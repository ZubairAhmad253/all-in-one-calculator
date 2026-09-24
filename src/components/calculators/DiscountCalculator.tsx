import { useMemo } from 'react';
import { discount } from '@/lib/calculators/shopping';
import { CURRENCIES, localeFor, currencySymbol, formatMoney, formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, QuickPicks, SelectField, Tabs } from '@/components/ui/fields';
import { Headline, Receipt, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = {
  price: 80,
  type: 'percent',
  off: 25,
  extra: 0,
  cur: 'USD',
};

export default function DiscountCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const type = s.type === 'amount' ? 'amount' : 'percent';
  const r = useMemo(() => discount({ price: s.price, type, value: s.off, extraPct: s.extra }), [s.price, type, s.off, s.extra]);

  const cur = s.cur;
  const sym = currencySymbol(cur);
  const loc = localeFor(cur);
  const money = (v: number) => formatMoney(v, cur, 2);
  const firstOff = s.price - r.afterFirst;

  return (
    <section aria-label="Discount calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <NumberField label="Original price" value={s.price} onChange={(v) => set('price', v)} prefix={sym} locale={loc} min={0} decimals={2} />

          <div>
            <p className="mb-1.5 text-sm font-medium">Discount type</p>
            <Tabs
              value={type}
              onChange={(v) => set('type', v)}
              tabs={[
                { value: 'percent', label: '% off' },
                { value: 'amount', label: 'Amount off' },
              ]}
            />
          </div>

          {type === 'percent' ? (
            <div>
              <NumberField label="Discount" value={s.off} onChange={(v) => set('off', v)} suffix="% off" min={0} max={100} decimals={2} />
              <QuickPicks label="Common discounts" values={[10, 20, 25, 30, 50]} value={s.off} onPick={(v) => set('off', v)} />
            </div>
          ) : (
            <NumberField label="Discount" value={s.off} onChange={(v) => set('off', v)} prefix={sym} suffix="off" locale={loc} min={0} decimals={2} />
          )}

          <NumberField
            label="Extra discount (optional)"
            value={s.extra}
            onChange={(v) => set('extra', v)}
            suffix="% off"
            min={0}
            max={100}
            decimals={2}
            hint="For offers like “an extra 10% off sale prices”. Applied after the first discount."
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
          <Headline label="Sale price" value={money(r.salePrice)} action={<ShareButton />} />

          <div className="mt-6">
            <Receipt
              lines={[
                { label: 'Original price', value: money(s.price) },
                { label: type === 'percent' ? `Discount (${formatNumber(s.off, 2)}%)` : 'Discount', value: `− ${money(firstOff)}` },
                ...(s.extra > 0 ? [{ label: `Extra ${formatNumber(s.extra, 2)}% off ${money(r.afterFirst)}`, value: `− ${money(r.afterFirst - r.salePrice)}` }] : []),
              ]}
              total={{ label: 'You pay', value: money(r.salePrice) }}
            />
          </div>

          <div className="mt-5">
            <StatGrid
              items={[
                ['You save', money(r.savings)],
                ['Total discount', `${formatNumber(r.totalPct, 2)}%`],
              ]}
            />
          </div>

          {s.extra > 0 && type === 'percent' && (
            <p className="mt-4 rounded-xl bg-accent/10 px-4 py-3 text-sm">
              {formatNumber(s.off, 2)}% off plus an extra {formatNumber(s.extra, 2)}% is <strong>{formatNumber(r.totalPct, 2)}% off</strong> in total, not{' '}
              {formatNumber(Math.min(s.off + s.extra, 100), 2)}%, because the extra discount applies to the already-reduced price.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
