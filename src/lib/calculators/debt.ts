/**
 * Borrowing maths beyond a plain fixed-rate loan: car loans, credit
 * cards, paying off several debts, and APR. Pure functions only.
 * Card and debt interest is charged monthly at APR ÷ 12, the usual
 * approximation of daily interest.
 */
import { monthlyPayment } from './loan';

// ------------------------------------------------------------ auto loan

export interface AutoLoanInput {
  price: number;
  down: number;
  tradeIn: number;
  /** Still owed on the trade-in; added to the new loan. */
  tradeOwed: number;
  /** Sales tax as a percentage. */
  taxRate: number;
  /** Most US states tax the price after the trade-in credit; some tax the full price. */
  taxAfterTradeIn: boolean;
  /** Title, registration and dealer fees. */
  fees: number;
  /** Roll tax and fees into the loan (true) or pay them upfront (false). */
  financeTaxAndFees: boolean;
}

export interface AutoLoanBreakdown {
  taxable: number;
  tax: number;
  /** Trade-in value minus what's owed on it (can be negative). */
  tradeEquity: number;
  amountFinanced: number;
  /** Cash due at signing. */
  upfront: number;
}

export function autoLoan(i: AutoLoanInput): AutoLoanBreakdown {
  const pos = (v: number) => Math.max(v || 0, 0);
  const taxable = pos(i.taxAfterTradeIn ? i.price - pos(i.tradeIn) : i.price);
  const tax = (taxable * pos(i.taxRate)) / 100;
  const tradeEquity = pos(i.tradeIn) - pos(i.tradeOwed);
  const extras = tax + pos(i.fees);
  const base = pos(i.price) - pos(i.down) - tradeEquity;
  const amountFinanced = Math.max(base + (i.financeTaxAndFees ? extras : 0), 0);
  return { taxable, tax, tradeEquity, amountFinanced, upfront: pos(i.down) + (i.financeTaxAndFees ? 0 : extras) };
}

// ---------------------------------------------------------- credit card

export interface PayoffResult {
  months: number;
  totalInterest: number;
  totalPaid: number;
  /** False when the payment never covers the interest. */
  paysOff: boolean;
}

const MAX_MONTHS = 1200; // 100 years: anything longer counts as "never"

/** Months and interest to clear a balance with a payment worked out each month. */
function simulate(balance: number, apr: number, paymentFor: (bal: number, interest: number) => number): PayoffResult {
  const r = Math.max(apr, 0) / 100 / 12;
  let bal = Math.max(balance, 0);
  let interest = 0;
  let paid = 0;
  let months = 0;
  while (bal > 0.005 && months < MAX_MONTHS) {
    const i = bal * r;
    const pay = Math.min(paymentFor(bal, i), bal + i);
    if (pay <= i + 1e-9) return { months: Infinity, totalInterest: Infinity, totalPaid: Infinity, paysOff: false };
    bal = bal + i - pay;
    interest += i;
    paid += pay;
    months++;
  }
  return months >= MAX_MONTHS ? { months: Infinity, totalInterest: Infinity, totalPaid: Infinity, paysOff: false } : { months, totalInterest: interest, totalPaid: paid, paysOff: true };
}

export const payoffWithPayment = (balance: number, apr: number, payment: number) => simulate(balance, apr, () => payment);

/** Fixed payment needed to clear the balance in `months`. */
export const paymentToClearIn = (balance: number, apr: number, months: number) => monthlyPayment(balance, apr, months);

/**
 * Paying only the minimum, using a common card formula: 1% of the balance
 * plus that month's interest, and never less than `floor` (e.g. $25).
 */
export const payoffWithMinimum = (balance: number, apr: number, floor = 25) => simulate(balance, apr, (bal, i) => Math.max(bal * 0.01 + i, floor));

// --------------------------------------------------- snowball / avalanche

export interface Debt {
  name: string;
  balance: number;
  apr: number;
  minPayment: number;
}

export type Strategy = 'snowball' | 'avalanche';

