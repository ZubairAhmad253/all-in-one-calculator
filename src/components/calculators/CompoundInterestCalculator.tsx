import { useMemo } from 'react';
import { COMPOUNDING, compoundInterest, effectiveAnnualRate, type Compounding } from '@/lib/calculators/growth';
import { CURRENCIES, localeFor, currencySymbol, formatMoney, formatMoneyCompact, formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, SelectField } from '@/components/ui/fields';
import { BreakdownDonut, GrowthPanel, Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = {
  principal: 10_000,
  rate: 5,
  years: 10,
  comp: 'monthly',
  contrib: 100,
  freq: 'monthly',
  cur: 'USD',
};

const COMPOUNDING_OPTIONS: { value: Compounding; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'half-yearly', label: 'Half-yearly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function CompoundInterestCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const comp = (s.comp in COMPOUNDING ? s.comp : 'monthly') as Compounding;
  const freq = s.freq === 'yearly' ? 'yearly' : 'monthly';

  const r = useMemo(
    () => compoundInterest({ principal: s.principal, annualRate: s.rate, years: s.years, compounding: comp, contribution: s.contrib, contributionFrequency: freq }),
    [s.principal, s.rate, s.years, comp, s.contrib, freq],
  );

  const cur = s.cur;
  const sym = currencySymbol(cur);
  const loc = localeFor(cur);
  const money = (v: number) => formatMoney(v, cur);
  const apy = effectiveAnnualRate(s.rate, COMPOUNDING[comp]);

  return (
    <section aria-label="Compound interest calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <NumberField label="Initial deposit" value={s.principal} onChange={(v) => set('principal', v)} prefix={sym} locale={loc} min={0} decimals={0} slider={{ min: 0, max: 100_000, step: 500 }} />

          <div className="grid grid-cols-2 items-start gap-3">
            <NumberField label="Interest rate" value={s.rate} onChange={(v) => set('rate', v)} suffix="% / yr" min={0} max={100} decimals={3} slider={{ min: 0, max: 20, step: 0.25 }} />
            <NumberField label="Years" value={s.years} onChange={(v) => set('years', v)} suffix="yrs" min={0} max={100} decimals={1} slider={{ min: 1, max: 50, step: 1 }} />
          </div>

          <SelectField label="Compounding" value={comp} onChange={(v) => set('comp', v)} options={COMPOUNDING_OPTIONS} />

          <div className="grid grid-cols-[minmax(0,1fr)_9rem] items-start gap-3">
            <NumberField label="Regular deposit" value={s.contrib} onChange={(v) => set('contrib', v)} prefix={sym} locale={loc} min={0} decimals={0} hint="Added at the end of each period. Enter 0 for none." />
            <SelectField
              label="Every"
              value={freq}
              onChange={(v) => set('freq', v)}
              options={[
                { value: 'monthly', label: 'Month' },
                { value: 'yearly', label: 'Year' },
              ]}
            />
          </div>

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
          <Headline label={`Balance after ${formatNumber(s.years, 1)} years`} value={formatMoney(r.finalBalance, cur, 2)} action={<ShareButton />} />

          <div className="mt-6">
            <BreakdownDonut
              segments={[
                { label: 'Initial deposit', value: Math.max(s.principal, 0), color: 'var(--chart-1)' },
                { label: 'Regular deposits', value: r.totalDeposits - Math.max(s.principal, 0), color: 'var(--chart-4)' },
                { label: 'Interest earned', value: r.totalInterest, color: 'var(--chart-2)' },
              ]}
              currency={cur}
              center={{ label: 'Balance', value: formatMoneyCompact(r.finalBalance, cur) }}
            />
          </div>

          <div className="mt-7">
            <StatGrid
              items={[
                ['Total deposits', money(r.totalDeposits)],
                ['Interest earned', money(r.totalInterest)],
                ['Effective annual rate (APY)', `${formatNumber(apy, 3)}%`],
                ['Interest share of balance', `${formatNumber(r.finalBalance > 0 ? (r.totalInterest / r.finalBalance) * 100 : 0, 1)}%`],
              ]}
            />
          </div>
        </div>
      </div>

      {r.yearly.length > 0 && (
        <GrowthPanel
          yearly={r.yearly}
          currency={cur}
          depositLabel="Total deposits"
          interestLabel="Total interest"
          note={`${formatNumber(s.rate, 3)}% a year compounded ${comp === 'half-yearly' ? 'half-yearly' : comp}. Deposits are added at the end of each ${freq === 'monthly' ? 'month' : 'year'}. Taxes and fees are not included.`}
        />
      )}
    </section>
  );
}
