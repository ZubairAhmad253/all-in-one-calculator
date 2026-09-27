/**
 * Home-buying maths beyond the mortgage itself. Pure functions only.
 */
import { monthlyPayment } from './loan';

export interface DownPaymentInput {
  price: number;
  /** Down payment as a percentage of the price. */
  downPct: number;
  /** Closing costs as a percentage of the price (typically 2–5%). */
  closingPct: number;
  savings: number;
  monthlySaving: number;
  /** Interest earned on savings, % a year. */
  savingsRate: number;
  /** Mortgage rate, % a year, for the payment estimate. */
  mortgageRate: number;
  termYears: number;
}

export interface DownPaymentResult {
  downPayment: number;
  closingCosts: number;
  /** Down payment + closing costs. */
  cashNeeded: number;
  shortfall: number;
  /** Months of saving to cover the shortfall; Infinity if it's never reached. */
  monthsToSave: number;
  loan: number;
  payment: number;
  /** Below 20% down, most conventional loans add mortgage insurance. */
  pmiLikely: boolean;
}

export function downPayment(i: DownPaymentInput): DownPaymentResult {
  const price = Math.max(i.price, 0);
  const down = (price * Math.min(Math.max(i.downPct, 0), 100)) / 100;
  const closing = (price * Math.max(i.closingPct, 0)) / 100;
  const cashNeeded = down + closing;
  const shortfall = Math.max(cashNeeded - Math.max(i.savings, 0), 0);

  let monthsToSave = 0;
  if (shortfall > 0) {
    const r = Math.max(i.savingsRate, 0) / 100 / 12;
    let bal = Math.max(i.savings, 0);
    const save = Math.max(i.monthlySaving, 0);
    while (bal < cashNeeded && monthsToSave < 1200) {
      bal = bal * (1 + r) + save;
      monthsToSave++;
    }
    if (bal < cashNeeded) monthsToSave = Infinity;
  }

  const loan = price - down;
  return {
    downPayment: down,
    closingCosts: closing,
    cashNeeded,
    shortfall,
    monthsToSave,
    loan,
    payment: monthlyPayment(loan, i.mortgageRate, Math.round(i.termYears * 12)),
    pmiLikely: i.downPct < 20,
  };
}
