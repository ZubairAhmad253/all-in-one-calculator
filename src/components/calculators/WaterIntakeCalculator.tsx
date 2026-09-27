import { kgFromLb, lbFromKg, waterIntake } from '@/lib/calculators/health';
import { formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, Tabs } from '@/components/ui/fields';
import { HealthNote } from './shared/body';
import { Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { u: 'metric', kg: 70, lb: 154, ex: 30, hot: 'no' };
const ML_PER_FL_OZ = 29.5735295625;

export default function WaterIntakeCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const metric = s.u !== 'imperial';
  const kg = metric ? s.kg : kgFromLb(s.lb);
  const hot = s.hot === 'yes';
  const w = waterIntake(kg, s.ex, hot);
  const valid = kg > 0 && kg < 400;
  const litres = (v: number) => `${formatNumber(v, 1)} L`;
  const oz = (v: number) => `${formatNumber((v * 1000) / ML_PER_FL_OZ, 0)} fl oz`;
  const main = (v: number) => (metric ? litres(v) : oz(v));
  const glasses = (w.total * 1000) / 250;
  const parts = [
    { label: 'Body weight', v: w.base, color: 'var(--chart-1)' },
    { label: 'Exercise', v: w.exercise, color: 'var(--chart-2)' },
    { label: 'Hot weather', v: w.heat, color: 'var(--chart-3)' },
  ].filter((p) => p.v > 0);

  return (
    <section aria-label="Water intake calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <div>
            <p className="mb-1.5 text-sm font-medium">Units</p>
            <Tabs
              value={metric ? 'metric' : 'imperial'}
              onChange={(v) => {
                if (v === 'imperial' && metric) set('lb', Math.round(lbFromKg(s.kg) * 10) / 10);
                if (v === 'metric' && !metric) set('kg', Math.round(kgFromLb(s.lb) * 10) / 10);
                set('u', v);
              }}
              tabs={[
                { value: 'metric', label: 'Metric (kg, L)' },
                { value: 'imperial', label: 'US (lb, fl oz)' },
              ]}
            />
          </div>
          {metric ? (
            <NumberField label="Body weight" value={s.kg} onChange={(v) => set('kg', v)} suffix="kg" min={0} max={400} decimals={1} />
          ) : (
            <NumberField label="Body weight" value={s.lb} onChange={(v) => set('lb', v)} suffix="lb" min={0} max={880} decimals={1} />
          )}
          <NumberField label="Exercise per day" value={s.ex} onChange={(v) => set('ex', v)} suffix="minutes" min={0} max={600} decimals={0} slider={{ min: 0, max: 180, step: 5 }} />
          <div>
            <p className="mb-1.5 text-sm font-medium">Hot or humid weather?</p>
            <Tabs
              value={hot ? 'yes' : 'no'}
              onChange={(v) => set('hot', v)}
              tabs={[
                { value: 'no', label: 'No' },
                { value: 'yes', label: 'Yes' },
              ]}
            />
          </div>
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!valid ? (
            <p className="text-sm text-muted">Enter your body weight.</p>
          ) : (
            <>
              <Headline label="Drink about this much water a day" value={main(w.total)} action={<ShareButton />} />
              <p className="mt-2 text-sm text-muted">
                {metric ? oz(w.total) : litres(w.total)} · about {formatNumber(Math.round(glasses), 0)} glasses of 250 ml
              </p>

              <div className="mt-6" aria-label="Glasses of water">
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: Math.min(30, Math.ceil(glasses)) }, (_, i) => {
                    const fill = Math.min(1, glasses - i);
                    return (
                      <svg key={i} viewBox="0 0 20 26" className="h-7 w-5" aria-hidden="true">
                        <clipPath id={`glass-${i}`}>
                          <path d="M2 2h16l-2 22H4z" />
                        </clipPath>
                        <rect x="0" y={2 + 22 * (1 - fill)} width="20" height={22 * fill} fill="var(--chart-2)" opacity="0.75" clipPath={`url(#glass-${i})`} />
                        <path d="M2 2h16l-2 22H4z" fill="none" stroke="var(--muted)" strokeWidth="1.25" strokeLinejoin="round" />
                      </svg>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 space-y-2.5">
                {parts.map((p) => (
                  <div key={p.label} className="flex items-center gap-2.5 text-sm">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: p.color }} />
                    <span className="text-muted">{p.label}</span>
                    <span className="tabular ml-auto font-medium">+{main(p.v)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <StatGrid
                  items={[
                    ['US cups (8 fl oz)', formatNumber((w.total * 1000) / (8 * ML_PER_FL_OZ), 1)],
                    ['500 ml bottles', formatNumber((w.total * 1000) / 500, 1)],
                    ['Per waking hour (16 h)', metric ? `${formatNumber((w.total * 1000) / 16, 0)} ml` : `${formatNumber((w.total * 1000) / 16 / ML_PER_FL_OZ, 1)} fl oz`],
                    ['Rate', metric ? '35 ml per kg' : '0.54 fl oz per lb'],
                  ]}
                />
              </div>
              <p className="mt-4 text-xs text-muted">
                This is drinking water. Food supplies roughly another 20% of your daily water. Reference total intakes from all sources are about 2.5 L (men) and 2.0 L (women) in
                Europe, or 3.7 L and 2.7 L in the US.
              </p>
            </>
          )}
        </div>
      </div>
      <HealthNote>Needs vary with health, diet and sweat rate; thirst and pale-yellow urine are good everyday guides. People with heart or kidney conditions may need to limit fluids.</HealthNote>
    </section>
  );
}
