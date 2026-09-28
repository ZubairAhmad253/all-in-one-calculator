import { dailyKwh, energyCost, type Appliance } from '@/lib/calculators/costs';
import { CURRENCY_CODES, currencySymbol, formatMoney, formatNumber, localeFor } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { InlineNumber, NumberField } from '@/components/ui/fields';
import { CurrencyPicker } from '@/components/ui/CurrencyPicker';
import { Headline, ShareButton, StatGrid } from './shared/results';

/** Typical power draw while running. */
const PRESETS = [
  { id: 'fridge', name: 'Fridge-freezer', watts: 150, hours: 24 },
  { id: 'ac', name: 'Air conditioner', watts: 1500, hours: 6 },
  { id: 'heater', name: 'Space heater', watts: 2000, hours: 3 },
  { id: 'washer', name: 'Washing machine', watts: 500, hours: 1 },
  { id: 'dryer', name: 'Tumble dryer', watts: 2500, hours: 0.7 },
  { id: 'dishwasher', name: 'Dishwasher', watts: 1200, hours: 1 },
  { id: 'oven', name: 'Electric oven', watts: 2400, hours: 0.75 },
  { id: 'kettle', name: 'Kettle', watts: 2000, hours: 0.2 },
  { id: 'microwave', name: 'Microwave', watts: 1000, hours: 0.25 },
  { id: 'tv', name: 'TV', watts: 100, hours: 4 },
  { id: 'pc', name: 'Desktop computer', watts: 200, hours: 6 },
  { id: 'laptop', name: 'Laptop', watts: 50, hours: 6 },
  { id: 'led', name: 'LED bulb', watts: 10, hours: 5 },
  { id: 'fan', name: 'Ceiling fan', watts: 60, hours: 8 },
  { id: 'water-heater', name: 'Water heater', watts: 3000, hours: 1.5 },
  { id: 'ev', name: 'EV charging (home)', watts: 7000, hours: 1 },
  { id: 'custom', name: 'Other appliance', watts: 100, hours: 1 },
];

const DEFAULTS = { items: 'fridge:150:24:1,tv:100:4:1,led:10:5:8,washer:500:1:1,pc:200:6:1', price: 0.25, fixed: 0, cur: 'USD' };
const MAX_ITEMS = 20;

interface Row extends Appliance {
  id: string;
}

const decode = (t: string): Row[] =>
  t
    .split(',')
    .filter(Boolean)
    .slice(0, MAX_ITEMS)
    .map((p) => {
      const [id = 'custom', w = '0', h = '0', q = '1'] = p.split(':');
      return { id: PRESETS.some((x) => x.id === id) ? id : 'custom', watts: Number(w) || 0, hoursPerDay: Number(h) || 0, quantity: Number(q) || 0 };
    });
const encode = (rows: Row[]) => rows.map((r) => `${r.id}:${r.watts}:${r.hoursPerDay}:${r.quantity}`).join(',');
const nameOf = (id: string) => PRESETS.find((p) => p.id === id)?.name ?? 'Appliance';

