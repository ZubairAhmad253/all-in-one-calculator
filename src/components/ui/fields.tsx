import { useEffect, useId, useState, type ReactNode } from 'react';
import { formatNumber, parseNumber } from '@/lib/format/number';

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: ReactNode;
  suffix?: ReactNode;
  /** Shown under the field, e.g. "20% of home price". */
  hint?: ReactNode;
  min?: number;
  max?: number;
  /** Adds a range slider under the input for quick exploration. */
  slider?: { min: number; max: number; step: number };
  decimals?: number;
  /** Digit grouping locale, e.g. from localeFor(currency) for money fields. */
  locale?: string;
}

/**
 * Text input for numbers. It accepts "1,250.5" style typing, formats with
 * thousands separators on blur, and reports every valid keystroke so
 * results update as the user types.
 */
export function NumberField({ label, value, onChange, prefix, suffix, hint, min, max, slider, decimals = 2, locale = 'en' }: NumberFieldProps) {
  const id = useId();
  const [text, setText] = useState(() => formatNumber(value, decimals, locale));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(formatNumber(value, decimals, locale));
  }, [value, focused, decimals, locale]);

  const n = parseNumber(text);
  const invalid = text.trim() !== '' && (Number.isNaN(n) || (min !== undefined && n < min) || (max !== undefined && n > max));

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <div
        className={`flex h-12 items-center rounded-xl border bg-surface px-3.5 transition focus-within:ring-4 ${
          invalid ? 'border-warn focus-within:ring-warn/15' : 'border-line focus-within:border-brand focus-within:ring-brand/15'
        }`}
      >
        {prefix && <span className="mr-2 text-muted">{prefix}</span>}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={text}
          aria-invalid={invalid}
          aria-describedby={hint ? `${id}-hint` : undefined}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            setText(e.target.value);
            const v = parseNumber(e.target.value);
            if (!Number.isNaN(v) && (min === undefined || v >= min) && (max === undefined || v <= max)) onChange(v);
          }}
          className="tabular h-full w-full min-w-0 bg-transparent text-base font-medium outline-none"
        />
        {suffix && <span className="ml-2 shrink-0 text-muted">{suffix}</span>}
      </div>
      {slider && (
        <input
          type="range"
          aria-label={`${label} slider`}
          min={slider.min}
          max={slider.max}
          step={slider.step}
          value={Math.min(Math.max(value, slider.min), slider.max)}
          onChange={(e) => onChange(Number(e.target.value))}
          className="mt-2 w-full accent-[var(--brand)]"
        />
      )}
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

interface SelectFieldProps<T extends string | number> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}

export function SelectField<T extends string | number>({ label, value, onChange, options }: SelectFieldProps<T>) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => {
          const raw = e.target.value;
          onChange((typeof value === 'number' ? Number(raw) : raw) as T);
        }}
        className="h-12 w-full rounded-xl border border-line bg-surface px-3 text-base font-medium outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Pill tabs, e.g. Summary / Schedule. */
export function Tabs<T extends string>({ value, onChange, tabs }: { value: T; onChange: (v: T) => void; tabs: { value: T; label: string }[] }) {
  return (
    <div role="tablist" className="inline-flex rounded-xl bg-surface-2 p-1">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          type="button"
          aria-selected={t.value === value}
          onClick={() => onChange(t.value)}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${t.value === value ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export type TermUnit = 'y' | 'm';

/** Loan term with a years/months switch inside the field. */
export function TermField({ label = 'Loan term', value, unit, onChange, onUnitChange, maxYears = 40 }: {
  label?: string;
  value: number;
  unit: TermUnit;
  onChange: (value: number) => void;
  /** Receives the new unit and the value converted into it. */
  onUnitChange: (unit: TermUnit, value: number) => void;
  maxYears?: number;
}) {
  const unitSelect = (
    <select
      aria-label="Term unit"
      value={unit}
      onChange={(e) => {
        const next = e.target.value as TermUnit;
        if (next !== unit) onUnitChange(next, next === 'm' ? Math.round(value * 12) : Math.max(1, Math.round(value / 12)));
      }}
      className="-mr-1 cursor-pointer rounded-md bg-transparent py-1 text-sm font-medium text-muted outline-none hover:text-fg"
    >
      <option value="y">years</option>
      <option value="m">months</option>
    </select>
  );
  return (
    <NumberField
      label={label}
      value={value}
      onChange={onChange}
      suffix={unitSelect}
      min={1}
      max={unit === 'y' ? maxYears : maxYears * 12}
      decimals={0}
      slider={unit === 'y' ? { min: 1, max: maxYears, step: 1 } : { min: 1, max: maxYears * 12, step: 1 }}
    />
  );
}
