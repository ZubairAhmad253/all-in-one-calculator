import { useMemo } from 'react';
import { autoLoan } from '@/lib/calculators/debt';
import { calculateLoan } from '@/lib/calculators/loan';
import { CURRENCIES, localeFor, currencySymbol, formatMoney, formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, QuickPicks, SelectField } from '@/components/ui/fields';
import { AmortizationPanel, Headline, Receipt, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { price: 35_000, down: 5_000, trade: 0, owed: 0, tax: 7, fees: 600, rate: 6.5, months: 60, tat: 1, fin: 1, cur: 'USD' };

export default function AutoLoanCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const b = useMemo(
    () => autoLoan({ price: s.price, down: s.down, tradeIn: s.trade, tradeOwed: s.owed, taxRate: s.tax, taxAfterTradeIn: s.tat === 1, fees: s.fees, financeTaxAndFees: s.fin === 1 }),
    [s.price, s.down, s.trade, s.owed, s.tax, s.tat, s.fees, s.fin],
  );
  const months = Math.max(1, Math.round(s.months));
  const loan = useMemo(() => calculateLoan(b.amountFinanced, s.rate, months), [b.amountFinanced, s.rate, months]);

  const cur = s.cur;
  const sym = currencySymbol(cur);
  const loc = localeFor(cur);
  const money = (v: number) => formatMoney(v, cur);
  const totalCost = b.upfront + loan.totalPaid;

  const toggle = (key: 'tat' | 'fin', label: string, hint: string) => (
    <label className="flex cursor-pointer items-start gap-3 text-sm">
      <input type="checkbox" checked={s[key] === 1} onChange={(e) => set(key, e.target.checked ? 1 : 0)} className="mt-0.5 size-4 accent-[var(--brand)]" />
      <span>
        {label}
        <span className="block text-xs text-muted">{hint}</span>
      </span>
    </label>
  );

  return (
    <section aria-label="Auto loan calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <NumberField label="Vehicle price" value={s.price} onChange={(v) => set('price', v)} prefix={sym} locale={loc} min={0} decimals={0} />
          <NumberField label="Down payment" value={s.down} onChange={(v) => set('down', v)} prefix={sym} locale={loc} min={0} decimals={0} />
          <div className="grid grid-cols-2 items-start gap-3">
            <NumberField label="Trade-in value" value={s.trade} onChange={(v) => set('trade', v)} prefix={sym} locale={loc} min={0} decimals={0} />
            <NumberField label="Still owed on trade-in" value={s.owed} onChange={(v) => set('owed', v)} prefix={sym} locale={loc} min={0} decimals={0} />
          </div>
          <div className="grid grid-cols-2 items-start gap-3">
            <NumberField label="Sales tax" value={s.tax} onChange={(v) => set('tax', v)} suffix="%" min={0} max={30} decimals={3} />
            <NumberField label="Title, registration & fees" value={s.fees} onChange={(v) => set('fees', v)} prefix={sym} locale={loc} min={0} decimals={0} />
          </div>
          <div className="space-y-3">
            {toggle('tat', 'Tax the price after the trade-in', 'Most US states do this. Untick if your state taxes the full price.')}
            {toggle('fin', 'Include tax and fees in the loan', 'Untick to pay them upfront instead.')}
          </div>

          <div className="space-y-4 border-t border-line pt-5">
            <NumberField label="Interest rate (APR)" value={s.rate} onChange={(v) => set('rate', v)} suffix="%" min={0} max={40} decimals={3} />
            <div>
              <NumberField label="Loan term" value={s.months} onChange={(v) => set('months', v)} suffix="months" min={1} max={120} decimals={0} />
              <QuickPicks label="Common terms" values={[36, 48, 60, 72, 84]} value={s.months} onPick={(v) => set('months', v)} format={(v) => `${v / 12} yr`} />
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
          <Headline label="Monthly payment" value={formatMoney(loan.payment, cur, 2)} action={<ShareButton />} />
          <div className="mt-6">
            <Receipt
              lines={[
                { label: 'Vehicle price', value: money(s.price) },
                { label: 'Down payment', value: `− ${money(s.down)}` },
                ...(s.trade > 0 || s.owed > 0
                  ? [{ label: b.tradeEquity >= 0 ? 'Trade-in equity' : 'Negative equity rolled in', value: b.tradeEquity >= 0 ? `− ${money(b.tradeEquity)}` : `+ ${money(-b.tradeEquity)}` }]
                  : []),
                ...(s.fin === 1
                  ? [
                      { label: `Sales tax (${formatNumber(s.tax, 3)}% of ${money(b.taxable)})`, value: `+ ${money(b.tax)}` },
                      { label: 'Fees', value: `+ ${money(s.fees)}` },
                    ]
                  : []),
              ]}
              total={{ label: 'Amount financed', value: money(b.amountFinanced) }}
            />
          </div>
          <div className="mt-5">
            <StatGrid
              items={[
                ['Total interest', money(loan.totalInterest)],
                ['Due at signing', money(b.upfront)],
                ['Total cost of the car', money(totalCost)],
                ['Paid off in', `${formatNumber(months, 0)} months`],
              ]}
            />
          </div>
          {b.tradeEquity < 0 && (
            <p className="mt-4 rounded-xl bg-warn/10 px-4 py-3 text-sm text-warn">
              You owe {money(-b.tradeEquity)} more on your trade-in than it’s worth. That amount is added to the new loan, and you pay interest on it.
            </p>
          )}
        </div>
      </div>

      {b.amountFinanced > 0 && (
        <AmortizationPanel
          principal={b.amountFinanced}
          yearly={loan.yearly}
          monthly={loan.monthly}
          currency={cur}
          note={`Based on ${formatNumber(s.rate, 3)}% APR over ${formatNumber(months, 0)} months. Tax rules and dealer fees vary by state and country.`}
        />
      )}
    </section>
  );
}
