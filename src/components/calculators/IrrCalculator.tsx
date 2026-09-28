import { irr, npv, payback } from '@/lib/calculators/business';
import { CURRENCY_CODES, localeFor, currencySymbol, formatMoney, formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField } from '@/components/ui/fields';
import { CurrencyPicker } from '@/components/ui/CurrencyPicker';
import { LineChart } from '@/components/charts/LineChart';
import { Headline, ShareButton, StatGrid } from './shared/results';
import { CashFlowList, decodeFlows, encodeFlows } from './shared/cashflows';

const DEFAULTS = { init: 10_000, hurdle: 10, cf: '3000,4000,4000,3000', cur: 'USD' };

const years = (v: number) => (Number.isFinite(v) ? `${formatNumber(v, 2)} years` : 'Not within the period');

export default function IrrCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const flows = decodeFlows(s.cf);
  const rate = irr(s.init, flows);
  const found = Number.isFinite(rate);

  const cur = s.cur;
  const sym = currencySymbol(cur);
  const money = (v: number) => formatMoney(v, cur, 2);
  // NPV profile from 0% to a little beyond the IRR.
  const maxRate = Math.max(20, Math.ceil(((found ? rate : 20) * 1.6) / 5) * 5);
  const rates = Array.from({ length: 11 }, (_, i) => Math.round((maxRate * i) / 10));

  return (
    <section aria-label="IRR calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <NumberField label="Initial investment" value={s.init} onChange={(v) => set('init', v)} prefix={sym} locale={localeFor(cur)} min={0} decimals={2} />
          <CashFlowList flows={flows} onChange={(f) => set('cf', encodeFlows(f))} symbol={sym} />
          <NumberField label="Hurdle rate (optional)" value={s.hurdle} onChange={(v) => set('hurdle', v)} suffix="%" min={0} max={100} decimals={2} hint="The minimum return you need, to compare against the IRR." />
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
          <Headline label="Internal rate of return (IRR)" value={found ? `${formatNumber(rate, 2)}%` : '—'} action={<ShareButton />} />
          {found ? (
            <p className={`mt-2 text-sm font-medium ${rate >= s.hurdle ? 'text-accent' : 'text-warn'}`}>
              {rate >= s.hurdle ? `Above your ${formatNumber(s.hurdle, 2)}% hurdle rate.` : `Below your ${formatNumber(s.hurdle, 2)}% hurdle rate.`}
            </p>
          ) : (
            <p className="mt-2 text-sm text-warn">No IRR: the cash flows never change sign in a way that makes NPV zero. Check the investment and cash flows.</p>
          )}
          <div className="mt-6">
            <StatGrid
              items={[
                ['NPV at hurdle rate', money(npv(s.hurdle, s.init, flows))],
                ['Total return', money(flows.reduce((a, b) => a + b, 0) - s.init)],
                ['Payback period', years(payback(s.init, flows))],
                ['Discounted payback', years(payback(s.init, flows, s.hurdle))],
              ]}
            />
          </div>
        </div>
      </div>
      <div className="border-t border-line p-5 sm:p-7">
        <h2 className="text-lg font-semibold">NPV at different discount rates</h2>
        <div className="mt-5">
          <LineChart
            labels={rates.map((r) => `${r}%`)}
            xTitle="Rate"
            formatY={(v) => formatMoney(v, cur)}
            formatTooltip={money}
            series={[{ label: 'NPV', color: 'var(--chart-1)', values: rates.map((r) => Math.max(npv(r, s.init, flows), 0)) }]}
          />
        </div>
        <p className="mt-3 text-xs text-muted">The IRR is where NPV falls to zero. Values below zero are shown at zero on this chart.</p>
      </div>
    </section>
  );
}
