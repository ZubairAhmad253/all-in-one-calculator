import { pricePerUnit } from '@/lib/calculators/costs';
import { CURRENCY_CODES, currencySymbol, formatMoney, localeFor } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { InlineNumber } from '@/components/ui/fields';
import { CurrencyPicker } from '@/components/ui/CurrencyPicker';
import { ShareButton } from './shared/results';

/** Size of each unit in its base (grams, millilitres or items). */
const UNITS = [
  { id: 'g', label: 'g', kind: 'weight', base: 1 },
  { id: 'kg', label: 'kg', kind: 'weight', base: 1000 },
  { id: 'oz', label: 'oz', kind: 'weight', base: 28.349523125 },
  { id: 'lb', label: 'lb', kind: 'weight', base: 453.59237 },
  { id: 'ml', label: 'ml', kind: 'volume', base: 1 },
  { id: 'l', label: 'L', kind: 'volume', base: 1000 },
  { id: 'floz', label: 'fl oz', kind: 'volume', base: 29.5735295625 },
  { id: 'gal', label: 'gal (US)', kind: 'volume', base: 3785.411784 },
  { id: 'ct', label: 'items', kind: 'count', base: 1 },
] as const;

/** How each kind is compared: per kg, per litre or per item. */
const PER = { weight: { label: 'kg', size: 1000 }, volume: { label: 'L', size: 1000 }, count: { label: 'item', size: 1 } } as const;

const DEFAULTS = { items: '3.49:500:g,5.99:1:kg,1.29:200:g', cur: 'USD' };
const MAX = 6;
const LETTERS = 'ABCDEF';

type Item = { price: number; size: number; unit: string };
const decode = (t: string): Item[] =>
  t
    .split(',')
    .filter(Boolean)
    .slice(0, MAX)
    .map((p) => {
      const [price = '0', size = '0', unit = 'g'] = p.split(':');
      return { price: Number(price) || 0, size: Number(size) || 0, unit: UNITS.some((u) => u.id === unit) ? unit : 'g' };
    });
const encode = (list: Item[]) => list.map((x) => `${x.price}:${x.size}:${x.unit}`).join(',');

export default function UnitPriceCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const items = decode(s.items);
  const cur = s.cur;
  const unitOf = (id: string) => UNITS.find((u) => u.id === id)!;
  const kinds = new Set(items.map((x) => unitOf(x.unit).kind));
  const mixed = kinds.size > 1;
  const kind = unitOf(items[0]?.unit ?? 'g').kind;
  const per = PER[kind];

  const priced = items.map((x) => pricePerUnit(x.price, x.size * unitOf(x.unit).base) * per.size);
  const valid = priced.filter((v) => Number.isFinite(v));
  const best = valid.length ? Math.min(...valid) : Number.NaN;
  const worst = valid.length ? Math.max(...valid) : Number.NaN;
  const bestIndex = priced.findIndex((v) => v === best);

  const update = (i: number, patch: Partial<Item>) => set('items', encode(items.map((x, j) => (j === i ? { ...x, ...patch } : x))));

  return (
    <section aria-label="Unit price calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <div>
            <div className="grid grid-cols-[1.5rem_minmax(0,1fr)_minmax(0,1fr)_5.5rem_2rem] gap-2 px-1 pb-1.5 text-xs text-muted">
              <span />
              <span>Price ({currencySymbol(cur)})</span>
              <span>Size</span>
              <span>Unit</span>
              <span />
            </div>
            <ol className="space-y-2">
              {items.map((x, i) => (
                <li key={i} className="grid grid-cols-[1.5rem_minmax(0,1fr)_minmax(0,1fr)_5.5rem_2rem] items-center gap-2">
                  <span className={`grid size-6 place-items-center rounded-md text-xs font-bold ${i === bestIndex && !mixed && valid.length > 1 ? 'bg-brand text-white' : 'bg-surface-2 text-muted'}`}>{LETTERS[i]}</span>
                  <InlineNumber label={`Product ${LETTERS[i]} price`} value={x.price} onChange={(v) => update(i, { price: v })} width="w-full" allowNegative={false} />
                  <InlineNumber label={`Product ${LETTERS[i]} size`} value={x.size} onChange={(v) => update(i, { size: v })} width="w-full" allowNegative={false} />
                  <select aria-label={`Product ${LETTERS[i]} unit`} value={x.unit} onChange={(e) => update(i, { unit: e.target.value })} className="h-10 w-full rounded-lg border border-line bg-surface px-2 text-sm font-medium outline-none focus:border-brand">
                    {UNITS.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                  {items.length > 2 ? (
                    <button type="button" aria-label={`Remove product ${LETTERS[i]}`} onClick={() => set('items', encode(items.filter((_, j) => j !== i)))} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg">
                      ✕
                    </button>
                  ) : (
                    <span />
                  )}
                </li>
              ))}
            </ol>
            <button
              type="button"
              disabled={items.length >= MAX}
              onClick={() => set('items', encode([...items, { price: 0, size: 0, unit: items.at(-1)?.unit ?? 'g' }]))}
              className="mt-3 h-10 rounded-xl border border-line bg-surface px-4 text-sm font-medium hover:border-brand/40 disabled:opacity-50"
            >
              + Add product
            </button>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
            <CurrencyPicker label="Currency" value={cur} onChange={(v) => set('cur', v)} codes={CURRENCY_CODES} />
            <button type="button" onClick={reset} className="h-12 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
              Reset
            </button>
          </div>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {mixed ? (
            <p className="text-sm text-warn">Some products are measured by weight and others by volume or count, so they can’t be compared. Use the same kind of unit for all of them.</p>
          ) : valid.length < 2 ? (
            <p className="text-sm text-muted">Enter the price and size of at least two products.</p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted">Best value</p>
                  <p className="mt-1 text-4xl font-bold tracking-tight">Product {LETTERS[bestIndex]}</p>
                  <p className="tabular mt-1 text-sm">
                    {formatMoney(best, cur, 2)} per {per.label}
                  </p>
                </div>
                <ShareButton />
              </div>
              <ul className="mt-6 space-y-2.5">
                {items.map((x, i) => {
                  const v = priced[i];
                  if (!Number.isFinite(v)) return null;
                  const more = ((v - best) / best) * 100;
                  return (
                    <li key={i} className={`rounded-xl border p-3.5 ${i === bestIndex ? 'border-brand bg-brand-soft/60' : 'border-line bg-surface'}`}>
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="font-semibold">
                          {LETTERS[i]} · {formatMoney(x.price, cur, 2)} for {x.size.toLocaleString(localeFor(cur))} {unitOf(x.unit).label}
                        </p>
                        <p className="tabular shrink-0 font-bold">
                          {formatMoney(v, cur, 2)}/{per.label}
                        </p>
                      </div>
                      <p className={`mt-0.5 text-xs ${i === bestIndex ? 'font-semibold text-brand' : 'text-muted'}`}>{i === bestIndex ? 'Cheapest per unit' : `${more.toFixed(1)}% more per ${per.label}`}</p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${(v / worst) * 100}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 text-xs text-muted">The cheapest per unit only saves money if you’ll use it all before it spoils.</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
