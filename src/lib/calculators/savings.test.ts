import { describe, expect, it } from 'vitest';
import { fixedDeposit, futureCost, monthlyForGoal, monthsToGoal, realReturn, recurringDeposit, retirement, simpleInterest, todaysValue } from './savings';

describe('simpleInterest', () => {
  const base = { principal: 10_000, rate: 5, years: 3, interest: 1_500 };
  it('solves for each value', () => {
    expect(simpleInterest('interest', base).interest).toBeCloseTo(1_500, 10);
    expect(simpleInterest('principal', base).principal).toBeCloseTo(10_000, 8);
    expect(simpleInterest('rate', base).rate).toBeCloseTo(5, 10);
    expect(simpleInterest('time', base).years).toBeCloseTo(3, 10);
  });
  it('returns NaN when unsolvable', () => {
    expect(simpleInterest('principal', { ...base, rate: 0 }).principal).toBeNaN();
  });
});

describe('deposits', () => {
  it('compounds a fixed deposit quarterly', () => {
    // ₹1,00,000 at 7% for 1 year, quarterly: 1,00,000 × 1.0175⁴ = 1,07,185.90
    const r = fixedDeposit(100_000, 7, 12);
    expect(r.maturity).toBeCloseTo(107_185.9, 1);
    expect(r.effectiveYield).toBeCloseTo(7.186, 3);
  });

  it('matches the bank RD formula', () => {
    // Published formula: M = R × ((1+i)^n − 1) ÷ (1 − (1+i)^(−1/3)), i = rate/400, n = quarters.
    const i = 7 / 400;
    const published = (5_000 * (Math.pow(1 + i, 4) - 1)) / (1 - Math.pow(1 + i, -1 / 3));
    const r = recurringDeposit(5_000, 7, 12);
    expect(r.deposited).toBe(60_000);
    expect(r.maturity).toBeCloseTo(published, 6);
    expect(Math.round(r.maturity)).toBe(62_311);
    expect(recurringDeposit(1_000, 0, 10).maturity).toBe(10_000);
  });
});

describe('savings goal', () => {
  it('finds the months to a goal', () => {
    expect(monthsToGoal(12_000, 0, 1_000, 0)).toBe(12);
    expect(monthsToGoal(12_000, 0, 1_000, 5)).toBeLessThanOrEqual(12);
    expect(monthsToGoal(1_000, 2_000, 0, 0)).toBe(0);
    expect(monthsToGoal(10_000, 0, 0, 0)).toBe(Infinity);
  });

  it('finds the monthly amount for a deadline, consistent with monthsToGoal', () => {
    const pay = monthlyForGoal(20_000, 2_000, 36, 4);
    expect(monthsToGoal(20_000, 2_000, pay + 0.01, 4)).toBe(36);
    expect(monthlyForGoal(12_000, 0, 12, 0)).toBe(1_000);
    expect(monthlyForGoal(1_000, 5_000, 12, 3)).toBe(0);
  });
});

describe('inflation', () => {
  it('grows and discounts consistently', () => {
    expect(futureCost(100, 3, 10)).toBeCloseTo(134.39, 2);
    expect(todaysValue(134.3916, 3, 10)).toBeCloseTo(100, 3);
  });
  it('computes the real return', () => {
    expect(realReturn(7, 3)).toBeCloseTo(3.883, 3);
  });
});

describe('retirement', () => {
  const base = { age: 35, retireAge: 65, planToAge: 90, savings: 50_000, monthlySaving: 800, returnBefore: 7, returnAfter: 5, income: 3_000, inflation: 2.5 };

  it('builds a balance and withdrawals that rise with inflation', () => {
    const r = retirement(base);
    expect(r.atRetirement).toBeGreaterThan(1_000_000);
    expect(r.firstWithdrawal).toBeCloseTo(3_000 * Math.pow(1.025, 30), 6);
    expect(r.path[0]).toEqual({ age: 35, balance: 50_000 });
    expect(r.path.find((p) => p.age === 65)!.balance).toBeCloseTo(r.atRetirement, 6);
  });

  it('says whether the money lasts, and what would be needed', () => {
    const r = retirement(base);
    if (Number.isFinite(r.runsOutAt)) {
      expect(r.runsOutAt).toBeLessThan(90);
      expect(r.needed).toBeGreaterThan(r.atRetirement);
      expect(r.savingNeeded).toBeGreaterThan(base.monthlySaving);
    } else {
      expect(r.needed).toBeLessThanOrEqual(r.atRetirement * 1.0001);
    }
    // Saving exactly what's needed should just about make the money last.
    const fixed = retirement({ ...base, monthlySaving: r.savingNeeded + 1 });
    expect(fixed.runsOutAt).toBe(Infinity);
  });

  it('puts the amount needed between a plan that falls short and one that lasts', () => {
    // Saving $800 runs out just before 90; saving $1,200 lasts beyond it.
    const short = retirement(base);
    const enough = retirement({ ...base, monthlySaving: 1_200 });
    expect(short.runsOutAt).toBeLessThan(90);
    expect(enough.runsOutAt).toBe(Infinity);
    expect(short.needed).toBeGreaterThan(short.atRetirement);
    expect(short.needed).toBeLessThan(enough.atRetirement);
    // And the needed amount is the same whatever you save (it depends only on retirement).
    expect(enough.needed).toBeCloseTo(short.needed, 0);
    expect(short.savingNeeded).toBeGreaterThan(800);
    expect(short.savingNeeded).toBeLessThan(1_200);
  });

  it('with no income needed, nothing is needed', () => {
    const r = retirement({ ...base, income: 0 });
    expect(r.needed).toBe(0);
    expect(r.savingNeeded).toBe(0);
    expect(r.runsOutAt).toBe(Infinity);
  });
});
