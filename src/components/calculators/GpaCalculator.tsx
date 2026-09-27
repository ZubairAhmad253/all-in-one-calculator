import { cumulativeGpa, gpa, gradePoints, isLetterGrade, LETTER_GRADES, type Course, type LetterGrade } from '@/lib/calculators/education';
import { formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { InlineNumber, NumberField } from '@/components/ui/fields';
import { Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { c: 'A:3,B+:4,B:3,C:2', a43: 0, pg: 0, pc: 0 };
const MAX = 20;

/** Courses live in the URL as "A:3,B+:4". */
const decode = (s: string): Course[] =>
  s
    .split(',')
    .filter(Boolean)
    .slice(0, MAX)
    .map((p) => {
      const [g, cr] = p.split(':');
      return { grade: isLetterGrade(g) ? g : 'A', credits: Number(cr) || 0 };
    });
const encode = (cs: Course[]) => cs.map((c) => `${c.grade}:${c.credits}`).join(',');

export default function GpaCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const courses = decode(s.c);
  const a43 = s.a43 === 1;
  const term = gpa(courses, a43);
  const hasPrev = s.pg > 0 && s.pc > 0;
  const cumulative = hasPrev ? cumulativeGpa(s.pg, s.pc, term) : Number.NaN;
  const fmt = (v: number) => (Number.isFinite(v) ? v.toFixed(2) : '—');

  const update = (i: number, patch: Partial<Course>) => set('c', encode(courses.map((c, j) => (j === i ? { ...c, ...patch } : c))));

  return (
    <section aria-label="GPA calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <div className="grid grid-cols-[1.5rem_minmax(0,1fr)_5rem_2rem] sm:grid-cols-[minmax(0,1fr)_minmax(0,8rem)_5rem_2rem] gap-2 px-1 text-xs text-muted">
            <span>
              <span className="sm:hidden">#</span>
              <span className="hidden sm:inline">Course</span>
            </span>
            <span>Grade</span>
            <span>Credits</span>
          </div>
          <ol className="mt-2 space-y-2">
            {courses.map((c, i) => (
              <li key={i} className="grid grid-cols-[1.5rem_minmax(0,1fr)_5rem_2rem] sm:grid-cols-[minmax(0,1fr)_minmax(0,8rem)_5rem_2rem] items-center gap-2">
                <span className="truncate px-1 text-sm font-medium">
                  <span className="hidden sm:inline">Course </span>
                  {i + 1}
                </span>
                <select
                  aria-label={`Course ${i + 1} grade`}
                  value={c.grade}
                  onChange={(e) => update(i, { grade: e.target.value as LetterGrade })}
                  className="h-11 w-full rounded-xl border border-line bg-surface px-2 text-base font-semibold outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
                >
                  {LETTER_GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g} ({gradePoints(g, a43).toFixed(1)})
                    </option>
                  ))}
                </select>
                <InlineNumber label={`Course ${i + 1} credits`} value={c.credits} onChange={(v) => update(i, { credits: v })} width="w-full" allowNegative={false} />
                {courses.length > 1 ? (
                  <button type="button" onClick={() => set('c', encode(courses.filter((_, j) => j !== i)))} aria-label={`Remove course ${i + 1}`} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg">
                    ✕
                  </button>
                ) : (
                  <span />
                )}
              </li>
            ))}
          </ol>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={courses.length >= MAX}
              onClick={() => set('c', encode([...courses, { grade: 'A', credits: 3 }]))}
              className="h-10 rounded-xl border border-line bg-surface px-4 text-sm font-medium hover:border-brand/40 disabled:opacity-50"
            >
              + Add course
            </button>
            <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
              Reset
            </button>
            <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={a43} onChange={(e) => set('a43', e.target.checked ? 1 : 0)} className="size-4 accent-[var(--brand)]" />
              Count A+ as 4.3
            </label>
          </div>

          <div className="mt-6 border-t border-line pt-5">
            <p className="text-sm font-semibold">Cumulative GPA (optional)</p>
            <p className="mt-1 text-xs text-muted">Add your GPA and credits so far to see your overall GPA including this term.</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <NumberField label="Current GPA" value={s.pg} onChange={(v) => set('pg', v)} min={0} max={4.3} decimals={2} />
              <NumberField label="Credits completed" value={s.pc} onChange={(v) => set('pc', v)} min={0} decimals={1} />
            </div>
          </div>
        </div>

        <div className="space-y-5 bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          <Headline label="Term GPA" value={fmt(term.gpa)} action={<ShareButton />} />
          <StatGrid
            items={[
              ['Total credits', formatNumber(term.credits, 1)],
              ['Grade points', formatNumber(term.points, 2)],
              ...(hasPrev ? ([['Cumulative GPA', fmt(cumulative)], ['Total credits overall', formatNumber(s.pc + term.credits, 1)]] as [string, string][]) : []),
            ]}
          />
          <p className="text-xs text-muted">
            Uses the common US 4.0 scale (A = 4.0, B = 3.0, C = 2.0, D = 1.0, F = 0, with ±0.3 for plus and minus grades). Check your school’s own scale, as some differ.
          </p>
        </div>
      </div>
    </section>
  );
}
