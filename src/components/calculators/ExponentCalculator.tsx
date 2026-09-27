import { powBig } from '@/lib/calculators/numbers';
import { formatResult } from '@/lib/calculators/expression';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { InlineNumber } from '@/components/ui/fields';
import { ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { b: 2, e: 10 };
const n = (v: number) => formatResult(v).replace('-', '−');

function explain(b: number, e: number): string | null {
  if (e === 0) return b === 0 ? '0⁰ is usually defined as 1 in algebra and counting.' : `Any non-zero number to the power 0 is 1.`;
  if (Number.isInteger(e) && e > 0 && e <= 8) return `${n(b)}^${e} = ${Array(e).fill(b < 0 ? `(${n(b)})` : n(b)).join(' × ')}`;
  if (Number.isInteger(e) && e < 0) return `A negative exponent means 1 divided by the positive power: ${n(b)}^${n(e)} = 1 ÷ ${n(b)}^${n(-e)}`;
  if (!Number.isInteger(e) && Number.isInteger(1 / e)) return `A power of 1/${n(1 / e)} is a root: ${n(b)}^${n(e)} = ${n(1 / e)}th root of ${n(b)}`;
  if (!Number.isInteger(e)) return `A fractional power combines a power and a root: b^(p/q) = qth root of b^p.`;
  return null;
}

export default function ExponentCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const exact = powBig(s.b, s.e);
  const value = Math.pow(s.b, s.e);
  const exactText = exact !== null && exact.toString().replace('-', '').length > 15 ? exact.toString() : null;
  const undefinedCase = Number.isNaN(value) || (s.b === 0 && s.e < 0);

  return (
    <section aria-label="Exponent calculator" className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-line p-5 text-2xl font-semibold sm:p-7">
        <InlineNumber label="Base" value={s.b} onChange={(v) => set('b', v)} width="w-28" />
        <span className="-mt-6 text-base">^</span>
        <InlineNumber label="Exponent" value={s.e} onChange={(v) => set('e', v)} width="w-24" />
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
          <ShareButton />
        </div>
      </div>
      <div className="p-5 sm:p-7" aria-live="polite">
        <p className="text-sm font-medium text-muted">
          {n(s.b)}^{n(s.e)} =
        </p>
        <p className="tabular mt-1 text-4xl font-bold tracking-tight break-all">{undefinedCase ? 'Undefined' : n(value)}</p>
        {undefinedCase && (
          <p className="mt-2 text-sm text-warn">{s.b === 0 ? 'Zero to a negative power would mean dividing by zero.' : 'A negative base with a fractional exponent has no real answer (it would be a complex number).'}</p>
        )}
        {!undefinedCase && explain(s.b, s.e) && <p className="tabular mt-3 text-sm text-muted">{explain(s.b, s.e)}</p>}
        {exactText && (
          <div className="mt-5">
            <p className="text-sm font-semibold">Exact value ({exactText.replace('-', '').length} digits)</p>
            <p className="tabular mt-2 max-h-40 overflow-y-auto rounded-xl border border-line bg-surface p-3 font-mono text-xs leading-5 break-all">{exactText}</p>
          </div>
        )}
        {!undefinedCase && (
          <div className="mt-6 max-w-xl">
            <StatGrid
              items={[
                ['Reciprocal (b^−e)', value !== 0 ? n(1 / value) : '—'],
                ['Square of the result', n(value * value)],
              ]}
            />
          </div>
        )}
      </div>
    </section>
  );
}
