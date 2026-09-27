import { useId, useState } from 'react';
import { groupDigits, parseInBase, toBase } from '@/lib/calculators/numeral';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, SelectField } from '@/components/ui/fields';
import { ShareButton } from './shared/results';

const DEFAULTS = { n: '255', base: 10, custom: 36 };

const BASES = [
  { value: 2, label: 'Binary (base 2)' },
  { value: 8, label: 'Octal (base 8)' },
  { value: 10, label: 'Decimal (base 10)' },
  { value: 16, label: 'Hexadecimal (base 16)' },
  ...Array.from({ length: 35 }, (_, i) => i + 2)
    .filter((b) => ![2, 8, 10, 16].includes(b))
    .map((b) => ({ value: b, label: `Base ${b}` })),
];

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted">{label}</p>
        <p className="tabular mt-0.5 font-mono text-base font-semibold break-all">{value}</p>
        {sub && <p className="text-xs text-muted">{sub}</p>}
      </div>
      <button
        type="button"
        aria-label={`Copy ${label}`}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value.replace(/[\s,]/g, ''));
            setDone(true);
            setTimeout(() => setDone(false), 1500);
          } catch {
            /* Clipboard blocked. */
          }
        }}
        className="h-8 shrink-0 rounded-lg border border-line px-2.5 text-xs font-medium text-muted hover:text-fg"
      >
        {done ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

export default function NumberBaseConverter() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const id = useId();
  const base = Math.min(36, Math.max(2, Math.round(s.base) || 10));
  const custom = Math.min(36, Math.max(2, Math.round(s.custom) || 36));
  const value = s.n.length <= 400 ? parseInBase(s.n, base) : null;
  const invalid = s.n.trim() !== '' && value === null;
  const bits = value !== null ? (value < 0n ? -value : value).toString(2).length : 0;

  return (
    <section aria-label="Number base converter" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <SelectField label="Input base" value={base} onChange={(v) => set('base', v)} options={BASES} />
          <div>
            <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
              Number
            </label>
            <input
              id={id}
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={s.n}
              aria-invalid={invalid}
              onChange={(e) => set('n', e.target.value)}
              className={`h-12 w-full rounded-xl border bg-surface px-3.5 font-mono text-base font-medium outline-none focus:ring-4 ${invalid ? 'border-warn focus:ring-warn/15' : 'border-line focus:border-brand focus:ring-brand/15'}`}
            />
            <p className={`mt-1.5 text-xs ${invalid ? 'text-warn' : 'text-muted'}`}>
              {invalid ? `Use only digits valid in base ${base}${base > 10 ? ` (0–9 and a–${'abcdefghijklmnopqrstuvwxyz'[base - 11]})` : ` (0–${base - 1})`}.` : 'Whole numbers of any size. Spaces, underscores and 0b / 0o / 0x prefixes are fine.'}
            </p>
          </div>
          <NumberField label="Also show in base" value={s.custom} onChange={(v) => set('custom', v)} min={2} max={36} decimals={0} />
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {value === null ? (
            <p className="text-sm text-muted">Enter a whole number to convert.</p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted">Decimal value</p>
                  <p className={`tabular mt-1 font-bold tracking-tight break-all ${value.toString().length > 14 ? 'text-2xl' : 'text-4xl sm:text-5xl'}`}>{value.toLocaleString('en')}</p>
                </div>
                <ShareButton />
              </div>
              <div className="mt-6 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
                <Row label="Binary (base 2)" value={groupDigits(toBase(value, 2), 4)} sub={`${bits} bit${bits === 1 ? '' : 's'}`} />
                <Row label="Octal (base 8)" value={toBase(value, 8)} />
                <Row label="Decimal (base 10)" value={value.toLocaleString('en')} />
                <Row label="Hexadecimal (base 16)" value={groupDigits(toBase(value, 16).toUpperCase(), 4)} sub={value >= 0n && value < 2n ** 64n ? `0x${toBase(value, 16).toUpperCase()}` : undefined} />
                {![2, 8, 10, 16].includes(custom) && <Row label={`Base ${custom}`} value={toBase(value, custom).toUpperCase()} />}
              </div>
              <p className="mt-3 text-xs text-muted">Negative numbers are shown with a minus sign rather than in two’s complement.</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
