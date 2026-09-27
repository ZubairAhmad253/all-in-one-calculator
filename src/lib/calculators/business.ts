/**
 * Business maths: margin and markup, break-even, depreciation, NPV and
 * IRR. Pure functions only.
 */

// ------------------------------------------------------ margin / markup

export interface MarginResult {
  profit: number;
  /** Profit as % of the selling price. */
  marginPct: number;
  /** Profit as % of the cost. */
  markupPct: number;
}

export function margin(cost: number, price: number): MarginResult {
  const profit = price - cost;
  return { profit, marginPct: price !== 0 ? (profit / price) * 100 : Number.NaN, markupPct: cost !== 0 ? (profit / cost) * 100 : Number.NaN };
}

/** Selling price that gives a target margin: cost ÷ (1 − margin). */
export const priceForMargin = (cost: number, marginPct: number) => (marginPct >= 100 ? Number.NaN : cost / (1 - marginPct / 100));

/** Selling price from a markup on cost: cost × (1 + markup). */
export const priceForMarkup = (cost: number, markupPct: number) => cost * (1 + markupPct / 100);

export const markupToMargin = (markupPct: number) => (markupPct / (100 + markupPct)) * 100;
export const marginToMarkup = (marginPct: number) => (marginPct >= 100 ? Number.NaN : (marginPct / (100 - marginPct)) * 100);

// ----------------------------------------------------------- break-even

export interface BreakEvenResult {
  /** Price minus variable cost per unit. */
  contribution: number;
  /** Contribution as % of price. */
  contributionRatio: number;
  /** Units needed (rounded up to whole units). */
  units: number;
  revenue: number;
  /** False when each unit doesn't cover its own variable cost. */
  possible: boolean;
}

/** Units to cover fixed costs (plus an optional target profit): (fixed + target) ÷ (price − variable). */
export function breakEven(fixed: number, price: number, variable: number, targetProfit = 0): BreakEvenResult {
  const contribution = price - variable;
  if (!(contribution > 0)) return { contribution, contributionRatio: price > 0 ? (contribution / price) * 100 : 0, units: Infinity, revenue: Infinity, possible: false };
  const units = Math.ceil((Math.max(fixed, 0) + Math.max(targetProfit, 0)) / contribution - 1e-9);
  return { contribution, contributionRatio: (contribution / price) * 100, units, revenue: units * price, possible: true };
}

// --------------------------------------------------------- depreciation

export type DepreciationMethod = 'straight' | 'declining' | 'double';

export interface DepreciationRow {
  year: number;
  start: number;
  depreciation: number;
  end: number;
  accumulated: number;
}

/**
 * Yearly depreciation schedule.
 * - straight: (cost − salvage) ÷ life every year
 * - declining (150%) / double (200%): a fixed % of the book value each
 *   year, switching to straight-line once that gives more, and never
 *   going below the salvage value.
 */
export function depreciation(cost: number, salvage: number, life: number, method: DepreciationMethod): DepreciationRow[] {
  const years = Math.max(Math.round(life), 0);
  const floor = Math.min(Math.max(salvage, 0), cost);
  const rows: DepreciationRow[] = [];
  let book = cost;
  let acc = 0;
  const factor = method === 'double' ? 2 : 1.5;
  for (let y = 1; y <= years; y++) {
    const remaining = years - y + 1;
    const straightLeft = (book - floor) / remaining;
    let dep = method === 'straight' ? (cost - floor) / years : Math.max((book * factor) / years, straightLeft);
    dep = Math.min(dep, book - floor);
    acc += dep;
    rows.push({ year: y, start: book, depreciation: dep, end: book - dep, accumulated: acc });
    book -= dep;
  }
  return rows;
}

// ------------------------------------------------------------ NPV / IRR

/** NPV of an upfront investment followed by yearly cash flows (year 1, 2, …). */
export function npv(ratePct: number, initial: number, flows: number[]): number {
  const r = ratePct / 100;
  return flows.reduce((sum, cf, i) => sum + cf / Math.pow(1 + r, i + 1), -initial);
}

export const presentValues = (ratePct: number, flows: number[]) => flows.map((cf, i) => cf / Math.pow(1 + ratePct / 100, i + 1));

/** IRR: the rate where NPV = 0, found by bisection between −99.9% and 1,000%. NaN if there's no sign change. */
export function irr(initial: number, flows: number[]): number {
  let lo = -99.9;
  let hi = 1000;
  let fLo = npv(lo, initial, flows);
  const fHi = npv(hi, initial, flows);
  if (!Number.isFinite(fLo) || fLo * fHi > 0) return Number.NaN;
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    const f = npv(mid, initial, flows);
    if (Math.abs(f) < 1e-9) return mid;
    if (f * fLo > 0) {
      lo = mid;
      fLo = f;
    } else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Years until cumulative cash flows repay the investment (fractional); discounted if a rate is given. Infinity if never. */
export function payback(initial: number, flows: number[], ratePct?: number): number {
  let left = initial;
  for (let i = 0; i < flows.length; i++) {
    const cf = ratePct === undefined ? flows[i] : flows[i] / Math.pow(1 + ratePct / 100, i + 1);
    if (cf >= left && cf > 0) return i + left / cf;
    left -= cf;
  }
  return Infinity;
}
