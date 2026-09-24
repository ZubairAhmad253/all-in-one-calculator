/**
 * Mortgage maths. Pure functions only: no DOM, no formatting, so they
 * can be unit tested and reused by other calculators (loan, EMI, etc.).
 */

export interface MortgageInput {
  homePrice: number;
  downPayment: number;
  /** Annual interest rate as a percentage, e.g. 6.5 for 6.5%. */
  annualRate: number;
  termYears: number;
  /** Annual property tax as a percentage of the home price. */
  propertyTaxRate: number;
  /** Annual home insurance cost. */
  insurancePerYear: number;
  /** Monthly HOA / service charge. */
  hoaPerMonth: number;
  /** Extra amount paid towards principal every month. */
  extraPerMonth: number;
}

export interface YearRow {
  year: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface MortgageResult {
  loanAmount: number;
  /** Scheduled principal and interest payment (excludes extras). */
  principalAndInterest: number;
  tax: number;
  insurance: number;
  hoa: number;
  /** Everything due each month, excluding optional extra principal. */
  monthlyTotal: number;
  totalInterest: number;
  /** Principal + interest paid over the life of the loan. */
  totalPaid: number;
  months: number;
  /** Interest saved versus no extra payments. */
  interestSaved: number;
  monthsSaved: number;
  schedule: YearRow[];
}

/** Standard fixed-rate payment: P·r / (1 − (1 + r)^−n). */
export function monthlyPayment(principal: number, annualRate: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

function amortize(principal: number, annualRate: number, payment: number, extra: number, maxMonths: number) {
  const r = annualRate / 100 / 12;
  const schedule: YearRow[] = [];
  let balance = principal;
  let totalInterest = 0;
  let month = 0;
  let row: YearRow = { year: 1, principal: 0, interest: 0, balance };

  while (balance > 0.005 && month < maxMonths) {
    const interest = balance * r;
    const toPrincipal = Math.min(payment + extra - interest, balance);
    balance -= toPrincipal;
    totalInterest += interest;
    row.principal += toPrincipal;
    row.interest += interest;
    row.balance = Math.max(balance, 0);
    month++;
    if (month % 12 === 0 || balance <= 0.005) {
      schedule.push(row);
      row = { year: row.year + 1, principal: 0, interest: 0, balance: row.balance };
    }
  }
  return { schedule, totalInterest, months: month };
}

export function calculateMortgage(input: MortgageInput): MortgageResult {
  const loanAmount = Math.max(input.homePrice - input.downPayment, 0);
  const n = Math.round(input.termYears * 12);
  const pi = monthlyPayment(loanAmount, input.annualRate, n);
  const tax = (input.homePrice * input.propertyTaxRate) / 100 / 12;
  const insurance = input.insurancePerYear / 12;
  const hoa = input.hoaPerMonth;

  const withExtra = amortize(loanAmount, input.annualRate, pi, Math.max(input.extraPerMonth, 0), n);
  const baseline =
    input.extraPerMonth > 0 ? amortize(loanAmount, input.annualRate, pi, 0, n) : withExtra;

  return {
    loanAmount,
    principalAndInterest: pi,
    tax,
    insurance,
    hoa,
    monthlyTotal: pi + tax + insurance + hoa,
    totalInterest: withExtra.totalInterest,
    totalPaid: loanAmount + withExtra.totalInterest,
    months: withExtra.months,
    interestSaved: baseline.totalInterest - withExtra.totalInterest,
    monthsSaved: baseline.months - withExtra.months,
    schedule: withExtra.schedule,
  };
}
