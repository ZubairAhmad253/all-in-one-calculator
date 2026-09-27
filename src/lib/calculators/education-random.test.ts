import { describe, expect, it } from 'vitest';
import { cgpa, CGPA_SCALES, cumulativeGpa, marksPercent, gpa, gradePoints, letterFromPercent, neededOnFinal, weightedGrade } from './education';
import { draw, DrawError, randomInt } from './random';

describe('gpa', () => {
  it('weights grade points by credits', () => {
    // (4.0×3 + 3.3×4 + 3.0×3 + 2.0×2) ÷ 12 = 38.2 ÷ 12 = 3.183…
    const r = gpa([
      { grade: 'A', credits: 3 },
      { grade: 'B+', credits: 4 },
      { grade: 'B', credits: 3 },
      { grade: 'C', credits: 2 },
    ]);
    expect(r.credits).toBe(12);
    expect(r.points).toBeCloseTo(38.2, 10);
    expect(r.gpa).toBeCloseTo(3.1833, 4);
  });

  it('optionally counts A+ as 4.3', () => {
    expect(gradePoints('A+')).toBe(4);
    expect(gradePoints('A+', true)).toBe(4.3);
    expect(gpa([{ grade: 'A+', credits: 3 }], true).gpa).toBeCloseTo(4.3, 10);
  });

  it('ignores courses without credits', () => {
    expect(gpa([{ grade: 'F', credits: 0 }, { grade: 'A', credits: 3 }]).gpa).toBe(4);
    expect(gpa([]).gpa).toBeNaN();
  });

  it('combines with a previous cumulative GPA', () => {
    // 3.5 over 30 credits, then a 3.0 term over 15: (105 + 45) ÷ 45 = 3.333…
    const term = gpa([{ grade: 'B', credits: 15 }]);
    expect(cumulativeGpa(3.5, 30, term)).toBeCloseTo(3.3333, 4);
    expect(cumulativeGpa(0, 0, term)).toBe(3);
  });
});

describe('grades', () => {
  it('maps percentages to letters', () => {
    expect(letterFromPercent(98)).toBe('A+');
    expect(letterFromPercent(93)).toBe('A');
    expect(letterFromPercent(92.9)).toBe('A-');
    expect(letterFromPercent(85)).toBe('B');
    expect(letterFromPercent(59.9)).toBe('F');
  });

  it('computes a weighted grade', () => {
    // 90×20 + 80×30 + 70×10 = 4,900 over 60 → 81.67
    const r = weightedGrade([
      { score: 90, weight: 20 },
      { score: 80, weight: 30 },
      { score: 70, weight: 10 },
    ]);
    expect(r.weight).toBe(60);
    expect(r.grade).toBeCloseTo(81.667, 3);
  });

  it('skips items without a weight or score', () => {
    expect(weightedGrade([{ score: 100, weight: 0 }, { score: Number.NaN, weight: 20 }]).grade).toBeNaN();
  });

  it('works out the score needed on the final', () => {
    // 85% on 75% of the course; final is 25%; target 90 → (90×100 − 85×75) ÷ 25 = 105.
    expect(neededOnFinal(85, 75, 25, 90)).toBeCloseTo(105, 10);
    expect(neededOnFinal(85, 75, 25, 80)).toBeCloseTo(65, 10);
    expect(neededOnFinal(85, 75, 0, 80)).toBeNaN();
  });
});

describe('random', () => {
  /** Deterministic generator for tests (mulberry32). */
  const seeded = (seed: number) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) >>> 0;
  };

  it('stays within the range, inclusive', () => {
    const rand = seeded(1);
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const n = randomInt(1, 6, rand);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(6);
      seen.add(n);
    }
    expect(seen.size).toBe(6);
  });

  it('is fair: each value comes up about equally often', () => {
    const rand = seeded(42);
    const counts = Array(6).fill(0);
    for (let i = 0; i < 60_000; i++) counts[randomInt(1, 6, rand) - 1]++;
    for (const c of counts) expect(Math.abs(c - 10_000)).toBeLessThan(400); // within 4%
  });

  it('rejects values that would bias the result', () => {
    // A generator stuck on the top value must be retried, not wrapped.
    let calls = 0;
    const rand = () => (calls++ === 0 ? 2 ** 32 - 1 : 7);
    expect(randomInt(0, 2, rand)).toBe(7 % 3);
    expect(calls).toBe(2);
  });

  it('draws unique numbers with no repeats', () => {
    const r = draw({ min: 1, max: 49, count: 6, unique: true, sort: 'asc' }, seeded(7));
    expect(new Set(r).size).toBe(6);
    expect([...r].sort((a, b) => a - b)).toEqual(r);
    const all = draw({ min: 1, max: 10, count: 10, unique: true, sort: 'asc' }, seeded(3));
    expect(all).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('allows repeats when asked and sorts descending', () => {
    const r = draw({ min: 1, max: 3, count: 20, unique: false, sort: 'desc' }, seeded(9));
    expect(r).toHaveLength(20);
    expect([...r].sort((a, b) => b - a)).toEqual(r);
  });

  it('explains impossible requests', () => {
    expect(() => draw({ min: 1, max: 5, count: 6, unique: true, sort: 'none' })).toThrow(DrawError);
    expect(() => draw({ min: 10, max: 1, count: 1, unique: false, sort: 'none' })).toThrow(DrawError);
    expect(() => draw({ min: 1.5, max: 10, count: 1, unique: false, sort: 'none' })).toThrow(DrawError);
    expect(() => draw({ min: 1, max: 10, count: 0, unique: false, sort: 'none' })).toThrow(DrawError);
  });
});

describe('cgpa and marks', () => {
  it('weights terms by credits, or averages them', () => {
    expect(cgpa([{ gpa: 8, credits: 20 }, { gpa: 9, credits: 30 }]).cgpa).toBeCloseTo(8.6, 12);
    expect(cgpa([{ gpa: 8, credits: 0 }, { gpa: 9, credits: 30 }])).toEqual({ cgpa: 8.5, credits: 0, weighted: false });
    expect(cgpa([]).cgpa).toBeNaN();
  });
  it('converts CGPA to a percentage and back', () => {
    const s = (id: string) => CGPA_SCALES.find((x) => x.id === id)!;
    expect(s('x9.5').toPct(8.6)).toBeCloseTo(81.7, 12);
    expect(s('minus7.5').toPct(8)).toBe(72.5);
    expect(s('4pt').toPct(3.5)).toBe(87.5);
    expect(s('x9.5').fromPct(76)).toBe(8);
  });
  it('computes marks percentages', () => {
    expect(marksPercent(425, 500)).toBe(85);
    expect(marksPercent(1, 0)).toBeNaN();
  });
});
