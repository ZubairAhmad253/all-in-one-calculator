/**
 * Everyday shopping maths: sales tax / VAT, discounts and tips.
 * Pure functions only: no DOM, no formatting.
 */

const clamp0 = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

export interface TaxResult {
  /** Price before tax. */
  net: number;
  tax: number;
  /** Price including tax. */
  gross: number;
}

/**
 * `add`: `amount` is the price before tax.
 * `remove`: `amount` already includes tax; work back to the pre-tax price
 * with net = gross ÷ (1 + rate). Subtracting rate% of the gross is a
 * common mistake that gives too low a figure.
 */
export function salesTax(amount: number, ratePct: number, mode: 'add' | 'remove'): TaxResult {
  const a = clamp0(amount);
  const r = clamp0(ratePct) / 100;
  if (mode === 'add') return { net: a, tax: a * r, gross: a * (1 + r) };
  const net = a / (1 + r);
  return { net, tax: a - net, gross: a };
}

export interface DiscountInput {
  price: number;
  /** A percentage off, or a fixed amount off. */
  type: 'percent' | 'amount';
  value: number;
  /** Optional extra percentage off the already-reduced price. */
  extraPct?: number;
}

export interface DiscountResult {
  /** Price after the first discount only. */
  afterFirst: number;
  salePrice: number;
  savings: number;
  /** Real total discount as a percentage of the original price. */
  totalPct: number;
}

export function discount({ price, type, value, extraPct = 0 }: DiscountInput): DiscountResult {
  const p = clamp0(price);
  const off = type === 'percent' ? (p * Math.min(clamp0(value), 100)) / 100 : Math.min(clamp0(value), p);
  const afterFirst = p - off;
  const salePrice = afterFirst * (1 - Math.min(clamp0(extraPct), 100) / 100);
  const savings = p - salePrice;
  return { afterFirst, salePrice, savings, totalPct: p > 0 ? (savings / p) * 100 : 0 };
}

export type TipRounding = 'none' | 'person' | 'total';

export interface TipInput {
  bill: number;
  tipPct: number;
  people: number;
  /** Round each person's share, or the whole bill, up to a whole unit. */
  rounding?: TipRounding;
}

export interface TipResult {
  tip: number;
  total: number;
  tipPerPerson: number;
  totalPerPerson: number;
  /** Tip as a percentage of the bill after any rounding. */
  effectivePct: number;
}

export function tip({ bill, tipPct, people, rounding = 'none' }: TipInput): TipResult {
  const b = clamp0(bill);
  const n = Math.max(1, Math.floor(clamp0(people) || 1));
  let total = b * (1 + clamp0(tipPct) / 100);

  // Work in cents so rounding isn't thrown off by floating-point noise
  // (e.g. 50.0000000001 rounding up to 51).
  const cents = (v: number) => Math.round(v * 100);
  if (rounding === 'person') total = Math.ceil(cents(total / n) / 100) * n;
  else if (rounding === 'total') total = Math.ceil(cents(total) / 100);

  const t = total - b;
  return { tip: t, total, tipPerPerson: t / n, totalPerPerson: total / n, effectivePct: b > 0 ? (t / b) * 100 : 0 };
}
