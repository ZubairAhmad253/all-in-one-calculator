import { useMemo } from 'react';
import { compoundInterest } from '@/lib/calculators/growth';
import { realReturn, todaysValue } from '@/lib/calculators/savings';
import { CURRENCIES, localeFor, currencySymbol, formatMoney, formatMoneyCompact, formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, SelectField } from '@/components/ui/fields';
import { BreakdownDonut, GrowthPanel, Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { start: 10_000, monthly: 300, ret: 7, years: 20, inf: 2.5, cur: 'USD' };

export default function InvestmentCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const r = useMemo(
    () => compoundInterest({ principal: s.start, annualRate: s.ret, years: s.years, compounding: 'monthly', contribution: s.monthly, contributionFrequency: 'monthly' }),
    [s.start, s.ret, s.years, s.monthly],
  );
  const cur = s.cur;
  const sym = currencySymbol(cur);
  const loc = localeFor(cur);
  const money = (v: number) => formatMoney(v, cur);
  const real = todaysValue(r.finalBalance, s.inf, s.years);
  const gain = r.totalDeposits > 0 ? (r.totalInterest / r.totalDeposits) * 100 : 0;

  return (
    <section aria-label="Investment calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <NumberField label="Starting amount" value={s.start} onChange={(v) => set('start', v)} prefix={sym} locale={loc} min={0} decimals={0} />
          <NumberField label="Monthly contribution" value={s.monthly} onChange={(v) => set('monthly', v)} prefix={sym} locale={loc} min={0} decimals={0} />
          <div className="grid grid-cols-2 items-start gap-3">
            <NumberField label="Expected return" value={s.ret} onChange={(v) => set('ret', v)} suffix="% / yr" min={-20} max={40} decimals={2} slider={{ min: 0, max: 15, step: 0.5 }} />
            <NumberField label="Years" value={s.years} onChange={(v) => set('years', v)} suffix="yrs" min={1} max={70} decimals={0} slider={{ min: 1, max: 50, step: 1 }} />
          </div>
          <NumberField label="Inflation" value={s.inf} onChange={(v) => set('inf', v)} suffix="% / yr" min={0} max={30} decimals={2} hint="Used to show the result in today’s money." />
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
          <Headline label={`Value after ${s.years} years`} value={money(r.finalBalance)} action={<ShareButton />} />
          <p className="mt-1 text-sm text-muted">
            About <strong className="text-fg">{money(real)}</strong> in today’s money, after {formatNumber(s.inf, 2)}% inflation.
          </p>
          <div className="mt-6">
            <BreakdownDonut
              segments={[
                { label: 'Starting amount', value: Math.max(s.start, 0), color: 'var(--chart-1)' },
                { label: 'Contributions', value: r.totalDeposits - Math.max(s.start, 0), color: 'var(--chart-4)' },
                { label: 'Investment growth', value: Math.max(r.totalInterest, 0), color: 'var(--chart-2)' },
              ]}
              currency={cur}
              center={{ label: 'Final value', value: formatMoneyCompact(r.finalBalance, cur) }}
            />
          </div>
          <div className="mt-7">
            <StatGrid
              items={[
                ['Total invested', money(r.totalDeposits)],
                ['Investment growth', money(r.totalInterest)],
                ['Growth vs money put in', `${formatNumber(gain, 1)}%`],
                ['Real return (after inflation)', `${formatNumber(realReturn(s.ret, s.inf), 2)}% / yr`],
              ]}
            />
          </div>
          <p className="mt-4 text-xs text-muted">Assumes a steady return every year. Real investment returns vary and aren’t guaranteed; fees and taxes reduce them.</p>
        </div>
      </div>
      <GrowthPanel yearly={r.yearly} currency={cur} depositLabel="Money put in" interestLabel="Growth" note={`${formatNumber(s.ret, 2)}% a year, compounded monthly, with contributions at the end of each month.`} />
    </section>
  );
}
