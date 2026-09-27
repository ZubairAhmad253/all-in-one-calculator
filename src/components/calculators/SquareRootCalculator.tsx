import { nthRoot, simplifyRadical } from '@/lib/calculators/numbers';
import { formatResult } from '@/lib/calculators/expression';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, QuickPicks } from '@/components/ui/fields';
import { ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { x: 72, k: 2 };
const n = (v: number) => (Number.isFinite(v) ? formatResult(v).replace('-', '−') : 'Not a real number');
const rootSymbol = (k: number) => (k === 2 ? '√' : k === 3 ? '∛' : k === 4 ? '∜' : `${k}√`);

export default function SquareRootCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const k = Math.max(2, Math.round(s.k));
  const r = nthRoot(s.x, k);
  const simple = Number.isInteger(s.x) && s.x > 0 && s.x <= 1e12 ? simplifyRadical(s.x, k) : null;
  const perfect = Number.isFinite(r) && Number.isInteger(r);
  const lower = s.x >= 0 ? Math.floor(Math.pow(s.x, 1 / k) + 1e-9) : null;

  return (
    <section aria-label="Square root calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <NumberField label="Number" value={s.x} onChange={(v) => set('x', v)} decimals={10} />
          <div>
            <NumberField label="Root" value={s.k} onChange={(v) => set('k', v)} min={2} max={100} decimals={0} hint="2 for square root, 3 for cube root, and so on." />
            <QuickPicks label="Common roots" values={[2, 3, 4, 5]} value={k} onPick={(v) => set('k', v)} format={(v) => (v === 2 ? 'Square' : v === 3 ? 'Cube' : `${v}th`)} />
          </div>
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted">
                {rootSymbol(k)}
                {n(s.x)} =
              </p>
              <p className="tabular mt-1 text-4xl font-bold tracking-tight">{n(r)}</p>
            </div>
            <ShareButton />
          </div>
          {!Number.isFinite(r) && <p className="mt-2 text-sm text-warn">An even root of a negative number isn’t a real number. (The square root of −{n(-s.x)} is {n(Math.sqrt(-s.x))}i.)</p>}
          {simple && simple.outside > 1 && simple.inside > 1 && (
            <p className="tabular mt-3 text-lg">
              Simplified: <strong>{simple.outside}{rootSymbol(k)}{simple.inside}</strong>
            </p>
          )}
          <div className="mt-6">
            <StatGrid
              items={[
                [`Perfect ${k === 2 ? 'square' : k === 3 ? 'cube' : 'power'}?`, perfect ? `Yes: ${n(r)}^${k} = ${n(s.x)}` : 'No'],
                ['Check', Number.isFinite(r) ? `${n(r)}^${k} = ${n(Math.pow(r, k))}` : '—'],
                ...(lower !== null && !perfect && Number.isFinite(r)
                  ? ([
                      ['Between', `${lower} and ${lower + 1}`],
                      [`Nearest perfect ${k === 2 ? 'squares' : 'powers'}`, `${n(Math.pow(lower, k))} and ${n(Math.pow(lower + 1, k))}`],
                    ] as [string, string][])
                  : []),
              ]}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
