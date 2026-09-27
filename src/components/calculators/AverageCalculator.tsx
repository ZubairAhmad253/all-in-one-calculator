import { summarize, weightedMean } from '@/lib/calculators/stats';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { Tabs } from '@/components/ui/fields';
import { NumberListField, parseList } from './shared/numberlist';
import { Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { mode: 'simple', n: '12, 15, 11, 15, 20, 17, 15, 9', w: '3, 2, 1, 4', wv: '85, 90, 78, 92' };

const fmt = (v: number) => (Number.isFinite(v) ? v.toLocaleString('en', { maximumFractionDigits: 6 }) : '—');

export default function AverageCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const mode = s.mode === 'weighted' ? 'weighted' : 'simple';

  const nums = parseList(mode === 'simple' ? s.n : s.wv);
  const sum = summarize(nums);
  const weights = parseList(s.w);
  const wm = weightedMean(nums, weights);
  const sumW = nums.reduce((a, _, i) => a + (weights[i] ?? 0), 0);

  return (
    <section aria-label="Average calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <Tabs
            value={mode}
            onChange={(v) => set('mode', v)}
            tabs={[
              { value: 'simple', label: 'Mean, median, mode' },
              { value: 'weighted', label: 'Weighted average' },
            ]}
          />
          {mode === 'simple' ? (
            <NumberListField label="Numbers" value={s.n} onChange={(v) => set('n', v)} rows={4} hint="Separate with commas, spaces or new lines. You can paste a column from a spreadsheet." />
          ) : (
            <>
              <NumberListField label="Values" value={s.wv} onChange={(v) => set('wv', v)} hint="e.g. test scores or prices" />
              <NumberListField label="Weights" value={s.w} onChange={(v) => set('w', v)} hint="One weight per value, in the same order, e.g. credits, quantities or percentages." />
            </>
          )}
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!sum ? (
            <p className="text-sm text-muted">Enter at least one number.</p>
          ) : mode === 'simple' ? (
            <>
              <Headline label={`Average (mean) of ${sum.count} number${sum.count === 1 ? '' : 's'}`} value={fmt(sum.mean)} action={<ShareButton />} compact />
              <p className="tabular mt-2 text-sm text-muted">
                {fmt(sum.sum)} ÷ {sum.count} = {fmt(sum.mean)}
              </p>
              <div className="mt-6">
                <StatGrid
                  items={[
                    ['Median', fmt(sum.median)],
                    ['Mode', sum.modes.length ? sum.modes.map(fmt).join(', ') : 'No mode'],
                    ['Sum', fmt(sum.sum)],
                    ['Count', String(sum.count)],
                    ['Smallest', fmt(sum.min)],
                    ['Largest', fmt(sum.max)],
                    ['Range', fmt(sum.range)],
                    ['Geometric mean', Number.isFinite(sum.geometricMean) ? fmt(sum.geometricMean) : 'Needs all > 0'],
                    ['Harmonic mean', Number.isFinite(sum.harmonicMean) ? fmt(sum.harmonicMean) : 'Needs all > 0'],
                  ]}
                />
              </div>
              <p className="tabular mt-5 text-xs text-muted break-words">Sorted: {[...nums].sort((a, b) => a - b).map(fmt).join(', ')}</p>
            </>
          ) : (
            <>
              <Headline label="Weighted average" value={fmt(wm)} action={<ShareButton />} compact />
              {weights.length < nums.length && <p className="mt-2 text-sm text-warn">{nums.length - weights.length} value{nums.length - weights.length === 1 ? ' has' : 's have'} no weight and count as 0.</p>}
              <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface">
                <table className="tabular w-full text-sm">
                  <thead className="bg-surface-2 text-left text-xs text-muted">
                    <tr>
                      <th className="px-4 py-2 font-medium">Value</th>
                      <th className="px-4 py-2 text-right font-medium">Weight</th>
                      <th className="px-4 py-2 text-right font-medium">Value × weight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {nums.map((x, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2">{fmt(x)}</td>
                        <td className="px-4 py-2 text-right">{fmt(weights[i] ?? 0)}</td>
                        <td className="px-4 py-2 text-right">{fmt(x * (weights[i] ?? 0))}</td>
                      </tr>
                    ))}
                    <tr className="bg-surface-2 font-semibold">
                      <td className="px-4 py-2">Total</td>
                      <td className="px-4 py-2 text-right">{fmt(sumW)}</td>
                      <td className="px-4 py-2 text-right">{fmt(nums.reduce((a, x, i) => a + x * (weights[i] ?? 0), 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-muted">Weighted average = Σ(value × weight) ÷ Σ weights. The simple average of these values is {fmt(sum.mean)}.</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
