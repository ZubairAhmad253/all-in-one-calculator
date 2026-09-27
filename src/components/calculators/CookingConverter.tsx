import { convertKitchen, findKitchenUnit, INGREDIENTS, KITCHEN_UNITS, type IngredientId } from '@/lib/calculators/cooking';
import { formatValue } from '@/lib/calculators/units';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, SelectField } from '@/components/ui/fields';
import { ShareButton } from './shared/results';

const DEFAULTS = { v: 1, from: 'cup', to: 'g', ing: 'flour' };
const AMOUNTS = [
  ['⅛ cup', 0.125],
  ['¼ cup', 0.25],
  ['⅓ cup', 1 / 3],
  ['½ cup', 0.5],
  ['⅔ cup', 2 / 3],
  ['¾ cup', 0.75],
  ['1 cup', 1],
] as const;

/** Kitchen-friendly rounding: whole grams above 10, one decimal below. */
const nice = (v: number) => (Number.isFinite(v) ? (Math.abs(v) >= 10 ? Math.round(v).toLocaleString('en') : formatValue(Number(v.toPrecision(3)))) : '—');

export default function CookingConverter() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const from = findKitchenUnit(s.from) ? s.from : 'cup';
  const to = findKitchenUnit(s.to) ? s.to : 'g';
  const ing = (INGREDIENTS.some((i) => i.id === s.ing) ? s.ing : 'flour') as IngredientId;
  const a = findKitchenUnit(from)!;
  const b = findKitchenUnit(to)!;
  const result = convertKitchen(s.v, from, to, ing);
  const usesDensity = a.kind !== b.kind;
  const ingredient = INGREDIENTS.find((i) => i.id === ing)!;
  const options = KITCHEN_UNITS.map((u) => ({ value: u.id, label: `${u.name} (${u.symbol})` }));

  return (
    <section aria-label="Cooking measurement converter" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <SelectField label="Ingredient" value={ing} onChange={(v) => set('ing', v)} options={INGREDIENTS.map((i) => ({ value: i.id, label: i.name }))} />
          <NumberField label="Amount" value={s.v} onChange={(v) => set('v', v)} min={0} decimals={4} suffix={a.symbol} />
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <SelectField label="From" value={from} onChange={(v) => set('from', v)} options={options} />
            <button
              type="button"
              aria-label="Swap units"
              onClick={() => {
                set('from', to);
                set('to', from);
                if (Number.isFinite(result)) set('v', Number(result.toPrecision(6)));
              }}
              className="mb-1 grid size-10 place-items-center rounded-xl border border-line bg-surface text-muted hover:text-fg"
            >
              ⇄
            </button>
            <SelectField label="To" value={to} onChange={(v) => set('to', v)} options={options} />
          </div>
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted">
                {formatValue(s.v)} {a.symbol} {usesDensity ? `of ${ingredient.name.toLowerCase()}` : ''} =
              </p>
              <p className="tabular mt-1 text-4xl font-bold tracking-tight break-words sm:text-5xl">
                {nice(result)} {b.symbol}
              </p>
            </div>
            <ShareButton />
          </div>
          <p className="mt-2 text-sm text-muted">
            {usesDensity ? `Using ${ingredient.gPerCup} g per US cup for ${ingredient.name.toLowerCase()}.` : 'A straight volume or weight conversion, so the ingredient doesn’t matter.'}
          </p>

          <p className="mt-6 mb-2 text-sm font-semibold">{ingredient.name}: cups to grams and ounces</p>
          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            <table className="tabular w-full text-sm">
              <thead className="bg-surface-2 text-left text-xs text-muted">
                <tr>
                  <th className="px-4 py-2.5 font-medium">US cups</th>
                  <th className="px-4 py-2.5 text-right font-medium">Grams</th>
                  <th className="px-4 py-2.5 text-right font-medium">Ounces</th>
                  <th className="px-4 py-2.5 text-right font-medium">Tablespoons</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {AMOUNTS.map(([label, cups]) => (
                  <tr key={label}>
                    <td className="px-4 py-2">{label}</td>
                    <td className="px-4 py-2 text-right font-medium">{nice(convertKitchen(cups, 'cup', 'g', ing))} g</td>
                    <td className="px-4 py-2 text-right">{formatValue(Number(convertKitchen(cups, 'cup', 'oz', ing).toPrecision(3)))} oz</td>
                    <td className="px-4 py-2 text-right">{formatValue(Number((cups * 16).toPrecision(3)))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">Weights are typical: how you fill the cup matters. Spoon flour into the cup and level it, rather than scooping, which packs in up to 20% more.</p>
        </div>
      </div>
    </section>
  );
}
