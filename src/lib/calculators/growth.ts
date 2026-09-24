/**
 * Savings and investment growth: compound interest with regular
 * contributions, and SIP (systematic investment plan) with an optional
 * yearly step-up. Pure functions only: no DOM, no formatting.
 *
 * Both run on one month-by-month simulation, so contributions, compounding
 * and step-ups combine without special-case formulas.
 */

export interface GrowthYear {
  year: number;
  /** Money paid in during this year (including the initial amount in year 1). */
  deposits: number;
  /** Interest or returns earned during this year. */
  interest: number;
  /** Everything paid in so far. */
  totalDeposits: number;
  /** All interest earned so far. */
  totalInterest: number;
  balance: number;
}

export interface GrowthResult {
  finalBalance: number;
  totalDeposits: number;
  totalInterest: number;
  yearly: GrowthYear[];
}

interface SimulateOptions {
  initial: number;
  /** Growth rate applied each month, as a fraction (0.01 = 1%). */
  monthlyRate: number;
  months: number;
  /** Amount paid in during month `m` (0-based). */
  contribution: (m: number) => number;
  /** 'start' = deposit before the month's growth (SIP style); 'end' = after. */
  timing: 'start' | 'end';
}

function simulate({ initial, monthlyRate, months, contribution, timing }: SimulateOptions): GrowthResult {
  const yearly: GrowthYear[] = [];
  let balance = Math.max(initial, 0);
  let totalDeposits = balance;
  let totalInterest = 0;
  let row = newYear(1, balance, totalDeposits, 0);

  for (let m = 0; m < months; m++) {
    const c = Math.max(contribution(m), 0);
    if (timing === 'start') balance += c;
    const interest = balance * monthlyRate;
    balance += interest;
    if (timing === 'end') balance += c;

    totalDeposits += c;
    totalInterest += interest;
    row.deposits += c;
    row.interest += interest;

    if ((m + 1) % 12 === 0 || m === months - 1) {
      row.totalDeposits = totalDeposits;
      row.totalInterest = totalInterest;
      row.balance = balance;
      yearly.push(row);
      row = newYear(row.year + 1, 0, totalDeposits, totalInterest);
    }
  }

  return { finalBalance: balance, totalDeposits, totalInterest, yearly };
}

const newYear = (year: number, deposits: number, totalDeposits: number, totalInterest: number): GrowthYear => ({
  year,
  deposits,
  interest: 0,
  totalDeposits,
  totalInterest,
  balance: 0,
});

/** How many times a year interest is compounded. */
export const COMPOUNDING = {
  daily: 365,
  monthly: 12,
  quarterly: 4,
  'half-yearly': 2,
  yearly: 1,
} as const;
export type Compounding = keyof typeof COMPOUNDING;

/**
 * Monthly growth equivalent to a nominal annual rate compounded n times a
 * year: (1 + r/n)^(n/12) − 1. This makes the balance at every year end
 * match the standard formula A = P(1 + r/n)^(nt) exactly.
 */
export function monthlyEquivalentRate(annualRatePct: number, compoundsPerYear: number): number {
  return Math.pow(1 + annualRatePct / 100 / compoundsPerYear, compoundsPerYear / 12) - 1;
}

/** Effective annual yield (APY) of a nominal rate compounded n times a year. */
export function effectiveAnnualRate(annualRatePct: number, compoundsPerYear: number): number {
  return (Math.pow(1 + annualRatePct / 100 / compoundsPerYear, compoundsPerYear) - 1) * 100;
}

export interface CompoundInput {
  principal: number;
  /** Nominal annual rate, e.g. 5 for 5%. */
  annualRate: number;
  years: number;
  compounding: Compounding;
  /** Regular deposit amount, made at the end of each period. */
  contribution: number;
  contributionFrequency: 'monthly' | 'yearly';
}

export function compoundInterest(input: CompoundInput): GrowthResult {
  const months = Math.round(input.years * 12);
  const perMonth = input.contributionFrequency === 'monthly';
  return simulate({
    initial: input.principal,
    monthlyRate: monthlyEquivalentRate(input.annualRate, COMPOUNDING[input.compounding]),
    months,
    // Yearly deposits land at the end of each 12th month.
    contribution: (m) => (perMonth || (m + 1) % 12 === 0 ? input.contribution : 0),
    timing: 'end',
  });
}

export interface SipInput {
  monthly: number;
  /** Expected annual return, e.g. 12 for 12%. */
  annualReturn: number;
  years: number;
  /** Yearly increase in the monthly amount, e.g. 10 for 10%. */
  stepUpPct?: number;
}

export interface SipResult extends GrowthResult {
  /** Monthly amount in the final year (differs from `monthly` with a step-up). */
  finalMonthly: number;
}

/**
 * SIP maturity value, using the convention of Indian fund houses and
 * brokers: monthly rate = annual ÷ 12, each instalment invested at the
 * start of the month. Without a step-up this equals
 * P × ((1 + i)^n − 1) ÷ i × (1 + i).
 */
export function sip({ monthly, annualReturn, years, stepUpPct = 0 }: SipInput): SipResult {
  const months = Math.round(years * 12);
  const amountInYear = (y: number) => monthly * Math.pow(1 + stepUpPct / 100, y);
  const result = simulate({
    initial: 0,
    monthlyRate: annualReturn / 100 / 12,
    months,
    contribution: (m) => amountInYear(Math.floor(m / 12)),
    timing: 'start',
  });
  return { ...result, finalMonthly: months > 0 ? amountInYear(Math.floor((months - 1) / 12)) : monthly };
}
