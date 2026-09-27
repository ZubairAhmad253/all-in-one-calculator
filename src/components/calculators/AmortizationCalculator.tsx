import { useId, useMemo } from 'react';
import { calculateLoan } from '@/lib/calculators/loan';
import { addMonths } from '@/lib/calculators/dates';
import { CURRENCIES, localeFor, currencySymbol, formatDuration, formatMoney, formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { useToday } from '@/lib/hooks/useToday';
import { NumberField, SelectField, TermField, type TermUnit } from '@/components/ui/fields';
import { AmortizationPanel, Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { amount: 250_000, rate: 6, term: 30, unit: 'y', start: '', extra: 0, lump: 0, lumpAt: 12, cur: 'USD' };

const monthName = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en', { month: 'long', year: 'numeric', timeZone: 'UTC' });

export default function AmortizationCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const today = useToday();
  const startId = useId();
  const unit = s.unit as TermUnit;
  const months = unit === 'y' ? Math.round(s.term * 12) : Math.round(s.term);
  // First payment: the month picked, or next month once today's date is known.
  const startMonth = /^\d{4}-\d{2}$/.test(s.start) ? s.start : today ? addMonths(`${today.slice(0, 7)}-01`, 1).slice(0, 7) : null;
  const start = startMonth ? `${startMonth}-01` : undefined;

  const r = useMemo(
    () => calculateLoan(s.amount, s.rate, months, s.extra, s.lump > 0 ? { month: Math.max(1, Math.round(s.lumpAt)), amount: s.lump } : undefined),
    [s.amount, s.rate, months, s.extra, s.lump, s.lumpAt],
  );

  const cur = s.cur;
  const sym = currencySymbol(cur);
  const loc = localeFor(cur);
  const money = (v: number) => formatMoney(v, cur);
  const payoff = start ? addMonths(start, r.months - 1) : null;
  const hasExtra = s.extra > 0 || s.lump > 0;

  return (
    <section aria-label="Amortization calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <NumberField label="Loan amount" value={s.amount} onChange={(v) => set('amount', v)} prefix={sym} locale={loc} min={0} decimals={0} />
          <div className="grid grid-cols-2 items-start gap-3">
            <NumberField label="Interest rate" value={s.rate} onChange={(v) => set('rate', v)} suffix="%" min={0} max={60} decimals={3} />
            <TermField
              value={s.term}
              unit={unit}
              onChange={(v) => set('term', v)}
              onUnitChange={(u, v) => {
                set('unit', u);
                set('term', v);
              }}
            />
          </div>
          <div>
            <label htmlFor={startId} className="mb-1.5 block text-sm font-medium">
              First payment
            </label>
            <input
              id={startId}
              type="month"
              value={startMonth ?? ''}
              onChange={(e) => e.target.value && set('start', e.target.value)}
              className="tabular h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-base font-medium outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
            />
          </div>

          <div className="space-y-4 border-t border-line pt-5">
            <p className="text-sm font-semibold">Extra payments (optional)</p>
            <NumberField label="Extra every month" value={s.extra} onChange={(v) => set('extra', v)} prefix={sym} locale={loc} min={0} decimals={0} />
            <div className="grid grid-cols-2 items-start gap-3">
              <NumberField label="One-off payment" value={s.lump} onChange={(v) => set('lump', v)} prefix={sym} locale={loc} min={0} decimals={0} />
              <NumberField
                label="With payment no."
                value={s.lumpAt}
                onChange={(v) => set('lumpAt', v)}
                min={1}
                max={months}
                decimals={0}
                hint={start && s.lump > 0 ? monthName(addMonths(start, Math.max(1, Math.round(s.lumpAt)) - 1)) : undefined}
              />
            </div>
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
          <Headline label="Monthly payment" value={formatMoney(r.payment, cur, 2)} action={<ShareButton />} />
          <div className="mt-6">
            <StatGrid
              items={[
                ['Total interest', money(r.totalInterest)],
                ['Total of payments', money(r.totalPaid)],
                ['Number of payments', formatNumber(r.months, 0)],
                ['Final payment', payoff ? monthName(payoff) : formatDuration(r.months)],
              ]}
            />
          </div>
          {hasExtra && r.interestSaved > 0 && (
            <p className="mt-4 rounded-xl bg-accent/10 px-4 py-3 text-sm">
              Your extra payments save <strong>{money(r.interestSaved)}</strong> in interest and finish the loan <strong>{formatDuration(r.monthsSaved)}</strong> early.
            </p>
          )}
          <p className="mt-4 text-sm text-muted">
            In the first payment, {money(r.monthly[0]?.interest ?? 0)} is interest and {money(r.monthly[0]?.principal ?? 0)} repays the loan.
          </p>
        </div>
      </div>

      {s.amount > 0 && (
        <AmortizationPanel
          principal={s.amount}
          yearly={r.yearly}
          monthly={r.monthly}
          currency={cur}
          start={start}
          csvName="amortization-schedule.csv"
          defaultView="monthly"
          note={`Fixed rate of ${formatNumber(s.rate, 3)}% over ${formatNumber(months, 0)} monthly payments. Year 1 is the first 12 payments.`}
        />
      )}
    </section>
  );
}
