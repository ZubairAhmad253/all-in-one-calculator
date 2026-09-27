/**
 * Fitness and body tools: menstrual cycle and ovulation dates, running
 * pace, heart rate zones, one-rep max, sleep cycles and waist-to-hip
 * ratio. Pure functions only.
 */

import { addDays, type IsoDate } from './dates';
import type { Sex } from './health';

// ------------------------------------------------------------- ovulation

export interface Cycle {
  periodStart: IsoDate;
  fertileStart: IsoDate;
  ovulation: IsoDate;
  fertileEnd: IsoDate;
  nextPeriod: IsoDate;
}

/**
 * Upcoming cycles from the first day of the last period. Ovulation is
 * `luteal` days (usually 14) before the next period; the fertile window
 * runs from 5 days before ovulation to the day after.
 */
export function cycles(lastPeriod: IsoDate, cycleLength = 28, luteal = 14, count = 6): Cycle[] {
  return Array.from({ length: count }, (_, i) => {
    const periodStart = addDays(lastPeriod, i * cycleLength);
    const ovulation = addDays(periodStart, cycleLength - luteal);
    return {
      periodStart,
      fertileStart: addDays(ovulation, -5),
      ovulation,
      fertileEnd: addDays(ovulation, 1),
      nextPeriod: addDays(periodStart, cycleLength),
    };
  });
}

// ------------------------------------------------------------------ pace

export const KM_PER_MILE = 1.609344;

/** "1:23:45", "23:45" or "45" (minutes) → seconds; NaN if invalid. */
export function parseDuration(text: string): number {
  const parts = text.trim().split(':');
  if (parts.length > 3 || parts.some((p) => p === '' || !/^\d+(\.\d+)?$/.test(p))) return Number.NaN;
  const n = parts.map(Number);
  if (n.length === 1) return n[0] * 60;
  if (n.length === 2) return n[0] * 60 + n[1];
  return n[0] * 3600 + n[1] * 60 + n[2];
}

/** Seconds → "1:23:45" or "23:45". */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '—';
  const t = Math.round(seconds);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const mm = String(m).padStart(h ? 2 : 1, '0');
  return `${h ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`;
}

export const RACES = [
  { id: '5k', label: '5K', km: 5 },
  { id: '10k', label: '10K', km: 10 },
  { id: 'half', label: 'Half marathon', km: 21.0975 },
  { id: 'marathon', label: 'Marathon', km: 42.195 },
] as const;

/** Riegel's race-time prediction: T₂ = T₁ × (D₂ ÷ D₁)^1.06. */
export const riegel = (seconds: number, fromKm: number, toKm: number) => seconds * Math.pow(toKm / fromKm, 1.06);

// ------------------------------------------------------------ heart rate

export const MAX_HR_FORMULAS = [
  { id: 'tanaka', label: 'Tanaka: 208 − 0.7 × age', fn: (age: number) => 208 - 0.7 * age },
  { id: 'fox', label: 'Classic: 220 − age', fn: (age: number) => 220 - age },
  { id: 'gulati', label: 'Gulati (women): 206 − 0.88 × age', fn: (age: number) => 206 - 0.88 * age },
] as const;

export const HR_ZONES = [
  { zone: 1, name: 'Recovery', min: 50, max: 60, feel: 'Very easy; warm-ups and recovery' },
  { zone: 2, name: 'Endurance', min: 60, max: 70, feel: 'Easy, conversational; builds aerobic base' },
  { zone: 3, name: 'Tempo', min: 70, max: 80, feel: 'Moderate; improves aerobic fitness' },
  { zone: 4, name: 'Threshold', min: 80, max: 90, feel: 'Hard; raises lactate threshold' },
  { zone: 5, name: 'Maximum', min: 90, max: 100, feel: 'All-out; short intervals only' },
] as const;

/**
 * Beats per minute for each zone. With a resting heart rate, uses the
 * Karvonen (heart rate reserve) method; otherwise a % of max.
 */
