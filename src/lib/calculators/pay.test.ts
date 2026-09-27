import { describe, expect, it } from 'vitest';
import { cagr, convertPay, gst, projectValue, workYear } from './pay';
import { rentVsBuy } from './housing';

const fullTime = { hoursPerWeek: 40, daysPerWeek: 5, unpaidDays: 0 };

describe('salary', () => {
  it('uses 2,080 hours and 260 days for a standard full-time year', () => {
    expect(workYear(fullTime)).toEqual({ days: 260, hours: 2080, hoursPerDay: 8 });
  });

  it('converts hourly pay to every period', () => {
    const p = convertPay(25, 'hour', fullTime);
    expect(p.year).toBe(52_000);
    expect(p.month).toBeCloseTo(4_333.33, 2);
    expect(p.biweek).toBe(2_000);
    expect(p.semimonth).toBeCloseTo(2_166.67, 2);
    expect(p.week).toBe(1_000);
    expect(p.day).toBe(200);
  });

  it('round-trips from a yearly salary', () => {
    const p = convertPay(60_000, 'year', fullTime);
    expect(p.hour).toBeCloseTo(28.846, 3);
    expect(convertPay(p.hour, 'hour', fullTime).year).toBeCloseTo(60_000, 6);
  });

  it('accounts for unpaid days off and part-time hours', () => {
    const p = convertPay(25, 'hour', { hoursPerWeek: 40, daysPerWeek: 5, unpaidDays: 10 });
    expect(p.year).toBe(25 * 8 * 250);
    expect(convertPay(20, 'hour', { hoursPerWeek: 20, daysPerWeek: 4, unpaidDays: 0 }).year).toBe(20 * 20 * 52);
  });
});

describe('gst', () => {
  it('adds GST and splits CGST/SGST within a state', () => {
    const r = gst(1_000, 18, 'add', false);
    expect(r.gst).toBe(180);
    expect(r.gross).toBe(1_180);
    expect(r.cgst).toBe(90);
    expect(r.sgst).toBe(90);
    expect(r.igst).toBe(0);
  });

  it('removes GST from an inclusive price and uses IGST between states', () => {
    const r = gst(1_180, 18, 'remove', true);
    expect(r.net).toBeCloseTo(1_000, 10);
    expect(r.gst).toBeCloseTo(180, 10);
    expect(r.igst).toBeCloseTo(180, 10);
    expect(r.cgst).toBe(0);
  });
});

describe('cagr', () => {
  it('finds the yearly growth rate', () => {
    expect(cagr(10_000, 20_000, 5)).toBeCloseTo(14.87, 2);
    expect(cagr(100, 100, 3)).toBe(0);
    expect(cagr(0, 100, 3)).toBeNaN();
  });
  it('round-trips with projectValue', () => {
    expect(projectValue(10_000, cagr(10_000, 25_000, 7), 7)).toBeCloseTo(25_000, 6);
  });
});

describe('rentVsBuy', () => {
  const base = {
    price: 400_000, downPct: 20, mortgageRate: 6.5, termYears: 30, buyCostPct: 3, sellCostPct: 6, propertyTaxPct: 1.1, maintenancePct: 1,
    insurance: 1_500, homeGrowth: 3.5, rent: 2_200, rentGrowth: 3, investReturn: 6, years: 15,
  };

  it('starts with the renter ahead because buying costs are sunk', () => {
    const r = rentVsBuy(base);
    expect(r.upfront).toBe(92_000);
    expect(r.payment).toBeCloseTo(2_022.62, 2);
    expect(r.years).toHaveLength(15);
    expect(r.years[0].rentWorth).toBeGreaterThan(r.years[0].buyWorth);
  });

  it('favours buying with faster home price growth, and renting with slower', () => {
    const fast = rentVsBuy({ ...base, homeGrowth: 6 });
    const slow = rentVsBuy({ ...base, homeGrowth: 0 });
    expect(fast.advantage).toBeGreaterThan(slow.advantage);
    expect(slow.advantage).toBeLessThan(0);
    if (fast.breakEvenYear !== null) expect(fast.years[fast.breakEvenYear - 1].buyWorth).toBeGreaterThanOrEqual(fast.years[fast.breakEvenYear - 1].rentWorth);
  });

  it('keeps totals consistent', () => {
    const r = rentVsBuy({ ...base, years: 1 });
    expect(r.years[0].rentPaid).toBeCloseTo(2_200 * 12, 6);
    expect(r.years[0].ownPaid).toBeGreaterThan(r.upfront + 2_022.62 * 12);
  });
});
