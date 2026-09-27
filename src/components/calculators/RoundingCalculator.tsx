import { roundSig, roundTo, type RoundMode } from '@/lib/calculators/stats';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, SelectField, Tabs } from '@/components/ui/fields';
import { ShareButton } from './shared/results';

const DEFAULTS = { x: 1234.5678, by: 'dp', p: 2, mode: 'half-up' };

const MODES: { value: RoundMode; label: string }[] = [
  { value: 'half-up', label: 'Round half up (standard)' },
  { value: 'half-even', label: 'Round half to even (banker’s)' },
  { value: 'up', label: 'Always round up (ceiling)' },
  { value: 'down', label: 'Always round down (floor)' },
  { value: 'toward-zero', label: 'Round toward zero (truncate)' },
];

const NEAREST = [
  { value: -3, label: 'Thousand' },
  { value: -2, label: 'Hundred' },
  { value: -1, label: 'Ten' },
  { value: 0, label: 'Whole number' },
  { value: 1, label: 'Tenth (0.1)' },
  { value: 2, label: 'Hundredth (0.01)' },
  { value: 3, label: 'Thousandth (0.001)' },
];

const show = (v: number, places?: number) => (places !== undefined && places > 0 ? v.toLocaleString('en', { minimumFractionDigits: places, maximumFractionDigits: places }) : v.toLocaleString('en', { maximumFractionDigits: 12 }));

export default function RoundingCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const mode = (MODES.some((m) => m.value === s.mode) ? s.mode : 'half-up') as RoundMode;
  const by = s.by === 'sf' ? 'sf' : s.by === 'near' ? 'near' : 'dp';
  const p = Math.round(s.p);
  const result = by === 'sf' ? roundSig(s.x, Math.max(1, p), mode) : roundTo(s.x, p, mode);

  return (
    <section aria-label="Rounding calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <NumberField label="Number" value={s.x} onChange={(v) => set('x', v)} decimals={12} />
          <div>
            <p className="mb-1.5 text-sm font-medium">Round to</p>
            <Tabs
              value={by}
              onChange={(v) => {
                set('by', v);
                set('p', v === 'sf' ? 3 : v === 'near' ? 0 : 2);
              }}
              tabs={[
                { value: 'dp', label: 'Decimal places' },
                { value: 'sf', label: 'Significant figures' },
                { value: 'near', label: 'Nearest…' },
              ]}
            />
          </div>
          {by === 'near' ? (
            <SelectField label="Nearest" value={p} onChange={(v) => set('p', v)} options={NEAREST} />
          ) : (
            <NumberField label={by === 'sf' ? 'Significant figures' : 'Decimal places'} value={s.p} onChange={(v) => set('p', v)} min={by === 'sf' ? 1 : 0} max={15} decimals={0} />
          )}
          <SelectField label="Rounding method" value={mode} onChange={(v) => set('mode', v)} options={MODES} />
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="tabular text-sm font-medium text-muted">{show(s.x)} rounded =</p>
              <p className="tabular mt-1 text-4xl font-bold tracking-tight break-all">{show(result, by === 'dp' ? p : undefined)}</p>
            </div>
            <ShareButton />
          </div>
          <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface">
            <table className="tabular w-full text-sm">
              <thead className="bg-surface-2 text-left text-xs text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Rounded to</th>
                  <th className="px-4 py-2 text-right font-medium">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {NEAREST.map((o) => (
                  <tr key={o.value} className={by !== 'sf' && o.value === p ? 'bg-brand-soft/60 font-semibold' : ''}>
                    <td className="px-4 py-2">Nearest {o.label.toLowerCase()}</td>
                    <td className="px-4 py-2 text-right">{show(roundTo(s.x, o.value, mode), o.value > 0 ? o.value : undefined)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