export function heartRateZones(maxHr: number, restingHr?: number) {
  const karvonen = restingHr !== undefined && restingHr > 0 && restingHr < maxHr;
  const at = (pct: number) => (karvonen ? restingHr! + (pct / 100) * (maxHr - restingHr!) : (pct / 100) * maxHr);
  return HR_ZONES.map((z) => ({ ...z, low: at(z.min), high: at(z.max) }));
}

// ---------------------------------------------------------- one-rep max

export const ONE_RM_FORMULAS = [
  { id: 'epley', label: 'Epley', fn: (w: number, r: number) => w * (1 + r / 30) },
  { id: 'brzycki', label: 'Brzycki', fn: (w: number, r: number) => (w * 36) / (37 - r) },
  { id: 'lombardi', label: 'Lombardi', fn: (w: number, r: number) => w * Math.pow(r, 0.1) },
  { id: 'lander', label: 'Lander', fn: (w: number, r: number) => (100 * w) / (101.3 - 2.67123 * r) },
  { id: 'oconner', label: 'O’Conner', fn: (w: number, r: number) => w * (1 + 0.025 * r) },
  { id: 'wathan', label: 'Wathan', fn: (w: number, r: number) => (100 * w) / (48.8 + 53.8 * Math.exp(-0.075 * r)) },
  { id: 'mayhew', label: 'Mayhew', fn: (w: number, r: number) => (100 * w) / (52.2 + 41.9 * Math.exp(-0.055 * r)) },
] as const;

/** 1RM by every formula plus their average. One rep is simply the weight lifted. */
export function oneRepMax(weight: number, reps: number) {
  const r = Math.round(reps);
  if (!(weight > 0) || r < 1 || r > 30) return null;
  const results = ONE_RM_FORMULAS.map((f) => ({ id: f.id, label: f.label, value: r === 1 ? weight : f.fn(weight, r) }));
  return { results, average: results.reduce((a, x) => a + x.value, 0) / results.length };
}

/** Typical reps possible at each % of 1RM. */
export const PERCENT_OF_1RM = [
  { pct: 100, reps: 1 },
  { pct: 95, reps: 2 },
  { pct: 93, reps: 3 },
  { pct: 90, reps: 4 },
  { pct: 87, reps: 5 },
  { pct: 85, reps: 6 },
  { pct: 83, reps: 7 },
  { pct: 80, reps: 8 },
  { pct: 77, reps: 9 },
  { pct: 75, reps: 10 },
  { pct: 70, reps: 12 },
  { pct: 65, reps: 15 },
] as const;

// ----------------------------------------------------------------- sleep

export const CYCLE_MIN = 90;

/** Minutes after midnight, wrapped into 0–1439. */
export const wrapDay = (min: number) => ((Math.round(min) % 1440) + 1440) % 1440;

/**
 * Bedtimes for waking at `wake` (minutes after midnight), for 6 down to
 * 3 sleep cycles, allowing `fallAsleep` minutes to drop off.
 */
export const bedtimesFor = (wake: number, fallAsleep = 15) =>
  [6, 5, 4, 3].map((c) => ({ cycles: c, sleepMin: c * CYCLE_MIN, time: wrapDay(wake - c * CYCLE_MIN - fallAsleep) }));

/** Wake times for going to bed at `bed`, for 3 up to 6 cycles. */
export const wakeTimesFor = (bed: number, fallAsleep = 15) =>
  [3, 4, 5, 6].map((c) => ({ cycles: c, sleepMin: c * CYCLE_MIN, time: wrapDay(bed + fallAsleep + c * CYCLE_MIN) }));

/** "7:30 AM" style label for minutes after midnight. */
export function clock(min: number, h24 = false): string {
  const t = wrapDay(min);
  const h = Math.floor(t / 60);
  const m = String(t % 60).padStart(2, '0');
  if (h24) return `${String(h).padStart(2, '0')}:${m}`;
  return `${h % 12 || 12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
}

// ---------------------------------------------------------- waist-to-hip

/** Health risk bands from the WHO report on waist-to-hip ratio. */
export function whrRisk(sex: Sex, ratio: number): 'Low' | 'Moderate' | 'High' {
  const [low, high] = sex === 'male' ? [0.95, 1.0] : [0.8, 0.85];
  return ratio <= low ? 'Low' : ratio <= high ? 'Moderate' : 'High';
}