export default function ElectricityBillCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const rows = decode(s.items);
  const cur = s.cur;
  const r = energyCost(rows, s.price);
  const monthly = r.cost.month + Math.max(0, s.fixed);
  const byCost = rows.map((row, i) => ({ i, row, month: dailyKwh(row) * (365 / 12) * s.price })).sort((a, b) => b.month - a.month);
  const maxMonth = Math.max(0.0001, ...byCost.map((x) => x.month));

  const update = (i: number, patch: Partial<Row>) => set('items', encode(rows.map((x, j) => (j === i ? { ...x, ...patch } : x))));

  return (
    <section aria-label="Electricity bill calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <div>
            <div className="hidden grid-cols-[minmax(0,1fr)_5rem_4.5rem_3.5rem_2rem] gap-2 px-1 pb-1.5 text-xs text-muted sm:grid">
              <span>Appliance</span>
              <span>Watts</span>
              <span>Hours/day</span>
              <span>Qty</span>
              <span />
            </div>
            <ol className="space-y-2">
              {rows.map((row, i) => (
                <li key={i} className="grid grid-cols-[minmax(0,1fr)_2rem] gap-2 rounded-xl border border-line bg-surface p-2 sm:grid-cols-[minmax(0,1fr)_5rem_4.5rem_3.5rem_2rem] sm:items-center sm:border-0 sm:bg-transparent sm:p-0">
                  <select
                    aria-label={`Appliance ${i + 1}`}
                    value={row.id}
                    onChange={(e) => {
                      const p = PRESETS.find((x) => x.id === e.target.value)!;
                      update(i, { id: p.id, watts: p.watts, hoursPerDay: p.hours });
                    }}
                    className="h-10 w-full min-w-0 rounded-lg border border-line bg-surface px-2 text-sm font-medium outline-none focus:border-brand"
                  >
                    {PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <button type="button" aria-label={`Remove ${nameOf(row.id)}`} onClick={() => set('items', encode(rows.filter((_, j) => j !== i)))} className="grid size-8 place-items-center self-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg sm:order-last">
                    ✕
                  </button>
                  <div className="col-span-2 grid grid-cols-3 gap-2 sm:col-span-3 sm:contents">
                    <label className="text-xs text-muted sm:contents">
                      <span className="sm:hidden">Watts</span>
                      <InlineNumber label={`${nameOf(row.id)} watts`} value={row.watts} onChange={(v) => update(i, { watts: v })} width="w-full" allowNegative={false} />
                    </label>
                    <label className="text-xs text-muted sm:contents">
                      <span className="sm:hidden">Hours/day</span>
                      <InlineNumber label={`${nameOf(row.id)} hours per day`} value={row.hoursPerDay} onChange={(v) => update(i, { hoursPerDay: Math.min(24, v) })} width="w-full" allowNegative={false} />
                    </label>
                    <label className="text-xs text-muted sm:contents">
                      <span className="sm:hidden">Qty</span>
                      <InlineNumber label={`${nameOf(row.id)} quantity`} value={row.quantity} onChange={(v) => update(i, { quantity: v })} width="w-full" allowNegative={false} />
                    </label>
                  </div>
                </li>
              ))}
            </ol>
            <button
              type="button"
              disabled={rows.length >= MAX_ITEMS}
              onClick={() => set('items', encode([...rows, { id: 'custom', watts: 100, hoursPerDay: 1, quantity: 1 }]))}
              className="mt-3 h-10 rounded-xl border border-line bg-surface px-4 text-sm font-medium hover:border-brand/40 disabled:opacity-50"
            >
              + Add appliance
            </button>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_8rem] items-end gap-3">
            <NumberField label="Price per kWh" value={s.price} onChange={(v) => set('price', v)} prefix={currencySymbol(cur)} locale={localeFor(cur)} min={0} decimals={4} hint="On your bill as the unit rate." />
            <CurrencyPicker label="Currency" value={cur} onChange={(v) => set('cur', v)} codes={CURRENCY_CODES} />
          </div>
          <NumberField label="Fixed monthly charge (optional)" value={s.fixed} onChange={(v) => set('fixed', v)} prefix={currencySymbol(cur)} locale={localeFor(cur)} min={0} decimals={2} hint="Standing or service charge." />
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          <Headline label="Estimated monthly bill" value={formatMoney(monthly, cur, 2)} action={<ShareButton />} />
          <p className="mt-2 text-sm text-muted">{formatNumber(r.kwh.month, 0)} kWh a month</p>
          <div className="mt-6">
            <StatGrid
              items={[
                ['Per day', `${formatMoney(r.cost.day, cur, 2)} · ${formatNumber(r.kwh.day, 2)} kWh`],
                ['Per year', `${formatMoney(r.cost.year + Math.max(0, s.fixed) * 12, cur, 0)} · ${formatNumber(r.kwh.year, 0)} kWh`],
              ]}
            />
          </div>
          {byCost.length > 0 && (
            <div className="mt-6 space-y-3">
              <p className="text-sm font-semibold">Monthly cost by appliance</p>
              {byCost.map(({ i, row, month }) => (
                <div key={i}>
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="truncate">
                      {nameOf(row.id)}
                      {row.quantity > 1 ? ` × ${formatNumber(row.quantity, 0)}` : ''}
                    </span>
                    <span className="tabular shrink-0 font-medium">{formatMoney(month, cur, 2)}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${(month / maxMonth) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="mt-4 text-xs text-muted">Wattages are typical; check the label on your appliance. Fridges and air conditioners cycle on and off, so real use is often lower than the rating suggests.</p>
        </div>
      </div>
    </section>
  );
}
