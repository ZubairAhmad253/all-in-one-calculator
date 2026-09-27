/**
 * Savings and planning maths: simple interest, fixed and recurring
 * deposits, savings goals, retirement and inflation. Pure functions only.
 */

// ------------------------------------------------------ simple interest

export type SolveFor = 'interest' | 'principal' | 'rate' | 'time';

export interface SimpleInterestInput {
  principal: number;
  /** % per year */
  rate: number;
  /** In years. */
  years: number;
  interest: number;
}

/** I = P × r × t; solve for whichever value is missing. NaN when it can't be solved (division by zero). */
export function simpleInterest(solve: SolveFor, i: SimpleInterestInput): SimpleInterestInput {
  const r = i.rate / 100;
  const safe = (v: number) => (Number.isFinite(v) ? v : Number.NaN);
  switch (solve) {
    case 'interest':
      return { ...i, interest: i.principal * r * i.years };
    case 'principal':
      return { ...i, principal: safe(i.interest / (r * i.years)) };
    case 'rate':
      return { ...i, rate: safe((i.interest / (i.principal * i.years)) * 100) };
    case 'time':
      return { ...i, years: safe(i.interest / (i.principal * r)) };
  }
}

// ------------------------------------------------------------- deposits

/** Fixed deposit maturity with interest compounded `perYear` times (Indian banks: quarterly = 4). */
export function fixedDeposit(principal: number, ratePct: number, months: number, perYear = 4) {
  const maturity = principal * Math.pow(1 + ratePct / 100 / perYear, (perYear * months) / 12);
  const effectiveYield = (Math.pow(1 + ratePct / 100 / perYear, perYear) - 1) * 100;
  return { maturity, interest: maturity - principal, effectiveYield };
}

/**
 * Recurring deposit maturity, the way Indian banks calculate it: each
 * monthly instalment grows with quarterly compounding for the months it's
 * invested: Σ R × (1 + r/4)^(4 × monthsLeft / 12).
 */
export function recurringDeposit(monthly: number, ratePct: number, months: number) {
  const q = ratePct / 100 / 4;
  let maturity = 0;
  for (let k = months; k >= 1; k--) maturity += monthly * Math.pow(1 + q, (4 * k) / 12);
  const deposited = monthly * months;
  return { maturity, deposited, interest: maturity - deposited };
}

// --------------------------------------------------------- savings goal

/** Months to grow `current` to `target` with `monthly` deposits at `ratePct` a year. Infinity if never. */
export function monthsToGoal(target: number, current: number, monthly: number, ratePct: number): number {
  const i = ratePct / 100 / 12;
  let bal = Math.max(current, 0);
  let m = 0;
  while (bal < target - 0.005) {
    if (++m > 1200) return Infinity;
    bal = bal * (1 + i) + Math.max(monthly, 0);
  }
  return m;
}

/** Monthly deposit needed to reach `target` in `months`: (target − S(1+i)^n) × i ÷ ((1+i)^n − 1). */
export function monthlyForGoal(target: number, current: number, months: number, ratePct: number): number {
  if (months <= 0) return Number.NaN;
  const i = ratePct / 100 / 12;
  const grown = Math.max(current, 0) * Math.pow(1 + i, months);
  const need = target - grown;
  if (need <= 0) return 0;
  return i === 0 ? need / months : (need * i) / (Math.pow(1 + i, months) - 1);
}

// ------------------------------------------------------------ inflation

/** What `amount` today will cost in `years` at `inflationPct` a year. */
export const futureCost = (amount: number, inflationPct: number, years: number) => amount * Math.pow(1 + inflationPct / 100, years);

/** What `amount` in `years` is worth in today's money. */
export const todaysValue = (amount: number, inflationPct: number, years: number) => amount / Math.pow(1 + inflationPct / 100, years);

/** Real (after-inflation) return: (1 + nominal) ÷ (1 + inflation) − 1. */
export const realReturn = (nominalPct: number, inflationPct: number) => ((1 + nominalPct / 100) / (1 + inflationPct / 100) - 1) * 100;

// ----------------------------------------------------------- retirement

