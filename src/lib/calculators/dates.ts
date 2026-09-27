/**
 * Calendar and time arithmetic for the date calculators.
 *
 * Dates are plain YYYY-MM-DD strings and all arithmetic is done in UTC,
 * so time zones and daylight-saving changes can never shift a day.
 */

export type IsoDate = string;

const DAY = 86_400_000;

const parts = (d: IsoDate) => d.split('-').map(Number) as [number, number, number];
const toUtc = (d: IsoDate) => {
  const [y, m, day] = parts(d);
  return Date.UTC(y, m - 1, day);
};
const fromUtc = (ms: number): IsoDate => new Date(ms).toISOString().slice(0, 10);
const iso = (y: number, m: number, d: number) => fromUtc(Date.UTC(y, m - 1, d));

/** A real calendar date in YYYY-MM-DD form (rejects 2026-02-30). */
export function isIsoDate(d: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const [y, m, day] = parts(d);
  return m >= 1 && m <= 12 && day >= 1 && day <= daysInMonth(y, m);
}

export const addDays = (d: IsoDate, days: number): IsoDate => fromUtc(toUtc(d) + days * DAY);
export const daysBetween = (from: IsoDate, to: IsoDate) => Math.round((toUtc(to) - toUtc(from)) / DAY);

export const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
export const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** 0 = Sunday … 6 = Saturday. */
export const weekday = (d: IsoDate) => new Date(toUtc(d)).getUTCDay();
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Add calendar months, clamping to the end of shorter months:
 * 31 Jan + 1 month = 28 Feb (29 in a leap year), not 3 March.
 */
export function addMonths(d: IsoDate, months: number): IsoDate {
  const [y, m, day] = parts(d);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return iso(ny, nm, Math.min(day, daysInMonth(ny, nm)));
}

export interface Span {
  years: number;
  months: number;
  days: number;
  /** True when `to` is before `from`; the parts are then of the reversed span. */
  negative: boolean;
}

/**
 * Whole years, months and days from one date to another, the way people
 * count ages: step whole years, then whole months, then the leftover days.
 * 31 Jan → 1 Mar is 1 month 1 day; a 29 Feb birthday is a year older on
 * 28 Feb in non-leap years (and on 29 Feb in leap years).
 */
export function span(from: IsoDate, to: IsoDate): Span {
  const negative = toUtc(to) < toUtc(from);
  const [a, b] = negative ? [to, from] : [from, to];
  const [ay, am, ad] = parts(a);
  const [by, bm, bd] = parts(b);

  let months = (by - ay) * 12 + (bm - am);
  // Step back a month if the day of the month hasn't been reached yet.
  if (bd < ad && !(bd === daysInMonth(by, bm) && ad > bd)) months -= 1;
  const anchor = addMonths(a, months);
  return { years: Math.floor(months / 12), months: months % 12, days: daysBetween(anchor, b), negative };
}

/** Monday–Friday days from `from` to `to`, counting both ends if `inclusive`. */
export function workingDays(from: IsoDate, to: IsoDate, inclusive = true): number {
  let [a, b] = toUtc(to) < toUtc(from) ? [to, from] : [from, to];
  if (!inclusive) b = addDays(b, -1);
  const total = daysBetween(a, b) + 1;
  if (total <= 0) return 0;
  const fullWeeks = Math.floor(total / 7);
  let count = fullWeeks * 5;
  const start = weekday(a);
  for (let i = 0; i < total % 7; i++) {
    const wd = (start + i) % 7;
    if (wd !== 0 && wd !== 6) count++;
  }
  return count;
}

export interface Birthday {
  date: IsoDate;
  /** Age that will be reached on that birthday. */
  age: number;
  daysAway: number;
}

/** Next birthday on or after `today`. 29 Feb birthdays fall on 28 Feb in non-leap years. */
export function nextBirthday(birth: IsoDate, today: IsoDate): Birthday {
  const [by, bm, bd] = parts(birth);
  const [ty] = parts(today);
  const onYear = (y: number) => iso(y, bm, Math.min(bd, daysInMonth(y, bm)));
  let year = ty;
  let date = onYear(year);
  if (toUtc(date) < toUtc(today)) date = onYear(++year);
  return { date, age: year - by, daysAway: daysBetween(today, date) };
}

// ---------------------------------------------------------------- times

/** Minutes since midnight for "HH:MM", or NaN. */
export function parseTime(t: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!m) return Number.NaN;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h <= 23 && min <= 59 ? h * 60 + min : Number.NaN;
}

export interface Shift {
  start: string;
  end: string;
  /** Unpaid break in minutes. */
  breakMin: number;
}

export interface ShiftResult {
  minutes: number;
  /** True when the shift crosses midnight. */
  overnight: boolean;
  error?: string;
}

/** Paid minutes in a shift. An end time at or before the start means the shift ran past midnight. */
export function shiftMinutes({ start, end, breakMin }: Shift): ShiftResult {
  const s = parseTime(start);
  const e = parseTime(end);
  if (Number.isNaN(s) || Number.isNaN(e)) return { minutes: 0, overnight: false, error: 'Enter a start and end time' };
  const overnight = e <= s;
  const worked = (overnight ? e + 24 * 60 : e) - s;
  const brk = Math.max(breakMin || 0, 0);
  if (brk >= worked) return { minutes: 0, overnight, error: 'The break is longer than the shift' };
  return { minutes: worked - brk, overnight };
}

export const formatHM = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h} h ${String(m).padStart(2, '0')} min`;
};

/** Minutes as decimal hours, e.g. 450 → 7.5. */
export const decimalHours = (minutes: number) => minutes / 60;

// -------------------------------------------------- flexible working days

export interface WorkWeek {
  /** Weekday numbers treated as the weekend (0 = Sunday … 6 = Saturday). */
  weekend: number[];
  /** Extra non-working dates, e.g. public holidays. */
  holidays?: IsoDate[];
}

export const SAT_SUN: WorkWeek = { weekend: [0, 6] };

const isWorkDay = (d: IsoDate, w: WorkWeek) => !w.weekend.includes(weekday(d)) && !(w.holidays ?? []).includes(d);

/**
 * Working days from `from` to `to` (in either order), counting both ends
 * if `inclusive`, skipping weekend days and holidays.
 */
export function countWorkDays(from: IsoDate, to: IsoDate, w: WorkWeek = SAT_SUN, inclusive = true): { workDays: number; weekendDays: number; holidays: number } {
  let [a, b] = toUtc(to) < toUtc(from) ? [to, from] : [from, to];
  if (!inclusive) b = addDays(b, -1);
  const total = daysBetween(a, b) + 1;
  let workDays = 0;
  let weekendDays = 0;
  let holidays = 0;
  // Capped at about 300 years to keep the loop bounded.
  for (let i = 0; i < Math.min(total, 110_000); i++) {
    const d = addDays(a, i);
    if (w.weekend.includes(weekday(d))) weekendDays++;
    else if ((w.holidays ?? []).includes(d)) holidays++;
    else workDays++;
  }
  return { workDays, weekendDays, holidays };
}

/**
 * The date `n` working days after (or, for negative n, before) `start`.
 * The start day itself is not counted.
 */
export function addWorkDays(start: IsoDate, n: number, w: WorkWeek = SAT_SUN): IsoDate {
  if (w.weekend.length >= 7) return start;
  const step = n < 0 ? -1 : 1;
  let d = start;
  let left = Math.abs(Math.round(n));
  while (left > 0) {
    d = addDays(d, step);
    if (isWorkDay(d, w)) left--;
  }
  return d;
}
