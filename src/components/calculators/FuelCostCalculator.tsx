import { tripFuel } from '@/lib/calculators/costs';
import { convert, QUANTITIES } from '@/lib/calculators/units';
import { CURRENCY_CODES, currencySymbol, formatMoney, formatNumber, localeFor } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, SelectField, Tabs } from '@/components/ui/fields';
import { CurrencyPicker } from '@/components/ui/CurrencyPicker';
import { Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { d: 350, du: 'km', eff: 7, eu: 'l100', price: 1.75, pu: 'l', cur: 'EUR', trip: 'one', people: 1 };

const KM_PER_MI = 1.609344;
const LITRES = { l: 1, gal: 3.785411784, 'gal-uk': 4.54609 } as const;
const EFFICIENCY = [
  { value: 'l100', label: 'L/100 km' },
  { value: 'mpg', label: 'mpg (US)' },
  { value: 'mpg-uk', label: 'mpg (UK)' },
  { value: 'kmpl', label: 'km/L' },
];
const PRICE_UNITS = [
  { value: 'l', label: 'per litre' },
  { value: 'gal', label: 'per US gallon' },
  { value: 'gal-uk', label: 'per UK gallon' },
];

export default function FuelCostCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const cur = s.cur;
  const mi = s.du === 'mi';
  const eu = EFFICIENCY.some((e) => e.value === s.eu) ? s.eu : 'l100';
  const pu = (s.pu in LITRES ? s.pu : 'l') as keyof typeof LITRES;
  const round = s.trip === 'round';
  const people = Math.max(1, Math.round(s.people));

  const km = s.d * (mi ? KM_PER_MI : 1) * (round ? 2 : 1);
  const kmPerL = convert(QUANTITIES.fuel, s.eff, eu, 'kmpl');
  const pricePerL = s.price / LITRES[pu];
  const t = tripFuel(km, kmPerL, pricePerL);
  const money = (v: number) => formatMoney(v, cur, 2);

  return (
    <section aria-label="Fuel cost calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <div className="grid grid-cols-[minmax(0,1fr)_7rem] items-end gap-3">
            <NumberField label="Trip distance" value={s.d} onChange={(v) => set('d', v)} min={0} decimals={1} />
            <SelectField
              label="Unit"
              value={mi ? 'mi' : 'km'}
              onChange={(v) => set('du', v)}
              options={[
                { value: 'km', label: 'km' },
                { value: 'mi', label: 'miles' },
              ]}
            />
          </div>
          <Tabs
            value={round ? 'round' : 'one'}
            onChange={(v) => set('trip', v)}
            tabs={[
              { value: 'one', label: 'One way' },
              { value: 'round', label: 'Round trip' },
            ]}
          />
          <div className="grid grid-cols-[minmax(0,1fr)_7rem] items-end gap-3">
            <NumberField label="Fuel economy" value={s.eff} onChange={(v) => set('eff', v)} min={0} decimals={2} />
            <SelectField label="Unit" value={eu} onChange={(v) => set('eu', v)} options={EFFICIENCY} />
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_8rem] items-end gap-3">
            <NumberField label="Fuel price" value={s.price} onChange={(v) => set('price', v)} prefix={currencySymbol(cur)} locale={localeFor(cur)} min={0} decimals={3} />
            <CurrencyPicker label="Currency" value={cur} onChange={(v) => set('cur', v)} codes={CURRENCY_CODES} />
          </div>
          <SelectField label="Price is" value={pu} onChange={(v) => set('pu', v)} options={PRICE_UNITS} />
          <NumberField label="Split between" value={s.people} onChange={(v) => set('people', v)} min={1} max={100} decimals={0} suffix={people === 1 ? 'person' : 'people'} />
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!t ? (
            <p className="text-sm text-muted">Enter a distance, a fuel economy above zero and a fuel price.</p>
          ) : (
            <>
              <Headline label={`Fuel cost${round ? ' (round trip)' : ''}`} value={money(t.cost)} action={<ShareButton />} />
              {people > 1 && <p className="mt-2 text-sm font-semibold text-brand">{money(t.cost / people)} per person</p>}
              <div className="mt-6">
                <StatGrid
                  items={[
                    ['Fuel needed', `${formatNumber(t.litres, 1)} L · ${formatNumber(t.litres / LITRES.gal, 1)} US gal`],
                    ['Distance', `${formatNumber(km, 0)} km · ${formatNumber(km / KM_PER_MI, 0)} mi`],
                    [`Cost per ${mi ? 'mile' : 'km'}`, formatMoney(t.costPerKm * (mi ? KM_PER_MI : 1), cur, 3)],
                    [`Cost per 100 ${mi ? 'miles' : 'km'}`, money(t.costPerKm * 100 * (mi ? KM_PER_MI : 1))],
                    ['Fuel economy', `${formatNumber(convert(QUANTITIES.fuel, kmPerL, 'kmpl', 'l100'), 2)} L/100 km · ${formatNumber(convert(QUANTITIES.fuel, kmPerL, 'kmpl', 'mpg'), 1)} mpg (US)`],
                    ['Price per litre', formatMoney(pricePerL, cur, 3)],
                  ]}
                />
              </div>
              <p className="mt-6 mb-2 text-sm font-semibold">If fuel prices change</p>
              <div className="overflow-hidden rounded-xl border border-line bg-surface">
                <table className="tabular w-full text-sm">
                  <tbody className="divide-y divide-line">
                    {[-20, -10, 0, 10, 20].map((p) => (
                      <tr key={p} className={p === 0 ? 'bg-brand-soft/60 font-semibold' : ''}>
                        <td className="px-4 py-2">{p === 0 ? 'Current price' : `${p > 0 ? '+' : ''}${p}%`}</td>
                        <td className="px-4 py-2 text-right">{formatMoney(s.price * (1 + p / 100), cur, 3)}</td>
                        <td className="px-4 py-2 text-right">{money(t.cost * (1 + p / 100))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