export interface RetirementInput {
  age: number;
  retireAge: number;
  /** Plan for the money to last until this age. */
  planToAge: number;
  savings: number;
  monthlySaving: number;
  /** % a year before retirement. */
  returnBefore: number;
  /** % a year during retirement. */
  returnAfter: number;
  /** Monthly income wanted in retirement, in today's money. */
  income: number;
  /** % a year; withdrawals rise with it. */
  inflation: number;
}

export interface RetirementPoint {
  age: number;
  balance: number;
}

export interface RetirementResult {
  /** Balance on the day you retire. */
  atRetirement: number;
  /** The same, in today's money. */
  atRetirementToday: number;
  /** First month's withdrawal after inflation. */
  firstWithdrawal: number;
  /** Age when the money runs out; Infinity if it lasts past planToAge. */
  runsOutAt: number;
  /** Balance needed at retirement to last until planToAge. */
  needed: number;
  /** Monthly saving from today needed to reach `needed`. */
  savingNeeded: number;
  /** Year-end balances from now to planToAge (or until it runs out). */
  path: RetirementPoint[];
}

/** Month-by-month drawdown from `start`; returns months it lasts (capped) and the path. */
function drawdown(start: number, firstWithdrawal: number, months: number, returnPct: number, inflationPct: number) {
  const r = returnPct / 100 / 12;
  const g = Math.pow(1 + inflationPct / 100, 1 / 12) - 1;
  let bal = start;
  let w = firstWithdrawal;
  const yearEnds: number[] = [];
  for (let m = 1; m <= months; m++) {
    bal = bal * (1 + r) - w;
    w *= 1 + g;
    if (bal <= 0) return { lasted: m - 1 + (bal + w / (1 + g)) / (w / (1 + g)), yearEnds: [...yearEnds, 0] };
    if (m % 12 === 0) yearEnds.push(bal);
  }
  return { lasted: Infinity, yearEnds };
}

export function retirement(i: RetirementInput): RetirementResult {
  const accMonths = Math.max(Math.round((i.retireAge - i.age) * 12), 0);
  const drawMonths = Math.max(Math.round((i.planToAge - i.retireAge) * 12), 0);
  const r = i.returnBefore / 100 / 12;

  const path: RetirementPoint[] = [{ age: i.age, balance: Math.max(i.savings, 0) }];
  let bal = Math.max(i.savings, 0);
  for (let m = 1; m <= accMonths; m++) {
    bal = bal * (1 + r) + Math.max(i.monthlySaving, 0);
    if (m % 12 === 0) path.push({ age: i.age + m / 12, balance: bal });
  }
  const atRetirement = bal;
  const yearsToRetire = accMonths / 12;
  const firstWithdrawal = i.income * Math.pow(1 + i.inflation / 100, yearsToRetire);

  const d = drawdown(atRetirement, firstWithdrawal, drawMonths, i.returnAfter, i.inflation);
  d.yearEnds.forEach((b, k) => path.push({ age: i.retireAge + k + 1, balance: Math.max(b, 0) }));
  const runsOutAt = Number.isFinite(d.lasted) ? i.retireAge + d.lasted / 12 : Infinity;

  // Balance needed at retirement: bisection on the drawdown lasting drawMonths.
  let lo = 0;
  let hi = Math.max(firstWithdrawal * drawMonths * 2, 1);
  for (let k = 0; k < 100; k++) {
    const mid = (lo + hi) / 2;
    // `lasted` is Infinity when the money outlasts the plan: then `mid` is enough.
    if (drawdown(mid, firstWithdrawal, drawMonths, i.returnAfter, i.inflation).lasted === Infinity) hi = mid;
    else lo = mid;
  }
  const needed = drawMonths > 0 && firstWithdrawal > 0 ? hi : 0;

  const grown = Math.max(i.savings, 0) * Math.pow(1 + r, accMonths);
  const gap = needed - grown;
  const savingNeeded = gap <= 0 || accMonths === 0 ? (gap <= 0 ? 0 : Number.NaN) : r === 0 ? gap / accMonths : (gap * r) / (Math.pow(1 + r, accMonths) - 1);

  return { atRetirement, atRetirementToday: atRetirement / Math.pow(1 + i.inflation / 100, yearsToRetire), firstWithdrawal, runsOutAt, needed, savingNeeded, path };
}
