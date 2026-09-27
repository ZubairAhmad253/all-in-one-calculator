import { useId } from 'react';

/** Parse "12, 18 30;42" into numbers (commas, spaces, semicolons or new lines). */
export function parseList(text: string): number[] {
  return text
    .split(/[\s,;]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => Number.isFinite(n));
}

/** Free-text field for a list of numbers. */
export function NumberListField({ label, value, onChange, hint, rows = 2 }: { label: string; value: string; onChange: (v: string) => void; hint?: string; rows?: number }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="tabular w-full resize-y rounded-xl border border-line bg-surface px-3.5 py-3 text-base font-medium outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
      />
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}
