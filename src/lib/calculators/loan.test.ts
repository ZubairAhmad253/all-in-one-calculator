import { describe, expect, it } from 'vitest';
import { amortize, calculateLoan, groupByYear, monthlyPayment } from './loan';

describe('monthlyPayment (EMI)', () => {
  it('matches published EMI examples', () => {
    // ₹10,00,000 at 10% for 20 years: widely quoted EMI of ₹9,650.
    expect(monthlyPayment(1_000_000, 10, 240)).toBeCloseTo(9650.22, 2);
    // $25,000 at 7% for 5 years.
    expect(monthlyPayment(25_000, 7, 60)).toBeCloseTo(495.03, 2);
  });

  it('handles 0% and empty loans', () => {
    expect(monthlyPayment(12_000, 0, 12)).toBe(1_000);
    expect(monthlyPayment(0, 7, 60)).toBe(0);
    expect(monthlyPayment(10_000, 7, 0)).toBe(0);
  });
});

describe('amortize', () => {
  it('clears the balance exactly on the last payment', () => {
    const a = amortize(25_000, 7, 60);
    expect(a.months).toBe(60);
    expect(a.monthly).toHaveLength(60);
    expect(a.monthly.at(-1)!.balance).toBe(0);
    expect(a.totalPaid).toBeCloseTo(a.payment * 60, 2);
  });

  it('splits the first payment into interest on the full balance and principal', () => {
    const first = amortize(25_000, 7, 60).monthly[0];
    expect(first.interest).toBeCloseTo((25_000 * 0.07) / 12, 6);
    expect(first.principal).toBeCloseTo(495.03 - first.interest, 1);
  });

  it('sums principal to the loan amount', () => {
    const a = amortize(250_000, 5.25, 180);
    const principal = a.monthly.reduce((s, m) => s + m.principal, 0);
    expect(principal).toBeCloseTo(250_000, 4);
  });

  it('handles a term that is not a whole number of years', () => {
    const a = amortize(10_000, 6, 30);
    expect(a.yearly).toHaveLength(3);
    expect(a.yearly[2].balance).toBe(0);
  });
});

describe('groupByYear', () => {
  it('totals each year and keeps the year-end balance', () => {
    const a = amortize(25_000, 7, 60);
    const years = groupByYear(a.monthly);
    expect(years).toHaveLength(5);
    const y1 = a.monthly.slice(0, 12);
    expect(years[0].interest).toBeCloseTo(y1.reduce((s, m) => s + m.interest, 0), 8);
    expect(years[0].balance).toBe(y1[11].balance);
  });
});

describe('calculateLoan', () => {
  it('reports interest and months saved by extra payments', () => {
    const base = calculateLoan(25_000, 7, 60);
    const extra = calculateLoan(25_000, 7, 60, 100);
    expect(base.interestSaved).toBe(0);
    expect(extra.months).toBeLessThan(60);
    expect(extra.monthsSaved).toBe(60 - extra.months);
    expect(extra.interestSaved).toBeCloseTo(base.totalInterest - extra.totalInterest, 8);
    expect(extra.monthly.at(-1)!.balance).toBe(0);
  });
});
