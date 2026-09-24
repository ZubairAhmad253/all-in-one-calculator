import { useMemo } from 'react';
import { calculateLoan } from '@/lib/calculators/loan';
import { CURRENCIES, localeFor, currencySymbol, formatDuration, formatMoney, formatMoneyCompact, formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, SelectField, TermField, type TermUnit } from '@/components/ui/fields';
import { AmortizationPanel, BreakdownDonut, Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = {
  amount: 25_000,
  rate: 7,
  term: 5,
  unit: 'y',
  extra: 0,
  cur: 'USD',
};

export default function LoanCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const unit = s.unit as TermUnit;
  const months = unit === 'y' ? s.term * 12 : s.term;
  const r = useMemo(() => calculateLoan(s.amount, s.rate, months, s.extra), [s.amount, s.rate, months, s.extra]);

  const cur = s.cur;
  const sym = currencySymbol(cur);
  const money = (v: number) => formatMoney(v, cur);

  return (
    <section aria-label="Loan calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <NumberField label="Loan amount" value={s.amount} onChange={(v) => set('amount', v)} prefix={sym} locale={localeFor(cur)} min={0} decimals={0} slider={{ min: 1_000, max: 200_000, step: 500 }} />
          <NumberField label="Interest rate (APR)" value={s.rate} onChange={(v) => set('rate', v)} suffix="% per year" min={0} max={60} decimals={3} slider={{ min: 0, max: 36, step: 0.25 }} />
          <TermField
            value={s.term}
            unit={unit}
            onChange={(v) => set('term', v)}
            onUnitChange={(u, v) => {
              set('unit', u);
              set('term', v);
            }}
            maxYears={30}
          />
          <NumberField
            label="Extra payment (optional)"
            value={s.extra}
            onChange={(v) => set('extra', v)}
            prefix={sym} locale={localeFor(cur)}
            suffix="/mo"
            min={0}
            decimals={0}
            hint="Paid on top of the regular payment, straight off the principal."
          />

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
          <Headline label="Monthly payment" value={formatMoney(r.payment, cur, 2)} action={<ShareButton />} />

          <div className="mt-6">
            <BreakdownDonut
              segments={[
                { label: 'Principal', value: s.amount, color: 'var(--chart-1)' },
                { label: 'Total interest', value: r.totalInterest, color: 'var(--chart-3)' },
              ]}
              currency={cur}
              center={{ label: 'Total paid', value: formatMoneyCompact(r.totalPaid, cur) }}
            />
          </div>

          <div className="mt-7">
            <StatGrid
              items={[
                ['Total interest', money(r.totalInterest)],
                ['Total of payments', money(r.totalPaid)],
                ['Number of payments', formatNumber(r.months, 0)],
                ['Paid off in', formatDuration(r.months)],
              ]}
            />
          </div>

          {s.extra > 0 && r.interestSaved > 0 && (
            <p className="mt-4 rounded-xl bg-accent/10 px-4 py-3 text-sm">
              Paying <strong>{money(s.extra)}</strong> extra each month saves <strong>{money(r.interestSaved)}</strong> in interest and clears the loan{' '}
              <strong>{formatDuration(r.monthsSaved)}</strong> sooner.
            </p>
          )}
        </div>
      </div>

      {s.amount > 0 && (
        <AmortizationPanel
          principal={s.amount}
          yearly={r.yearly}
          monthly={r.monthly}
          currency={cur}
          note={`Based on a fixed rate of ${formatNumber(s.rate, 3)}% with ${formatNumber(months, 0)} monthly payments. Fees and variable rates are not included.`}
        />
      )}
    </section>
  );
}
