import { bmi, bmiBodyFat, BODY_FAT_CATEGORIES, bodyFatCategory, CM_PER_IN, navyBodyFat, type Sex } from '@/lib/calculators/health';
import { formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField } from '@/components/ui/fields';
import { BODY_DEFAULTS, BodyFields, formatWeight, HealthNote, readBody, SexAgeFields } from './shared/body';
import { ShareButton, StatGrid } from './shared/results';

// Tape measurements are kept in both units, like height and weight.
const DEFAULTS = { ...BODY_DEFAULTS, sex: 'male', age: 30, neck: 38, waist: 86, hip: 97, neckIn: 15, waistIn: 34, hipIn: 38 };

/** Colour band scale from 0% to 45%. */
function Scale({ sex, pct }: { sex: Sex; pct: number }) {
  const bands = BODY_FAT_CATEGORIES[sex];
  const MAX = 45;
  const colors = ['#94a3b8', '#22c55e', '#10b981', '#f59e0b', '#ef4444'];
  return (
    <div className="mt-6">
      <div className="relative flex h-3 overflow-hidden rounded-full">
        <div style={{ width: `${(bands[0].min / MAX) * 100}%` }} className="bg-surface-2" />
        {bands.map((b, i) => (
          <div key={b.label} style={{ width: `${(((bands[i + 1]?.min ?? MAX) - b.min) / MAX) * 100}%`, background: colors[i] }} />
        ))}
      </div>
      <div className="relative h-5">
        <div className="absolute -top-1 h-5 w-0.5 -translate-x-1/2 rounded bg-fg" style={{ left: `${Math.min(100, Math.max(0, (pct / MAX) * 100))}%` }} aria-hidden="true" />
      </div>
      <div className="grid grid-cols-5 gap-1 text-center text-[11px] leading-tight text-muted">
        {bands.map((b, i) => (
          <span key={b.label}>
            {b.label}
            <br />
            {bands[i + 1] ? `${b.min}–${bands[i + 1].min - 1}%` : `${b.min}%+`}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function BodyFatCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const { metric, cm, kg } = readBody(s);
  const sex: Sex = s.sex === 'female' ? 'female' : 'male';
  const toCm = (v: number) => (metric ? v : v * CM_PER_IN);
  const neck = toCm(metric ? s.neck : s.neckIn);
  const waist = toCm(metric ? s.waist : s.waistIn);
  const hip = toCm(metric ? s.hip : s.hipIn);

  const valid = kg > 0 && cm > 0 && s.age >= 15 && neck > 0 && waist > 0 && (sex === 'male' || hip > 0);
  const navy = valid ? navyBodyFat(sex, cm, neck, waist, hip) : Number.NaN;
  const byBmi = valid ? bmiBodyFat(sex, bmi(kg, cm), s.age) : Number.NaN;
  const pct = Number.isFinite(navy) && navy > 0 ? navy : Number.NaN;
  const unit = metric ? 'cm' : 'in';
  const tape = { min: 0, max: metric ? 250 : 100, decimals: 1, suffix: unit };

  return (
    <section aria-label="Body fat calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <SexAgeFields sex={s.sex} age={s.age} onSex={(v) => set('sex', v)} onAge={(v) => set('age', v)} />
          <BodyFields s={s} set={set} />
          <div className="grid grid-cols-2 items-start gap-3">
            <NumberField label="Neck" value={metric ? s.neck : s.neckIn} onChange={(v) => set(metric ? 'neck' : 'neckIn', v)} {...tape} hint="Just below the larynx" />
            <NumberField
              label="Waist"
              value={metric ? s.waist : s.waistIn}
              onChange={(v) => set(metric ? 'waist' : 'waistIn', v)}
              {...tape}
              hint={sex === 'male' ? 'At the navel' : 'At the narrowest point'}
            />
          </div>
          {sex === 'female' && <NumberField label="Hips" value={metric ? s.hip : s.hipIn} onChange={(v) => set(metric ? 'hip' : 'hipIn', v)} {...tape} hint="At the widest point" />}
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!valid ? (
            <p className="text-sm text-muted">Enter your age (15+), height, weight and tape measurements.</p>
          ) : !Number.isFinite(pct) ? (
            <p className="text-sm text-warn">These measurements don’t fit the Navy formula. Check that your waist{sex === 'female' ? ' plus hips' : ''} is larger than your neck.</p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted">Body fat (US Navy method)</p>
                  <p className="tabular mt-1 text-4xl font-bold tracking-tight sm:text-5xl">{formatNumber(pct, 1)}%</p>
                  <p className="mt-1 font-semibold text-brand">{bodyFatCategory(sex, pct)}</p>
                </div>
                <ShareButton />
              </div>
              <Scale sex={sex} pct={pct} />
              <div className="mt-6">
                <StatGrid
                  items={[
                    ['Fat mass', formatWeight((kg * pct) / 100, metric)],
                    ['Lean mass', formatWeight(kg * (1 - pct / 100), metric)],
                    ['BMI method estimate', Number.isFinite(byBmi) ? `${formatNumber(byBmi, 1)}%` : '—'],
                    ['BMI', formatNumber(bmi(kg, cm), 1)],
                  ]}
                />
              </div>
              <p className="mt-3 text-xs text-muted">The BMI method uses only height, weight and age, so it’s less accurate for muscular people. Tape measurements are usually within 3–4% of a DEXA scan.</p>
            </>
          )}
        </div>
      </div>
      <HealthNote>Categories follow the American Council on Exercise.</HealthNote>
    </section>
  );
}
