import { ACTIVITY_LEVELS, macroGrams, minimumCalories, tdee, type ActivityId, type Sex } from '@/lib/calculators/health';
import { formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, SelectField, Tabs } from '@/components/ui/fields';
import { Donut } from '@/components/charts/Donut';
import { BODY_DEFAULTS, BodyFields, HealthNote, readBody, SexAgeFields } from './shared/body';
import { ShareButton } from './shared/results';

const DEFAULTS = { ...BODY_DEFAULTS, sex: 'male', age: 30, act: 'moderate', goal: 'maintain', diet: 'balanced', kcal: 0, p: 30, c: 40, f: 30, meals: 3 };

const GOALS = [
  { value: 'lose', label: 'Lose weight (−500 kcal)', delta: -500 },
  { value: 'maintain', label: 'Maintain weight', delta: 0 },
  { value: 'gain', label: 'Build muscle (+300 kcal)', delta: 300 },
];

const DIETS = [
  { value: 'balanced', label: 'Balanced', split: [30, 40, 30] },
  { value: 'high-protein', label: 'High protein', split: [40, 35, 25] },
  { value: 'low-carb', label: 'Low carb', split: [35, 25, 40] },
  { value: 'keto', label: 'Keto', split: [25, 5, 70] },
  { value: 'low-fat', label: 'Low fat', split: [25, 55, 20] },
  { value: 'custom', label: 'Custom', split: [0, 0, 0] },
];

const MACROS = [
  { key: 'protein', label: 'Protein', color: 'var(--chart-1)', per: 4 },
  { key: 'carbs', label: 'Carbs', color: 'var(--chart-2)', per: 4 },
  { key: 'fat', label: 'Fat', color: 'var(--chart-3)', per: 9 },
] as const;

const g = (v: number) => `${formatNumber(Math.round(v), 0)} g`;

