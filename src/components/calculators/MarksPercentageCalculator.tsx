import { marksPercent } from '@/lib/calculators/education';
import { formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { InlineNumber, NumberField, Tabs } from '@/components/ui/fields';
import { Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { mode: 'total', got: 425, max: 500, subs: '88:100,76:100,92:100,81:100,69:100' };
const MAX_SUBJECTS = 15;

const decode = (t: string) =>
  t
    .split(',')
    .filter(Boolean)
    .slice(0, MAX_SUBJECTS)
    .map((p) => {
      const [g = '0', m = '100'] = p.split(':');
      return { got: Number(g) || 0, max: Number(m) || 0 };
    });
const encode = (list: { got: number; max: number }[]) => list.map((x) => `${x.got}:${x.max}`).join(',');

function Bar({ pct }: { pct: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-surface-2">
      <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

export default function MarksPercentageCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const mode = s.mode === 'subjects' ? 'subjects' : 'total';
  const subjects = decode(s.subs);
  const got = mode === 'total' ? s.got : subjects.reduce((a, x) => a + x.got, 0);
  const max = mode === 'total' ? s.max : subjects.reduce((a, x) => a + x.max, 0);
  const pct = marksPercent(got, max);
  const over = mode === 'total' ? s.got > s.max : subjects.some((x) => x.got > x.max);

  const update = (i: number, patch: Partial<{ got: number; max: number }>) => set('subs', encode(subjects.map((x, j) => (j === i ? { ...x, ...patch } : x))));

  return (
    <section aria-label="Marks percentage calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <Tabs
            value={mode}
            onChange={(v) => set('mode', v)}
            tabs={[
              { value: 'total', label: 'Total marks' },
              { value: 'subjects', label: 'By subject' },
            ]}
          />
          {mode === 'total' ? (
            <>
              <NumberField label="Marks obtained" value={s.got} onChange={(v) => set('got', v)} min={0} decimals={2} />
              <NumberField label="Total marks" value={s.max} onChange={(v) => set('max', v)} min={0} decimals={2} />
            </>
          ) : (
            <div>
              <div className="grid grid-cols-[5rem_minmax(0,1fr)_minmax(0,1fr)_2rem] gap-2 px-1 pb-1.5 text-xs text-muted">
                <span>Subject</span>
                <span>Obtained</span>
                <span>Out of</span>
                <span />
              </div>
              <ol className="space-y-2">
                {subjects.map((x, i) => (
                  <li key={i} className="grid grid-cols-[5rem_minmax(0,1fr)_minmax(0,1fr)_2rem] items-center gap-2">
                    <span className="text-sm font-medium">Subject {i + 1}</span>
                    <InlineNumber label={`Subject ${i + 1} marks obtained`} value={x.got} onChange={(v) => update(i, { got: v })} width="w-full" allowNegative={false} />
                    <InlineNumber label={`Subject ${i + 1} maximum marks`} value={x.max} onChange={(v) => update(i, { max: v })} width="w-full" allowNegative={false} />
                    {subjects.length > 1 ? (
                      <button type="button" aria-label={`Remove subject ${i + 1}`} onClick={() => set('subs', encode(subjects.filter((_, j) => j !== i)))} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg">
                        ✕
                      </button>
                    ) : (
                      <span />
                    )}
                  </li>
                ))}
              </ol>
              <button
                type="button"
                disabled={subjects.length >= MAX_SUBJECTS}
                onClick={() => set('subs', encode([...subjects, { got: 0, max: subjects.at(-1)?.max ?? 100 }]))}
                className="mt-3 h-10 rounded-xl border border-line bg-surface px-4 text-sm font-medium hover:border-brand/40 disabled:opacity-50"
              >
                + Add subject
              </button>
            </div>
          )}
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!Number.isFinite(pct) ? (
            <p className="text-sm text-muted">Enter the marks obtained and a total above zero.</p>
          ) : (
            <>
              <Headline label="Percentage" value={`${formatNumber(pct, 2)}%`} action={<ShareButton />} />
              <p className="tabular mt-2 text-sm text-muted">
                {formatNumber(got, 2)} ÷ {formatNumber(max, 2)} × 100 = {formatNumber(pct, 2)}%
              </p>
              {over && <p className="mt-2 text-sm text-warn">Marks obtained are higher than the maximum somewhere. Check your numbers.</p>}
              <div className="mt-4">
                <Bar pct={pct} />
              </div>
              <div className="mt-6">
                <StatGrid
                  items={[
                    ['Marks obtained', formatNumber(got, 2)],
                    ['Marks lost', formatNumber(Math.max(0, max - got), 2)],
                    ['Out of 10', formatNumber(pct / 10, 2)],
                    ['As a fraction', `${formatNumber(got, 2)}/${formatNumber(max, 2)}`],
                  ]}
                />
              </div>
              {mode === 'subjects' && (
                <div className="mt-6 space-y-3">
                  <p className="text-sm font-semibold">By subject</p>
                  {subjects.map((x, i) => {
                    const p = marksPercent(x.got, x.max);
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-sm">
                          <span>Subject {i + 1}</span>
                          <span className="tabular font-medium">{Number.isFinite(p) ? `${formatNumber(p, 1)}%` : '—'}</span>
                        </div>
                        <div className="mt-1">
                          <Bar pct={p} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="mt-6 mb-2 text-sm font-semibold">Marks needed out of {formatNumber(max, 2)}</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {[40, 50, 60, 75, 90, 100].map((t) => (
                  <div key={t} className={`rounded-lg border px-2 py-2 text-center ${pct >= t ? 'border-brand/40 bg-brand-soft/60' : 'border-line bg-surface'}`}>
                    <p className="text-xs text-muted">{t}%</p>
                    <p className="tabular text-sm font-semibold">{formatNumber((t / 100) * max, 1)}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
