/**
 * GPA and course-grade maths. Pure functions only.
 * Uses the common US 4.0 scale; schools vary, so pages say so.
 */

export const LETTER_GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'] as const;
export type LetterGrade = (typeof LETTER_GRADES)[number];

const POINTS: Record<LetterGrade, number> = {
  'A+': 4.0,
  A: 4.0,
  'A-': 3.7,
  'B+': 3.3,
  B: 3.0,
  'B-': 2.7,
  'C+': 2.3,
  C: 2.0,
  'C-': 1.7,
  'D+': 1.3,
  D: 1.0,
  'D-': 0.7,
  F: 0,
};

/** Grade points for a letter; some schools give A+ 4.3. */
export const gradePoints = (g: LetterGrade, aPlusIs43 = false) => (g === 'A+' && aPlusIs43 ? 4.3 : POINTS[g]);

export const isLetterGrade = (g: string): g is LetterGrade => (LETTER_GRADES as readonly string[]).includes(g);

export interface Course {
  grade: LetterGrade;
  credits: number;
}

export interface GpaResult {
  gpa: number;
  credits: number;
  /** Grade points × credits, summed ("quality points"). */
  points: number;
}

export function gpa(courses: Course[], aPlusIs43 = false): GpaResult {
  let credits = 0;
  let points = 0;
  for (const c of courses) {
    if (!(c.credits > 0)) continue;
    credits += c.credits;
    points += gradePoints(c.grade, aPlusIs43) * c.credits;
  }
  return { gpa: credits > 0 ? points / credits : Number.NaN, credits, points };
}

/** Combine a previous cumulative GPA with this term's results. */
export function cumulativeGpa(prevGpa: number, prevCredits: number, term: GpaResult): number {
  const pc = prevCredits > 0 && prevGpa >= 0 ? prevCredits : 0;
  const total = pc + term.credits;
  return total > 0 ? (prevGpa * pc + term.points) / total : Number.NaN;
}

/** Percentage to letter on the common US scale (93+ A, 90+ A−, 87+ B+ …). */
export function letterFromPercent(p: number): LetterGrade {
  const cutoffs: [number, LetterGrade][] = [
    [97, 'A+'],
    [93, 'A'],
    [90, 'A-'],
    [87, 'B+'],
    [83, 'B'],
    [80, 'B-'],
    [77, 'C+'],
    [73, 'C'],
    [70, 'C-'],
    [67, 'D+'],
    [63, 'D'],
    [60, 'D-'],
  ];
  return cutoffs.find(([min]) => p >= min)?.[1] ?? 'F';
}

export interface GradedItem {
  /** Score as a percentage (0–100+). */
  score: number;
  /** Weight as a percentage of the course. */
  weight: number;
}

export interface WeightedResult {
  /** Average of the graded work, weighted: Σ(score × weight) ÷ Σ weight. */
  grade: number;
  /** Total weight of graded work so far. */
  weight: number;
}

export function weightedGrade(items: GradedItem[]): WeightedResult {
  let weight = 0;
  let sum = 0;
  for (const it of items) {
    if (!(it.weight > 0) || !Number.isFinite(it.score)) continue;
    weight += it.weight;
    sum += it.score * it.weight;
  }
  return { grade: weight > 0 ? sum / weight : Number.NaN, weight };
}

/**
 * Score needed on the final to finish with `target`:
 * target × (graded + final) = current × graded + needed × final.
 */
export function neededOnFinal(current: number, gradedWeight: number, finalWeight: number, target: number): number {
  if (!(finalWeight > 0)) return Number.NaN;
  return (target * (gradedWeight + finalWeight) - current * gradedWeight) / finalWeight;
}

// ------------------------------------------------------------------ CGPA

export interface Term {
  gpa: number;
  /** Credits in the term; leave 0 to weight every term equally. */
  credits: number;
}

/** Cumulative GPA: credit-weighted when every term has credits, else a plain average. */
export function cgpa(terms: Term[]): { cgpa: number; credits: number; weighted: boolean } {
  const valid = terms.filter((t) => Number.isFinite(t.gpa) && t.gpa >= 0);
  if (!valid.length) return { cgpa: Number.NaN, credits: 0, weighted: false };
  const weighted = valid.every((t) => t.credits > 0);
  if (!weighted) return { cgpa: valid.reduce((a, t) => a + t.gpa, 0) / valid.length, credits: 0, weighted };
  const credits = valid.reduce((a, t) => a + t.credits, 0);
  return { cgpa: valid.reduce((a, t) => a + t.gpa * t.credits, 0) / credits, credits, weighted };
}

/** Common CGPA → percentage conventions. */
export const CGPA_SCALES = [
  { id: 'x9.5', label: '10-point, × 9.5 (CBSE and many Indian universities)', max: 10, toPct: (g: number) => g * 9.5, fromPct: (p: number) => p / 9.5 },
  { id: 'x10', label: '10-point, × 10', max: 10, toPct: (g: number) => g * 10, fromPct: (p: number) => p / 10 },
  { id: 'minus7.5', label: '10-point, × 10 − 7.5 (Mumbai University, some others)', max: 10, toPct: (g: number) => g * 10 - 7.5, fromPct: (p: number) => (p + 7.5) / 10 },
  { id: '4pt', label: '4-point scale (share of 4.0)', max: 4, toPct: (g: number) => (g / 4) * 100, fromPct: (p: number) => (p / 100) * 4 },
] as const;
export type CgpaScaleId = (typeof CGPA_SCALES)[number]['id'];

// ----------------------------------------------------------------- marks

/** Percentage from marks, with NaN for a zero or negative total. */
export const marksPercent = (obtained: number, total: number) => (total > 0 ? (obtained / total) * 100 : Number.NaN);
