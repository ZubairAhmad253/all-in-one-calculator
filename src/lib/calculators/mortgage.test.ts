import { describe, expect, it } from 'vitest';
import { calculateMortgage, monthlyPayment } from './mortgage';

const base = {
  homePrice: 400_000,
  downPayment: 80_000,
  annualRate: 6.5,
  termYears: 30,
  propertyTaxRate: 1.2,
  insurancePerYear: 1_500,
  hoaPerMonth: 0,
  extraPerMonth: 0,
};

describe('monthlyPayment', () => {
  it('matches the standard amortization formula', () => {
    expect(monthlyPayment(300_000, 6, 360)).toBeCloseTo(1798.65, 2);
    expect(monthlyPayment(200_000, 4.5, 180)).toBeCloseTo(1529.99, 2);
  });

  it('splits principal evenly at 0% interest', () => {
    expect(monthlyPayment(120_000, 0, 120)).toBe(1_000);
  });

  it('returns 0 for no loan', () => {
    expect(monthlyPayment(0, 5, 360)).toBe(0);
  });
});

describe('calculateMortgage', () => {
  it('builds the monthly total from P&I, tax, insurance and HOA', () => {
    const r = calculateMortgage({ ...base, hoaPerMonth: 50 });
    expect(r.loanAmount).toBe(320_000);
    expect(r.principalAndInterest).toBeCloseTo(2022.62, 2);
    expect(r.tax).toBeCloseTo(400, 2);
    expect(r.insurance).toBeCloseTo(125, 2);
    expect(r.monthlyTotal).toBeCloseTo(2022.62 + 400 + 125 + 50, 1);
  });

  it('pays the loan off exactly over the term', () => {
    const r = calculateMortgage(base);
    expect(r.months).toBe(360);
    expect(r.schedule).toHaveLength(30);
    expect(r.schedule.at(-1)!.balance).toBeCloseTo(0, 2);
    expect(r.totalPaid).toBeCloseTo(r.principalAndInterest * 360, 0);
  });

  it('shortens the loan and saves interest with extra payments', () => {
    const r = calculateMortgage({ ...base, extraPerMonth: 300 });
    expect(r.months).toBeLessThan(360);
    expect(r.monthsSaved).toBe(360 - r.months);
    expect(r.interestSaved).toBeGreaterThan(0);
    expect(r.schedule.at(-1)!.balance).toBeCloseTo(0, 2);
  });

  it('supports short and part-year terms', () => {
    const sevenYears = calculateMortgage({ ...base, termYears: 7 });
    expect(sevenYears.months).toBe(84);
    expect(sevenYears.schedule).toHaveLength(7);

    // 90 months entered in the months unit = 7.5 years.
    const ninetyMonths = calculateMortgage({ ...base, termYears: 90 / 12 });
    expect(ninetyMonths.months).toBe(90);
    expect(ninetyMonths.schedule.at(-1)!.balance).toBe(0);
  });

  it('handles a down payment larger than the price', () => {
    const r = calculateMortgage({ ...base, downPayment: 500_000 });
    expect(r.loanAmount).toBe(0);
    expect(r.principalAndInterest).toBe(0);
    expect(r.totalInterest).toBe(0);
  });
});
