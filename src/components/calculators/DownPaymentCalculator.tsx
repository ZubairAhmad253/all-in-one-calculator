import { useMemo } from 'react';
import { downPayment } from '@/lib/calculators/housing';
import { addMonths } from '@/lib/calculators/dates';
import { CURRENCIES, localeFor, currencySymbol, formatDuration, formatMoney, formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { useToday } from '@/lib/hooks/useToday';
import { NumberField, QuickPicks, SelectField } from '@/components/ui/fields';
import { Headline, Receipt, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { price: 400_000, pct: 20, close: 3, saved: 50_000, save: 1_500, srate: 4, mrate: 6.5, term: 30, cur: 'USD' };

export default function DownPaymentCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const today = useToday();
  const input = { price: s.price, downPct: s.pct, closingPct: s.close, savings: s.saved, monthlySaving: s.save, savingsRate: s.srate, mortgageRate: s.mrate, termYears: s.term };
  const r = useMemo(() => downPayment(input), [JSON.stringify(input)]); // eslint-disable-line react-hooks/exhaustive-deps
  const options = [3.5, 5, 10, 20].map((pct) => ({ pct, ...downPayment({ ...input, downPct: pct }) }));

  const cur = s.cur;
  const sym = currencySymbol(cur);
  const loc = localeFor(cur);
  const money = (v: number) => formatMoney(v, cur);
  const readyBy = today && Number.isFinite(r.monthsToSave) && r.monthsToSave > 0 ? addMonths(today, r.monthsToSave) : null;
  const month = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  return (
    <section aria-label="Down payment calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <NumberField label="Home price" value={s.price} onChange={(v) => set('price', v)} prefix={sym} locale={loc} min={0} decimals={0} />
          <div>
            <NumberField label="Down payment" value={s.pct} onChange={(v) => set('pct', v)} suffix="%" min={0} max={100} decimals={1} hint={money(r.downPayment)} />
            <QuickPicks label="Common down payments" values={[3.5, 5, 10, 20]} value={s.pct} onPick={(v) => set('pct', v)} />
          </div>
          <NumberField label="Closing costs" value={s.close} onChange={(v) => set('close', v)} suffix="% of price" min={0} max={15} decimals={1} hint="Usually 2–5%: lender fees, legal, title, taxes." />

          <div className="space-y-4 border-t border-line pt-5">
            <p className="text-sm font-semibold">Your savings plan</p>
            <div className="grid grid-cols-2 items-start gap-3">
              <NumberField label="Saved so far" value={s.saved} onChange={(v) => set('saved', v)} prefix={sym} locale={loc} min={0} decimals={0} />
              <NumberField label="Saving each month" value={s.save} onChange={(v) => set('save', v)} prefix={sym} locale={loc} min={0} decimals={0} />
            </div>
            <NumberField label="Interest on savings" value={s.srate} onChange={(v) => set('srate', v)} suffix="% / yr" min={0} max={20} decimals={2} />
          </div>

          <div className="grid grid-cols-2 items-start gap-3 border-t border-line pt-5">
            <NumberField label="Mortgage rate" value={s.mrate} onChange={(v) => set('mrate', v)} suffix="%" min={0} max={30} decimals={3} />
            <NumberField label="Mortgage term" value={s.term} onChange={(v) => set('term', v)} suffix="years" min={1} max={40} decimals={0} />
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
          <Headline label="Cash you need" value={money(r.cashNeeded)} action={<ShareButton />} />
          <div className="mt-6">
            <Receipt
              lines={[
                { label: `Down payment (${formatNumber(s.pct, 1)}%)`, value: money(r.downPayment) },
                { label: `Closing costs (${formatNumber(s.close, 1)}%)`, value: `+ ${money(r.closingCosts)}` },
              ]}
              total={{ label: 'Total cash needed', value: money(r.cashNeeded) }}
            />
          </div>
          <div className="mt-5">
            <StatGrid
              items={[
                ['Still to save', r.shortfall > 0 ? money(r.shortfall) : 'Nothing: you’re ready'],
                ['Time to save it', r.shortfall === 0 ? 'Now' : Number.isFinite(r.monthsToSave) ? formatDuration(r.monthsToSave) : 'Add a monthly saving'],
                ['Mortgage amount', money(r.loan)],
                ['Monthly payment (P&I)', formatMoney(r.payment, cur, 2)],
              ]}
            />
          </div>
          {readyBy && <p className="mt-3 text-sm text-muted">At this rate you’ll have enough by around {month(readyBy)}.</p>}
          {r.pmiLikely && (
            <p className="mt-3 rounded-xl bg-warn/10 px-4 py-3 text-sm text-warn">Under 20% down, most conventional US loans add mortgage insurance (PMI), usually about 0.3–1.5% of the loan a year.</p>
          )}

          <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface">
            <table className="tabular w-full text-sm">
              <thead className="bg-surface-2 text-left text-xs text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Down</th>
                  <th className="px-3 py-2 text-right font-medium">Cash needed</th>
                  <th className="px-3 py-2 text-right font-medium">Loan</th>
                  <th className="px-3 py-2 text-right font-medium">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {options.map((o) => (
                  <tr key={o.pct} className={o.pct === s.pct ? 'bg-brand-soft/60 font-semibold' : ''}>
                    <td className="px-3 py-2">{o.pct}%</td>
                    <td className="px-3 py-2 text-right">{money(o.cashNeeded)}</td>
                    <td className="px-3 py-2 text-right">{money(o.loan)}</td>
                    <td className="px-3 py-2 text-right">{money(o.payment)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
