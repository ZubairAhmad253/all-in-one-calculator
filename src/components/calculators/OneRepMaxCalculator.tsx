import { oneRepMax, PERCENT_OF_1RM } from '@/lib/calculators/fitness';
import { formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, Tabs } from '@/components/ui/fields';
import { Headline, ShareButton } from './shared/results';

const DEFAULTS = { w: 100, r: 5, u: 'kg' };

export default function OneRepMaxCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const u = s.u === 'lb' ? 'lb' : 'kg';
  const result = oneRepMax(s.w, s.r);
  // Round plate-loadable weights to 2.5 kg or 5 lb.
  const step = u === 'kg' ? 2.5 : 5;
  const plate = (v: number) => Math.round(v / step) * step;
  const w = (v: number, d = 1) => `${formatNumber(v, d)} ${u}`;
  const max = result ? Math.max(...result.results.map((x) => x.value)) : 0;

  return (
    <section aria-label="One rep max calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <div>
            <p className="mb-1.5 text-sm font-medium">Units</p>
            <Tabs
              value={u}
              onChange={(v) => set('u', v)}
              tabs={[
                { value: 'kg', label: 'Kilograms' },
                { value: 'lb', label: 'Pounds' },
              ]}
            />
          </div>
          <NumberField label="Weight lifted" value={s.w} onChange={(v) => set('w', v)} suffix={u} min={0} max={2000} decimals={1} />
          <NumberField label="Reps completed" value={s.r} onChange={(v) => set('r', v)} min={1} max={30} decimals={0} hint="Use a set taken close to failure with good form. Estimates are most accurate at 10 reps or fewer." />
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!result ? (
            <p className="text-sm text-muted">Enter the weight lifted and between 1 and 30 reps.</p>
          ) : (
            <>
              <Headline label="Estimated one-rep max" value={w(result.average)} action={<ShareButton />} />
              <p className="mt-2 text-sm text-muted">
                Average of 7 formulas for {w(s.w, 1)} × {Math.round(s.r)} rep{Math.round(s.r) === 1 ? '' : 's'}
              </p>
              {s.r > 10 && <p className="mt-2 text-sm text-warn">Above 10 reps the formulas disagree more, so treat this as a rough guide.</p>}

              <div className="mt-6 space-y-2">
                {result.results.map((x) => (
                  <div key={x.id} className="flex items-center gap-3 text-sm">
                    <span className="w-20 shrink-0 text-muted">{x.label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${(x.value / max) * 100}%` }} />
                    </div>
                    <span className="tabular w-20 shrink-0 text-right font-medium">{w(x.value)}</span>
                  </div>
                ))}
              </div>

              <p className="mt-6 mb-2 text-sm font-semibold">Training weights</p>
              <div className="overflow-hidden rounded-xl border border-line bg-surface">
                <table className="tabular w-full text-sm">
                  <thead className="bg-surface-2 text-left text-xs text-muted">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">% of 1RM</th>
                      <th className="px-4 py-2.5 text-right font-medium">Weight</th>
                      <th className="px-4 py-2.5 text-right font-medium">Rounded</th>
                      <th className="px-4 py-2.5 text-right font-medium">Typical reps</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {PERCENT_OF_1RM.map((p) => (
                      <tr key={p.pct} className={p.reps === Math.round(s.r) ? 'bg-brand-soft/60 font-medium' : ''}>
                        <td className="px-4 py-2">{p.pct}%</td>
                        <td className="px-4 py-2 text-right">{w((result.average * p.pct) / 100)}</td>
                        <td className="px-4 py-2 text-right">{w(plate((result.average * p.pct) / 100), step % 1 ? 1 : 0)}</td>
                        <td className="px-4 py-2 text-right">{p.reps}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-muted">Rounded to the nearest {step} {u} for loading plates. Strength work: 80–95% for 2–6 reps. Muscle growth: 65–80% for 8–15 reps.</p>
            </>
          )}
        </div>
      </div>
      <p className="border-t border-line px-5 py-3 text-xs text-muted sm:px-7">Estimates only. Test a true max only with a spotter and a proper warm-up.</p>
    </section>
  );
}
