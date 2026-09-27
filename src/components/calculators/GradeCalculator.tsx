import { letterFromPercent, neededOnFinal, weightedGrade, type GradedItem } from '@/lib/calculators/education';
import { formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { InlineNumber, NumberField } from '@/components/ui/fields';
import { Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { g: '92:15,85:15,78:30', fw: 40, tg: 85 };
const MAX = 20;

/** Items live in the URL as "score:weight,…". */
const decode = (s: string): GradedItem[] =>
  s
    .split(',')
    .filter(Boolean)
    .slice(0, MAX)
    .map((p) => {
      const [sc, w] = p.split(':');
      return { score: Number(sc) || 0, weight: Number(w) || 0 };
    });
const encode = (items: GradedItem[]) => items.map((i) => `${i.score}:${i.weight}`).join(',');
const pct = (v: number) => `${formatNumber(v, 2)}%`;

export default function GradeCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const items = decode(s.g);
  const current = weightedGrade(items);
  const need = neededOnFinal(current.grade, current.weight, s.fw, s.tg);
  const totalWeight = current.weight + s.fw;

  const update = (i: number, patch: Partial<GradedItem>) => set('g', encode(items.map((it, j) => (j === i ? { ...it, ...patch } : it))));

  const verdict = !Number.isFinite(need)
    ? null
    : need > 100
      ? { tone: 'text-warn', text: `You’d need ${pct(need)} on the final, which isn’t possible without extra credit. The best you can reach is ${pct((current.grade * current.weight + 100 * s.fw) / totalWeight)}.` }
      : need <= 0
        ? { tone: 'text-accent', text: `You’ve already secured ${pct(s.tg)}: even 0% on the final keeps you there.` }
        : { tone: '', text: `Score at least ${pct(need)} on the final to finish with ${pct(s.tg)}.` };

  return (
    <section aria-label="Grade calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <p className="text-sm font-semibold">Graded work so far</p>
          <div className="mt-3 grid grid-cols-[1.5rem_minmax(0,1fr)_minmax(0,1fr)_2rem] sm:grid-cols-[minmax(0,1fr)_6rem_6rem_2rem] gap-2 px-1 text-xs text-muted">
            <span>
              <span className="sm:hidden">#</span>
              <span className="hidden sm:inline">Assignment</span>
            </span>
            <span>Score %</span>
            <span>Weight %</span>
          </div>
          <ol className="mt-2 space-y-2">
            {items.map((it, i) => (
              <li key={i} className="grid grid-cols-[1.5rem_minmax(0,1fr)_minmax(0,1fr)_2rem] sm:grid-cols-[minmax(0,1fr)_6rem_6rem_2rem] items-center gap-2">
                <span className="truncate px-1 text-sm font-medium">
                  <span className="hidden sm:inline">Item </span>
                  {i + 1}
                </span>
                <InlineNumber label={`Item ${i + 1} score percent`} value={it.score} onChange={(v) => update(i, { score: v })} width="w-full" allowNegative={false} />
                <InlineNumber label={`Item ${i + 1} weight percent`} value={it.weight} onChange={(v) => update(i, { weight: v })} width="w-full" allowNegative={false} />
                {items.length > 1 ? (
                  <button type="button" onClick={() => set('g', encode(items.filter((_, j) => j !== i)))} aria-label={`Remove item ${i + 1}`} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg">
                    ✕
                  </button>
                ) : (
                  <span />
                )}
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={items.length >= MAX}
              onClick={() => set('g', encode([...items, { score: 80, weight: 10 }]))}
              className="h-10 rounded-xl border border-line bg-surface px-4 text-sm font-medium hover:border-brand/40 disabled:opacity-50"
            >
              + Add item
            </button>
            <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
              Reset
            </button>
          </div>

          <div className="mt-6 border-t border-line pt-5">
            <p className="text-sm font-semibold">Final exam</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <NumberField label="Final exam weight" value={s.fw} onChange={(v) => set('fw', v)} suffix="%" min={0} max={100} decimals={1} />
              <NumberField label="Grade you want" value={s.tg} onChange={(v) => set('tg', v)} suffix="%" min={0} max={100} decimals={1} />
            </div>
            {Math.abs(totalWeight - 100) > 0.01 && (
              <p className="mt-2 text-xs text-warn">Your weights add up to {formatNumber(totalWeight, 1)}% including the final; courses usually total 100%.</p>
            )}
          </div>
        </div>

        <div className="space-y-5 bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          <Headline label="Current grade" value={Number.isFinite(current.grade) ? pct(current.grade) : '—'} action={<ShareButton />} />
          <StatGrid
            items={[
              ['Letter grade', Number.isFinite(current.grade) ? letterFromPercent(current.grade) : '—'],
              ['Weight graded so far', `${formatNumber(current.weight, 1)}%`],
            ]}
          />
          {verdict && (
            <div className="rounded-xl border border-line bg-surface p-4">
              <p className="text-xs text-muted">Needed on the final</p>
              <p className="tabular mt-1 text-3xl font-bold">{need > 100 || need <= 0 ? (need > 100 ? pct(need) : '0%') : pct(need)}</p>
              <p className={`mt-2 text-sm ${verdict.tone}`}>{verdict.text}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
