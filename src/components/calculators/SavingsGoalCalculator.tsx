import { useMemo } from 'react';
import { compoundInterest } from '@/lib/calculators/growth';
import { monthlyForGoal, monthsToGoal } from '@/lib/calculators/savings';
import { addMonths } from '@/lib/calculators/dates';
import { CURRENCY_CODES, localeFor, currencySymbol, formatDuration, formatMoney } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { useToday } from '@/lib/hooks/useToday';
import { NumberField, Tabs } from '@/components/ui/fields';
import { CurrencyPicker } from '@/components/ui/CurrencyPicker';
import { GrowthPanel, Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { goal: 20_000, have: 2_000, rate: 4, mode: 'time', monthly: 400, months: 36, cur: 'USD' };

export default function SavingsGoalCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const today = useToday();
  const mode = s.mode === 'amount' ? 'amount' : 'time';

  const months = mode === 'time' ? monthsToGoal(s.goal, s.have, s.monthly, s.rate) : Math.max(1, Math.round(s.months));
  const monthly = mode === 'time' ? s.monthly : monthlyForGoal(s.goal, s.have, months, s.rate);
  const reachable = Number.isFinite(months);

  const growth = useMemo(
    () => (reachable ? compoundInterest({ principal: s.have, annualRate: s.rate, years: months / 12, compounding: 'monthly', contribution: monthly, contributionFrequency: 'monthly' }) : null),
    [reachable, s.have, s.rate, months, monthly],
  );

  const cur = s.cur;
  const sym = currencySymbol(cur);
  const loc = localeFor(cur);
  const money = (v: number) => formatMoney(v, cur);
  const date = today && reachable ? addMonths(today, months) : null;
  const dateText = date ? new Date(`${date}T00:00:00Z`).toLocaleDateString('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : null;

  return (
    <section aria-label="Savings goal calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <NumberField label="Savings goal" value={s.goal} onChange={(v) => set('goal', v)} prefix={sym} locale={loc} min={0} decimals={0} />
          <NumberField label="Already saved" value={s.have} onChange={(v) => set('have', v)} prefix={sym} locale={loc} min={0} decimals={0} />
          <NumberField label="Interest rate" value={s.rate} onChange={(v) => set('rate', v)} suffix="% per year" min={0} max={30} decimals={2} />
          <div>
            <p className="mb-1.5 text-sm font-medium">I want to know</p>
            <Tabs
              value={mode}
              onChange={(v) => set('mode', v)}
              tabs={[
                { value: 'time', label: 'How long it takes' },
                { value: 'amount', label: 'How much to save' },
              ]}
            />
          </div>
          {mode === 'time' ? (
            <NumberField label="Saving each month" value={s.monthly} onChange={(v) => set('monthly', v)} prefix={sym} locale={loc} min={0} decimals={0} />
          ) : (
            <NumberField label="Reach it in" value={s.months} onChange={(v) => set('months', v)} suffix="months" min={1} max={600} decimals={0} slider={{ min: 3, max: 120, step: 1 }} />
          )}
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
          {!reachable ? (
            <div>
              <p className="text-sm font-medium text-muted">Time to reach your goal</p>
              <p className="mt-1 text-3xl font-bold text-warn">Not reachable</p>
              <p className="mt-2 text-sm">Add a monthly saving (or a higher rate) to reach {money(s.goal)}.</p>
            </div>
          ) : (
            <>
              <Headline
                label={mode === 'time' ? 'Time to reach your goal' : 'Save each month'}
                value={mode === 'time' ? (months === 0 ? 'Done!' : formatDuration(months)) : formatMoney(monthly, cur, 2)}
                action={<ShareButton />}
                compact
              />
              {dateText && months > 0 && <p className="mt-1 text-sm text-muted">Around {dateText}</p>}
              <div className="mt-6">
                <StatGrid
                  items={[
                    ['You pay in', money(s.have + monthly * months)],
                    ['Interest earned', money(growth ? growth.totalInterest : 0)],
                    ['Monthly saving', money(monthly)],
                    ['Months', String(months)],
                  ]}
                />
              </div>
            </>
          )}
        </div>
      </div>
      {growth && months >= 12 && (
        <GrowthPanel yearly={growth.yearly} currency={cur} depositLabel="Your deposits" interestLabel="Interest" note={`Interest at ${s.rate}% a year, compounded monthly. Deposits at the end of each month.`} />
      )}
    </section>
  );
}
