/**
 * Number tools and statistics: rounding, scientific notation, averages,
 * spread, probability, permutations/combinations and matrices.
 * Pure functions only.
 */

// ------------------------------------------------------------ rounding

export type RoundMode = 'half-up' | 'half-even' | 'up' | 'down' | 'toward-zero';

/**
 * Round to `places` decimal places (negative places round to tens,
 * hundreds…). Works on the decimal string, so 1.005 rounds to 1.01 as
 * people expect (plain Math.round(100.49999…) would give 1.00).
 */
export function roundTo(x: number, places: number, mode: RoundMode = 'half-up'): number {
  if (!Number.isFinite(x)) return x;
  const shift = (v: number, p: number) => {
    const [m, e = '0'] = String(v).split('e');
    return Number(`${m}e${Number(e) + p}`);
  };
  const scaled = shift(x, places);
  const floor = Math.floor(scaled);
  const frac = scaled - floor;
  const eps = 1e-9;
  let r: number;
  switch (mode) {
    case 'up':
      r = Math.ceil(scaled - eps);
      break;
    case 'down':
      r = Math.floor(scaled + eps);
      break;
    case 'toward-zero':
      r = Math.trunc(scaled + (scaled < 0 ? -eps : eps));
      break;
    case 'half-even':
      if (Math.abs(frac - 0.5) < eps) r = floor % 2 === 0 ? floor : floor + 1;
      else r = Math.round(scaled);
      break;
    default:
      // Half away from zero.
      r = Math.sign(scaled) * Math.round(Math.abs(scaled) + eps);
  }
  return shift(r, -places) + 0;
}

/** Round to `sig` significant figures. */
export function roundSig(x: number, sig: number, mode: RoundMode = 'half-up'): number {
  if (x === 0 || !Number.isFinite(x)) return x;
  const magnitude = Math.floor(Math.log10(Math.abs(x)));
  return roundTo(x, sig - 1 - magnitude, mode);
}

// ------------------------------------------------- scientific notation

export interface Scientific {
  mantissa: number;
  exponent: number;
}

/** 123,400 → 1.234 × 10⁵; `engineering` keeps the exponent a multiple of 3. */
export function toScientific(x: number, engineering = false): Scientific {
  if (x === 0 || !Number.isFinite(x)) return { mantissa: x, exponent: 0 };
  let exponent = Math.floor(Math.log10(Math.abs(x)));
  if (engineering) exponent = Math.floor(exponent / 3) * 3;
  let mantissa = Number((x / Math.pow(10, exponent)).toPrecision(15));
  // Guard against 9.9999999 → 10 after rounding.
  if (!engineering && Math.abs(mantissa) >= 10) {
    mantissa /= 10;
    exponent += 1;
  }
  return { mantissa, exponent };
}

/** Parse "6.022e23", "6.022 × 10^23", "6.022x10^23" or a plain number. */
export function parseScientific(text: string): number {
  const t = text.replace(/[,\s]/g, '').replace(/[×xX*]10\^/, 'e').replace(/·10\^/, 'e').replace('−', '-');
  const n = Number(t);
  return Number.isFinite(n) ? n : Number.NaN;
}

// ------------------------------------------------------------ averages

export interface Summary {
  count: number;
  sum: number;
  mean: number;
  median: number;
  modes: number[];
  min: number;
  max: number;
  range: number;
  geometricMean: number;
  harmonicMean: number;
}

export function summarize(xs: number[]): Summary | null {
  if (xs.length === 0) return null;
  const sorted = [...xs].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const counts = new Map<number, number>();
  for (const x of sorted) counts.set(x, (counts.get(x) ?? 0) + 1);
  const top = Math.max(...counts.values());
  const modes = top > 1 ? [...counts].filter(([, c]) => c === top).map(([v]) => v) : [];
  const positive = sorted.every((x) => x > 0);
  return {
    count: n,
    sum,
    mean: sum / n,
    median,
    modes,
    min: sorted[0],
    max: sorted[n - 1],
    range: sorted[n - 1] - sorted[0],
    geometricMean: positive ? Math.exp(sorted.reduce((a, x) => a + Math.log(x), 0) / n) : Number.NaN,
    harmonicMean: positive ? n / sorted.reduce((a, x) => a + 1 / x, 0) : Number.NaN,
  };
}

/** Weighted mean Σ(x·w) ÷ Σw. */
export function weightedMean(xs: number[], ws: number[]): number {
  let sw = 0;
  let s = 0;
  xs.forEach((x, i) => {
    const w = ws[i] ?? 0;
    sw += w;
    s += x * w;
  });
  return sw !== 0 ? s / sw : Number.NaN;
}

// -------------------------------------------------------------- spread

export interface Spread {
  mean: number;
  /** Sum of squared deviations from the mean. */
  ss: number;
  populationVariance: number;
  populationSD: number;
  sampleVariance: number;
  sampleSD: number;
  /** Standard error of the mean (sample SD ÷ √n). */
  standardError: number;
  /** Coefficient of variation, sample SD ÷ mean, %. */
  cv: number;
}

