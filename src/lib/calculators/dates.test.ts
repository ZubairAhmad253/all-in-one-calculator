import { describe, expect, it } from 'vitest';
import { addMonths, daysInMonth, formatHM, isIsoDate, isLeapYear, nextBirthday, parseTime, shiftMinutes, span, weekday, workingDays } from './dates';

describe('calendar basics', () => {
  it('knows leap years and month lengths', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2026)).toBe(false);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2026, 4)).toBe(30);
  });

  it('validates real dates only', () => {
    expect(isIsoDate('2026-02-28')).toBe(true);
    expect(isIsoDate('2026-02-29')).toBe(false);
    expect(isIsoDate('2024-02-29')).toBe(true);
    expect(isIsoDate('2026-13-01')).toBe(false);
    expect(isIsoDate('26-1-1')).toBe(false);
  });

  it('finds the weekday', () => {
    expect(weekday('2026-09-27')).toBe(0); // Sunday
    expect(weekday('2000-01-01')).toBe(6); // Saturday
  });

  it('adds months, clamping to shorter months', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
    expect(addMonths('2026-03-31', -1)).toBe('2026-02-28');
    expect(addMonths('2026-11-15', 3)).toBe('2027-02-15');
  });
});

describe('span', () => {
  it('counts years, months and days', () => {
    expect(span('1990-05-15', '2026-09-27')).toEqual({ years: 36, months: 4, days: 12, negative: false });
    expect(span('2026-01-01', '2026-01-01')).toEqual({ years: 0, months: 0, days: 0, negative: false });
  });

  it('handles month ends', () => {
    expect(span('2026-01-31', '2026-03-01')).toEqual({ years: 0, months: 1, days: 1, negative: false });
    expect(span('2026-01-31', '2026-02-28')).toEqual({ years: 0, months: 1, days: 0, negative: false });
    expect(span('2026-01-30', '2026-02-28')).toEqual({ years: 0, months: 1, days: 0, negative: false });
  });

  it('handles 29 February birthdays', () => {
    expect(span('2000-02-29', '2025-02-28')).toMatchObject({ years: 25, months: 0, days: 0 });
    expect(span('2000-02-29', '2024-02-29')).toMatchObject({ years: 24, months: 0, days: 0 });
    expect(span('2000-02-29', '2024-02-28')).toMatchObject({ years: 23, months: 11, days: 30 });
  });

  it('flags reversed ranges', () => {
    expect(span('2026-03-01', '2026-01-31')).toEqual({ years: 0, months: 1, days: 1, negative: true });
  });
});

describe('workingDays', () => {
  it('counts Monday to Friday', () => {
    // Mon 21 Sep – Fri 25 Sep 2026.
    expect(workingDays('2026-09-21', '2026-09-25')).toBe(5);
    expect(workingDays('2026-09-21', '2026-09-25', false)).toBe(4);
    // Sat–Sun only.
    expect(workingDays('2026-09-26', '2026-09-27')).toBe(0);
    // Whole of 2026 has 261 weekdays.
    expect(workingDays('2026-01-01', '2026-12-31')).toBe(261);
  });

  it('works in either order', () => {
    expect(workingDays('2026-09-25', '2026-09-21')).toBe(5);
  });
});

describe('nextBirthday', () => {
  it('finds the next birthday and age', () => {
    expect(nextBirthday('1990-05-15', '2026-09-27')).toEqual({ date: '2027-05-15', age: 37, daysAway: 230 });
    expect(nextBirthday('1990-09-27', '2026-09-27')).toEqual({ date: '2026-09-27', age: 36, daysAway: 0 });
  });

  it('moves 29 February to 28 February in non-leap years', () => {
    expect(nextBirthday('2000-02-29', '2026-09-27').date).toBe('2027-02-28');
    expect(nextBirthday('2000-02-29', '2027-09-27').date).toBe('2028-02-29');
  });
});

describe('shifts', () => {
  it('parses times', () => {
    expect(parseTime('09:30')).toBe(570);
    expect(parseTime('24:00')).toBeNaN();
    expect(parseTime('')).toBeNaN();
  });

  it('subtracts the break', () => {
    expect(shiftMinutes({ start: '09:00', end: '17:30', breakMin: 30 })).toEqual({ minutes: 480, overnight: false });
  });

  it('handles overnight shifts', () => {
    expect(shiftMinutes({ start: '22:00', end: '06:00', breakMin: 45 })).toEqual({ minutes: 435, overnight: true });
  });

  it('reports problems', () => {
    expect(shiftMinutes({ start: '', end: '17:00', breakMin: 0 }).error).toBeDefined();
    expect(shiftMinutes({ start: '09:00', end: '09:30', breakMin: 60 }).error).toBeDefined();
  });

  it('formats hours and minutes', () => {
    expect(formatHM(450)).toBe('7 h 30 min');
    expect(formatHM(2405)).toBe('40 h 05 min');
  });
});
