import { describe, expect, it } from 'vitest';
import { cityName, isValidZone, offsetLabel, utcToZoned, ZONES, zonedToUtc, zoneOffset } from './timezones';

describe('time zones', () => {
  it('knows offsets, including daylight saving and half hours', () => {
    expect(zoneOffset('America/New_York', Date.UTC(2026, 0, 15, 12))).toBe(-300);
    expect(zoneOffset('America/New_York', Date.UTC(2026, 6, 15, 12))).toBe(-240);
    expect(zoneOffset('Asia/Kolkata', Date.UTC(2026, 6, 15))).toBe(330);
    expect(zoneOffset('Asia/Kathmandu', Date.UTC(2026, 6, 15))).toBe(345);
    expect(zoneOffset('Australia/Sydney', Date.UTC(2026, 0, 15))).toBe(660);
  });
  it('converts wall-clock times between zones', () => {
    const t = zonedToUtc('2026-07-15', '12:00', 'America/New_York');
    expect(new Date(t).toISOString()).toBe('2026-07-15T16:00:00.000Z');
    expect(utcToZoned(t, 'Europe/London')).toEqual({ date: '2026-07-15', time: '17:00' });
    expect(utcToZoned(t, 'Asia/Tokyo')).toEqual({ date: '2026-07-16', time: '01:00' });
    expect(utcToZoned(zonedToUtc('2026-01-15', '09:00', 'Asia/Kolkata'), 'UTC')).toEqual({ date: '2026-01-15', time: '03:30' });
  });
  it('handles the skipped hour when clocks go forward', () => {
    // 2:30 AM doesn't exist in New York on 8 March 2026.
    const t = zonedToUtc('2026-03-08', '02:30', 'America/New_York');
    expect(utcToZoned(t, 'America/New_York').time).toBe('03:30');
  });
  it('labels zones and offsets', () => {
    expect(cityName('America/Argentina/Buenos_Aires')).toBe('Buenos Aires');
    expect(offsetLabel(330)).toBe('+5:30');
    expect(offsetLabel(-240)).toBe('−4');
    expect(offsetLabel(0)).toBe('±0');
    expect(ZONES.every(isValidZone)).toBe(true);
    expect(isValidZone('Mars/Olympus')).toBe(false);
  });
});

describe('repeated hour', () => {
  it('uses the first 1:30 AM when clocks go back', () => {
    // New York falls back from 2:00 EDT to 1:00 EST on 1 November 2026.
    const t = zonedToUtc('2026-11-01', '01:30', 'America/New_York');
    expect(new Date(t).toISOString()).toBe('2026-11-01T05:30:00.000Z');
  });
});
