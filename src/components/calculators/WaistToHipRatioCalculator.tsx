import { CM_PER_IN, type Sex } from '@/lib/calculators/health';
import { whrRisk } from '@/lib/calculators/fitness';
import { formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, Tabs } from '@/components/ui/fields';
import { HealthNote } from './shared/body';
import { ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { sex: 'female', u: 'cm', waist: 76, hip: 100, h: 165 };

const RISK_STYLE = { Low: 'text-emerald-600', Moderate: 'text-amber-600', High: 'text-rose-600' } as const;

export default function WaistToHipRatioCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const sex: Sex = s.sex === 'male' ? 'male' : 'female';
  const cm = s.u !== 'in';
  const u = cm ? 'cm' : 'in';
  const ratio = s.waist / s.hip;
  const valid = s.waist > 0 && s.hip > 0 && ratio > 0.4 && ratio < 2;
  const risk = valid ? whrRisk(sex, ratio) : null;
  const [low, high] = sex === 'male' ? [0.95, 1.0] : [0.8, 0.85];
  const whtr = s.h > 0 ? s.waist / s.h : Number.NaN;
  const who = sex === 'male' ? 0.9 : 0.85;
  // Scale from 0.6 to 1.2 for the marker.
  const pos = (v: number) => `${Math.min(100, Math.max(0, ((v - 0.6) / 0.6) * 100))}%`;

  const convert = (to: string) => {
    if (to === u) return;
    const f = to === 'in' ? 1 / CM_PER_IN : CM_PER_IN;
    set('waist', Math.round(s.waist * f * 10) / 10);
    set('hip', Math.round(s.hip * f * 10) / 10);
    set('h', Math.round(s.h * f * 10) / 10);
    set('u', to);
  };

  return (
    <section aria-label="Waist-to-hip ratio calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <div className="grid grid-cols-2 items-end gap-3">
            <div>
              <p className="mb-1.5 text-sm font-medium">Sex</p>
              <Tabs
                value={sex}
                onChange={(v) => set('sex', v)}
                tabs={[
                  { value: 'female', label: 'Female' },
                  { value: 'male', label: 'Male' },
                ]}
              />
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium">Units</p>
              <Tabs
                value={u}
                onChange={convert}
                tabs={[
                  { value: 'cm', label: 'cm' },
                  { value: 'in', label: 'inches' },
                ]}
              />
            </div>
          </div>
          <NumberField label="Waist" value={s.waist} onChange={(v) => set('waist', v)} suffix={u} min={0} decimals={1} hint="At the narrowest point, or just above the navel, after breathing out." />
          <NumberField label="Hips" value={s.hip} onChange={(v) => set('hip', v)} suffix={u} min={0} decimals={1} hint="Around the widest part of your buttocks." />
          <NumberField label="Height (optional)" value={s.h} onChange={(v) => set('h', v)} suffix={u} min={0} decimals={1} hint="Adds your waist-to-height ratio." />
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!valid || !risk ? (
            <p className="text-sm text-muted">Enter your waist and hip measurements.</p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted">Waist-to-hip ratio</p>
                  <p className="tabular mt-1 text-5xl font-bold tracking-tight">{formatNumber(ratio, 2)}</p>
                  <p className={`mt-1 font-semibold ${RISK_STYLE[risk]}`}>{risk} health risk</p>
                </div>
                <ShareButton />
              </div>
              <div className="mt-6">
                <div className="relative flex h-3 overflow-hidden rounded-full">
                  <div className="bg-emerald-500" style={{ width: pos(low) }} />
                  <div className="bg-amber-500" style={{ width: `calc(${pos(high)} - ${pos(low)})` }} />
                  <div className="flex-1 bg-rose-500" />
                </div>
                <div className="relative h-5">
                  <div className="absolute -top-1 h-5 w-0.5 -translate-x-1/2 rounded bg-fg" style={{ left: pos(ratio) }} aria-hidden="true" />
                </div>
                <div className="tabular flex justify-between text-xs text-muted">
                  <span>0.60</span>
                  <span>Low ≤ {low.toFixed(2)}</span>
                  <span>High &gt; {high.toFixed(2)}</span>
                  <span>1.20</span>
                </div>
              </div>
              <div className="mt-6">
                <StatGrid
                  items={[
                    ['Body shape', ratio >= who ? 'Apple (more weight at the waist)' : 'Pear (more weight at the hips)'],
                    ['WHO threshold', `${sex === 'male' ? 'Men' : 'Women'}: ${who.toFixed(2)} (${ratio >= who ? 'above' : 'below'})`],
                    ['Waist-to-height ratio', Number.isFinite(whtr) && whtr > 0 ? formatNumber(whtr, 2) : '—'],
                    ['Waist-to-height guide', Number.isFinite(whtr) && whtr > 0 ? (whtr < 0.4 ? 'Low; check you’re not underweight' : whtr < 0.5 ? 'Healthy (under 0.5)' : whtr < 0.6 ? 'Increased risk' : 'High risk') : 'Add your height'],
                  ]}
                />
              </div>
              <p className="mt-4 text-xs text-muted">Fat stored around the waist is linked to higher risk of heart disease and type 2 diabetes than fat on the hips and thighs, even at the same BMI.</p>
            </>
          )}
        </div>
      </div>
      <HealthNote>Risk bands follow the World Health Organization’s 2008 report on waist circumference and waist-to-hip ratio.</HealthNote>
    </section>
  );
}
