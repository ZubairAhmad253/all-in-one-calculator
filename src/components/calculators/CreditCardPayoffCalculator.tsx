import { useMemo } from 'react';
import { payoffWithMinimum, payoffWithPayment, paymentToClearIn } from '@/lib/calculators/debt';
import { CURRENCY_CODES, localeFor, currencySymbol, formatDuration, formatMoney } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, Tabs } from '@/components/ui/fields';
import { CurrencyPicker } from '@/components/ui/CurrencyPicker';
import { Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { bal: 5_000, apr: 22, mode: 'pay', pay: 200, months: 24, cur: 'USD' };

export default function CreditCardPayoffCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const mode = s.mode === 'date' ? 'date' : 'pay';
  const cur = s.cur;
  const sym = currencySymbol(cur);
  const loc = localeFor(cur);
  const money = (v: number) => formatMoney(v, cur);

  const payment = mode === 'pay' ? s.pay : paymentToClearIn(s.bal, s.apr, Math.max(1, Math.round(s.months)));
  const plan = useMemo(() => payoffWithPayment(s.bal, s.apr, payment), [s.bal, s.apr, payment]);
  const minimum = useMemo(() => payoffWithMinimum(s.bal, s.apr), [s.bal, s.apr]);
  const firstInterest = (s.bal * s.apr) / 100 / 12;

  return (
    <section aria-label="Credit card payoff calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <NumberField label="Card balance" value={s.bal} onChange={(v) => set('bal', v)} prefix={sym} locale={loc} min={0} decimals={2} />
          <NumberField label="Interest rate (APR)" value={s.apr} onChange={(v) => set('apr', v)} suffix="%" min={0} max={80} decimals={2} />
          <div>
            <p className="mb-1.5 text-sm font-medium">I want to</p>
            <Tabs
              value={mode}
              onChange={(v) => set('mode', v)}
              tabs={[
                { value: 'pay', label: 'Pay a set amount' },
                { value: 'date', label: 'Be debt-free by…' },
              ]}
            />
          </div>
          {mode === 'pay' ? (
            <NumberField label="Monthly payment" value={s.pay} onChange={(v) => set('pay', v)} prefix={sym} locale={loc} min={0} decimals={2} hint={`This month’s interest alone is about ${money(firstInterest)}.`} />
          ) : (
            <NumberField label="Pay it off in" value={s.months} onChange={(v) => set('months', v)} suffix="months" min={1} max={360} decimals={0} slider={{ min: 3, max: 60, step: 1 }} />
          )}
          <p className="text-xs text-muted">Assumes no new spending on the card and a steady APR.</p>

          <div className="flex flex-wrap items-end gap-3 border-t border-line pt-5">
            <div className="min-w-40 flex-1">
              <CurrencyPicker label="Currency" value={cur} onChange={(v) => set('cur', v)} codes={CURRENCY_CODES} />
            </div>
            <button type="button" onClick={reset} className="h-12 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
              Reset
            </button>
          </div>
        </div>

        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!plan.paysOff ? (
            <div>
              <p className="text-sm font-medium text-muted">Time to pay off</p>
              <p className="mt-1 text-3xl font-bold text-warn">Never</p>
              <p className="mt-2 text-sm">
                {money(payment)} a month doesn’t cover the interest (about {money(firstInterest)} this month), so the balance never goes down. Pay more than the interest to make
                progress.
              </p>
            </div>
          ) : (
            <>
              <Headline
                label={mode === 'pay' ? 'Debt-free in' : 'Pay each month'}
                value={mode === 'pay' ? formatDuration(plan.months) : formatMoney(payment, cur, 2)}
                action={<ShareButton />}
                compact
              />
              <div className="mt-6">
                <StatGrid
                  items={[
                    ['Total interest', money(plan.totalInterest)],
                    ['Total paid', money(plan.totalPaid)],
                    ['Number of payments', String(plan.months)],
                    [mode === 'pay' ? 'Monthly payment' : 'Debt-free in', mode === 'pay' ? money(payment) : formatDuration(plan.months)],
                  ]}
                />
              </div>
            </>
          )}

          {minimum.paysOff && s.bal > 0 && (
            <div className="mt-6 rounded-xl border border-line bg-surface p-4">
              <p className="text-sm font-semibold">If you only paid the minimum</p>
              <p className="mt-1 text-xs text-muted">Using a typical minimum of 1% of the balance plus interest, at least {money(25)}.</p>
              <p className="tabular mt-3 text-sm">
                <strong>{formatDuration(minimum.months)}</strong> to pay off and <strong>{money(minimum.totalInterest)}</strong> in interest.
              </p>
              {plan.paysOff && minimum.totalInterest > plan.totalInterest && (
                <p className="mt-2 text-sm font-medium text-accent">
                  Your plan saves {money(minimum.totalInterest - plan.totalInterest)} and {formatDuration(minimum.months - plan.months)}.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
