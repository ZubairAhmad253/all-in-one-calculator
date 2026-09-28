import { margin, markupToMargin, priceForMarkup } from '@/lib/calculators/business';
import { CURRENCY_CODES, localeFor, currencySymbol, formatMoney, formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, QuickPicks, Tabs } from '@/components/ui/fields';
import { CurrencyPicker } from '@/components/ui/CurrencyPicker';
import { Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { mode: 'price', cost: 40, markup: 50, price: 60, cur: 'USD' };

export default function MarkupCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const mode = s.mode === 'find' ? 'find' : 'price';
  const price = mode === 'price' ? priceForMarkup(s.cost, s.markup) : s.price;
  const r = margin(s.cost, price);

  const cur = s.cur;
  const sym = currencySymbol(cur);
  const loc = localeFor(cur);
  const money = (v: number) => (Number.isFinite(v) ? formatMoney(v, cur, 2) : '—');
  const pct = (v: number) => (Number.isFinite(v) ? `${formatNumber(v, 2)}%` : '—');

  return (
    <section aria-label="Markup calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <div>
            <p className="mb-1.5 text-sm font-medium">I want to</p>
            <Tabs
              value={mode}
              onChange={(v) => set('mode', v)}
              tabs={[
                { value: 'price', label: 'Find the price' },
                { value: 'find', label: 'Find my markup' },
              ]}
            />
          </div>
          <NumberField label="Cost" value={s.cost} onChange={(v) => set('cost', v)} prefix={sym} locale={loc} min={0} decimals={2} />
          {mode === 'price' ? (
            <div>
              <NumberField label="Markup" value={s.markup} onChange={(v) => set('markup', v)} suffix="% of cost" min={0} decimals={2} />
              <QuickPicks label="Common markups" values={[25, 50, 75, 100, 200]} value={s.markup} onPick={(v) => set('markup', v)} />
            </div>
          ) : (
            <NumberField label="Selling price" value={s.price} onChange={(v) => set('price', v)} prefix={sym} locale={loc} min={0} decimals={2} />
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
          <Headline label={mode === 'price' ? 'Selling price' : 'Markup'} value={mode === 'price' ? money(price) : pct(r.markupPct)} action={<ShareButton />} />
          <div className="mt-6">
            <StatGrid
              items={[
                ['Profit per sale', money(r.profit)],
                ['Markup (on cost)', pct(r.markupPct)],
                ['Margin (on price)', pct(r.marginPct)],
                ['Selling price', money(price)],
              ]}
            />
          </div>
          {Number.isFinite(r.markupPct) && r.markupPct > 0 && (
            <p className="mt-4 text-sm">
              A {pct(r.markupPct)} markup is a <strong>{pct(markupToMargin(r.markupPct))} margin</strong>: the same profit, measured against the price instead of the cost.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
