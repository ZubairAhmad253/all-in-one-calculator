/**
 * Mortgage maths: a fixed-rate loan (see ./loan.ts) plus the property
 * costs that are paid alongside it each month.
 */
import { calculateLoan, type YearRow } from './loan';

export { monthlyPayment } from './loan';
export type { YearRow } from './loan';

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

export function calculateMortgage(input: MortgageInput): MortgageResult {
  const loanAmount = Math.max(input.homePrice - input.downPayment, 0);
  const loan = calculateLoan(loanAmount, input.annualRate, Math.round(input.termYears * 12), input.extraPerMonth);
  const tax = (input.homePrice * input.propertyTaxRate) / 100 / 12;
  const insurance = input.insurancePerYear / 12;
  const hoa = input.hoaPerMonth;

  return {
    loanAmount,
    principalAndInterest: loan.payment,
    tax,
    insurance,
    hoa,
    monthlyTotal: loan.payment + tax + insurance + hoa,
    totalInterest: loan.totalInterest,
    totalPaid: loan.totalPaid,
    months: loan.months,
    interestSaved: loan.interestSaved,
    monthsSaved: loan.monthsSaved,
    schedule: loan.yearly,
  };
}
