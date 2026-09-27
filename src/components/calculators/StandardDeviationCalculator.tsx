import { spread } from '@/lib/calculators/stats';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { Tabs } from '@/components/ui/fields';
import { NumberListField, parseList } from './shared/numberlist';
import { Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { n: '10, 12, 23, 23, 16, 23, 21, 16', type: 'sample' };

const fmt = (v: number, d = 6) => (Number.isFinite(v) ? v.toLocaleString('en', { maximumFractionDigits: d }) : '—');

export default function StandardDeviationCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const sample = s.type !== 'population';
  const nums = parseList(s.n);
  const r = spread(nums);
  const n = nums.length;
  const sd = r ? (sample ? r.sampleSD : r.populationSD) : Number.NaN;
  const variance = r ? (sample ? r.sampleVariance : r.populationVariance) : Number.NaN;
  const shown = nums.slice(0, 50);

  return (
    <section aria-label="Standard deviation calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <NumberListField label="Data set" value={s.n} onChange={(v) => set('n', v)} rows={4} hint="Separate with commas, spaces or new lines. You can paste a spreadsheet column." />
          <div>
            <p className="mb-1.5 text-sm font-medium">Your data is a</p>
            <Tabs
              value={sample ? 'sample' : 'population'}
              onChange={(v) => set('type', v)}
              tabs={[
                { value: 'sample', label: 'Sample (n − 1)' },
                { value: 'population', label: 'Population (N)' },
              ]}
            />
            <p className="mt-1.5 text-xs text-muted">Use sample unless your data covers every member of the group.</p>
          </div>
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!r ? (
            <p className="text-sm text-muted">Enter at least two numbers.</p>
          ) : (
            <>
              <Headline label={`${sample ? 'Sample' : 'Population'} standard deviation (${sample ? 's' : 'σ'})`} value={fmt(sd)} action={<ShareButton />} compact />
              {sample && n < 2 && <p className="mt-2 text-sm text-warn">A sample needs at least two values.</p>}
              <p className="tabular mt-2 text-sm text-muted">
                √({fmt(r.ss)} ÷ {sample ? `(${n} − 1)` : n}) = {fmt(sd)}
              </p>
              <div className="mt-6">
                <StatGrid
                  items={[
                    ['Count (n)', String(n)],
                    ['Mean (x̄)', fmt(r.mean)],
                    [`Variance (${sample ? 's²' : 'σ²'})`, fmt(variance)],
                    ['Sum of squares', fmt(r.ss)],
                    [sample ? 'Population SD (σ)' : 'Sample SD (s)', fmt(sample ? r.populationSD : r.sampleSD)],
                    ['Standard error of mean', fmt(r.standardError)],
                    ['Coefficient of variation', Number.isFinite(r.cv) ? `${fmt(sample ? r.cv : (r.populationSD / Math.abs(r.mean)) * 100, 2)}%` : '—'],
                    ['68% of data within', `${fmt(r.mean - sd, 3)} to ${fmt(r.mean + sd, 3)}`],
                  ]}
                />
              </div>
              <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface">
                <table className="tabular w-full text-sm">
                  <thead className="bg-surface-2 text-left text-xs text-muted">
                    <tr>
                      <th className="px-4 py-2 font-medium">x</th>
                      <th className="px-4 py-2 text-right font-medium">x − x̄</th>
                      <th className="px-4 py-2 text-right font-medium">(x − x̄)²</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {shown.map((x, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2">{fmt(x)}</td>
                        <td className="px-4 py-2 text-right">{fmt(x - r.mean, 4)}</td>
                        <td className="px-4 py-2 text-right">{fmt((x - r.mean) ** 2, 4)}</td>
                      </tr>
                    ))}
                    <tr className="bg-surface-2 font-semibold">
                      <td className="px-4 py-2" colSpan={2}>
                        Σ (x − x̄)²
                      </td>
                      <td className="px-4 py-2 text-right">{fmt(r.ss, 4)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {n > shown.length && <p className="mt-2 text-xs text-muted">Showing the first {shown.length} of {n} values; totals use them all.</p>}
              <p className="mt-3 text-xs text-muted">The “68%” range assumes roughly normally distributed data.</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
