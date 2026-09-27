import { useId } from 'react';
import { cmFromFtIn, ftInFromCm, kgFromLb, lbFromKg } from '@/lib/calculators/health';
import { NumberField, Tabs } from '@/components/ui/fields';

/** URL-state fields for body measurements. Both unit systems are kept, so switching never drifts. */
export const BODY_DEFAULTS = { u: 'metric', cm: 175, kg: 70, ft: 5, inch: 9, lb: 154 };

type BodyState = typeof BODY_DEFAULTS;

/** Height (cm) and weight (kg) from whichever unit system is active. */
export function readBody(s: BodyState) {
  const metric = s.u !== 'imperial';
  return {
    metric,
    cm: metric ? s.cm : cmFromFtIn(s.ft, s.inch),
    kg: metric ? s.kg : kgFromLb(s.lb),
  };
}

/**
 * Metric / imperial switch plus height and weight fields. Works with any
 * URL state that includes the body fields (e.g. the calorie inputs too).
 */
export function BodyFields<T extends BodyState>({ s, set }: { s: T; set: <K extends keyof T>(key: K, value: T[K]) => void }) {
  const put = set as unknown as <K extends keyof BodyState>(key: K, value: BodyState[K]) => void;
  const { metric, cm, kg } = readBody(s);

  const switchTo = (u: 'metric' | 'imperial') => {
    if (u === s.u) return;
    if (u === 'imperial') {
      const { ft, inch } = ftInFromCm(cm);
      put('ft', ft);
      put('inch', inch);
      put('lb', Math.round(lbFromKg(kg) * 10) / 10);
    } else {
      put('cm', Math.round(cm * 10) / 10);
      put('kg', Math.round(kg * 10) / 10);
    }
    put('u', u);
  };

  return (
    <>
      <div>
        <p className="mb-1.5 text-sm font-medium">Units</p>
        <Tabs
          value={metric ? 'metric' : 'imperial'}
          onChange={switchTo}
          tabs={[
            { value: 'metric', label: 'Metric (kg, cm)' },
            { value: 'imperial', label: 'Imperial (lb, ft)' },
          ]}
        />
      </div>

      {metric ? (
        <div className="grid grid-cols-2 items-start gap-3">
          <NumberField label="Height" value={s.cm} onChange={(v) => put('cm', v)} suffix="cm" min={0} max={272} decimals={1} />
          <NumberField label="Weight" value={s.kg} onChange={(v) => put('kg', v)} suffix="kg" min={0} max={650} decimals={1} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 items-start gap-3">
            <NumberField label="Height (feet)" value={s.ft} onChange={(v) => put('ft', v)} suffix="ft" min={0} max={8} decimals={0} />
            <NumberField label="Height (inches)" value={s.inch} onChange={(v) => put('inch', v)} suffix="in" min={0} max={11.9} decimals={1} />
          </div>
          <NumberField label="Weight" value={s.lb} onChange={(v) => put('lb', v)} suffix="lb" min={0} max={1400} decimals={1} />
        </>
      )}
    </>
  );
}

/** Weight in the active unit, for results. */
export function formatWeight(kg: number, metric: boolean, decimals = 1): string {
  const v = metric ? kg : lbFromKg(kg);
  return `${v.toLocaleString('en', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })} ${metric ? 'kg' : 'lb'}`;
}

/** Native date picker styled like the other fields. */
export function DateField({ label, value, onChange, hint, max }: { label: string; value: string; onChange: (v: string) => void; hint?: string; max?: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        max={max}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="tabular h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-base font-medium outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15"
      />
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}
