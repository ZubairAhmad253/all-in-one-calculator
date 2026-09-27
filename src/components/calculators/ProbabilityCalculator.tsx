import { atLeastOnce, binomial, twoEvents } from '@/lib/calculators/stats';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, Tabs } from '@/components/ui/fields';
import { Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { mode: 'two', pa: 50, pb: 40, p: 5, tries: 20, n: 10, k: 7, bp: 50 };

const pct = (v: number) => (Number.isFinite(v) ? `${Number((v * 100).toPrecision(6)).toLocaleString('en', { maximumFractionDigits: 6 })}%` : '—');
const odds = (v: number) => (v > 0 && v < 1 ? `1 in ${Number((1 / v).toPrecision(4)).toLocaleString('en')}` : v >= 1 ? 'Certain' : 'Impossible');

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="tabular font-semibold">{pct(value)}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }} />
      </div>
    </div>
  );
}

export default function ProbabilityCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const mode = s.mode === 'repeat' || s.mode === 'binomial' ? s.mode : 'two';
  const pctField = { suffix: '%', min: 0, max: 100, decimals: 4 };

  const two = twoEvents(s.pa / 100, s.pb / 100);
  const tries = Math.max(0, Math.round(s.tries));
  const once = atLeastOnce(s.p / 100, tries);
  // Tries needed for a 50% / 95% / 99% chance of at least one success.
  const needed = (target: number) => (s.p > 0 && s.p < 100 ? Math.ceil(Math.log(1 - target) / Math.log(1 - s.p / 100)) : s.p >= 100 ? 1 : Number.NaN);

  const n = Math.min(10_000, Math.max(0, Math.round(s.n)));
  const k = Math.min(n, Math.max(0, Math.round(s.k)));
  const bp = s.bp / 100;
  let below = 0;
  for (let i = 0; i < k; i++) below += binomial(n, i, bp);
  const exact = binomial(n, k, bp);
  const clamp = (v: number) => Math.min(1, Math.max(0, v));

  return (
    <section aria-label="Probability calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <Tabs
            value={mode}
            onChange={(v) => set('mode', v)}
            tabs={[
              { value: 'two', label: 'Two events' },
              { value: 'repeat', label: 'Repeated tries' },
              { value: 'binomial', label: 'Binomial' },
            ]}
          />
          {mode === 'two' && (
            <>
              <NumberField label="Probability of A" value={s.pa} onChange={(v) => set('pa', v)} {...pctField} slider={{ min: 0, max: 100, step: 1 }} />
              <NumberField label="Probability of B" value={s.pb} onChange={(v) => set('pb', v)} {...pctField} slider={{ min: 0, max: 100, step: 1 }} />
              <p className="text-xs text-muted">A and B are treated as independent: one happening doesn’t change the chance of the other.</p>
            </>
          )}
          {mode === 'repeat' && (
            <>
              <NumberField label="Chance of success on each try" value={s.p} onChange={(v) => set('p', v)} {...pctField} hint="A die roll landing on six is 16.6667%." />
              <NumberField label="Number of tries" value={s.tries} onChange={(v) => set('tries', v)} min={0} max={1_000_000} decimals={0} />
            </>
          )}
          {mode === 'binomial' && (
            <>
              <NumberField label="Number of trials (n)" value={s.n} onChange={(v) => set('n', v)} min={0} max={10_000} decimals={0} />
              <NumberField label="Number of successes (k)" value={s.k} onChange={(v) => set('k', v)} min={0} max={10_000} decimals={0} />
              <NumberField label="Chance of success per trial (p)" value={s.bp} onChange={(v) => set('bp', v)} {...pctField} />
            </>
          )}
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {mode === 'two' && (
            <>
              <Headline label="P(A and B), both happen" value={pct(two.and)} action={<ShareButton />} />
              <div className="mt-6 space-y-4">
                <Bar label="A or B (at least one)" value={two.or} />
                <Bar label="Exactly one of A or B" value={two.xor} />
                <Bar label="Neither A nor B" value={two.neither} />
                <Bar label="Not A" value={two.notA} />
                <Bar label="Not B" value={two.notB} />
              </div>
              <p className="tabular mt-5 text-xs text-muted">
                P(A and B) = {pct(s.pa / 100)} × {pct(s.pb / 100)}; P(A or B) = P(A) + P(B) − P(A and B).
              </p>
            </>
          )}
          {mode === 'repeat' && (
            <>
              <Headline label={`Chance of at least one success in ${tries.toLocaleString('en')} tries`} value={pct(once)} action={<ShareButton />} />
              <p className="tabular mt-2 text-sm text-muted">1 − (1 − {pct(s.p / 100)})^{tries}</p>
              <div className="mt-6">
                <StatGrid
                  items={[
                    ['No success at all', pct(1 - once)],
                    ['Expected successes', (tries * s.p / 100).toLocaleString('en', { maximumFractionDigits: 4 })],
                    ['Tries for a 50% chance', Number.isFinite(needed(0.5)) ? needed(0.5).toLocaleString('en') : '—'],
                    ['Tries for a 95% chance', Number.isFinite(needed(0.95)) ? needed(0.95).toLocaleString('en') : '—'],
                  ]}
                />
              </div>
            </>
          )}
          {mode === 'binomial' && (
            <>
              <Headline label={`P(exactly ${k} of ${n})`} value={pct(exact)} action={<ShareButton />} />
              <p className="mt-2 text-sm text-muted">{odds(exact)}</p>
              <div className="mt-6">
                <StatGrid
                  items={[
                    [`At least ${k}`, pct(clamp(1 - below))],
                    [`At most ${k}`, pct(clamp(below + exact))],
                    [`Fewer than ${k}`, pct(clamp(below))],
                    [`More than ${k}`, pct(clamp(1 - below - exact))],
                    ['Mean (n × p)', (n * bp).toLocaleString('en', { maximumFractionDigits: 4 })],
                    ['Standard deviation', Math.sqrt(n * bp * (1 - bp)).toLocaleString('en', { maximumFractionDigits: 4 })],
                  ]}
                />
              </div>
              <p className="mt-3 text-xs text-muted">Formula: C(n, k) × pᵏ × (1 − p)ⁿ⁻ᵏ. Trials are independent with the same chance each time.</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
