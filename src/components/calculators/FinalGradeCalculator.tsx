import { letterFromPercent, neededOnFinal } from '@/lib/calculators/education';
import { formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField } from '@/components/ui/fields';
import { Headline, ShareButton } from './shared/results';

const DEFAULTS = { cur: 84, fw: 30, target: 80 };

export default function FinalGradeCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const fw = Math.min(100, Math.max(0, s.fw));
  const graded = 100 - fw;
  const need = neededOnFinal(s.cur, graded, fw, s.target);
  const valid = fw > 0 && Number.isFinite(need);
  // What you'd finish with for a range of final exam scores.
  const finish = (score: number) => (s.cur * graded + score * fw) / 100;

  const verdict = !valid ? '' : need > 100 ? 'Out of reach without extra credit' : need <= 0 ? 'Already secured, even with a zero on the final' : need > 90 ? 'Possible, but you’ll need an excellent final' : 'Achievable';

  return (
    <section aria-label="Final grade calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <NumberField label="Current grade" value={s.cur} onChange={(v) => set('cur', v)} suffix="%" min={0} max={150} decimals={2} hint="Your grade in the class so far, before the final." />
          <NumberField label="Final exam weight" value={s.fw} onChange={(v) => set('fw', v)} suffix="%" min={0} max={100} decimals={2} slider={{ min: 5, max: 60, step: 5 }} hint="How much of the final grade the exam counts for, from your syllabus." />
          <NumberField label="Grade you want" value={s.target} onChange={(v) => set('target', v)} suffix="%" min={0} max={150} decimals={2} />
          <div className="flex flex-wrap gap-2">
            {[
              ['A', 90],
              ['B', 80],
              ['C', 70],
              ['D', 60],
            ].map(([l, v]) => (
              <button key={l} type="button" onClick={() => set('target', Number(v))} className={`h-9 rounded-lg border px-3 text-sm font-medium ${s.target === v ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface hover:border-brand'}`}>
                {l} ({v}%)
              </button>
            ))}
          </div>
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!valid ? (
            <p className="text-sm text-muted">Enter a final exam weight above 0%.</p>
          ) : (
            <>
              <Headline label={`Score needed on the final for ${formatNumber(s.target, 2)}%`} value={`${formatNumber(Math.max(0, need), 2)}%`} action={<ShareButton />} />
              <p className={`mt-2 font-semibold ${need > 100 ? 'text-warn' : 'text-brand'}`}>{verdict}</p>
              <p className="tabular mt-2 text-sm text-muted">
                ({formatNumber(s.target, 2)} − {formatNumber(s.cur, 2)} × {formatNumber(graded / 100, 2)}) ÷ {formatNumber(fw / 100, 2)} = {formatNumber(need, 2)}%
              </p>

              <p className="mt-6 mb-2 text-sm font-semibold">Score needed for each grade</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ['A', 90],
                  ['B', 80],
                  ['C', 70],
                  ['D', 60],
                ].map(([l, v]) => {
                  const n = neededOnFinal(s.cur, graded, fw, Number(v));
                  return (
                    <div key={l} className="rounded-xl border border-line bg-surface p-3 text-center">
                      <p className="text-xs text-muted">
                        {l} ({v}%)
                      </p>
                      <p className={`tabular mt-1 text-lg font-bold ${n > 100 ? 'text-warn' : ''}`}>{n <= 0 ? 'Secured' : n > 100 ? `${formatNumber(n, 0)}%` : `${formatNumber(n, 1)}%`}</p>
                    </div>
                  );
                })}
              </div>

              <p className="mt-6 mb-2 text-sm font-semibold">Your final grade by exam score</p>
              <div className="overflow-hidden rounded-xl border border-line bg-surface">
                <table className="tabular w-full text-sm">
                  <thead className="bg-surface-2 text-left text-xs text-muted">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Final exam</th>
                      <th className="px-4 py-2.5 text-right font-medium">Course grade</th>
                      <th className="px-4 py-2.5 text-right font-medium">Letter</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {[100, 90, 80, 70, 60, 50, 0].map((sc) => (
                      <tr key={sc}>
                        <td className="px-4 py-2">{sc}%</td>
                        <td className="px-4 py-2 text-right font-medium">{formatNumber(finish(sc), 2)}%</td>
                        <td className="px-4 py-2 text-right">{letterFromPercent(finish(sc))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
