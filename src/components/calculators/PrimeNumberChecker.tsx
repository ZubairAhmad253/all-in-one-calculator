import { useMemo } from 'react';
import { divisors, isPrime, MAX_PRIME_INPUT, nextPrime, previousPrime, primeFactors } from '@/lib/calculators/numbers';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField } from '@/components/ui/fields';
import { ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { n: 97 };
/** Searching for neighbouring primes above this gets slow in a browser. */
const NEIGHBOUR_LIMIT = 1e12;

const sup = (e: number) => String(e).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)]);

export default function PrimeNumberChecker() {
  const [s, set] = useUrlState(DEFAULTS);
  const n = s.n;
  const valid = Number.isInteger(n) && n >= 0 && n <= MAX_PRIME_INPUT;

  const info = useMemo(() => {
    if (!valid) return null;
    const prime = isPrime(n);
    const factors = primeFactors(n);
    const divCount = factors.reduce((c, [, e]) => c * (e + 1), 1);
    return {
      prime,
      factors,
      divCount: n >= 1 ? divCount : 0,
      divs: n >= 1 && divCount <= 120 ? divisors(n) : null,
      next: n <= NEIGHBOUR_LIMIT ? nextPrime(n) : null,
      prev: n <= NEIGHBOUR_LIMIT ? previousPrime(n) : null,
    };
  }, [n, valid]);

  return (
    <section aria-label="Prime number checker" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-4 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <NumberField label="Whole number" value={s.n} onChange={(v) => set('n', v)} min={0} max={MAX_PRIME_INPUT} decimals={0} hint="Any whole number up to 9,007,199,254,740,991." />
          <div className="flex flex-wrap gap-2">
            {[2, 17, 91, 561, 7919, 2147483647].map((x) => (
              <button key={x} type="button" onClick={() => set('n', x)} className="h-8 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-muted hover:border-brand/40 hover:text-fg">
                {x.toLocaleString('en')}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!info ? (
            <p className="text-sm text-warn">Enter a whole number from 0 to 9,007,199,254,740,991.</p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="tabular text-sm font-medium text-muted">{n.toLocaleString('en')}</p>
                  <p className={`mt-1 text-4xl font-bold tracking-tight ${info.prime ? 'text-accent' : ''}`}>{info.prime ? 'is prime' : n < 2 ? 'is not prime' : 'is not prime'}</p>
                  <p className="mt-2 text-sm text-muted">
                    {n < 2
                      ? `${n} is neither prime nor composite: primes start at 2.`
                      : info.prime
                        ? `Its only divisors are 1 and ${n.toLocaleString('en')}.`
                        : `It’s composite: ${n.toLocaleString('en')} = ${info.factors.map(([p, e]) => `${p.toLocaleString('en')}${e > 1 ? sup(e) : ''}`).join(' × ')}.`}
                  </p>
                </div>
                <ShareButton />
              </div>
              <div className="mt-6">
                <StatGrid
                  items={[
                    ['Previous prime', info.prev !== null ? info.prev.toLocaleString('en') : n > NEIGHBOUR_LIMIT ? 'Too large to search' : 'None'],
                    ['Next prime', info.next !== null ? info.next.toLocaleString('en') : 'Too large to search'],
                    ['Number of divisors', info.divCount.toLocaleString('en')],
                    ['Even or odd', n % 2 === 0 ? 'Even' : 'Odd'],
                  ]}
                />
              </div>
              {info.divs && info.divs.length > 0 && (
                <div className="mt-5">
                  <p className="text-sm font-semibold">All divisors</p>
                  <p className="tabular mt-1 text-sm break-words text-muted">{info.divs.map((d) => d.toLocaleString('en')).join(', ')}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
