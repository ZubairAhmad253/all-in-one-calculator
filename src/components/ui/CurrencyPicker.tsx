import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { currencyName } from '@/lib/format/number';

/** Shown first in the list, before the alphabetical rest. */
export const POPULAR_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'PKR', 'AED', 'SAR', 'CAD', 'AUD', 'JPY', 'CNY'];

interface Props {
  label: string;
  value: string;
  onChange: (code: string) => void;
  /** Every currency code that can be chosen. */
  codes: string[];
}

/** Button that opens a searchable list of currencies (search by code or name). */
export function CurrencyPicker({ label, value, onChange, codes }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);

  const ordered = useMemo(() => {
    const set = new Set(codes);
    const popular = POPULAR_CURRENCIES.filter((c) => set.has(c));
    const rest = codes.filter((c) => !POPULAR_CURRENCIES.includes(c)).sort();
    return [...popular, ...rest].map((code) => ({ code, name: currencyName(code) }));
  }, [codes]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ordered;
    return ordered
      .filter((c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
      .sort((a, b) => Number(b.code.toLowerCase().startsWith(q)) - Number(a.code.toLowerCase().startsWith(q)));
  }, [ordered, query]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const choose = (code?: string) => {
    if (code) onChange(code);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={root} className="relative">
      <label id={`${id}-label`} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}-btn`}
        id={`${id}-btn`}
        onClick={() => setOpen((o) => !o)}
        className="flex h-12 w-full items-center gap-2 rounded-xl border border-line bg-surface px-3.5 text-left transition hover:border-brand/40 focus-visible:border-brand"
      >
        <span className="font-semibold">{value}</span>
        <span className="min-w-0 flex-1 truncate text-sm text-muted">{currencyName(value)}</span>
        <svg className="size-4 shrink-0 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full min-w-64 overflow-hidden rounded-xl border border-line bg-surface shadow-2xl">
          <div className="border-b border-line p-2">
            <input
              ref={input}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActive((a) => Math.min(a + 1, results.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActive((a) => Math.max(a - 1, 0));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  choose(results[active]?.code);
                } else if (e.key === 'Escape') setOpen(false);
              }}
              placeholder="Search currency or code"
              aria-label="Search currencies"
              role="combobox"
              aria-expanded="true"
              aria-controls={`${id}-list`}
              aria-activedescendant={results[active] ? `${id}-${results[active].code}` : undefined}
              className="h-10 w-full rounded-lg bg-surface-2 px-3 text-sm outline-none placeholder:text-muted"
            />
          </div>
          <ul ref={list} id={`${id}-list`} role="listbox" aria-label={label} className="max-h-72 overflow-y-auto p-1.5">
            {results.length === 0 && <li className="px-3 py-4 text-center text-sm text-muted">No currencies found</li>}
            {results.map((c, i) => (
              <li
                key={c.code}
                id={`${id}-${c.code}`}
                data-index={i}
                role="option"
                aria-selected={c.code === value}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(c.code)}
                className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm ${i === active ? 'bg-brand-soft' : ''}`}
              >
                <span className="w-10 font-semibold">{c.code}</span>
                <span className="min-w-0 flex-1 truncate text-muted">{c.name}</span>
                {c.code === value && <span className="text-brand">✓</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
