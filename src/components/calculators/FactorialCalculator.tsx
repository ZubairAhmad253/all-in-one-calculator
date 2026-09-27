import { useMemo, useState } from 'react';
import { factorialBig, factorialTrailingZeros, MAX_FACTORIAL } from '@/lib/calculators/numbers';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField } from '@/components/ui/fields';
import { ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { n: 10 };

/** 1.5511210043 × 10²⁵ style approximation of a long digit string. */
function scientific(digits: string): string {
  if (digits.length <= 15) return Number(digits).toLocaleString('en');
  const mantissa = `${digits[0]}.${digits.slice(1, 11)}`.replace(/\.?0+$/, '');
  return `${mantissa} × 10^${digits.length - 1}`;
}

export default function FactorialCalculator() {
  const [s, set] = useUrlState(DEFAULTS);
  const [copied, setCopied] = useState(false);
  const n = Math.round(s.n);
  const valid = Number.isInteger(s.n) && n >= 0 && n <= MAX_FACTORIAL;
  const digits = useMemo(() => (valid ? factorialBig(n).toString() : ''), [n, valid]);
  const working = valid && n <= 12 ? (n < 2 ? `${n}! = 1 (by definition)` : `${n}! = ${Array.from({ length: n }, (_, i) => n - i).join(' × ')} = ${Number(digits).toLocaleString('en')}`) : null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(digits);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <section aria-label="Factorial calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <div className="space-y-4 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <NumberField label="n" value={s.n} onChange={(v) => set('n', v)} suffix="!" min={0} max={MAX_FACTORIAL} decimals={0} hint={`Any whole number from 0 to ${MAX_FACTORIAL.toLocaleString('en')}.`} />
          <div className="flex flex-wrap gap-2">
            {[5, 10, 20, 52, 100, 1000].map((x) => (
              <button key={x} type="button" onClick={() => set('n', x)} className="h-8 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-muted hover:border-brand/40 hover:text-fg">
                {x}!
              </button>
            ))}
          </div>
        </div>
        <div className="min-w-0 bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!valid ? (
            <p className="text-sm text-warn">Enter a whole number from 0 to {MAX_FACTORIAL.toLocaleString('en')}.</p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted">{n}! =</p>
                  <p className="tabular mt-1 text-3xl font-bold tracking-tight break-all sm:text-4xl">{scientific(digits)}</p>
                </div>
                <ShareButton />
              </div>
              {working && <p className="tabular mt-3 text-sm text-muted">{working}</p>}
              <div className="mt-6">
                <StatGrid
                  items={[
                    ['Number of digits', digits.length.toLocaleString('en')],
                    ['Trailing zeros', factorialTrailingZeros(n).toLocaleString('en')],
                  ]}
                />
              </div>
              {digits.length > 15 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Exact value</p>
                    <button type="button" onClick={copy} className="h-8 rounded-lg border border-line bg-surface px-3 text-xs font-medium hover:border-brand/40">
                      {copied ? 'Copied' : 'Copy all digits'}
                    </button>
                  </div>
                  <p className="tabular mt-2 max-h-48 overflow-y-auto rounded-xl border border-line bg-surface p-3 font-mono text-xs leading-5 break-all">{digits}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
