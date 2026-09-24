import { useEffect, useMemo, useRef, useState } from 'react';

interface Item {
  slug: string;
  name: string;
  category: string;
  live: boolean;
  summary: string;
  keywords: string[];
}

/** Rank by where the query matches: name start > name > keywords > summary. */
function score(item: Item, q: string): number {
  const name = item.name.toLowerCase();
  if (name.startsWith(q)) return 4;
  if (name.includes(q)) return 3;
  if (item.keywords.some((k) => k.includes(q))) return 2;
  if (item.summary.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)) return 1;
  return 0;
}

export default function SearchDialog({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = q
      ? items
          .map((item) => ({ item, s: score(item, q) }))
          .filter((r) => r.s > 0)
          .sort((a, b) => Number(b.item.live) - Number(a.item.live) || b.s - a.s)
          .map((r) => r.item)
      : items.filter((i) => i.live);
    return pool.slice(0, 8);
  }, [items, query]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      inputRef.current?.focus();
    } else if (!open && d.open) d.close();
  }, [open]);

  const go = (item?: Item) => {
    if (item?.live) window.location.href = `/${item.slug}`;
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm text-muted hover:text-fg sm:w-64"
        aria-label="Search calculators"
      >
        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span className="hidden sm:inline">Search calculators</span>
        <kbd className="ml-auto hidden rounded-md border border-line px-1.5 text-[11px] font-medium sm:inline">Ctrl K</kbd>
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === dialogRef.current && setOpen(false)}
        className="m-auto mt-[12vh] w-[min(40rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
        aria-label="Search calculators"
      >
        <div className="border-b border-line p-3">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, results.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === 'Enter') go(results[active]);
            }}
            placeholder="Mortgage, BMI, percentage…"
            className="h-11 w-full rounded-lg bg-transparent px-2 text-base outline-none placeholder:text-muted"
            role="combobox"
            aria-expanded="true"
            aria-controls="search-results"
            aria-activedescendant={results[active] ? `sr-${results[active].slug}` : undefined}
          />
        </div>
        <ul id="search-results" role="listbox" className="max-h-[60vh] overflow-y-auto p-2">
          {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">No calculators found.</li>}
          {results.map((item, i) => (
            <li
              key={item.slug}
              id={`sr-${item.slug}`}
              role="option"
              aria-selected={i === active}
              aria-disabled={!item.live}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(item)}
              className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 ${i === active ? 'bg-brand-soft' : ''} ${item.live ? '' : 'cursor-default opacity-60'}`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.name}</p>
                <p className="truncate text-sm text-muted">{item.summary}</p>
              </div>
              <span className="shrink-0 text-xs text-muted">{item.live ? item.category : 'Coming soon'}</span>
            </li>
          ))}
        </ul>
      </dialog>
    </>
  );
}
