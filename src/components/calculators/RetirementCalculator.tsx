import { useMemo } from 'react';
import { retirement } from '@/lib/calculators/savings';
import { CURRENCIES, localeFor, currencySymbol, formatMoney, formatMoneyCompact, formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, SelectField } from '@/components/ui/fields';
import { LineChart } from '@/components/charts/LineChart';
import { Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { age: 35, ret: 65, plan: 90, saved: 50_000, save: 600, rb: 7, ra: 5, inc: 3_000, inf: 2.5, cur: 'USD' };

export default function RetirementCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const valid = s.age < s.ret && s.ret < s.plan;
  const r = useMemo(
    () =>
      valid
        ? retirement({ age: s.age, retireAge: s.ret, planToAge: s.plan, savings: s.saved, monthlySaving: s.save, returnBefore: s.rb, returnAfter: s.ra, income: s.inc, inflation: s.inf })
        : null,
    [valid, s.age, s.ret, s.plan, s.saved, s.save, s.rb, s.ra, s.inc, s.inf],
  );

  const cur = s.cur;
  const sym = currencySymbol(cur);
  const loc = localeFor(cur);
  const money = (v: number) => formatMoney(v, cur);
  const onTrack = r ? !Number.isFinite(r.runsOutAt) : false;

  return (
    <section aria-label="Retirement calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <div className="grid grid-cols-3 items-start gap-3">
            <NumberField label="Your age" value={s.age} onChange={(v) => set('age', v)} min={16} max={90} decimals={0} />
            <NumberField label="Retire at" value={s.ret} onChange={(v) => set('ret', v)} min={30} max={90} decimals={0} />
            <NumberField label="Plan to age" value={s.plan} onChange={(v) => set('plan', v)} min={50} max={110} decimals={0} />
          </div>
          <div className="grid grid-cols-2 items-start gap-3">
            <NumberField label="Saved so far" value={s.saved} onChange={(v) => set('saved', v)} prefix={sym} locale={loc} min={0} decimals={0} />
            <NumberField label="Saving each month" value={s.save} onChange={(v) => set('save', v)} prefix={sym} locale={loc} min={0} decimals={0} />
          </div>
          <NumberField
            label="Monthly income wanted in retirement"
            value={s.inc}
            onChange={(v) => set('inc', v)}
            prefix={sym}
            locale={loc}
            min={0}
            decimals={0}
            hint="In today’s money, on top of any pension or social security you expect."
          />
          <div className="grid grid-cols-3 items-start gap-3">
            <NumberField label="Return before" value={s.rb} onChange={(v) => set('rb', v)} suffix="%" min={0} max={20} decimals={1} />
            <NumberField label="Return after" value={s.ra} onChange={(v) => set('ra', v)} suffix="%" min={0} max={20} decimals={1} />
            <NumberField label="Inflation" value={s.inf} onChange={(v) => set('inf', v)} suffix="%" min={0} max={15} decimals={1} />
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
          {!r ? (
            <p className="font-medium text-warn">Check the ages: your age must be below your retirement age, and that below the age you’re planning to.</p>
          ) : (
            <>
              <Headline label={`Savings at ${s.ret}`} value={money(r.atRetirement)} action={<ShareButton />} />
              <p className="mt-1 text-sm text-muted">About {money(r.atRetirementToday)} in today’s money.</p>
              <div className={`mt-5 rounded-xl px-4 py-3 text-sm ${onTrack ? 'bg-accent/10' : 'bg-warn/10'}`}>
                {onTrack ? (
                  <p>
                    <strong>On track.</strong> Taking {money(r.firstWithdrawal)} a month (your {money(s.inc)} after inflation), rising each year, your savings last beyond age {s.plan}.
                  </p>
                ) : (
                  <p className="text-warn">
                    <strong>Your savings run out at about age {formatNumber(r.runsOutAt, 0)}.</strong> To last until {s.plan}, save about {money(r.savingNeeded)} a month instead of{' '}
                    {money(s.save)}.
                  </p>
                )}
              </div>
              <div className="mt-5">
                <StatGrid
                  items={[
                    ['Needed at retirement', money(r.needed)],
                    ['Monthly saving needed', money(Math.max(r.savingNeeded, 0))],
                    ['First monthly withdrawal', money(r.firstWithdrawal)],
                    ['Money lasts until', onTrack ? `${s.plan}+` : `about ${formatNumber(r.runsOutAt, 0)}`],
                  ]}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {r && (
        <div className="border-t border-line p-5 sm:p-7">
          <h2 className="text-lg font-semibold">Your savings over time</h2>
          <div className="mt-5">
            <LineChart
              labels={r.path.map((p) => p.age)}
              xTitle="Age"
              formatY={(v) => formatMoneyCompact(v, cur)}
              formatTooltip={money}
              series={[{ label: 'Savings balance', color: 'var(--chart-1)', values: r.path.map((p) => p.balance), area: true }]}
            />
          </div>
          <p className="mt-3 text-xs text-muted">
            Savings grow until {s.ret}, then fund your withdrawals, which rise with inflation. Returns are assumed steady; real markets vary. This is a planning estimate, not
            financial advice.
          </p>
        </div>
      )}
    </section>
  );
}
