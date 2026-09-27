import { heartRateZones, MAX_HR_FORMULAS } from '@/lib/calculators/fitness';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, SelectField } from '@/components/ui/fields';
import { HealthNote } from './shared/body';
import { Headline, ShareButton } from './shared/results';

const DEFAULTS = { age: 35, f: 'tanaka', max: 0, rest: 60 };

const COLORS = ['#94a3b8', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];

export default function HeartRateZoneCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const formula = MAX_HR_FORMULAS.find((x) => x.id === s.f) ?? MAX_HR_FORMULAS[0];
  const estimated = formula.fn(s.age);
  const maxHr = s.max > 0 ? s.max : estimated;
  const rest = s.rest > 0 && s.rest < maxHr ? s.rest : undefined;
  const zones = heartRateZones(maxHr, rest);
  const valid = s.age >= 10 && s.age <= 100 && maxHr > 80 && maxHr < 240;
  const bpm = (v: number) => Math.round(v);

  return (
    <section aria-label="Heart rate zone calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <NumberField label="Age" value={s.age} onChange={(v) => set('age', v)} suffix="years" min={10} max={100} decimals={0} />
          <SelectField label="Max heart rate formula" value={formula.id} onChange={(v) => set('f', v)} options={MAX_HR_FORMULAS.map((x) => ({ value: x.id, label: x.label }))} />
          <NumberField
            label="Known max heart rate (optional)"
            value={s.max}
            onChange={(v) => set('max', v)}
            suffix="bpm"
            min={0}
            max={240}
            decimals={0}
            hint={s.max > 0 ? 'Using your measured max. Set to 0 to estimate it from age.' : `Leave at 0 to use the estimate of ${bpm(estimated)} bpm.`}
          />
          <NumberField label="Resting heart rate (optional)" value={s.rest} onChange={(v) => set('rest', v)} suffix="bpm" min={0} max={150} decimals={0} hint="Measure on waking, before getting up. With it, zones use the more personal Karvonen method; set 0 to use % of max." />
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!valid ? (
            <p className="text-sm text-muted">Enter an age between 10 and 100, or a max heart rate between 80 and 240 bpm.</p>
          ) : (
            <>
              <Headline label={s.max > 0 ? 'Your max heart rate' : 'Estimated max heart rate'} value={`${bpm(maxHr)} bpm`} action={<ShareButton />} />
              <p className="mt-2 text-sm text-muted">
                Zones by {rest ? `heart rate reserve (Karvonen), resting ${bpm(rest)} bpm` : '% of max heart rate'}
                {rest ? ` · reserve ${bpm(maxHr - rest)} bpm` : ''}
              </p>
              <div className="mt-6 space-y-2.5">
                {[...zones].reverse().map((z) => (
                  <div key={z.zone} className="flex items-stretch overflow-hidden rounded-xl border border-line bg-surface">
                    <div className="w-1.5 shrink-0" style={{ background: COLORS[z.zone - 1] }} />
                    <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">
                          Zone {z.zone} · {z.name} <span className="font-normal text-muted">({z.min}–{z.max}%)</span>
                        </p>
                        <p className="text-xs text-muted">{z.feel}</p>
                      </div>
                      <p className="tabular text-lg font-bold whitespace-nowrap">
                        {bpm(z.low)}–{bpm(z.high)} <span className="text-xs font-medium text-muted">bpm</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted">Age formulas can be 10–20 bpm off for individuals. A supervised test or a hard hill effort gives a truer max.</p>
            </>
          )}
        </div>
      </div>
      <HealthNote>Talk to a doctor before starting hard exercise if you have a heart condition, take medication that affects heart rate, or are new to exercise.</HealthNote>
    </section>
  );
}
