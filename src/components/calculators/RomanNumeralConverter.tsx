import { useId } from 'react';
import { fromRoman, ROMAN_MAX, toRoman } from '@/lib/calculators/numeral';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, Tabs } from '@/components/ui/fields';
import { ShareButton } from './shared/results';

const DEFAULTS = { mode: 'to', n: 2026, r: 'MCMXCIV' };

export default function RomanNumeralConverter() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const id = useId();
  const mode = s.mode === 'from' ? 'from' : 'to';
  const roman = toRoman(Math.round(s.n));
  const parsed = fromRoman(s.r);
  const value = 'value' in parsed ? parsed.value : null;
  // The breakdown always explains the number being shown.
  const breakdown = mode === 'to' ? roman : value !== null ? toRoman(value) : null;

  return (
    <section aria-label="Roman numeral converter" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <Tabs
            value={mode}
            onChange={(v) => set('mode', v)}
            tabs={[
              { value: 'to', label: 'Number → Roman' },
              { value: 'from', label: 'Roman → number' },
            ]}
          />
          {mode === 'to' ? (
            <NumberField label="Number" value={s.n} onChange={(v) => set('n', v)} min={1} max={ROMAN_MAX} decimals={0} hint={`Whole numbers from 1 to ${ROMAN_MAX.toLocaleString('en')}.`} />
          ) : (
            <div>
              <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
                Roman numeral
              </label>
              <input
                id={id}
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={s.r}
                onChange={(e) => set('r', e.target.value)}
                className="h-12 w-full rounded-xl border border-line bg-surface px-3.5 font-serif text-lg font-semibold tracking-wider uppercase outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
              />
              <p className="mt-1.5 text-xs text-muted">Letters I, V, X, L, C, D and M, in upper or lower case.</p>
            </div>
          )}
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {mode === 'to' ? (
                roman ? (
                  <>
                    <p className="text-sm font-medium text-muted">{Math.round(s.n).toLocaleString('en')} in Roman numerals</p>
                    <p className="mt-1 font-serif text-4xl font-bold tracking-wider break-all sm:text-5xl">{roman.numeral}</p>
                  </>
                ) : (
                  <p className="text-sm text-warn">Enter a whole number from 1 to {ROMAN_MAX.toLocaleString('en')}. Standard Roman numerals have no zero or negatives.</p>
                )
              ) : value !== null ? (
                <>
                  <p className="text-sm font-medium text-muted">{s.r.trim().toUpperCase()} as a number</p>
                  <p className="tabular mt-1 text-5xl font-bold tracking-tight">{value.toLocaleString('en')}</p>
                </>
              ) : (
                <p className="text-sm text-warn">{'error' in parsed ? parsed.error : ''}</p>
              )}
            </div>
            <ShareButton />
          </div>

          {breakdown && (
            <>
              <p className="mt-6 mb-2 text-sm font-semibold">How it breaks down</p>
              <div className="flex flex-wrap gap-2">
                {breakdown.parts.map((p, i) => (
                  <div key={i} className="rounded-xl border border-line bg-surface px-3 py-2 text-center">
                    <p className="font-serif text-lg font-bold">{p.symbol}</p>
                    <p className="tabular text-xs text-muted">{p.value.toLocaleString('en')}</p>
                  </div>
                ))}
              </div>
              <p className="tabular mt-3 text-sm text-muted">
                {breakdown.parts.map((p) => p.value.toLocaleString('en')).join(' + ')} = {breakdown.parts.reduce((a, p) => a + p.value, 0).toLocaleString('en')}
              </p>
            </>
          )}

          <div className="mt-6 grid grid-cols-7 gap-2 text-center">
            {[
              ['I', 1],
              ['V', 5],
              ['X', 10],
              ['L', 50],
              ['C', 100],
              ['D', 500],
              ['M', 1000],
            ].map(([sym, v]) => (
              <div key={sym} className="rounded-lg border border-line bg-surface py-2">
                <p className="font-serif font-bold">{sym}</p>
                <p className="tabular text-[11px] text-muted">{Number(v).toLocaleString('en')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
