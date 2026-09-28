import { margin, priceForMargin } from '@/lib/calculators/business';
import { CURRENCY_CODES, localeFor, currencySymbol, formatMoney, formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, QuickPicks, Tabs } from '@/components/ui/fields';
import { CurrencyPicker } from '@/components/ui/CurrencyPicker';
import { Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { mode: 'find', cost: 60, price: 100, target: 40, cur: 'USD' };

export default function ProfitMarginCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const mode = s.mode === 'price' ? 'price' : 'find';
  const price = mode === 'find' ? s.price : priceForMargin(s.cost, s.target);
  const r = margin(s.cost, price);

  const cur = s.cur;
  const sym = currencySymbol(cur);
  const loc = localeFor(cur);
  const money = (v: number) => (Number.isFinite(v) ? formatMoney(v, cur, 2) : '—');
  const pct = (v: number) => (Number.isFinite(v) ? `${formatNumber(v, 2)}%` : '—');

  return (
    <section aria-label="Profit margin calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <div>
            <p className="mb-1.5 text-sm font-medium">I want to</p>
            <Tabs
              value={mode}
              onChange={(v) => set('mode', v)}
              tabs={[
                { value: 'find', label: 'Find my margin' },
                { value: 'price', label: 'Price for a margin' },
              ]}
            />
          </div>
          <NumberField label="Cost" value={s.cost} onChange={(v) => set('cost', v)} prefix={sym} locale={loc} min={0} decimals={2} hint="What the product or service costs you." />
          {mode === 'find' ? (
            <NumberField label="Selling price (revenue)" value={s.price} onChange={(v) => set('price', v)} prefix={sym} locale={loc} min={0} decimals={2} />
          ) : (
            <div>
              <NumberField label="Target margin" value={s.target} onChange={(v) => set('target', v)} suffix="%" min={0} max={99.99} decimals={2} />
              <QuickPicks label="Common margins" values={[20, 30, 40, 50, 60]} value={s.target} onPick={(v) => set('target', v)} />
            </div>
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
          <Headline label={mode === 'find' ? 'Profit margin' : 'Selling price'} value={mode === 'find' ? pct(r.marginPct) : money(price)} action={<ShareButton />} />
          <div className="mt-6">
            <StatGrid
              items={[
                ['Profit', money(r.profit)],
                ['Margin', pct(r.marginPct)],
                ['Markup', pct(r.markupPct)],
                ['Selling price', money(price)],
              ]}
            />
          </div>
          {r.profit < 0 && <p className="mt-4 rounded-xl bg-warn/10 px-4 py-3 text-sm text-warn">You’re selling below cost: a loss of {money(-r.profit)} on each sale.</p>}
          <p className="tabular mt-4 text-sm text-muted">
            Margin = profit ÷ price = {money(r.profit)} ÷ {money(price)}. Markup = profit ÷ cost = {money(r.profit)} ÷ {money(s.cost)}.
          </p>
        </div>
      </div>
    </section>
  );
}
