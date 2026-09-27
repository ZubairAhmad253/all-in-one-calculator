import { useCallback, useEffect, useState } from 'react';
import { draw, DrawError, MAX_COUNT, type DrawOptions } from '@/lib/calculators/random';
import { formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, SelectField } from '@/components/ui/fields';

const DEFAULTS = { min: 1, max: 100, n: 1, u: 1, sort: 'none' };

const PRESETS: { label: string; min: number; max: number; n: number; u: number; sort: string }[] = [
  { label: 'Roll a die (1–6)', min: 1, max: 6, n: 1, u: 0, sort: 'none' },
  { label: '1–10', min: 1, max: 10, n: 1, u: 1, sort: 'none' },
  { label: '1–100', min: 1, max: 100, n: 1, u: 1, sort: 'none' },
  { label: 'Lottery: 6 from 49', min: 1, max: 49, n: 6, u: 1, sort: 'asc' },
  { label: 'Coin: 0 or 1', min: 0, max: 1, n: 1, u: 0, sort: 'none' },
];

export default function RandomNumberGenerator() {
  const [s, set] = useUrlState(DEFAULTS);
  const [numbers, setNumbers] = useState<number[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<number[][]>([]);
  const [copied, setCopied] = useState(false);

  const opts: DrawOptions = { min: s.min, max: s.max, count: s.n, unique: s.u === 1, sort: s.sort === 'asc' || s.sort === 'desc' ? s.sort : 'none' };

  /** `record` adds the draw to the history (button presses only, not automatic redraws). */
  const generate = useCallback((record = true) => {
    try {
      const out = draw(opts);
      setNumbers(out);
      setError(null);
      if (record) setHistory((h) => [out, ...h].slice(0, 8));
    } catch (e) {
      setError(e instanceof DrawError ? e.message : 'Something went wrong');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.min, s.max, s.n, s.u, s.sort]);

  // Draw in the browser (never during the build), and again whenever the
  // settings change, including when they load from a shared link.
  useEffect(() => {
    generate(false);
  }, [generate]);

  const copy = async () => {
    if (!numbers) return;
    try {
      await navigator.clipboard.writeText(numbers.join(', '));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* Clipboard blocked. */
    }
  };

  const single = numbers?.length === 1;

  return (
    <section aria-label="Random number generator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Minimum" value={s.min} onChange={(v) => set('min', Math.round(v))} decimals={0} />
            <NumberField label="Maximum" value={s.max} onChange={(v) => set('max', Math.round(v))} decimals={0} />
          </div>
          <NumberField label="How many numbers" value={s.n} onChange={(v) => set('n', Math.round(v))} min={1} max={MAX_COUNT} decimals={0} />
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Repeats"
              value={s.u}
              onChange={(v) => set('u', v)}
              options={[
                { value: 1, label: 'No repeats' },
                { value: 0, label: 'Allow repeats' },
              ]}
            />
            <SelectField
              label="Order"
              value={opts.sort}
              onChange={(v) => set('sort', v)}
              options={[
                { value: 'none', label: 'As drawn' },
                { value: 'asc', label: 'Smallest first' },
                { value: 'desc', label: 'Largest first' },
              ]}
            />
          </div>
          <div>
            <p className="text-sm font-medium">Quick picks</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    set('min', p.min);
                    set('max', p.max);
                    set('n', p.n);
                    set('u', p.u);
                    set('sort', p.sort);
                  }}
                  className="h-8 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-muted hover:border-brand/40 hover:text-fg"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          <p className="text-sm font-medium text-muted">
            {formatNumber(opts.count, 0)} {opts.count === 1 ? 'number' : 'numbers'} from {formatNumber(opts.min, 0)} to {formatNumber(opts.max, 0)}
            {opts.count > 1 ? (opts.unique ? ', no repeats' : ', repeats allowed') : ''}
          </p>

          <div className="flex min-h-40 flex-1 items-center justify-center py-6">
            {error ? (
              <p className="text-center font-medium text-warn" role="alert">
                {error}
              </p>
            ) : !numbers ? (
              <p className="text-muted">…</p>
            ) : single ? (
              <p className="tabular text-7xl font-bold tracking-tight sm:text-8xl">{formatNumber(numbers[0], 0)}</p>
            ) : (
              <ul className="flex max-h-72 flex-wrap justify-center gap-2 overflow-y-auto">
                {numbers.map((n, i) => (
                  <li key={i} className="tabular grid min-w-12 place-items-center rounded-xl border border-line bg-surface px-3 py-2 text-lg font-semibold">
                    {formatNumber(n, 0)}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => generate()} className="h-12 rounded-xl bg-brand px-8 text-base font-semibold text-brand-fg hover:opacity-90">
              Generate
            </button>
            {numbers && !error && (
              <button type="button" onClick={copy} className="h-12 rounded-xl border border-line bg-surface px-5 text-sm font-medium hover:border-brand/40">
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>

          {history.length > 0 && (
            <div className="mt-6 border-t border-line pt-4">
              <p className="text-xs font-semibold text-muted">Recent draws</p>
              <ul className="tabular mt-2 space-y-1 text-sm text-muted">
                {history.map((h, i) => (
                  <li key={i} className="truncate">
                    {h.join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-4 text-center text-xs text-muted">Numbers come from your browser’s secure random generator; every number in the range is equally likely.</p>
        </div>
      </div>
    </section>
  );
}
