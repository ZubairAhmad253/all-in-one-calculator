import { kgFromLb, lbFromKg, PROTEIN_GOALS, proteinRange, type ProteinGoalId } from '@/lib/calculators/health';
import { formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, SelectField, Tabs } from '@/components/ui/fields';
import { HealthNote } from './shared/body';
import { Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { u: 'metric', kg: 70, lb: 154, goal: 'active', meals: 3 };

/** Protein per typical serving. */
const FOODS = [
  { name: 'Chicken breast, cooked', serving: '100 g', g: 31 },
  { name: 'Tuna, canned in water', serving: '100 g', g: 25 },
  { name: 'Greek yogurt, plain', serving: '170 g pot', g: 17 },
  { name: 'Lentils, cooked', serving: '1 cup (198 g)', g: 18 },
  { name: 'Firm tofu', serving: '100 g', g: 15 },
  { name: 'Egg, large', serving: '1 egg', g: 6 },
  { name: 'Milk', serving: '1 cup (244 ml)', g: 8 },
  { name: 'Whey protein', serving: '1 scoop (30 g)', g: 24 },
];

const g = (v: number) => `${formatNumber(Math.round(v), 0)} g`;

export default function ProteinCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const metric = s.u !== 'imperial';
  const kg = metric ? s.kg : kgFromLb(s.lb);
  const goal = (PROTEIN_GOALS.some((p) => p.id === s.goal) ? s.goal : 'active') as ProteinGoalId;
  const r = proteinRange(kg, goal);
  const mid = (r.min + r.max) / 2;
  const meals = Math.min(8, Math.max(1, Math.round(s.meals)));
  const valid = kg > 0 && kg < 400;
  const single = r.min === r.max;

  return (
    <section aria-label="Protein calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <div>
            <p className="mb-1.5 text-sm font-medium">Units</p>
            <Tabs
              value={metric ? 'metric' : 'imperial'}
              onChange={(v) => {
                if (v === 'imperial' && metric) set('lb', Math.round(lbFromKg(s.kg) * 10) / 10);
                if (v === 'metric' && !metric) set('kg', Math.round(kgFromLb(s.lb) * 10) / 10);
                set('u', v);
              }}
              tabs={[
                { value: 'metric', label: 'Kilograms' },
                { value: 'imperial', label: 'Pounds' },
              ]}
            />
          </div>
          {metric ? (
            <NumberField label="Body weight" value={s.kg} onChange={(v) => set('kg', v)} suffix="kg" min={0} max={400} decimals={1} />
          ) : (
            <NumberField label="Body weight" value={s.lb} onChange={(v) => set('lb', v)} suffix="lb" min={0} max={880} decimals={1} />
          )}
          <SelectField label="Goal" value={goal} onChange={(v) => set('goal', v)} options={PROTEIN_GOALS.map((p) => ({ value: p.id, label: p.label }))} />
          <NumberField label="Meals per day" value={s.meals} onChange={(v) => set('meals', v)} min={1} max={8} decimals={0} />
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!valid ? (
            <p className="text-sm text-muted">Enter your body weight.</p>
          ) : (
            <>
              <Headline label="Protein per day" value={single ? g(r.min) : `${formatNumber(Math.round(r.min), 0)}–${g(r.max)}`} action={<ShareButton />} />
              <p className="mt-2 text-sm text-muted">
                {single ? r.perKg[0] : `${r.perKg[0]}–${r.perKg[1]}`} g per kg of body weight
                {!metric && ` (${single ? formatNumber(r.perKg[0] / 2.2046226218, 2) : `${formatNumber(r.perKg[0] / 2.2046226218, 2)}–${formatNumber(r.perKg[1] / 2.2046226218, 2)}`} g per lb)`}
              </p>
              <div className="mt-6">
                <StatGrid
                  items={[
                    [`Per meal (${meals} a day)`, single ? g(r.min / meals) : `${formatNumber(Math.round(r.min / meals), 0)}–${g(r.max / meals)}`],
                    ['Calories from protein', `${formatNumber(Math.round(r.min * 4), 0)}${single ? '' : `–${formatNumber(Math.round(r.max * 4), 0)}`} kcal`],
                  ]}
                />
              </div>
              <p className="mt-6 mb-2 text-sm font-semibold">What {g(mid)} of protein looks like</p>
              <div className="overflow-hidden rounded-xl border border-line bg-surface">
                <table className="tabular w-full text-sm">
                  <thead className="bg-surface-2 text-left text-xs text-muted">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Food</th>
                      <th className="px-4 py-2.5 text-right font-medium">Protein</th>
                      <th className="px-4 py-2.5 text-right font-medium">Servings for {g(mid)}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {FOODS.map((f) => (
                      <tr key={f.name}>
                        <td className="px-4 py-2.5">
                          {f.name}
                          <span className="block text-xs text-muted">{f.serving}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right">{f.g} g</td>
                        <td className="px-4 py-2.5 text-right font-medium">{formatNumber(mid / f.g, 1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-muted">Most people get protein from a mix of foods; the table just shows scale. Values are typical and vary by brand.</p>
            </>
          )}
        </div>
      </div>
      <HealthNote>Ranges follow the RDA and International Society of Sports Nutrition guidance. People with kidney disease should ask their doctor before eating more protein.</HealthNote>
    </section>
  );
}
