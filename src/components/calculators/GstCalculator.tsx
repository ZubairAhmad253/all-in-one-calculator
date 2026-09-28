import { gst } from '@/lib/calculators/pay';
import { CURRENCY_CODES, localeFor, currencySymbol, formatMoney, formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, QuickPicks, Tabs } from '@/components/ui/fields';
import { CurrencyPicker } from '@/components/ui/CurrencyPicker';
import { Headline, Receipt, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { mode: 'add', amt: 1_000, rate: 18, inter: 0, cur: 'INR' };

export default function GstCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const mode = s.mode === 'remove' ? 'remove' : 'add';
  const inter = s.inter === 1;
  const r = gst(s.amt, s.rate, mode, inter);

  const cur = s.cur;
  const money = (v: number) => formatMoney(v, cur, 2);
  const half = formatNumber(s.rate / 2, 3);

  return (
    <section aria-label="GST calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <div>
            <p className="mb-1.5 text-sm font-medium">I want to</p>
            <Tabs
              value={mode}
              onChange={(v) => set('mode', v)}
              tabs={[
                { value: 'add', label: 'Add GST' },
                { value: 'remove', label: 'Remove GST' },
              ]}
            />
          </div>
          <NumberField label={mode === 'add' ? 'Amount before GST' : 'Amount including GST'} value={s.amt} onChange={(v) => set('amt', v)} prefix={currencySymbol(cur)} locale={localeFor(cur)} min={0} decimals={2} />
          <div>
            <NumberField label="GST rate" value={s.rate} onChange={(v) => set('rate', v)} suffix="%" min={0} max={100} decimals={3} />
            <QuickPicks label="GST slabs" values={[5, 12, 18, 28]} value={s.rate} onPick={(v) => set('rate', v)} />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium">Type of supply</p>
            <Tabs
              value={inter ? 'inter' : 'intra'}
              onChange={(v) => set('inter', v === 'inter' ? 1 : 0)}
              tabs={[
                { value: 'intra', label: 'Within a state' },
                { value: 'inter', label: 'Between states' },
              ]}
            />
            <p className="mt-1.5 text-xs text-muted">{inter ? 'Inter-state sales and imports are charged IGST.' : 'Intra-state sales are split equally into CGST and SGST (or UTGST).'}</p>
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
          <Headline label={mode === 'add' ? 'Price including GST' : 'Price before GST'} value={money(mode === 'add' ? r.gross : r.net)} action={<ShareButton />} />
          <div className="mt-6">
            <Receipt
              lines={[
                { label: 'Price before GST', value: money(r.net) },
                ...(inter
                  ? [{ label: `IGST (${formatNumber(s.rate, 3)}%)`, value: `+ ${money(r.igst)}` }]
                  : [
                      { label: `CGST (${half}%)`, value: `+ ${money(r.cgst)}` },
                      { label: `SGST (${half}%)`, value: `+ ${money(r.sgst)}` },
                    ]),
              ]}
              total={{ label: 'Price including GST', value: money(r.gross) }}
            />
          </div>
          <div className="mt-5">
            <StatGrid
              items={[
                ['Total GST', money(r.gst)],
                ['GST as share of final price', `${formatNumber(r.gross > 0 ? (r.gst / r.gross) * 100 : 0, 2)}%`],
              ]}
            />
          </div>
          {mode === 'remove' && s.rate > 0 && (
            <p className="mt-4 text-sm text-muted">
              Formula: GST = Amount × {formatNumber(s.rate, 3)} ÷ {formatNumber(100 + s.rate, 3)}. Taking {formatNumber(s.rate, 3)}% off the total would give the wrong answer.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
