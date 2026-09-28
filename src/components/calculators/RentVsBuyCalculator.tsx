import { useMemo } from 'react';
import { rentVsBuy } from '@/lib/calculators/housing';
import { CURRENCY_CODES, localeFor, currencySymbol, formatMoney, formatMoneyCompact } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField } from '@/components/ui/fields';
import { CurrencyPicker } from '@/components/ui/CurrencyPicker';
import { LineChart } from '@/components/charts/LineChart';
import { ShareButton, StatGrid } from './shared/results';

const DEFAULTS = {
  price: 400_000, down: 20, rate: 6.5, term: 30, bc: 3, sc: 6, ptax: 1.1, maint: 1, ins: 1_500, hg: 3.5,
  rent: 2_200, rg: 3, inv: 6, yrs: 15, cur: 'USD',
};

export default function RentVsBuyCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const years = Math.min(Math.max(Math.round(s.yrs), 1), 40);
  const r = useMemo(
    () =>
      rentVsBuy({
        price: s.price, downPct: s.down, mortgageRate: s.rate, termYears: s.term, buyCostPct: s.bc, sellCostPct: s.sc, propertyTaxPct: s.ptax,
        maintenancePct: s.maint, insurance: s.ins, homeGrowth: s.hg, rent: s.rent, rentGrowth: s.rg, investReturn: s.inv, years,
      }),
    [s.price, s.down, s.rate, s.term, s.bc, s.sc, s.ptax, s.maint, s.ins, s.hg, s.rent, s.rg, s.inv, years],
  );

  const cur = s.cur;
  const sym = currencySymbol(cur);
  const loc = localeFor(cur);
  const money = (v: number) => formatMoney(v, cur);
  const last = r.years.at(-1);
  const buyWins = r.advantage > 0;
  const ownMonthly = r.payment + (s.price * (s.ptax + s.maint)) / 100 / 12 + s.ins / 12;

  const num = (key: keyof typeof DEFAULTS, label: string, suffix?: string, decimals = 1, money_ = false) => (
    <NumberField
      label={label}
      value={s[key] as number}
      onChange={(v) => set(key, v as never)}
      suffix={suffix}
      prefix={money_ ? sym : undefined}
      locale={money_ ? loc : undefined}
      min={0}
      decimals={decimals}
    />
  );

  return (
    <section aria-label="Rent vs buy calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <p className="text-sm font-semibold">Buying</p>
          {num('price', 'Home price', undefined, 0, true)}
          <div className="grid grid-cols-2 items-start gap-3">
            {num('down', 'Down payment', '%')}
            {num('rate', 'Mortgage rate', '%', 3)}
          </div>
          <div className="grid grid-cols-2 items-start gap-3">
            {num('bc', 'Buying costs', '% of price')}
            {num('sc', 'Selling costs', '% of price')}
          </div>
          <div className="grid grid-cols-2 items-start gap-3">
            {num('ptax', 'Property tax', '% / yr', 2)}
            {num('maint', 'Maintenance', '% / yr', 2)}
          </div>
          <div className="grid grid-cols-2 items-start gap-3">
            {num('ins', 'Insurance', '/ yr', 0, true)}
            {num('hg', 'Home price growth', '% / yr', 2)}
          </div>

          <p className="border-t border-line pt-5 text-sm font-semibold">Renting</p>
          <div className="grid grid-cols-2 items-start gap-3">
            {num('rent', 'Monthly rent', undefined, 0, true)}
            {num('rg', 'Rent increase', '% / yr', 2)}
          </div>

          <p className="border-t border-line pt-5 text-sm font-semibold">Other</p>
          <div className="grid grid-cols-2 items-start gap-3">
            {num('inv', 'Investment return', '% / yr', 2)}
            {num('yrs', 'Years you’ll stay', 'yrs', 0)}
          </div>
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
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted">Over {years} years</p>
              <p className={`mt-1 text-2xl font-bold tracking-tight sm:text-4xl ${buyWins ? 'text-accent' : 'text-brand'}`}>{buyWins ? 'Buying comes out ahead' : 'Renting comes out ahead'}</p>
              <p className="tabular mt-2 text-sm">
                by <strong>{money(Math.abs(r.advantage))}</strong> in net worth.
                {r.breakEvenYear !== null && buyWins && <> Buying pulls ahead after <strong>year {r.breakEvenYear}</strong>.</>}
                {r.breakEvenYear === null && <> Buying doesn’t catch up within {years} years.</>}
              </p>
            </div>
            <ShareButton />
          </div>
          <div className="mt-6">
            <StatGrid
              items={[
                ['Cost to own, first month', money(ownMonthly)],
                ['Rent, first month', money(s.rent)],
                ['Cash needed to buy', money(r.upfront)],
                ['Mortgage payment', formatMoney(r.payment, cur, 2)],
                ...(last ? ([['Net worth if you buy', money(last.buyWorth)], ['Net worth if you rent', money(last.rentWorth)]] as [string, string][]) : []),
              ]}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-line p-5 sm:p-7">
        <h2 className="text-lg font-semibold">Net worth over time</h2>
        <div className="mt-5">
          <LineChart
            labels={r.years.map((y) => y.year)}
            xTitle="Year"
            formatY={(v) => formatMoneyCompact(v, cur)}
            formatTooltip={money}
            series={[
              { label: 'Buy: home equity after selling costs + investments', color: 'var(--chart-2)', values: r.years.map((y) => y.buyWorth) },
              { label: 'Rent: invested deposit + monthly savings', color: 'var(--chart-1)', values: r.years.map((y) => y.rentWorth) },
            ]}
          />
        </div>
        <p className="mt-3 text-xs text-muted">
          The renter invests the deposit and buying costs instead, and whoever has the lower housing cost each month invests the difference. Taxes on gains and rental
          deposits aren’t included. This is an estimate, not financial advice.
        </p>
      </div>
    </section>
  );
}
