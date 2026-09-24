import { useMemo } from 'react';
import { salesTax } from '@/lib/calculators/shopping';
import { CURRENCIES, localeFor, currencySymbol, formatMoney, formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, QuickPicks, SelectField, Tabs } from '@/components/ui/fields';
import { Headline, Receipt, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = {
  mode: 'add',
  amount: 100,
  rate: 10,
  cur: 'USD',
};

const COMMON_RATES = [5, 7.5, 10, 15, 20];

export default function SalesTaxCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const mode = s.mode === 'remove' ? 'remove' : 'add';
  const r = useMemo(() => salesTax(s.amount, s.rate, mode), [s.amount, s.rate, mode]);

  const cur = s.cur;
  const money = (v: number) => formatMoney(v, cur, 2);
  const rate = `${formatNumber(s.rate, 3)}%`;

  return (
    <section aria-label="Sales tax and VAT calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <div>
            <p className="mb-1.5 text-sm font-medium">I want to</p>
            <Tabs
              value={mode}
              onChange={(v) => set('mode', v)}
              tabs={[
                { value: 'add', label: 'Add tax' },
                { value: 'remove', label: 'Remove tax' },
              ]}
            />
          </div>

          <NumberField
            label={mode === 'add' ? 'Price before tax' : 'Price including tax'}
            value={s.amount}
            onChange={(v) => set('amount', v)}
            prefix={currencySymbol(cur)}
            locale={localeFor(cur)}
            min={0}
            decimals={2}
          />

          <div>
            <NumberField label="Tax rate (sales tax, VAT or GST)" value={s.rate} onChange={(v) => set('rate', v)} suffix="%" min={0} max={100} decimals={3} />
            <QuickPicks label="Common tax rates" values={COMMON_RATES} value={s.rate} onPick={(v) => set('rate', v)} />
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
          <Headline label={mode === 'add' ? 'Price including tax' : 'Price before tax'} value={money(mode === 'add' ? r.gross : r.net)} action={<ShareButton />} />

          <div className="mt-6">
            <Receipt
              lines={[
                { label: 'Price before tax', value: money(r.net) },
                { label: `Tax at ${rate}`, value: `+ ${money(r.tax)}` },
              ]}
              total={{ label: 'Price including tax', value: money(r.gross) }}
            />
          </div>

          <div className="mt-5">
            <StatGrid
              items={[
                ['Tax amount', money(r.tax)],
                ['Tax as share of final price', `${formatNumber(r.gross > 0 ? (r.tax / r.gross) * 100 : 0, 2)}%`],
              ]}
            />
          </div>

          {mode === 'remove' && s.rate > 0 && (
            <p className="mt-4 rounded-xl bg-accent/10 px-4 py-3 text-sm">
              To remove {rate} tax, divide by {formatNumber(1 + s.rate / 100, 5)}. Taking {rate} off the total would give {money(s.amount * (1 - s.rate / 100))}, which is{' '}
              {money(r.net - s.amount * (1 - s.rate / 100))} too low.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
