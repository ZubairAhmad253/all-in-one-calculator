import { describe, expect, it } from 'vitest';
import { compoundInterest, effectiveAnnualRate, monthlyEquivalentRate, sip } from './growth';

const lump = { contribution: 0, contributionFrequency: 'monthly' as const };

describe('compoundInterest', () => {
  it('matches A = P(1 + r/n)^(nt) for every compounding frequency', () => {
    const cases = [
      ['yearly', 1],
      ['half-yearly', 2],
      ['quarterly', 4],
      ['monthly', 12],
      ['daily', 365],
    ] as const;
    for (const [compounding, n] of cases) {
      const r = compoundInterest({ principal: 10_000, annualRate: 5, years: 10, compounding, ...lump });
      expect(r.finalBalance).toBeCloseTo(10_000 * Math.pow(1 + 0.05 / n, n * 10), 6);
    }
  });

  it('matches known values', () => {
    // $10,000 at 5% compounded monthly for 10 years: $16,470.09.
    const r = compoundInterest({ principal: 10_000, annualRate: 5, years: 10, compounding: 'monthly', ...lump });
    expect(r.finalBalance).toBeCloseTo(16_470.09, 2);
    expect(r.totalInterest).toBeCloseTo(6_470.09, 2);
  });

  it('adds monthly deposits like an ordinary annuity', () => {
    const r = compoundInterest({ principal: 0, annualRate: 6, years: 20, compounding: 'monthly', contribution: 200, contributionFrequency: 'monthly' });
    const i = 0.06 / 12;
    expect(r.finalBalance).toBeCloseTo((200 * (Math.pow(1 + i, 240) - 1)) / i, 6);
    expect(r.totalDeposits).toBe(48_000);
  });

  it('adds yearly deposits once a year', () => {
    const r = compoundInterest({ principal: 0, annualRate: 5, years: 3, compounding: 'yearly', contribution: 1_000, contributionFrequency: 'yearly' });
    expect(r.finalBalance).toBeCloseTo(1_000 * 1.05 * 1.05 + 1_000 * 1.05 + 1_000, 6);
    expect(r.yearly.map((y) => y.deposits)).toEqual([1_000, 1_000, 1_000]);
  });

  it('keeps yearly rows consistent with the totals', () => {
    const r = compoundInterest({ principal: 5_000, annualRate: 7, years: 15, compounding: 'quarterly', contribution: 100, contributionFrequency: 'monthly' });
    expect(r.yearly).toHaveLength(15);
    const last = r.yearly.at(-1)!;
    expect(last.balance).toBeCloseTo(r.finalBalance, 8);
    expect(last.totalDeposits + last.totalInterest).toBeCloseTo(r.finalBalance, 6);
    expect(r.yearly.reduce((s, y) => s + y.interest, 0)).toBeCloseTo(r.totalInterest, 6);
    expect(r.yearly[0].deposits).toBe(5_000 + 1_200);
  });

  it('handles 0% and part years', () => {
    const r = compoundInterest({ principal: 1_000, annualRate: 0, years: 2.5, compounding: 'monthly', contribution: 10, contributionFrequency: 'monthly' });
    expect(r.finalBalance).toBe(1_300);
    expect(r.yearly).toHaveLength(3);
  });
});

describe('rates', () => {
  it('computes APY', () => {
    expect(effectiveAnnualRate(5, 12)).toBeCloseTo(5.116, 3);
    expect(effectiveAnnualRate(5, 1)).toBeCloseTo(5, 10);
  });

  it('gives a monthly rate that compounds to the effective annual rate', () => {
    const m = monthlyEquivalentRate(5, 4);
    expect((Math.pow(1 + m, 12) - 1) * 100).toBeCloseTo(effectiveAnnualRate(5, 4), 10);
  });
});

describe('sip', () => {
  it('matches the standard SIP formula', () => {
    // ₹10,000 a month at 12% for 10 years: widely quoted ₹23,23,391.
    const r = sip({ monthly: 10_000, annualReturn: 12, years: 10 });
    const i = 0.01;
    expect(r.finalBalance).toBeCloseTo(((10_000 * (Math.pow(1 + i, 120) - 1)) / i) * (1 + i), 4);
    expect(Math.round(r.finalBalance)).toBe(2_323_391);
    expect(r.totalDeposits).toBe(1_200_000);
    expect(r.finalMonthly).toBe(10_000);
  });

  it('raises the monthly amount each year with a step-up', () => {
    const r = sip({ monthly: 10_000, annualReturn: 12, years: 3, stepUpPct: 10 });
    expect(r.yearly.map((y) => Math.round(y.deposits))).toEqual([120_000, 132_000, 145_200]);
    expect(r.finalMonthly).toBeCloseTo(12_100, 6);
    expect(r.finalBalance).toBeGreaterThan(sip({ monthly: 10_000, annualReturn: 12, years: 3 }).finalBalance);
  });

  it('returns deposits only at 0% return', () => {
    const r = sip({ monthly: 5_000, annualReturn: 0, years: 2 });
    expect(r.finalBalance).toBe(120_000);
    expect(r.totalInterest).toBe(0);
  });
});
