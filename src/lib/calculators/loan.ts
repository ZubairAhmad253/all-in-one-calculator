/**
 * Fixed-rate loan maths shared by the loan, EMI and mortgage calculators.
 * Pure functions only: no DOM, no formatting.
 */

export interface MonthRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface YearRow {
  year: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface Amortization {
  /** Scheduled payment each month, excluding any extra payment. */
  payment: number;
  totalInterest: number;
  /** Principal + interest over the life of the loan. */
  totalPaid: number;
  /** Months until the balance reaches zero. */
  months: number;
  monthly: MonthRow[];
  yearly: YearRow[];
}

/** Standard fixed-rate payment (EMI): P·r / (1 − (1 + r)^−n). */
export function monthlyPayment(principal: number, annualRate: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

/**
 * Month-by-month schedule. `extraPerMonth` goes straight to principal, so
 * the loan can finish before `months`.
 */
export function amortize(principal: number, annualRate: number, months: number, extraPerMonth = 0): Amortization {
  const payment = monthlyPayment(principal, annualRate, months);
  const r = annualRate / 100 / 12;
  const extra = Math.max(extraPerMonth, 0);
  const monthly: MonthRow[] = [];
  let balance = Math.max(principal, 0);
  let totalInterest = 0;

  while (balance > 0.005 && monthly.length < months) {
    const interest = balance * r;
    let toPrincipal = Math.min(payment + extra - interest, balance);
    // Clear floating-point dust (fractions of a cent) on the final payment.
    if (balance - toPrincipal < 0.005) toPrincipal = balance;
    balance -= toPrincipal;
    totalInterest += interest;
    monthly.push({ month: monthly.length + 1, payment: toPrincipal + interest, principal: toPrincipal, interest, balance });
  }

  return {
    payment,
    totalInterest,
    totalPaid: Math.max(principal, 0) + totalInterest,
    months: monthly.length,
    monthly,
    yearly: groupByYear(monthly),
  };
}

export function groupByYear(monthly: MonthRow[]): YearRow[] {
  const years: YearRow[] = [];
  for (const m of monthly) {
    const y = Math.ceil(m.month / 12);
    let row = years[y - 1];
    if (!row) years.push((row = { year: y, principal: 0, interest: 0, balance: 0 }));
    row.principal += m.principal;
    row.interest += m.interest;
    row.balance = m.balance;
  }
  return years;
}

export interface LoanResult extends Amortization {
  /** Interest saved by the extra payment, compared with none. */
  interestSaved: number;
  monthsSaved: number;
}

/** Amortization plus the savings from an extra monthly payment. */
export function calculateLoan(principal: number, annualRate: number, months: number, extraPerMonth = 0): LoanResult {
  const withExtra = amortize(principal, annualRate, months, extraPerMonth);
  const baseline = extraPerMonth > 0 ? amortize(principal, annualRate, months) : withExtra;
  return {
    ...withExtra,
    interestSaved: baseline.totalInterest - withExtra.totalInterest,
    monthsSaved: baseline.months - withExtra.months,
  };
}