export interface StrategyResult {
  months: number;
  totalInterest: number;
  /** Month each debt is cleared, in payoff order. */
  order: { name: string; month: number }[];
  paysOff: boolean;
}

/**
 * Pay every minimum, then put the extra (plus any minimums freed up by
 * debts already cleared) on one target debt at a time:
 * - snowball: smallest balance first (quick wins)
 * - avalanche: highest APR first (least interest)
 */
export function payoffPlan(debts: Debt[], extra: number, strategy: Strategy): StrategyResult {
  const list = debts.map((d, id) => ({ ...d, id, bal: Math.max(d.balance, 0) })).filter((d) => d.bal > 0);
  const budget = list.reduce((s, d) => s + Math.max(d.minPayment, 0), 0) + Math.max(extra, 0);
  const priority = [...list].sort((a, b) => (strategy === 'snowball' ? a.bal - b.bal || b.apr - a.apr : b.apr - a.apr || a.bal - b.bal));
  const order: { name: string; month: number }[] = [];
  const cleared = new Set<number>();
  let totalInterest = 0;
  let month = 0;

  while (list.some((d) => d.bal > 0)) {
    const before = list.reduce((s, d) => s + d.bal, 0);
    if (++month > MAX_MONTHS) return { months: Infinity, totalInterest: Infinity, order, paysOff: false };
    let left = budget;
    for (const d of list) {
      if (d.bal <= 0) continue;
      const i = (d.bal * Math.max(d.apr, 0)) / 100 / 12;
      d.bal += i;
      totalInterest += i;
    }
    // Minimums first…
    for (const d of list) {
      const pay = Math.min(Math.max(d.minPayment, 0), d.bal, left);
      d.bal -= pay;
      left -= pay;
    }
    // …then whatever is left goes to the targets in priority order
    // (`priority` holds the same objects as `list`).
    for (const d of priority) {
      const pay = Math.min(d.bal, left);
      d.bal -= pay;
      left -= pay;
    }
    for (const d of list) {
      if (d.bal < 0.005) d.bal = 0;
      if (d.bal === 0 && !cleared.has(d.id)) {
        cleared.add(d.id);
        order.push({ name: d.name, month });
      }
    }
    // No progress this month: the budget doesn't cover the interest.
    if (list.reduce((s, d) => s + d.bal, 0) >= before - 1e-9) return { months: Infinity, totalInterest: Infinity, order, paysOff: false };
  }
  return { months: month, totalInterest, order, paysOff: true };
}

// ----------------------------------------------------------------- APR

/** Monthly rate r where `payment` for `months` has present value `pv` (bisection). */
function solveMonthlyRate(pv: number, payment: number, months: number): number {
  if (payment * months <= pv) return 0;
  let lo = 0;
  let hi = 1; // 100% a month
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    const value = (payment * (1 - Math.pow(1 + mid, -months))) / mid;
    if (value > pv) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export interface AprInput {
  amount: number;
  /** Quoted nominal rate, %. */
  rate: number;
  months: number;
  fees: number;
  /** true: fees are added to the loan; false: paid upfront / deducted from what you receive. */
  feesFinanced: boolean;
}

export interface AprResult {
  apr: number;
  payment: number;
  totalInterest: number;
  /** Interest + fees. */
  totalCost: number;
}

/**
 * APR: the yearly rate at which the payments repay only the money you
 * actually receive, so upfront fees show up as a higher rate.
 */
export function apr({ amount, rate, months, fees, feesFinanced }: AprInput): AprResult {
  const f = Math.max(fees, 0);
  const principal = feesFinanced ? amount + f : amount;
  const received = feesFinanced ? amount : amount - f;
  const payment = monthlyPayment(principal, rate, months);
  const r = received > 0 && months > 0 ? solveMonthlyRate(received, payment, months) : Number.NaN;
  const totalInterest = payment * months - principal;
  return { apr: r * 12 * 100, payment, totalInterest, totalCost: totalInterest + f };
}
