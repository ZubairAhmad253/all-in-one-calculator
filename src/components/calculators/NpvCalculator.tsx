import { irr, npv, presentValues } from '@/lib/calculators/business';
import { CURRENCIES, localeFor, currencySymbol, formatMoney, formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, SelectField } from '@/components/ui/fields';
import { Headline, ShareButton, StatGrid } from './shared/results';
import { CashFlowList, decodeFlows, encodeFlows } from './shared/cashflows';

const DEFAULTS = { init: 10_000, rate: 10, cf: '3000,4000,4000,3000', cur: 'USD' };

export default function NpvCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const flows = decodeFlows(s.cf);
  const value = npv(s.rate, s.init, flows);
  const pvs = presentValues(s.rate, flows);
  const rate = irr(s.init, flows);

  const cur = s.cur;
  const sym = currencySymbol(cur);
  const money = (v: number) => formatMoney(v, cur, 2);
  const good = value > 0;

  return (
    <section aria-label="NPV calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <NumberField label="Initial investment" value={s.init} onChange={(v) => set('init', v)} prefix={sym} locale={localeFor(cur)} min={0} decimals={2} />
          <NumberField label="Discount rate" value={s.rate} onChange={(v) => set('rate', v)} suffix="% per year" min={0} max={100} decimals={2} hint="Your required return or cost of capital." />
          <CashFlowList flows={flows} onChange={(f) => set('cf', encodeFlows(f))} symbol={sym} />
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
          <Headline label="Net present value (NPV)" value={money(value)} action={<ShareButton />} />
          <p className={`mt-2 text-sm font-medium ${good ? 'text-accent' : 'text-warn'}`}>
            {good
              ? `Positive: the project earns more than ${formatNumber(s.rate, 2)}% a year, adding ${money(value)} of value in today’s money.`
              : value < 0
                ? `Negative: the project earns less than ${formatNumber(s.rate, 2)}% a year.`
                : 'Zero: the project earns exactly the discount rate.'}
          </p>
          <div className="mt-6">
            <StatGrid
              items={[
                ['Total cash in', money(flows.reduce((a, b) => a + b, 0))],
                ['Present value of cash in', money(pvs.reduce((a, b) => a + b, 0))],
                ['IRR', Number.isFinite(rate) ? `${formatNumber(rate, 2)}%` : '—'],
                ['Profitability index', s.init > 0 ? formatNumber(pvs.reduce((a, b) => a + b, 0) / s.init, 3) : '—'],
              ]}
            />
          </div>
          <div className="mt-6 max-h-72 overflow-auto rounded-xl border border-line bg-surface">
            <table className="tabular w-full text-sm">
              <thead className="sticky top-0 bg-surface-2 text-left text-xs text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Year</th>
                  <th className="px-3 py-2 text-right font-medium">Cash flow</th>
                  <th className="px-3 py-2 text-right font-medium">Discount factor</th>
                  <th className="px-3 py-2 text-right font-medium">Present value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                <tr>
                  <td className="px-3 py-2">0</td>
                  <td className="px-3 py-2 text-right">{money(-s.init)}</td>
                  <td className="px-3 py-2 text-right">1.0000</td>
                  <td className="px-3 py-2 text-right">{money(-s.init)}</td>
                </tr>
                {flows.map((cf, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2 text-right">{money(cf)}</td>
                    <td className="px-3 py-2 text-right">{(1 / Math.pow(1 + s.rate / 100, i + 1)).toFixed(4)}</td>
                    <td className="px-3 py-2 text-right font-medium">{money(pvs[i])}</td>
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
