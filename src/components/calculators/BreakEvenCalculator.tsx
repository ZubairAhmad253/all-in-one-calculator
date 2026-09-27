import { breakEven } from '@/lib/calculators/business';
import { CURRENCIES, localeFor, currencySymbol, formatMoney, formatMoneyCompact, formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, SelectField } from '@/components/ui/fields';
import { LineChart } from '@/components/charts/LineChart';
import { Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { fixed: 10_000, price: 50, variable: 30, target: 0, cur: 'USD' };

export default function BreakEvenCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const r = breakEven(s.fixed, s.price, s.variable, s.target);
  const be = breakEven(s.fixed, s.price, s.variable);

  const cur = s.cur;
  const sym = currencySymbol(cur);
  const loc = localeFor(cur);
  const money = (v: number) => formatMoney(v, cur, 2);

  // Chart from 0 to twice the target volume, in 10 steps.
  const top = r.possible ? Math.max(r.units * 2, 10) : 0;
  const steps = Array.from({ length: 11 }, (_, i) => Math.round((top * i) / 10));

  return (
    <section aria-label="Break-even calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <NumberField label="Fixed costs" value={s.fixed} onChange={(v) => set('fixed', v)} prefix={sym} locale={loc} min={0} decimals={0} hint="Costs that don’t change with sales: rent, salaries, insurance (for the period)." />
          <div className="grid grid-cols-2 items-start gap-3">
            <NumberField label="Price per unit" value={s.price} onChange={(v) => set('price', v)} prefix={sym} locale={loc} min={0} decimals={2} />
            <NumberField label="Variable cost per unit" value={s.variable} onChange={(v) => set('variable', v)} prefix={sym} locale={loc} min={0} decimals={2} />
          </div>
          <NumberField label="Target profit (optional)" value={s.target} onChange={(v) => set('target', v)} prefix={sym} locale={loc} min={0} decimals={0} />
          <div className="flex flex-wrap items-end gap-3 border-t border-line pt-5">
            <div className="min-w-40 flex-1">
              <SelectField label="Currency" value={cur} onChange={(v) => set('cur', v)} options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} – ${c.label}` }))} />
            </div>
            <button type="button" onClick={reset} className="h-12 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
              Reset
            </button>
          </div>
        </div>

        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!r.possible ? (
            <div>
              <p className="text-sm font-medium text-muted">Break-even point</p>
              <p className="mt-1 text-3xl font-bold text-warn">Not possible</p>
              <p className="mt-2 text-sm">Each unit sells for {money(s.price)} but costs {money(s.variable)} to make, so every sale loses money. Raise the price or cut the variable cost.</p>
            </div>
          ) : (
            <>
              <Headline label={s.target > 0 ? `Units to make ${money(s.target)} profit` : 'Break-even units'} value={formatNumber(r.units, 0)} action={<ShareButton />} />
              <p className="mt-1 text-sm text-muted">That’s {money(r.revenue)} of sales.</p>
              <div className="mt-6">
                <StatGrid
                  items={[
                    ['Contribution per unit', money(r.contribution)],
                    ['Contribution margin', `${formatNumber(r.contributionRatio, 2)}%`],
                    ['Break-even units', formatNumber(be.units, 0)],
                    ['Break-even sales', money(be.revenue)],
                  ]}
                />
              </div>
            </>
          )}
        </div>
      </div>
      {r.possible && (
        <div className="border-t border-line p-5 sm:p-7">
          <h2 className="text-lg font-semibold">Revenue vs total cost</h2>
          <div className="mt-5">
            <LineChart
              labels={steps}
              xTitle="Units"
              formatY={(v) => formatMoneyCompact(v, cur)}
              formatTooltip={(v) => formatMoney(v, cur)}
              series={[
                { label: 'Revenue', color: 'var(--chart-2)', values: steps.map((u) => u * s.price) },
                { label: 'Total cost', color: 'var(--chart-3)', values: steps.map((u) => s.fixed + u * s.variable) },
              ]}
            />
          </div>
          <p className="mt-3 text-xs text-muted">Where the lines cross is the break-even point. Above it, each unit adds {money(r.contribution)} of profit.</p>
        </div>
      )}
    </section>
  );
}
