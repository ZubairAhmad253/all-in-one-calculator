import { cgpa, CGPA_SCALES, type CgpaScaleId, type Term } from '@/lib/calculators/education';
import { formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { InlineNumber, SelectField } from '@/components/ui/fields';
import { Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { terms: '8.2:20,8.8:22,7.9:21,9.1:24', scale: 'x9.5' };
const MAX_TERMS = 16;

/** Terms live in the URL as "gpa:credits,gpa:credits". */
const decode = (t: string): Term[] =>
  t
    .split(',')
    .filter(Boolean)
    .slice(0, MAX_TERMS)
    .map((p) => {
      const [g = '0', c = '0'] = p.split(':');
      return { gpa: Number(g) || 0, credits: Number(c) || 0 };
    });
const encode = (terms: Term[]) => terms.map((t) => `${t.gpa}:${t.credits}`).join(',');

export default function CgpaCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const terms = decode(s.terms);
  const scale = CGPA_SCALES.find((x) => x.id === s.scale) ?? CGPA_SCALES[0];
  const r = cgpa(terms);
  const outOfRange = terms.some((t) => t.gpa > scale.max);
  const pct = scale.toPct(r.cgpa);

  const update = (i: number, patch: Partial<Term>) => set('terms', encode(terms.map((t, j) => (j === i ? { ...t, ...patch } : t))));

  return (
    <section aria-label="CGPA calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <SelectField label="Grading scale" value={scale.id} onChange={(v) => set('scale', v as CgpaScaleId)} options={CGPA_SCALES.map((x) => ({ value: x.id, label: x.label }))} />
          <div>
            <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,1fr)_2rem] gap-2 px-1 pb-1.5 text-xs text-muted">
              <span>Term</span>
              <span>SGPA / GPA</span>
              <span>Credits (optional)</span>
              <span />
            </div>
            <ol className="space-y-2">
              {terms.map((t, i) => (
                <li key={i} className="grid grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,1fr)_2rem] items-center gap-2">
                  <span className="text-sm font-medium">Sem {i + 1}</span>
                  <InlineNumber label={`Semester ${i + 1} GPA`} value={t.gpa} onChange={(v) => update(i, { gpa: v })} width="w-full" allowNegative={false} />
                  <InlineNumber label={`Semester ${i + 1} credits`} value={t.credits} onChange={(v) => update(i, { credits: v })} width="w-full" allowNegative={false} />
                  {terms.length > 1 ? (
                    <button type="button" aria-label={`Remove semester ${i + 1}`} onClick={() => set('terms', encode(terms.filter((_, j) => j !== i)))} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg">
                      ✕
                    </button>
                  ) : (
                    <span />
                  )}
                </li>
              ))}
            </ol>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={terms.length >= MAX_TERMS} onClick={() => set('terms', encode([...terms, { gpa: 0, credits: terms.at(-1)?.credits ?? 0 }]))} className="h-10 rounded-xl border border-line bg-surface px-4 text-sm font-medium hover:border-brand/40 disabled:opacity-50">
              + Add semester
            </button>
            <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
              Reset
            </button>
          </div>
          {outOfRange && <p className="text-xs text-warn">Some GPAs are above {scale.max}, the top of this scale. Check the grading scale.</p>}
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!Number.isFinite(r.cgpa) ? (
            <p className="text-sm text-muted">Enter at least one semester GPA.</p>
          ) : (
            <>
              <Headline label={`CGPA (out of ${scale.max})`} value={formatNumber(r.cgpa, 2)} action={<ShareButton />} />
              <p className="mt-2 text-sm text-muted">{r.weighted ? `Weighted by ${formatNumber(r.credits, 0)} total credits` : 'Simple average (add credits to every semester to weight them)'}</p>
              <div className="mt-6">
                <StatGrid
                  items={[
                    ['Equivalent percentage', `${formatNumber(Math.max(0, pct), 2)}%`],
                    ['Semesters', String(terms.length)],
                    ['Highest semester', formatNumber(Math.max(...terms.map((t) => t.gpa)), 2)],
                    ['Lowest semester', formatNumber(Math.min(...terms.map((t) => t.gpa)), 2)],
                  ]}
                />
              </div>
              <p className="mt-6 mb-2 text-sm font-semibold">CGPA to percentage on this scale</p>
              <div className="overflow-hidden rounded-xl border border-line bg-surface">
                <table className="tabular w-full text-sm">
                  <tbody className="divide-y divide-line">
                    {(scale.max === 10 ? [10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6] : [4, 3.7, 3.5, 3.3, 3, 2.7, 2.5, 2]).map((g) => (
                      <tr key={g} className={Math.abs(g - r.cgpa) < (scale.max === 10 ? 0.25 : 0.1) ? 'bg-brand-soft/60 font-semibold' : ''}>
                        <td className="px-4 py-2">{formatNumber(g, 1)} CGPA</td>
                        <td className="px-4 py-2 text-right">{formatNumber(scale.toPct(g), 2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-muted">Conversion rules differ between boards and universities. Use the one your institution publishes, usually printed on the mark sheet.</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
