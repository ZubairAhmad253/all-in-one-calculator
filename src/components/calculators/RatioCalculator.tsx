import { simplifyRatio, solveProportion } from '@/lib/calculators/numbers';
import { formatResult } from '@/lib/calculators/expression';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { InlineNumber, Tabs } from '@/components/ui/fields';
import { ShareButton } from './shared/results';

const DEFAULTS = { mode: 'simplify', a: 12, b: 18, c: 0, pa: 3, pb: 4, pc: 12 };
const n = (v: number) => formatResult(v);

export default function RatioCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const mode = s.mode === 'solve' ? 'solve' : 'simplify';
  const terms = [s.a, s.b, ...(s.c ? [s.c] : [])];
  const simple = simplifyRatio(terms);
  const total = simple.reduce((x, y) => x + y, 0);
  const x = solveProportion(s.pa, s.pb, s.pc);

  return (
    <section aria-label="Ratio calculator" className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5 sm:p-7">
        <Tabs
          value={mode}
          onChange={(v) => set('mode', v)}
          tabs={[
            { value: 'simplify', label: 'Simplify a ratio' },
            { value: 'solve', label: 'Solve A : B = C : ?' },
          ]}
        />
        <div className="flex gap-2">
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
          <ShareButton />
        </div>
      </div>

      {mode === 'simplify' ? (
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-2">
          <div>
            <p className="text-sm font-medium">Ratio</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-2xl font-semibold">
              <InlineNumber label="First term" value={s.a} onChange={(v) => set('a', v)} allowNegative={false} />
              <span>:</span>
              <InlineNumber label="Second term" value={s.b} onChange={(v) => set('b', v)} allowNegative={false} />
              <span>:</span>
              <InlineNumber label="Third term (optional)" value={s.c} onChange={(v) => set('c', v)} allowNegative={false} />
            </div>
            <p className="mt-2 text-xs text-muted">Leave the third box at 0 for a two-part ratio. Decimals are fine (1.5 : 2.25).</p>
          </div>
          <div className="rounded-xl bg-surface-2 p-5" aria-live="polite">
            <p className="text-sm font-medium text-muted">Simplest form</p>
            <p className="tabular mt-1 text-4xl font-bold tracking-tight">{simple.map(n).join(' : ')}</p>
            {total > 0 && (
              <ul className="tabular mt-4 space-y-1 text-sm">
                {simple.map((t, i) => (
                  <li key={i}>
                    Part {i + 1}: {n(t)}/{n(total)} of the whole = <strong>{n((t / total) * 100)}%</strong>
                  </li>
                ))}
              </ul>
            )}
            {simple.length === 2 && simple[1] !== 0 && <p className="tabular mt-3 text-sm text-muted">As a single number: {n(simple[0])} ÷ {n(simple[1])} = {n(simple[0] / simple[1])} : 1</p>}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-2">
          <div>
            <p className="text-sm font-medium">Proportion</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-2xl font-semibold">
              <InlineNumber label="A" value={s.pa} onChange={(v) => set('pa', v)} width="w-20" />
              <span>:</span>
              <InlineNumber label="B" value={s.pb} onChange={(v) => set('pb', v)} width="w-20" />
              <span>=</span>
              <InlineNumber label="C" value={s.pc} onChange={(v) => set('pc', v)} width="w-20" />
              <span>:</span>
              <span className="grid h-11 w-20 place-items-center rounded-xl bg-brand-soft text-brand">?</span>
            </div>
          </div>
          <div className="rounded-xl bg-surface-2 p-5" aria-live="polite">
            <p className="text-sm font-medium text-muted">Missing value</p>
            <p className="tabular mt-1 text-4xl font-bold tracking-tight">{Number.isFinite(x) ? n(x) : '—'}</p>
            <p className="tabular mt-3 text-sm text-muted">
              {Number.isFinite(x) ? `? = B × C ÷ A = ${n(s.pb)} × ${n(s.pc)} ÷ ${n(s.pa)} = ${n(x)}` : 'A can’t be 0.'}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
