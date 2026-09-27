import { logBase } from '@/lib/calculators/numbers';
import { formatResult } from '@/lib/calculators/expression';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, QuickPicks } from '@/components/ui/fields';
import { ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { x: 1000, base: 10 };
const n = (v: number) => (Number.isFinite(v) ? formatResult(v).replace('-', '−') : 'Undefined');
const baseName = (b: number) => (Math.abs(b - Math.E) < 1e-12 ? 'e' : n(b));

export default function LogarithmCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const r = logBase(s.x, s.base);
  const bn = baseName(s.base);

  return (
    <section aria-label="Logarithm calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <NumberField label="Number (x)" value={s.x} onChange={(v) => set('x', v)} min={0} decimals={10} />
          <div>
            <NumberField label="Base (b)" value={s.base} onChange={(v) => set('base', v)} min={0} decimals={10} />
            <QuickPicks label="Common bases" values={[10, Math.E, 2]} value={s.base} onPick={(v) => set('base', v)} format={(v) => (v === Math.E ? 'e (ln)' : String(v))} />
          </div>
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted">
                log<sub>{bn}</sub>({n(s.x)}) =
              </p>
              <p className="tabular mt-1 text-4xl font-bold tracking-tight">{n(r)}</p>
            </div>
            <ShareButton />
          </div>
          {Number.isFinite(r) ? (
            <p className="tabular mt-3 text-sm text-muted">
              Check: {bn}^{n(r)} = {n(Math.pow(s.base, r))}. Using change of base: ln({n(s.x)}) ÷ ln({bn}) = {n(Math.log(s.x))} ÷ {n(Math.log(s.base))}
            </p>
          ) : (
            <p className="mt-3 text-sm text-warn">
              {!(s.x > 0) ? 'Logarithms are only defined for numbers greater than 0.' : 'The base must be greater than 0 and not equal to 1.'}
            </p>
          )}
          <div className="mt-6">
            <StatGrid
              items={[
                ['Common log, log₁₀', n(logBase(s.x, 10))],
                ['Natural log, ln', n(logBase(s.x, Math.E))],
                ['Binary log, log₂', n(logBase(s.x, 2))],
                ['Antilog: bˣ', n(Math.pow(s.base, s.x))],
              ]}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
