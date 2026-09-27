import { healthyWeightRange, idealWeights, lbFromKg, type Sex } from '@/lib/calculators/health';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { Tabs } from '@/components/ui/fields';
import { BODY_DEFAULTS, BodyFields, formatWeight, HealthNote, readBody } from './shared/body';
import { Headline, ShareButton } from './shared/results';

const DEFAULTS = { ...BODY_DEFAULTS, sex: 'male' };

export default function IdealWeightCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const { metric, cm, kg } = readBody(s);
  const sex: Sex = s.sex === 'female' ? 'female' : 'male';
  const valid = cm >= 120 && cm <= 250;

  const formulas = idealWeights(sex, cm);
  const avg = formulas.reduce((a, f) => a + f.kg, 0) / formulas.length;
  const range = healthyWeightRange(cm);
  const short = cm < 152.4;
  const diff = kg > 0 ? (kg < range.min ? kg - range.min : kg > range.max ? kg - range.max : 0) : Number.NaN;
  const w = (v: number) => formatWeight(v, metric);
  const lo = Math.min(range.min, ...formulas.map((f) => f.kg)) * 0.9;
  const hi = Math.max(range.max, ...formulas.map((f) => f.kg)) * 1.1;
  const pos = (v: number) => `${((v - lo) / (hi - lo)) * 100}%`;

  return (
    <section aria-label="Ideal weight calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <div>
            <p className="mb-1.5 text-sm font-medium">Sex</p>
            <Tabs
              value={sex}
              onChange={(v) => set('sex', v)}
              tabs={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
              ]}
            />
          </div>
          <BodyFields s={s} set={set} />
          <p className="text-xs text-muted">Your current weight is optional. It’s only used to compare with the healthy range.</p>
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!valid ? (
            <p className="text-sm text-muted">Enter a height between 120 cm (3 ft 11 in) and 250 cm (8 ft 2 in).</p>
          ) : (
            <>
              <Headline label="Healthy weight range (BMI 18.5–24.9)" value={`${w(range.min).replace(/ (kg|lb)$/, '')}–${w(range.max)}`} action={<ShareButton />} compact />
              <p className="mt-2 text-sm text-muted">
                Average of the classic formulas: <strong className="text-fg">{w(avg)}</strong>
              </p>

              <div className="mt-6 rounded-xl border border-line bg-surface p-4">
                <div className="relative h-3 rounded-full bg-surface-2">
                  <div className="absolute inset-y-0 rounded-full bg-emerald-500/70" style={{ left: pos(range.min), width: `calc(${pos(range.max)} - ${pos(range.min)})` }} />
                  {formulas.map((f) => (
                    <div key={f.id} className="absolute -top-1 h-5 w-1 -translate-x-1/2 rounded bg-brand" style={{ left: pos(f.kg) }} title={f.label} />
                  ))}
                  {kg > 0 && kg >= lo && kg <= hi && <div className="absolute -top-2 h-7 w-0.5 -translate-x-1/2 bg-fg" style={{ left: pos(kg) }} />}
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                  <span><span className="mr-1 inline-block h-2 w-3 rounded bg-emerald-500/70" />Healthy BMI range</span>
                  <span><span className="mr-1 inline-block h-2 w-1 rounded bg-brand" />Formulas</span>
                  {kg > 0 && <span><span className="mr-1 inline-block h-3 w-0.5 bg-fg align-middle" />You</span>}
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface">
                <table className="tabular w-full text-sm">
                  <thead className="bg-surface-2 text-left text-xs text-muted">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Formula</th>
                      <th className="px-4 py-2.5 text-right font-medium">Ideal weight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {formulas.map((f) => (
                      <tr key={f.id}>
                        <td className="px-4 py-2.5">{f.label}</td>
                        <td className="px-4 py-2.5 text-right font-medium">
                          {w(f.kg)} <span className="text-xs text-muted">({metric ? `${Math.round(lbFromKg(f.kg))} lb` : `${Math.round(f.kg)} kg`})</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {kg > 0 && (
                <p className="mt-4 text-sm">
                  {diff === 0 ? (
                    <>Your weight of {w(kg)} is within the healthy range.</>
                  ) : diff < 0 ? (
                    <>You’re {w(-diff)} below the healthy range.</>
                  ) : (
                    <>You’re {w(diff)} above the healthy range.</>
                  )}
                </p>
              )}
              {short && <p className="mt-3 text-xs text-muted">The classic formulas were designed for people 5 ft (152 cm) and taller; below that they’re extended and less reliable.</p>}
            </>
          )}
        </div>
      </div>
      <HealthNote>Ideal weight formulas don’t account for muscle, frame size or age.</HealthNote>
    </section>
  );
}
