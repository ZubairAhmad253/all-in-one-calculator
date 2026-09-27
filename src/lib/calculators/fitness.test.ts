import { describe, expect, it } from 'vitest';
import { bedtimesFor, clock, cycles, formatDuration, heartRateZones, MAX_HR_FORMULAS, oneRepMax, parseDuration, riegel, wakeTimesFor, whrRisk } from './fitness';

describe('ovulation', () => {
  it('finds the fertile window and next period', () => {
    const [c] = cycles('2026-09-01', 28);
    expect(c.ovulation).toBe('2026-09-15');
    expect(c.fertileStart).toBe('2026-09-10');
    expect(c.fertileEnd).toBe('2026-09-16');
    expect(c.nextPeriod).toBe('2026-09-29');
  });
  it('shifts ovulation with cycle length', () => {
    expect(cycles('2026-09-01', 32)[0].ovulation).toBe('2026-09-19');
    expect(cycles('2026-09-01', 28, 14, 3)[2].periodStart).toBe('2026-10-27');
  });
});

describe('pace', () => {
  it('parses and formats durations', () => {
    expect(parseDuration('1:23:45')).toBe(5025);
    expect(parseDuration('25:30')).toBe(1530);
    expect(parseDuration('45')).toBe(2700);
    expect(parseDuration('1:x')).toBeNaN();
    expect(formatDuration(5025)).toBe('1:23:45');
    expect(formatDuration(330)).toBe('5:30');
    expect(formatDuration(3605)).toBe('1:00:05');
  });
  it('predicts race times with Riegel', () => {
    expect(riegel(25 * 60, 5, 10)).toBeCloseTo(3127.0, 0);
  });
});

describe('heart rate', () => {
  it('estimates max and zones', () => {
    expect(MAX_HR_FORMULAS[0].fn(40)).toBe(180);
    const z = heartRateZones(180);
    expect(z[1].low).toBe(108);
    const k = heartRateZones(180, 60);
    expect(k[1].low).toBe(132); // 60 + 0.6 × 120
    expect(k[4].high).toBe(180);
  });
});

describe('one-rep max', () => {
  it('averages the formulas', () => {
    const r = oneRepMax(100, 5)!;
    expect(r.results.find((x) => x.id === 'epley')!.value).toBeCloseTo(116.667, 3);
    expect(r.results.find((x) => x.id === 'brzycki')!.value).toBeCloseTo(112.5, 6);
    expect(oneRepMax(100, 1)!.average).toBe(100);
    expect(oneRepMax(100, 0)).toBeNull();
  });
});

describe('sleep', () => {
  it('counts back and forward in 90-minute cycles', () => {
    const b = bedtimesFor(7 * 60);
    expect(clock(b[0].time)).toBe('9:45 PM'); // 6 cycles + 15 min
    expect(clock(b[1].time)).toBe('11:15 PM');
    expect(clock(wakeTimesFor(23 * 60)[2].time)).toBe('6:45 AM');
    expect(clock(0, true)).toBe('00:00');
  });
});

describe('waist-to-hip', () => {
  it('classifies risk by sex', () => {
    expect(whrRisk('male', 0.9)).toBe('Low');
    expect(whrRisk('male', 0.98)).toBe('Moderate');
    expect(whrRisk('female', 0.9)).toBe('High');
  });
});
