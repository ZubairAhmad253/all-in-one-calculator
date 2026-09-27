import { useMemo } from 'react';
import { BMI_CATEGORIES, bmi, bmiCategory, healthyWeightRange } from '@/lib/calculators/health';
import { formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { BODY_DEFAULTS, BodyFields, formatWeight, readBody } from './shared/body';
import { Headline, ShareButton, StatGrid } from './shared/results';

const SCALE_MIN = 15;
const SCALE_MAX = 40;
const pos = (v: number) => ((Math.min(Math.max(v, SCALE_MIN), SCALE_MAX) - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100;

/** Colour-coded bar from BMI 15 to 40 with a marker at the result. */
function BmiScale({ value }: { value: number }) {
  const bands = [
    { from: SCALE_MIN, to: 18.5, color: 'var(--chart-1)' },
    { from: 18.5, to: 25, color: 'var(--accent)' },
    { from: 25, to: 30, color: 'var(--warn)' },
    { from: 30, to: SCALE_MAX, color: 'var(--danger)' },
  ];
  return (
    <div className="pt-7" aria-hidden="true">
      <div className="relative">
        <div className="flex h-3 overflow-hidden rounded-full">
          {bands.map((b) => (
            <div key={b.from} style={{ width: `${pos(b.to) - pos(b.from)}%`, background: b.color }} />
          ))}
        </div>
        {Number.isFinite(value) && (
          <div className="absolute -top-7 -translate-x-1/2 transition-[left] duration-300" style={{ left: `${pos(value)}%` }}>
            <span className="tabular block rounded-md bg-fg px-1.5 py-0.5 text-xs font-bold text-bg">{value.toFixed(1)}</span>
            <span className="mx-auto block h-0 w-0 border-x-4 border-t-4 border-x-transparent border-t-fg" />
          </div>
        )}
      </div>
      <div className="tabular relative mt-1.5 h-4 text-xs text-muted">
        {[18.5, 25, 30, 35].map((t) => (
          <span key={t} className="absolute -translate-x-1/2" style={{ left: `${pos(t)}%` }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function BmiCalculator() {
  const [s, set, reset] = useUrlState(BODY_DEFAULTS);
  const { metric, cm, kg } = readBody(s);
  const value = useMemo(() => bmi(kg, cm), [kg, cm]);
  const cat = bmiCategory(value);
  const range = healthyWeightRange(cm);
  const w = (v: number) => formatWeight(v, metric);

  const change =
    !Number.isFinite(value) ? null : kg < range.min ? { verb: 'Gain', amount: range.min - kg } : kg > range.max ? { verb: 'Lose', amount: kg - range.max } : null;

  return (
    <section aria-label="BMI calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <BodyFields s={s} set={set} />
          <div className="flex justify-end border-t border-line pt-5">
            <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
              Reset
            </button>
          </div>
        </div>

        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          <Headline label="Your BMI" value={Number.isFinite(value) ? value.toFixed(1) : '—'} action={<ShareButton />} />
          {cat && (
            <p className="mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold" style={{ background: `color-mix(in srgb, ${cat.color} 15%, transparent)`, color: cat.color }}>
              <span className="size-2 rounded-full" style={{ background: cat.color }} />
              {cat.label}
            </p>
          )}

          <div className="mt-4">
            <BmiScale value={value} />
          </div>

          <div className="mt-6">
            <StatGrid
              items={[
                ['Healthy weight for your height', `${w(range.min)} – ${w(range.max)}`],
                [change ? `${change.verb} to reach a healthy BMI` : 'Healthy range', change ? w(change.amount) : 'You’re within it'],
                ['BMI Prime (BMI ÷ 25)', Number.isFinite(value) ? (value / 25).toFixed(2) : '—'],
                ['Height', metric ? `${formatNumber(cm, 1)} cm` : `${s.ft} ft ${formatNumber(s.inch, 1)} in`],
              ]}
            />
          </div>

          <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted sm:grid-cols-3">
            {BMI_CATEGORIES.map((c, i) => {
              const next = BMI_CATEGORIES[i + 1];
              const on = cat?.label === c.label;
              return (
                <li key={c.label} className={`flex items-center gap-2 ${on ? 'font-semibold text-fg' : ''}`}>
                  <span className="size-2 shrink-0 rounded-full" style={{ background: c.color }} />
                  {c.label}: {i === 0 ? `< ${next.min}` : next ? `${c.min} – ${(next.min - 0.1).toFixed(1)}` : `${c.min}+`}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <p className="border-t border-line px-5 py-3 text-xs text-muted sm:px-7">
        For adults aged 18 and over. BMI doesn’t measure body fat directly and can mislead for athletes, older adults and during pregnancy. Some health bodies use lower thresholds for
        people of Asian descent (overweight from 23). Speak to a doctor about your weight and health.
      </p>
    </section>
  );
}
