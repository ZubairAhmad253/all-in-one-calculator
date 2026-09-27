/**
 * Number theory and algebra helpers: ratios, quadratics, GCD/LCM, primes,
 * factorials, powers, logarithms and roots. Pure functions only.
 * Whole-number results that can exceed 2^53 use BigInt so every digit is exact.
 */

// ---------------------------------------------------------- gcd / lcm

export function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) [a, b] = [b, a % b];
  return a;
}

export const gcdAll = (ns: number[]) => ns.reduce((g, n) => gcd(g, n), 0);

/** LCM of a list, exact with BigInt (LCMs grow quickly). */
export function lcmAll(ns: number[]): bigint {
  let l = 1n;
  for (const n of ns) {
    const b = BigInt(Math.abs(Math.round(n)));
    if (b === 0n) return 0n;
    let x = l;
    let y = b;
    while (y) [x, y] = [y, x % y];
    l = (l / x) * b;
  }
  return l;
}

// --------------------------------------------------------------- ratio

/** Number of decimal places, so ratios like 1.5 : 2.25 can be scaled to whole numbers. */
const decimals = (n: number) => {
  const s = String(n);
  return s.includes('e-') ? Number(s.split('e-')[1]) : (s.split('.')[1] ?? '').length;
};

/** Simplify a ratio of any number of terms to the smallest whole numbers: 1.5 : 2.25 → 2 : 3. */
export function simplifyRatio(terms: number[]): number[] {
  if (terms.some((t) => !Number.isFinite(t)) || terms.every((t) => t === 0)) return terms;
  const p = Math.pow(10, Math.min(Math.max(...terms.map(decimals)), 8));
  const ints = terms.map((t) => Math.round(t * p));
  const g = gcdAll(ints);
  return ints.map((t) => t / g);
}

/** Solve A : B = C : x for x. */
export const solveProportion = (a: number, b: number, c: number) => (a === 0 ? Number.NaN : (b * c) / a);

// ------------------------------------------------------------ quadratic

export interface QuadraticResult {
  discriminant: number;
  /** 'two' real roots, 'one' repeated root, 'complex' pair, or 'linear' when a = 0. */
  kind: 'two' | 'one' | 'complex' | 'linear' | 'none';
  roots: { re: number; im: number }[];
  vertex: { x: number; y: number } | null;
}

/** Roots of ax² + bx + c = 0. */
export function quadratic(a: number, b: number, c: number): QuadraticResult {
  if (a === 0) {
    if (b === 0) return { discriminant: Number.NaN, kind: 'none', roots: [], vertex: null };
    return { discriminant: Number.NaN, kind: 'linear', roots: [{ re: -c / b + 0, im: 0 }], vertex: null };
  }
  const d = b * b - 4 * a * c;
  const vx = -b / (2 * a);
  const vertex = { x: vx + 0, y: a * vx * vx + b * vx + c };
  if (d > 0) {
    // Numerically stable form avoids cancellation when b² ≫ 4ac.
    const q = -0.5 * (b + Math.sign(b || 1) * Math.sqrt(d));
    const r1 = q / a;
    const r2 = c / q;
    const [lo, hi] = r1 < r2 ? [r1, r2] : [r2, r1];
    return { discriminant: d, kind: 'two', roots: [{ re: lo + 0, im: 0 }, { re: hi + 0, im: 0 }], vertex };
  }
  if (d === 0) return { discriminant: 0, kind: 'one', roots: [{ re: vx + 0, im: 0 }], vertex };
  const im = Math.sqrt(-d) / (2 * a);
  return { discriminant: d, kind: 'complex', roots: [{ re: vx + 0, im: -Math.abs(im) }, { re: vx + 0, im: Math.abs(im) }], vertex };
}

// --------------------------------------------------------------- primes

/** Largest whole number handled exactly by the prime tools. */
export const MAX_PRIME_INPUT = Number.MAX_SAFE_INTEGER;

export function isPrime(n: number): boolean {
  if (!Number.isInteger(n) || n < 2) return false;
  if (n < 4) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) if (n % i === 0 || n % (i + 2) === 0) return false;
  return true;
}