export default function MacroCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const { cm, kg } = readBody(s);
  const sex: Sex = s.sex === 'female' ? 'female' : 'male';
  const act = (ACTIVITY_LEVELS.some((a) => a.id === s.act) ? s.act : 'moderate') as ActivityId;
  const goal = GOALS.find((x) => x.value === s.goal) ?? GOALS[1];
  const diet = DIETS.find((d) => d.value === s.diet) ?? DIETS[0];
  const custom = diet.value === 'custom';
  const [p, c, f] = custom ? [s.p, s.c, s.f] : diet.split;
  const total = p + c + f;

  const auto = kg > 0 && cm > 0 && s.age >= 15 && s.age <= 100 ? tdee(sex, kg, cm, s.age, act) + goal.delta : Number.NaN;
  const calories = s.kcal > 0 ? s.kcal : Math.max(auto, minimumCalories(sex));
  const grams = macroGrams(calories, { protein: p, carbs: c, fat: f });
  const valid = Number.isFinite(calories) && calories > 0 && Math.abs(total - 100) < 0.01;
  const meals = Math.min(8, Math.max(1, Math.round(s.meals)));

  return (
    <section aria-label="Macro calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <SexAgeFields sex={s.sex} age={s.age} onSex={(v) => set('sex', v)} onAge={(v) => set('age', v)} />
          <BodyFields s={s} set={set} />
          <SelectField label="Activity level" value={act} onChange={(v) => set('act', v)} options={ACTIVITY_LEVELS.map((a) => ({ value: a.id, label: `${a.label}: ${a.detail}` }))} />
          <SelectField label="Goal" value={goal.value} onChange={(v) => set('goal', v)} options={GOALS.map(({ value, label }) => ({ value, label }))} />
          <NumberField
            label="Daily calories (optional)"
            value={s.kcal}
            onChange={(v) => set('kcal', v)}
            suffix="kcal"
            min={0}
            max={10000}
            decimals={0}
            hint={s.kcal > 0 ? 'Using your number. Set to 0 to estimate from your details.' : `Leave at 0 to use the estimate of ${Number.isFinite(auto) ? formatNumber(Math.round(auto), 0) : '—'} kcal.`}
          />
          <div>
            <p className="mb-1.5 text-sm font-medium">Diet style</p>
            <div className="grid grid-cols-3 gap-2">
              {DIETS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  aria-pressed={d.value === diet.value}
                  onClick={() => {
                    if (d.value === 'custom') {
                      set('p', p);
                      set('c', c);
                      set('f', f);
                    }
                    set('diet', d.value);
                  }}
                  className={`h-10 rounded-lg border px-2 text-sm font-medium transition ${d.value === diet.value ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface hover:border-brand/50'}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          {custom && (
            <div className="grid grid-cols-3 items-start gap-3">
              <NumberField label="Protein" value={s.p} onChange={(v) => set('p', v)} suffix="%" min={0} max={100} decimals={0} />
              <NumberField label="Carbs" value={s.c} onChange={(v) => set('c', v)} suffix="%" min={0} max={100} decimals={0} />
              <NumberField label="Fat" value={s.f} onChange={(v) => set('f', v)} suffix="%" min={0} max={100} decimals={0} />
            </div>
          )}
          {custom && Math.abs(total - 100) >= 0.01 && <p className="text-xs text-warn">Your split adds up to {formatNumber(total, 0)}%. Adjust it to 100%.</p>}
          <NumberField label="Meals per day" value={s.meals} onChange={(v) => set('meals', v)} min={1} max={8} decimals={0} />
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!valid ? (
            <p className="text-sm text-muted">Enter your details (age 15–100) or a calorie target, and a split that adds up to 100%.</p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted">Daily target</p>
                  <p className="tabular mt-1 text-4xl font-bold tracking-tight sm:text-5xl">{formatNumber(Math.round(calories), 0)} kcal</p>
                  <p className="mt-1 text-sm text-muted">
                    {diet.label} split: {p}% protein · {c}% carbs · {f}% fat
                  </p>
                </div>
                <ShareButton />
              </div>
              <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row">
                <Donut segments={MACROS.map((m) => ({ label: m.label, value: grams[m.key] * m.per, color: m.color }))} size={168}>
                  <div>
                    <p className="text-xs text-muted">Per day</p>
                    <p className="tabular text-sm font-semibold">{formatNumber(Math.round(calories), 0)} kcal</p>
                  </div>
                </Donut>
                <ul className="w-full flex-1 space-y-3 text-sm">
                  {MACROS.map((m) => (
                    <li key={m.key} className="flex items-center gap-2.5">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: m.color }} />
                      <span>{m.label}</span>
                      <span className="tabular ml-auto text-right">
                        <span className="text-lg font-semibold">{g(grams[m.key])}</span>
                        <span className="block text-xs text-muted">{formatNumber(Math.round(grams[m.key] * m.per), 0)} kcal</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface">
                <table className="tabular w-full text-sm">
                  <thead className="bg-surface-2 text-left text-xs text-muted">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Per</th>
                      {MACROS.map((m) => (
                        <th key={m.key} className="px-4 py-2.5 text-right font-medium">
                          {m.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    <tr>
                      <td className="px-4 py-2.5">Day</td>
                      {MACROS.map((m) => (
                        <td key={m.key} className="px-4 py-2.5 text-right">
                          {g(grams[m.key])}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5">Meal ({meals}/day)</td>
                      {MACROS.map((m) => (
                        <td key={m.key} className="px-4 py-2.5 text-right">
                          {g(grams[m.key] / meals)}
                        </td>
                      ))}
                    </tr>
                    {kg > 0 && (
                      <tr>
                        <td className="px-4 py-2.5">kg of body weight</td>
                        {MACROS.map((m) => (
                          <td key={m.key} className="px-4 py-2.5 text-right">
                            {formatNumber(grams[m.key] / kg, 1)} g
                          </td>
                        ))}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {s.kcal === 0 && auto < minimumCalories(sex) && <p className="mt-3 text-xs text-warn">Raised to {formatNumber(minimumCalories(sex), 0)} kcal, a common safe minimum.</p>}
            </>
          )}
        </div>
      </div>
      <HealthNote>Calories are estimated with Mifflin–St Jeor × your activity factor. Protein and carbs have 4 kcal per gram, fat 9.</HealthNote>
    </section>
  );
}
