/**
 * Health maths: BMI, daily calories and pregnancy dates.
 * Pure functions only. Results are general estimates, not medical advice.
 */

import { addDays, daysBetween, type IsoDate } from './dates';

/** Date helpers, re-exported for existing callers. */
export { addDays, daysBetween, isIsoDate, type IsoDate } from './dates';

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

// ------------------------------------------------------------------ BMR

/** Revised Harris–Benedict (Roza & Shizgal, 1984), kcal/day. */
export function bmrHarrisBenedict(sex: Sex, kg: number, cm: number, age: number): number {
  return sex === 'male' ? 88.362 + 13.397 * kg + 4.799 * cm - 5.677 * age : 447.593 + 9.247 * kg + 3.098 * cm - 4.33 * age;
}

/** Katch–McArdle, from lean body mass; kcal/day. */
export const bmrKatchMcArdle = (kg: number, bodyFatPct: number) => 370 + 21.6 * kg * (1 - bodyFatPct / 100);

// ------------------------------------------------------------- body fat

/** US Navy circumference method (lengths in cm). NaN if the tape measurements can't apply. */
export function navyBodyFat(sex: Sex, cm: number, neck: number, waist: number, hip: number): number {
  if (sex === 'male') {
    if (waist <= neck) return Number.NaN;
    return 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(cm)) - 450;
  }
  if (waist + hip <= neck) return Number.NaN;
  return 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.221 * Math.log10(cm)) - 450;
}

/** Deurenberg estimate of body fat % from BMI and age (adults). */
export const bmiBodyFat = (sex: Sex, bmiValue: number, age: number) => 1.2 * bmiValue + 0.23 * age - 10.8 * (sex === 'male' ? 1 : 0) - 5.4;

/** American Council on Exercise categories: lower bound (%) of each band. */
export const BODY_FAT_CATEGORIES: Record<Sex, { label: string; min: number }[]> = {
  male: [
    { label: 'Essential fat', min: 2 },
    { label: 'Athletes', min: 6 },
    { label: 'Fitness', min: 14 },
    { label: 'Average', min: 18 },
    { label: 'Obese', min: 25 },
  ],
  female: [
    { label: 'Essential fat', min: 10 },
    { label: 'Athletes', min: 14 },
    { label: 'Fitness', min: 21 },
    { label: 'Average', min: 25 },
    { label: 'Obese', min: 32 },
  ],
};

export function bodyFatCategory(sex: Sex, pct: number): string {
  const bands = BODY_FAT_CATEGORIES[sex];
  if (pct < bands[0].min) return 'Below essential fat';
  return [...bands].reverse().find((b) => pct >= b.min)!.label;
}

// --------------------------------------------------------- ideal weight

/** kg at 5 ft plus kg per inch over 5 ft, for each classic formula. */
export const IDEAL_WEIGHT_FORMULAS = [
  { id: 'robinson', label: 'Robinson (1983)', male: [52, 1.9], female: [49, 1.7] },
  { id: 'miller', label: 'Miller (1983)', male: [56.2, 1.41], female: [53.1, 1.36] },
  { id: 'devine', label: 'Devine (1974)', male: [50, 2.3], female: [45.5, 2.3] },
  { id: 'hamwi', label: 'Hamwi (1964)', male: [48, 2.7], female: [45.5, 2.2] },
] as const;

/** Ideal weight in kg by each formula. Below 5 ft the lines are extended downwards. */
export function idealWeights(sex: Sex, cm: number) {
  const over = cm / CM_PER_IN - 60;
  return IDEAL_WEIGHT_FORMULAS.map((f) => {
    const [base, perInch] = f[sex];
    return { id: f.id, label: f.label, kg: base + perInch * over };
  });
}

// ---------------------------------------------------------------- macros

export const KCAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9 } as const;

/** Grams of each macro for a calorie target and a % split that adds up to 100. */
export function macroGrams(calories: number, split: { protein: number; carbs: number; fat: number }) {
  return {
    protein: (calories * split.protein) / 100 / KCAL_PER_GRAM.protein,
    carbs: (calories * split.carbs) / 100 / KCAL_PER_GRAM.carbs,
    fat: (calories * split.fat) / 100 / KCAL_PER_GRAM.fat,
  };
}

// --------------------------------------------------------------- protein

/** Daily protein ranges in g per kg of body weight, from sports-nutrition and RDA guidance. */
export const PROTEIN_GOALS = [
  { id: 'rda', label: 'Minimum (RDA), sedentary adult', min: 0.8, max: 0.8 },
  { id: 'active', label: 'Active, general fitness', min: 1.2, max: 1.6 },
  { id: 'muscle', label: 'Building muscle', min: 1.6, max: 2.2 },
  { id: 'cut', label: 'Losing fat, keeping muscle', min: 1.8, max: 2.7 },
  { id: 'older', label: 'Older adult (65+)', min: 1.0, max: 1.2 },
  { id: 'endurance', label: 'Endurance training', min: 1.2, max: 1.4 },
] as const;
export type ProteinGoalId = (typeof PROTEIN_GOALS)[number]['id'];

export function proteinRange(kg: number, goal: ProteinGoalId) {
  const g = PROTEIN_GOALS.find((p) => p.id === goal) ?? PROTEIN_GOALS[0];
  return { min: g.min * kg, max: g.max * kg, perKg: [g.min, g.max] as const };
}

// ----------------------------------------------------------------- water

/**
 * Daily drinking water estimate in litres: 35 ml per kg, plus 0.35 L per
 * 30 minutes of exercise, plus 0.5 L in hot weather.
 */
export function waterIntake(kg: number, exerciseMin: number, hot: boolean) {
  const base = (kg * 35) / 1000;
  const exercise = (Math.max(0, exerciseMin) / 30) * 0.35;
  const heat = hot ? 0.5 : 0;
  return { base, exercise, heat, total: base + exercise + heat };
}
