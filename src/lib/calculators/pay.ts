/**
 * Pay, sales tax (GST) and growth-rate maths. Pure functions only.
 */

// --------------------------------------------------------------- salary

export const PAY_PERIODS = ['hour', 'day', 'week', 'biweek', 'semimonth', 'month', 'year'] as const;
export type PayPeriod = (typeof PAY_PERIODS)[number];

export interface WorkPattern {
  hoursPerWeek: number;
  daysPerWeek: number;
  /** Days a year you aren't paid for (unpaid leave). Paid holidays don't count. */
  unpaidDays: number;
}

/** Paid working days and hours in a year for a work pattern. */
export function workYear({ hoursPerWeek, daysPerWeek, unpaidDays }: WorkPattern) {
  const days = Math.max(daysPerWeek * 52 - Math.max(unpaidDays, 0), 0);
  const hoursPerDay = daysPerWeek > 0 ? hoursPerWeek / daysPerWeek : 0;
  return { days, hours: days * hoursPerDay, hoursPerDay };
}

/** Pay expressed for every period, from an amount paid per `period`. */
export function convertPay(amount: number, period: PayPeriod, w: WorkPattern): Record<PayPeriod, number> {
  const { days, hours } = workYear(w);
  const perYear: Record<PayPeriod, number> = { hour: hours, day: days, week: 52, biweek: 26, semimonth: 24, month: 12, year: 1 };
  const annual = amount * perYear[period];
  const out = {} as Record<PayPeriod, number>;
  for (const p of PAY_PERIODS) out[p] = perYear[p] > 0 ? annual / perYear[p] : 0;
  return out;
}

// ------------------------------------------------------------------ GST

export interface GstResult {
  net: number;
  gst: number;
  gross: number;
  /** Intra-state sale: GST is split equally into central and state tax. */
  cgst: number;
  sgst: number;
  /** Inter-state sale: all of it is integrated GST. */
  igst: number;
}

export function gst(amount: number, ratePct: number, mode: 'add' | 'remove', interState: boolean): GstResult {
  const a = Math.max(amount, 0);
  const r = Math.max(ratePct, 0) / 100;
  const net = mode === 'add' ? a : a / (1 + r);
  const tax = mode === 'add' ? a * r : a - net;
  return { net, gst: tax, gross: net + tax, cgst: interState ? 0 : tax / 2, sgst: interState ? 0 : tax / 2, igst: interState ? tax : 0 };
}

// ----------------------------------------------------------------- CAGR

/** Compound annual growth rate, %: (end ÷ start)^(1 ÷ years) − 1. */
export function cagr(start: number, end: number, years: number): number {
  if (!(start > 0) || !(end >= 0) || !(years > 0)) return Number.NaN;
  return (Math.pow(end / start, 1 / years) - 1) * 100;
}

/** Value after growing at `ratePct` a year for `years`. */
export const projectValue = (start: number, ratePct: number, years: number) => start * Math.pow(1 + ratePct / 100, years);
