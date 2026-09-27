/**
 * Health maths: BMI, daily calories and pregnancy dates.
 * Pure functions only. Results are general estimates, not medical advice.
 */

// ---------------------------------------------------------------- units

export const LB_PER_KG = 2.2046226218;
export const CM_PER_IN = 2.54;

export const kgFromLb = (lb: number) => lb / LB_PER_KG;
export const lbFromKg = (kg: number) => kg * LB_PER_KG;
export const cmFromFtIn = (ft: number, inch: number) => (ft * 12 + inch) * CM_PER_IN;
export function ftInFromCm(cm: number): { ft: number; inch: number } {
  const total = cm / CM_PER_IN;
  let ft = Math.floor(total / 12);
  let inch = Math.round((total - ft * 12) * 10) / 10;
  if (inch >= 12) {
    ft += 1;
    inch -= 12;
  }
  return { ft, inch };
}

// ------------------------------------------------------------------ BMI

export interface BmiCategory {
  label: string;
  /** Lower bound, inclusive. */
  min: number;
  /** A CSS colour token for the scale. */
  color: string;
}

/** WHO adult categories. */
export const BMI_CATEGORIES: BmiCategory[] = [
  { label: 'Underweight', min: 0, color: 'var(--chart-1)' },
  { label: 'Healthy weight', min: 18.5, color: 'var(--accent)' },
  { label: 'Overweight', min: 25, color: 'var(--warn)' },
  { label: 'Obesity class I', min: 30, color: 'var(--danger)' },
  { label: 'Obesity class II', min: 35, color: 'var(--danger)' },
  { label: 'Obesity class III', min: 40, color: 'var(--danger)' },
];

export function bmi(kg: number, cm: number): number {
  const m = cm / 100;
  return kg > 0 && m > 0 ? kg / (m * m) : Number.NaN;
}

export function bmiCategory(value: number): BmiCategory | null {
  if (!Number.isFinite(value)) return null;
  // Compare on the 1-decimal value people see, so 24.96 (shown as 25.0) is overweight.
  const shown = Math.round(value * 10) / 10;
  return [...BMI_CATEGORIES].reverse().find((c) => shown >= c.min) ?? null;
}

/** Weight range (kg) for a BMI of 18.5–24.9 at this height. */
export function healthyWeightRange(cm: number): { min: number; max: number } {
  const m2 = (cm / 100) ** 2;
  return { min: 18.5 * m2, max: 24.9 * m2 };
}

// ------------------------------------------------------------- calories

export type Sex = 'male' | 'female';

export const ACTIVITY_LEVELS = [
  { id: 'sedentary', factor: 1.2, label: 'Sedentary', detail: 'Little or no exercise, desk job' },
  { id: 'light', factor: 1.375, label: 'Lightly active', detail: 'Light exercise 1–3 days a week' },
  { id: 'moderate', factor: 1.55, label: 'Moderately active', detail: 'Moderate exercise 3–5 days a week' },
  { id: 'very', factor: 1.725, label: 'Very active', detail: 'Hard exercise 6–7 days a week' },
  { id: 'extra', factor: 1.9, label: 'Extra active', detail: 'Very hard exercise or a physical job' },
] as const;
export type ActivityId = (typeof ACTIVITY_LEVELS)[number]['id'];

/** Mifflin–St Jeor basal metabolic rate, in kcal/day. */
export function bmr(sex: Sex, kg: number, cm: number, age: number): number {
  return 10 * kg + 6.25 * cm - 5 * age + (sex === 'male' ? 5 : -161);
}

/** Total daily energy expenditure: BMR × activity factor. */
export function tdee(sex: Sex, kg: number, cm: number, age: number, activity: ActivityId): number {
  const level = ACTIVITY_LEVELS.find((a) => a.id === activity) ?? ACTIVITY_LEVELS[0];
  return bmr(sex, kg, cm, age) * level.factor;
}

/** About 7,700 kcal of energy per kg of body fat (3,500 per lb). */
export const KCAL_PER_KG = 7700;

export interface CalorieGoal {
  label: string;
  /** Weekly change in kg (negative = loss). */
  kgPerWeek: number;
  calories: number;
  /** True if the target falls below common safe minimums. */
  belowMinimum: boolean;
}

/** General guidance floors: 1,200 kcal (women) / 1,500 kcal (men). */
export const minimumCalories = (sex: Sex) => (sex === 'male' ? 1500 : 1200);

export function calorieGoals(maintenance: number, sex: Sex, steps: { label: string; kgPerWeek: number }[]): CalorieGoal[] {
  return steps.map((s) => {
    const calories = maintenance + (s.kgPerWeek * KCAL_PER_KG) / 7;
    return { ...s, calories, belowMinimum: calories < minimumCalories(sex) };
  });
}

// ------------------------------------------------------------ pregnancy

/** A calendar date as YYYY-MM-DD. Arithmetic is done in UTC so time zones and DST never shift a day. */
export type IsoDate = string;

const toUtc = (d: IsoDate) => {
  const [y, m, day] = d.split('-').map(Number);
  return Date.UTC(y, m - 1, day);
};
const DAY = 86_400_000;

export const isIsoDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(toUtc(d));
export const addDays = (d: IsoDate, days: number): IsoDate => new Date(toUtc(d) + days * DAY).toISOString().slice(0, 10);
export const daysBetween = (from: IsoDate, to: IsoDate) => Math.round((toUtc(to) - toUtc(from)) / DAY);

export type DueDateMethod = 'lmp' | 'conception' | 'ivf3' | 'ivf5';

/**
 * Due date (40 weeks after the start of the last period).
 * - lmp: Naegele's rule, adjusted for cycles longer or shorter than 28 days
 * - conception: conception + 266 days
 * - ivf3 / ivf5: transfer of a 3- or 5-day embryo + 263 / 261 days
 */
export function dueDate(method: DueDateMethod, date: IsoDate, cycleLength = 28): IsoDate {
  switch (method) {
    case 'lmp':
      return addDays(date, 280 + (cycleLength - 28));
    case 'conception':
      return addDays(date, 266);
    case 'ivf3':
      return addDays(date, 263);
    case 'ivf5':
      return addDays(date, 261);
  }
}

/** Gestational age on `today`, counted from 280 days before the due date. */
export function gestationalAge(due: IsoDate, today: IsoDate): { weeks: number; days: number; totalDays: number } {
  const totalDays = daysBetween(addDays(due, -280), today);
  return { weeks: Math.floor(totalDays / 7), days: ((totalDays % 7) + 7) % 7, totalDays };
}

export function trimester(totalDays: number): 1 | 2 | 3 | null {
  if (totalDays < 0 || totalDays > 42 * 7) return null;
  if (totalDays < 14 * 7) return 1;
  if (totalDays < 28 * 7) return 2;
  return 3;
}

/** Key dates, each at a gestational age in days from the pregnancy start. */
export const MILESTONES = [
  { label: 'Heartbeat usually visible on ultrasound', day: 6 * 7 },
  { label: 'First trimester ends', day: 14 * 7 - 1 },
  { label: 'Anatomy (20-week) scan window opens', day: 18 * 7 },
  { label: 'Viability milestone', day: 24 * 7 },
  { label: 'Third trimester begins', day: 28 * 7 },
  { label: 'Full term (39 weeks)', day: 39 * 7 },
] as const;

export function milestoneDates(due: IsoDate) {
  const start = addDays(due, -280);
  return MILESTONES.map((m) => ({ ...m, date: addDays(start, m.day) }));
}
