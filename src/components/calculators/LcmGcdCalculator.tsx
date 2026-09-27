import { gcd, gcdAll, lcmAll, primeFactors } from '@/lib/calculators/numbers';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberListField, parseList } from './shared/numberlist';
import { Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { n: '12, 18, 30' };
const MAX = 1e12;

const factorText = (n: number) =>
  n < 2
    ? String(n)
    : primeFactors(n)
        .map(([p, e]) => (e > 1 ? `${p}${String(e).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)])}` : String(p)))
        .join(' × ');

/** Euclid's algorithm steps for two numbers: 48 = 2 × 18 + 12, … */
function euclid(a: number, b: number): string[] {
  const steps: string[] = [];
  let [x, y] = [Math.max(a, b), Math.min(a, b)];
  while (y && steps.length < 20) {
    steps.push(`${x.toLocaleString('en')} = ${Math.floor(x / y).toLocaleString('en')} × ${y.toLocaleString('en')} + ${(x % y).toLocaleString('en')}`);
    [x, y] = [y, x % y];
  }
  return steps;
}

export default function LcmGcdCalculator() {
  const [s, set] = useUrlState(DEFAULTS);
  const all = parseList(s.n);
  const nums = all.filter((x) => Number.isInteger(x) && x > 0 && x <= MAX).slice(0, 20);
  const skipped = all.length - nums.length;
  const g = nums.length ? gcdAll(nums) : 0;
  const l = nums.length ? lcmAll(nums) : 0n;

  return (
    <section aria-label="LCM and GCD calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-4 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <NumberListField label="Numbers" value={s.n} onChange={(v) => set('n', v)} hint="Two or more whole numbers, separated by commas or spaces (up to 20)." />
          {skipped > 0 && <p className="text-xs text-warn">{skipped} value{skipped === 1 ? '' : 's'} skipped: use positive whole numbers up to 1 trillion.</p>}
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {nums.length < 2 ? (
            <p className="text-sm text-muted">Enter at least two positive whole numbers.</p>
          ) : (
            <>
              <Headline label={`GCD of ${nums.join(', ')}`} value={g.toLocaleString('en')} action={<ShareButton />} compact />
              <div className="mt-6">
                <StatGrid
                  items={[
                    ['Greatest common divisor (GCD / HCF)', g.toLocaleString('en')],
                    ['Least common multiple (LCM)', l.toLocaleString('en')],
                  ]}
                />
              </div>
              <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface">
                <table className="tabular w-full text-sm">
                  <thead className="bg-surface-2 text-left text-xs text-muted">
                    <tr>
                      <th className="px-4 py-2 font-medium">Number</th>
                      <th className="px-4 py-2 font-medium">Prime factors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {nums.map((x, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 font-medium">{x.toLocaleString('en')}</td>
                        <td className="px-4 py-2">{factorText(x)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-muted">GCD: multiply the primes common to all numbers, each at its lowest power. LCM: multiply every prime, each at its highest power.</p>
              {nums.length === 2 && (
                <div className="mt-5">
                  <p className="text-sm font-semibold">Euclid’s algorithm</p>
                  <ol className="tabular mt-2 space-y-1 text-sm">
                    {euclid(nums[0], nums[1]).map((st, i) => (
                      <li key={i}>{st}</li>
                    ))}
                  </ol>
                  <p className="mt-2 text-sm text-muted">The last non-zero remainder, {gcd(nums[0], nums[1]).toLocaleString('en')}, is the GCD.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
