import { combinations, combinationsWithRepetition, permutations, permutationsWithRepetition } from '@/lib/calculators/stats';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, Tabs } from '@/components/ui/fields';
import { ShareButton } from './shared/results';

const DEFAULTS = { n: 10, r: 3, order: 'no', rep: 'no' };
const MAX = 1000;

const big = (v: bigint) => v.toLocaleString('en');
const digits = (v: bigint) => v.toString().length;

export default function PermutationCombinationCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const n = Math.min(MAX, Math.max(0, Math.round(s.n)));
  const r = Math.min(MAX, Math.max(0, Math.round(s.r)));
  const ordered = s.order === 'yes';
  const rep = s.rep === 'yes';

  const results = [
    { key: 'no-no', title: 'Combinations', sub: 'order doesn’t matter, no repetition', formula: `C(${n}, ${r}) = ${n}! ÷ (${r}! × ${n - r}!)`, v: combinations(n, r) },
    { key: 'yes-no', title: 'Permutations', sub: 'order matters, no repetition', formula: `P(${n}, ${r}) = ${n}! ÷ ${n - r}!`, v: permutations(n, r) },
    { key: 'no-yes', title: 'Combinations with repetition', sub: 'order doesn’t matter, repeats allowed', formula: `C(${n} + ${r} − 1, ${r}) = (${n + r - 1})! ÷ (${r}! × ${n - 1}!)`, v: combinationsWithRepetition(n, r) },
    { key: 'yes-yes', title: 'Permutations with repetition', sub: 'order matters, repeats allowed', formula: `${n}^${r}`, v: permutationsWithRepetition(n, r) },
  ];
  const main = results.find((x) => x.key === `${ordered ? 'yes' : 'no'}-${rep ? 'yes' : 'no'}`)!;
  const tooMany = !rep && r > n;

  return (
    <section aria-label="Permutation and combination calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <NumberField label="Total items to choose from (n)" value={s.n} onChange={(v) => set('n', v)} min={0} max={MAX} decimals={0} />
          <NumberField label="Items chosen (r)" value={s.r} onChange={(v) => set('r', v)} min={0} max={MAX} decimals={0} />
          <div>
            <p className="mb-1.5 text-sm font-medium">Does the order matter?</p>
            <Tabs
              value={ordered ? 'yes' : 'no'}
              onChange={(v) => set('order', v)}
              tabs={[
                { value: 'no', label: 'No (a group)' },
                { value: 'yes', label: 'Yes (an arrangement)' },
              ]}
            />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium">Can an item be picked more than once?</p>
            <Tabs
              value={rep ? 'yes' : 'no'}
              onChange={(v) => set('rep', v)}
              tabs={[
                { value: 'no', label: 'No' },
                { value: 'yes', label: 'Yes' },
              ]}
            />
          </div>
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted">
                {main.title} ({main.sub})
              </p>
              <p className={`tabular mt-1 font-bold tracking-tight break-all ${digits(main.v) > 16 ? 'text-2xl' : 'text-4xl sm:text-5xl'}`}>{big(main.v)}</p>
              {digits(main.v) > 16 && <p className="mt-1 text-xs text-muted">{digits(main.v).toLocaleString('en')} digits</p>}
            </div>
            <ShareButton />
          </div>
          <p className="tabular mt-3 text-sm text-muted">{main.formula}</p>
          {tooMany && <p className="mt-2 text-sm text-warn">You can’t choose more items than there are without repetition, so the answer is 0.</p>}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {results.map((x) => (
              <button
                key={x.key}
                type="button"
                onClick={() => {
                  const [o, rp] = x.key.split('-');
                  set('order', o);
                  set('rep', rp);
                }}
                className={`rounded-xl border p-3.5 text-left transition ${x === main ? 'border-brand bg-brand-soft/60' : 'border-line bg-surface hover:border-brand/50'}`}
              >
                <span className="block text-xs text-muted">{x.title}</span>
                <span className="tabular mt-1 block font-semibold break-all">{digits(x.v) > 40 ? `${x.v.toString().slice(0, 12)}… (${digits(x.v)} digits)` : big(x.v)}</span>
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted">Every permutation is a combination counted once for each order: P(n, r) = C(n, r) × r!.</p>
        </div>
      </div>
    </section>
  );
}