export function spread(xs: number[]): Spread | null {
  const n = xs.length;
  if (n === 0) return null;
  const mean = xs.reduce((a, b) => a + b, 0) / n;
  const ss = xs.reduce((a, x) => a + (x - mean) ** 2, 0);
  const sampleVariance = n > 1 ? ss / (n - 1) : Number.NaN;
  const sampleSD = Math.sqrt(sampleVariance);
  return {
    mean,
    ss,
    populationVariance: ss / n,
    populationSD: Math.sqrt(ss / n),
    sampleVariance,
    sampleSD,
    standardError: sampleSD / Math.sqrt(n),
    cv: mean !== 0 ? (sampleSD / Math.abs(mean)) * 100 : Number.NaN,
  };
}

// ---------------------------------------------------------- probability

/** Probabilities are fractions 0–1. */
export function twoEvents(pa: number, pb: number) {
  return {
    notA: 1 - pa,
    notB: 1 - pb,
    /** Independent events. */
    and: pa * pb,
    or: pa + pb - pa * pb,
    /** Exactly one of them. */
    xor: pa + pb - 2 * pa * pb,
    neither: (1 - pa) * (1 - pb),
  };
}

/** Chance of at least one success in n independent tries: 1 − (1 − p)ⁿ. */
export const atLeastOnce = (p: number, n: number) => 1 - Math.pow(1 - p, n);

/** Binomial probability of exactly k successes in n trials. */
export function binomial(n: number, k: number, p: number): number {
  if (k < 0 || k > n) return 0;
  // Work in logs so large n doesn't overflow.
  let logC = 0;
  for (let i = 1; i <= k; i++) logC += Math.log(n - k + i) - Math.log(i);
  if (p === 0) return k === 0 ? 1 : 0;
  if (p === 1) return k === n ? 1 : 0;
  return Math.exp(logC + k * Math.log(p) + (n - k) * Math.log(1 - p));
}

// ---------------------------------------------- permutations/combinations

/** n! ÷ (n − r)!, exact. */
export function permutations(n: number, r: number): bigint {
  if (r < 0 || r > n) return 0n;
  let v = 1n;
  for (let i = n - r + 1; i <= n; i++) v *= BigInt(i);
  return v;
}

/** n! ÷ (r! (n − r)!), exact. */
export function combinations(n: number, r: number): bigint {
  if (r < 0 || r > n) return 0n;
  const k = Math.min(r, n - r);
  let v = 1n;
  for (let i = 1; i <= k; i++) v = (v * BigInt(n - k + i)) / BigInt(i);
  return v;
}

/** Ordered with repetition: nʳ. */
export const permutationsWithRepetition = (n: number, r: number) => BigInt(n) ** BigInt(r);

/** Unordered with repetition (multisets): C(n + r − 1, r). */
export const combinationsWithRepetition = (n: number, r: number) => (n === 0 && r > 0 ? 0n : combinations(n + r - 1, r));

// -------------------------------------------------------------- matrices

export type Matrix = number[][];

export const dims = (m: Matrix) => [m.length, m[0]?.length ?? 0] as const;

export function addMatrices(a: Matrix, b: Matrix, sign = 1): Matrix | null {
  const [r, c] = dims(a);
  const [r2, c2] = dims(b);
  if (r !== r2 || c !== c2) return null;
  return a.map((row, i) => row.map((v, j) => v + sign * b[i][j]));
}

export function multiplyMatrices(a: Matrix, b: Matrix): Matrix | null {
  const [r, c] = dims(a);
  const [r2, c2] = dims(b);
  if (c !== r2) return null;
  return Array.from({ length: r }, (_, i) => Array.from({ length: c2 }, (_, j) => a[i].reduce((s, v, k) => s + v * b[k][j], 0)));
}

export const transpose = (m: Matrix): Matrix => m[0].map((_, j) => m.map((row) => row[j]));

/** Determinant by Gaussian elimination with partial pivoting. */
export function determinant(m: Matrix): number | null {
  const [r, c] = dims(m);
  if (r !== c) return null;
  const a = m.map((row) => [...row]);
  let det = 1;
  for (let i = 0; i < r; i++) {
    let p = i;
    for (let k = i + 1; k < r; k++) if (Math.abs(a[k][i]) > Math.abs(a[p][i])) p = k;
    if (Math.abs(a[p][i]) < 1e-12) return 0;
    if (p !== i) {
      [a[p], a[i]] = [a[i], a[p]];
      det = -det;
    }
    det *= a[i][i];
    for (let k = i + 1; k < r; k++) {
      const f = a[k][i] / a[i][i];
      for (let j = i; j < r; j++) a[k][j] -= f * a[i][j];
    }
  }
  return det + 0;
}

/** Inverse by Gauss–Jordan elimination; null if not square or singular. */
export function inverse(m: Matrix): Matrix | null {
  const [r, c] = dims(m);
  if (r !== c) return null;
  const a = m.map((row, i) => [...row, ...Array.from({ length: r }, (_, j) => (i === j ? 1 : 0))]);
  for (let i = 0; i < r; i++) {
    let p = i;
    for (let k = i + 1; k < r; k++) if (Math.abs(a[k][i]) > Math.abs(a[p][i])) p = k;
    if (Math.abs(a[p][i]) < 1e-12) return null;
    [a[p], a[i]] = [a[i], a[p]];
    const piv = a[i][i];
    for (let j = 0; j < 2 * r; j++) a[i][j] /= piv;
    for (let k = 0; k < r; k++) {
      if (k === i) continue;
      const f = a[k][i];
      for (let j = 0; j < 2 * r; j++) a[k][j] -= f * a[i][j];
    }
  }
  return a.map((row) => row.slice(r).map((v) => (Math.abs(v) < 1e-12 ? 0 : v)));
}