/** Prime factorisation as [prime, exponent] pairs: 360 → [[2,3],[3,2],[5,1]]. */
export function primeFactors(n: number): [number, number][] {
  const out: [number, number][] = [];
  if (!Number.isInteger(n) || n < 2) return out;
  let m = n;
  for (const p of [2, 3]) {
    let e = 0;
    while (m % p === 0) {
      m /= p;
      e++;
    }
    if (e) out.push([p, e]);
  }
  for (let i = 5; i * i <= m; i += 6) {
    for (const p of [i, i + 2]) {
      let e = 0;
      while (m % p === 0) {
        m /= p;
        e++;
      }
      if (e) out.push([p, e]);
    }
  }
  if (m > 1) out.push([m, 1]);
  return out;
}

/** All divisors in ascending order (from the factorisation). */
export function divisors(n: number): number[] {
  let ds = [1];
  for (const [p, e] of primeFactors(n)) {
    const next: number[] = [];
    for (const d of ds) for (let k = 0, pk = 1; k <= e; k++, pk *= p) next.push(d * pk);
    ds = next;
  }
  return n >= 1 ? ds.sort((a, b) => a - b) : [];
}

export function nextPrime(n: number): number {
  let k = Math.max(2, Math.floor(n) + 1);
  while (!isPrime(k)) k++;
  return k;
}

export function previousPrime(n: number): number | null {
  for (let k = Math.ceil(n) - 1; k >= 2; k--) if (isPrime(k)) return k;
  return null;
}

// ------------------------------------------------------------ factorial

export const MAX_FACTORIAL = 3000;

/** Exact n! as a BigInt. */
export function factorialBig(n: number): bigint {
  let r = 1n;
  for (let k = 2n; k <= BigInt(n); k++) r *= k;
  return r;
}

/** Number of trailing zeros in n! (count factors of 5). */
export function factorialTrailingZeros(n: number): number {
  let z = 0;
  for (let p = 5; p <= n; p *= 5) z += Math.floor(n / p);
  return z;
}

// ------------------------------------------------------ powers and logs

/** Exact integer power when base and exponent are whole numbers (exponent ≥ 0). */
export function powBig(base: number, exp: number): bigint | null {
  if (!Number.isInteger(base) || !Number.isInteger(exp) || exp < 0 || exp > 10_000) return null;
  return BigInt(base) ** BigInt(exp);
}

/** log_base(x); NaN for invalid input (x ≤ 0, base ≤ 0 or base = 1). */
export function logBase(x: number, base: number): number {
  if (!(x > 0) || !(base > 0) || base === 1) return Number.NaN;
  // Exact for powers: log10(1000) = 3, not 2.9999999999999996.
  const r = Math.log(x) / Math.log(base);
  const rounded = Math.round(r);
  return Math.abs(r - rounded) < 1e-12 && Math.abs(Math.pow(base, rounded) - x) <= 1e-9 * Math.abs(x) ? rounded : r;
}

/** Real nth root (odd roots of negatives are allowed); NaN when undefined. */
export function nthRoot(x: number, n: number): number {
  if (n === 0) return Number.NaN;
  if (x < 0) return Number.isInteger(n) && Math.abs(n) % 2 === 1 ? -Math.pow(-x, 1 / n) : Number.NaN;
  const r = Math.pow(x, 1 / n);
  const rounded = Math.round(r);
  return Math.abs(Math.pow(rounded, n) - x) < 1e-9 * Math.max(1, x) ? rounded : r;
}

/** Simplify √n (or ⁿ√n) into a·ⁿ√b with b having no nth-power factors: √72 = 6√2. */
export function simplifyRadical(n: number, index = 2): { outside: number; inside: number } {
  if (!Number.isInteger(n) || n < 0 || !Number.isInteger(index) || index < 2) return { outside: 1, inside: n };
  let outside = 1;
  let inside = 1;
  for (const [p, e] of primeFactors(n)) {
    outside *= Math.pow(p, Math.floor(e / index));
    inside *= Math.pow(p, e % index);
  }
  return n === 0 ? { outside: 0, inside: 1 } : { outside, inside };
}
