import { describe, expect, it } from 'vitest';
import {
  addDays,
  bmi,
  bmiCategory,
  bmiBodyFat,
  bmr,
  bmrHarrisBenedict,
  bmrKatchMcArdle,
  bodyFatCategory,
  idealWeights,
  macroGrams,
  navyBodyFat,
  proteinRange,
  waterIntake,
  calorieGoals,
  cmFromFtIn,
  daysBetween,
  dueDate,
  ftInFromCm,
  gestationalAge,
  healthyWeightRange,
  kgFromLb,
  milestoneDates,
  tdee,
  trimester,
} from './health';

describe('units', () => {
  it('converts pounds and feet/inches', () => {
    expect(kgFromLb(154)).toBeCloseTo(69.853, 3);
    expect(cmFromFtIn(5, 9)).toBeCloseTo(175.26, 2);
    expect(ftInFromCm(175.26)).toEqual({ ft: 5, inch: 9 });
    expect(ftInFromCm(182.88)).toEqual({ ft: 6, inch: 0 });
  });
});

describe('bmi', () => {
  it('matches the standard formula in both unit systems', () => {
    expect(bmi(70, 175)).toBeCloseTo(22.86, 2);
    // CDC example: 150 lb, 5 ft 5 in → BMI 25.0 (703 × 150 ÷ 65²).
    expect(bmi(kgFromLb(150), cmFromFtIn(5, 5))).toBeCloseTo((703 * 150) / 65 ** 2, 1);
  });

  it('returns NaN for missing input', () => {
    expect(bmi(0, 175)).toBeNaN();
    expect(bmi(70, 0)).toBeNaN();
  });

  it('assigns WHO categories using the displayed value', () => {
    expect(bmiCategory(18.4)!.label).toBe('Underweight');
    expect(bmiCategory(18.5)!.label).toBe('Healthy weight');
    expect(bmiCategory(24.94)!.label).toBe('Healthy weight');
    expect(bmiCategory(24.96)!.label).toBe('Overweight'); // shown as 25.0
    expect(bmiCategory(32)!.label).toBe('Obesity class I');
    expect(bmiCategory(41)!.label).toBe('Obesity class III');
    expect(bmiCategory(Number.NaN)).toBeNull();
  });

  it('gives the healthy weight range for a height', () => {
    const r = healthyWeightRange(175);
    expect(r.min).toBeCloseTo(56.66, 2);
    expect(r.max).toBeCloseTo(76.26, 2);
  });
});

describe('calories', () => {
  it('computes Mifflin–St Jeor BMR', () => {
    expect(bmr('male', 80, 180, 30)).toBe(1780);
    expect(bmr('female', 65, 165, 30)).toBeCloseTo(1370.25, 2);
  });

  it('applies the activity factor', () => {
    expect(tdee('male', 80, 180, 30, 'moderate')).toBeCloseTo(2759, 0);
    expect(tdee('female', 65, 165, 30, 'sedentary')).toBeCloseTo(1644.3, 1);
  });

  it('sets goals from ~7,700 kcal per kg and flags low targets', () => {
    const goals = calorieGoals(1644.3, 'female', [
      { label: 'Lose 0.5 kg/week', kgPerWeek: -0.5 },
      { label: 'Gain 0.5 kg/week', kgPerWeek: 0.5 },
    ]);
    expect(goals[0].calories).toBeCloseTo(1094.3, 1);
    expect(goals[0].belowMinimum).toBe(true);
    expect(goals[1].calories).toBeCloseTo(2194.3, 1);
    expect(goals[1].belowMinimum).toBe(false);
  });
});

describe('dates', () => {
  it('adds days across months, leap years and DST changes', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30');
    expect(daysBetween('2026-01-01', '2026-12-31')).toBe(364);
  });
});

describe('pregnancy', () => {
  it('uses Naegele’s rule from the last period', () => {
    // LMP 1 Jan 2026 + 280 days = 8 Oct 2026.
    expect(dueDate('lmp', '2026-01-01')).toBe('2026-10-08');
  });

  it('adjusts for cycle length', () => {
    expect(dueDate('lmp', '2026-01-01', 32)).toBe('2026-10-12');
    expect(dueDate('lmp', '2026-01-01', 25)).toBe('2026-10-05');
  });

  it('agrees across methods for the same pregnancy', () => {
    // Conception ≈ day 14 of a 28-day cycle; a day-5 embryo transfer ≈ day 19.
    expect(dueDate('conception', '2026-01-15')).toBe('2026-10-08');
    expect(dueDate('ivf5', '2026-01-20')).toBe('2026-10-08');
    expect(dueDate('ivf3', '2026-01-18')).toBe('2026-10-08');
  });

  it('works out weeks and days pregnant', () => {
    expect(gestationalAge('2026-10-08', '2026-03-12')).toEqual({ weeks: 10, days: 0, totalDays: 70 });
    expect(gestationalAge('2026-10-08', '2026-10-08').weeks).toBe(40);
  });

  it('assigns trimesters', () => {
    expect(trimester(13 * 7 + 6)).toBe(1);
    expect(trimester(14 * 7)).toBe(2);
    expect(trimester(27 * 7 + 6)).toBe(2);
    expect(trimester(28 * 7)).toBe(3);
    expect(trimester(-1)).toBeNull();
  });

  it('dates the milestones from the pregnancy start', () => {
    const m = milestoneDates('2026-10-08');
    expect(m.find((x) => x.label.startsWith('Third trimester'))!.date).toBe('2026-07-16');
    expect(m.find((x) => x.label.startsWith('Full term'))!.date).toBe('2026-10-01');
  });
});

describe('body composition', () => {
  it('computes BMR by three equations', () => {
    expect(bmrHarrisBenedict('male', 70, 175, 30)).toBeCloseTo(1695.667, 3);
    expect(bmrHarrisBenedict('female', 60, 165, 30)).toBeCloseTo(1383.683, 3);
    expect(bmrKatchMcArdle(70, 15)).toBeCloseTo(1655.2, 6);
  });
  it('estimates body fat with the Navy and BMI methods', () => {
    expect(navyBodyFat('male', 178, 38, 86, 0)).toBeCloseTo(17.2, 1);
    expect(navyBodyFat('female', 165, 33, 75, 97)).toBeCloseTo(27.9, 0);
    expect(navyBodyFat('male', 178, 40, 38, 0)).toBeNaN();
    expect(bmiBodyFat('male', 22.9, 30)).toBeCloseTo(18.18, 2);
    expect(bodyFatCategory('male', 17.2)).toBe('Fitness');
    expect(bodyFatCategory('female', 33)).toBe('Obese');
    expect(bodyFatCategory('male', 1)).toBe('Below essential fat');
  });
  it('gives ideal weights by formula', () => {
    const w = idealWeights('male', 177.8); // 5 ft 10 in
    expect(w.find((x) => x.id === 'devine')!.kg).toBeCloseTo(73, 6);
    expect(w.find((x) => x.id === 'robinson')!.kg).toBeCloseTo(71, 6);
  });
  it('splits calories into macros', () => {
    expect(macroGrams(2000, { protein: 30, carbs: 40, fat: 30 })).toEqual({ protein: 150, carbs: 200, fat: 2000 * 0.3 / 9 });
  });
  it('recommends protein and water', () => {
    expect(proteinRange(70, 'muscle').max).toBeCloseTo(154, 6);
    expect(waterIntake(70, 60, true).total).toBeCloseTo(2.45 + 0.7 + 0.5, 10);
  });
});
