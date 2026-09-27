import { describe, expect, it } from 'vitest';
import { apr, autoLoan, payoffPlan, payoffWithMinimum, payoffWithPayment, paymentToClearIn, type Debt } from './debt';
import { downPayment } from './housing';

describe('autoLoan', () => {
  const base = { price: 30_000, down: 3_000, tradeIn: 5_000, tradeOwed: 0, taxRate: 7, taxAfterTradeIn: true, fees: 500, financeTaxAndFees: true };

  it('taxes the price after the trade-in and finances tax and fees', () => {
    const r = autoLoan(base);
    expect(r.taxable).toBe(25_000);
    expect(r.tax).toBeCloseTo(1_750, 10);
    // 30,000 − 3,000 − 5,000 + 1,750 + 500
    expect(r.amountFinanced).toBeCloseTo(24_250, 10);
    expect(r.upfront).toBe(3_000);
  });

  it('can tax the full price and take tax and fees upfront', () => {
    const r = autoLoan({ ...base, taxAfterTradeIn: false, financeTaxAndFees: false });
    expect(r.tax).toBeCloseTo(2_100, 10);
    expect(r.amountFinanced).toBe(22_000);
    expect(r.upfront).toBeCloseTo(3_000 + 2_100 + 500, 10);
  });

  it('adds negative equity from the trade-in to the loan', () => {
    const r = autoLoan({ ...base, tradeOwed: 7_000 });
    expect(r.tradeEquity).toBe(-2_000);
    expect(r.amountFinanced).toBeCloseTo(24_250 + 7_000, 10);
  });
});

describe('credit card payoff', () => {
  it('works out months and interest for a fixed payment', () => {
    // $5,000 at 22% paying $200/month.
    const r = payoffWithPayment(5_000, 22, 200);
    // Closed form: n = −ln(1 − rB/P) ÷ ln(1 + r) = 33.75, so 34 payments (the last one smaller).
    const i = 0.22 / 12;
    const n = -Math.log(1 - (i * 5_000) / 200) / Math.log(1 + i);
    expect(n).toBeCloseTo(33.75, 2);
    expect(r.paysOff).toBe(true);
    expect(r.months).toBe(Math.ceil(n));
    expect(r.totalInterest).toBeGreaterThan(1_700);
    expect(r.totalInterest).toBeLessThan(1_800);
    expect(r.totalPaid).toBeCloseTo(5_000 + r.totalInterest, 6);
  });

  it('says so when the payment never covers the interest', () => {
    // Interest is 5,000 × 24% ÷ 12 = $100 a month.
    expect(payoffWithPayment(5_000, 24, 100).paysOff).toBe(false);
    expect(payoffWithPayment(5_000, 24, 90).months).toBe(Infinity);
  });

  it('finds the payment to clear the card by a date', () => {
    const pay = paymentToClearIn(5_000, 22, 24);
    const r = payoffWithPayment(5_000, 22, pay);
    expect(r.months).toBe(24);
  });

  it('shows how slow minimum payments are', () => {
    const min = payoffWithMinimum(5_000, 22);
    const fixed = payoffWithPayment(5_000, 22, 200);
    expect(min.paysOff).toBe(true);
    expect(min.months).toBeGreaterThan(fixed.months * 3);
    expect(min.totalInterest).toBeGreaterThan(fixed.totalInterest * 2);
  });
});

describe('snowball vs avalanche', () => {
  const debts: Debt[] = [
    { name: 'Store card', balance: 800, apr: 25, minPayment: 25 },
    { name: 'Credit card', balance: 4_000, apr: 22, minPayment: 80 },
    { name: 'Car loan', balance: 9_000, apr: 6, minPayment: 250 },
  ];

  it('snowball clears the smallest balance first', () => {
    const r = payoffPlan(debts, 300, 'snowball');
    expect(r.paysOff).toBe(true);
    expect(r.order.map((o) => o.name)).toEqual(['Store card', 'Credit card', 'Car loan']);
  });

  it('avalanche targets the highest rate first and pays the least interest', () => {
    const snow = payoffPlan(debts, 300, 'snowball');
    const aval = payoffPlan([{ ...debts[0], balance: 3_000 }, debts[1], debts[2]], 300, 'avalanche');
    expect(aval.order[0].name).toBe('Store card'); // 25% APR
    const avalSame = payoffPlan(debts, 300, 'avalanche');
    expect(avalSame.totalInterest).toBeLessThanOrEqual(snow.totalInterest + 1e-6);
  });

  it('pays off faster with a bigger extra payment', () => {
    expect(payoffPlan(debts, 500, 'avalanche').months).toBeLessThan(payoffPlan(debts, 100, 'avalanche').months);
  });

  it('detects a budget that can never clear the debts', () => {
    expect(payoffPlan([{ name: 'Card', balance: 10_000, apr: 30, minPayment: 100 }], 0, 'snowball').paysOff).toBe(false);
  });

  it('ignores debts that are already paid', () => {
    const r = payoffPlan([{ name: 'Done', balance: 0, apr: 10, minPayment: 50 }, debts[0]], 0, 'snowball');
    expect(r.order.map((o) => o.name)).toEqual(['Store card']);
  });
});

describe('apr', () => {
  it('equals the rate when there are no fees', () => {
    expect(apr({ amount: 10_000, rate: 8, months: 36, fees: 0, feesFinanced: false }).apr).toBeCloseTo(8, 6);
  });

  it('is higher than the rate when fees are paid upfront', () => {
    // $10,000 at 8% over 36 months with $300 of fees taken off the top.
    const r = apr({ amount: 10_000, rate: 8, months: 36, fees: 300, feesFinanced: false });
    expect(r.payment).toBeCloseTo(313.36, 2);
    expect(r.apr).toBeGreaterThan(9.9);
    expect(r.apr).toBeLessThan(10.2);
    expect(r.totalCost).toBeCloseTo(r.totalInterest + 300, 8);
  });

  it('also rises when fees are financed', () => {
    const r = apr({ amount: 10_000, rate: 8, months: 36, fees: 300, feesFinanced: true });
    expect(r.payment).toBeCloseTo(322.76, 2);
    expect(r.apr).toBeGreaterThan(9.9);
  });
});

describe('downPayment', () => {
  const base = { price: 400_000, downPct: 20, closingPct: 3, savings: 50_000, monthlySaving: 1_500, savingsRate: 0, mortgageRate: 6.5, termYears: 30 };

  it('adds closing costs to the cash needed', () => {
    const r = downPayment(base);
    expect(r.downPayment).toBe(80_000);
    expect(r.closingCosts).toBe(12_000);
    expect(r.cashNeeded).toBe(92_000);
    expect(r.shortfall).toBe(42_000);
    expect(r.monthsToSave).toBe(28); // 42,000 ÷ 1,500
    expect(r.loan).toBe(320_000);
    expect(r.payment).toBeCloseTo(2_022.62, 2);
    expect(r.pmiLikely).toBe(false);
  });

  it('saves faster with interest and flags PMI under 20%', () => {
    expect(downPayment({ ...base, savingsRate: 4 }).monthsToSave).toBeLessThan(28);
    expect(downPayment({ ...base, downPct: 10 }).pmiLikely).toBe(true);
  });

  it('handles already having enough, or never getting there', () => {
    expect(downPayment({ ...base, savings: 100_000 }).monthsToSave).toBe(0);
    expect(downPayment({ ...base, monthlySaving: 0 }).monthsToSave).toBe(Infinity);
  });
});
