/**
 * Exact fraction arithmetic with step-by-step working.
 * Values are kept as integer numerator/denominator pairs, so 1/3 + 1/3
 * is exactly 2/3, never 0.6666…
 */

export interface Fraction {
  /** Carries the sign. */
  n: number;
  /** Always > 0. */
  d: number;
}

export type FractionOp = '+' | '-' | '×' | '÷';

export class FractionError extends Error {}

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

export const lcm = (a: number, b: number) => Math.abs(a * b) / gcd(a, b);

export function simplify({ n, d }: Fraction): Fraction {
  if (d === 0) throw new FractionError('The denominator can’t be 0');
  const g = gcd(n, d);
  const sign = d < 0 ? -1 : 1;
  return { n: (sign * n) / g + 0, d: Math.abs(d) / g };
}

/**
 * Build a fraction from a mixed number: `whole` n/d. The sign comes from
 * the whole part, or from the numerator if there is no whole part, so
 * −2 1/2 means −(2 + 1/2) = −5/2.
 */
export function fromMixed(whole: number, n: number, d: number): Fraction {
  for (const v of [whole, n, d]) if (!Number.isInteger(v)) throw new FractionError('Use whole numbers in fractions');
  if (d === 0) throw new FractionError('The denominator can’t be 0');
  if (d < 0) throw new FractionError('Put the minus sign on the whole number or numerator');
  if (whole !== 0 && n < 0) throw new FractionError('Put the minus sign on the whole number only');
  if (whole === 0) return simplify({ n, d });
  const sign = whole < 0 ? -1 : 1;
  return simplify({ n: sign * (Math.abs(whole) * d + n), d });
}

export function toMixed({ n, d }: Fraction): { sign: 1 | -1; whole: number; n: number; d: number } {
  const sign = n < 0 ? -1 : 1;
  const a = Math.abs(n);
  return { sign, whole: Math.floor(a / d), n: a % d, d };
}

export function format(f: Fraction): string {
  return f.d === 1 ? `${f.n}` : `${f.n}/${f.d}`;
}

export function formatMixed(f: Fraction): string {
  const m = toMixed(f);
  const s = m.sign < 0 ? '−' : '';
  if (m.n === 0) return `${s}${m.whole}`;
  if (m.whole === 0) return `${s}${m.n}/${m.d}`;
  return `${s}${m.whole} ${m.n}/${m.d}`;
}

const show = (f: Fraction) => (f.n < 0 ? `(${format(f).replace('-', '−')})` : format(f));
const plain = (f: Fraction) => format(f).replace('-', '−');

export interface FractionResult {
  result: Fraction;
  decimal: number;
  /** Plain-English working, one step per line. */
  steps: string[];
}

export function calculate(a: Fraction, op: FractionOp, b: Fraction): FractionResult {
  const steps: string[] = [];
  let raw: Fraction;

  if (op === '+' || op === '-') {
    const common = lcm(a.d, b.d);
    const an = a.n * (common / a.d);
    const bn = b.n * (common / b.d);
    if (a.d !== b.d) {
      steps.push(`Find a common denominator: the lowest common multiple of ${a.d} and ${b.d} is ${common}.`);
      steps.push(`Rewrite both fractions: ${plain(a)} = ${an}/${common} and ${plain(b)} = ${bn}/${common}.`.replace(/-/g, '−'));
    } else steps.push(`Both fractions already have the denominator ${common}.`);
    raw = { n: op === '+' ? an + bn : an - bn, d: common };
    steps.push(`${op === '+' ? 'Add' : 'Subtract'} the numerators: ${an} ${op === '+' ? '+' : '−'} ${bn < 0 ? `(${bn})` : bn} = ${raw.n}, giving ${raw.n}/${common}.`.replace(/-/g, '−'));
  } else if (op === '×') {
    raw = { n: a.n * b.n, d: a.d * b.d };
    steps.push(`Multiply the numerators and the denominators: ${show(a)} × ${show(b)} = ${a.n * b.n}/${a.d * b.d}.`.replace(/-/g, '−'));
  } else {
    if (b.n === 0) throw new FractionError('You can’t divide by zero');
    const flipped = simplify({ n: b.d, d: b.n });
    steps.push(`To divide, flip the second fraction and multiply: ${show(a)} ÷ ${show(b)} = ${show(a)} × ${show(flipped)}.`.replace(/-/g, '−'));
    raw = { n: a.n * flipped.n, d: a.d * flipped.d };
    steps.push(`Multiply the numerators and the denominators: ${raw.n}/${raw.d}.`.replace(/-/g, '−'));
  }

  const result = simplify(raw);
  const g = gcd(raw.n, raw.d);
  if (g > 1) steps.push(`Simplify by dividing top and bottom by ${g}: ${plain(raw)} = ${plain(result)}.`);
  const m = toMixed(result);
  if (m.whole !== 0 && m.n !== 0) steps.push(`As a mixed number: ${plain(result)} = ${formatMixed(result)}.`);

  return { result, decimal: result.n / result.d, steps };
}
