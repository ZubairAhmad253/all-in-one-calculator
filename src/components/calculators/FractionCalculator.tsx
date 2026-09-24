import { useMemo } from 'react';
import { calculate, format, fromMixed, toMixed, FractionError, type Fraction, type FractionOp } from '@/lib/calculators/fraction';
import { formatResult } from '@/lib/calculators/expression';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { InlineNumber } from '@/components/ui/fields';
import { ShareButton } from './shared/results';

const DEFAULTS = { aw: 0, an: 3, ad: 4, op: 'add', bw: 0, bn: 5, bd: 6 };

const OPS: { key: string; op: FractionOp; label: string }[] = [
  { key: 'add', op: '+', label: 'Add' },
  { key: 'sub', op: '-', label: 'Subtract' },
  { key: 'mul', op: '×', label: 'Multiply' },
  { key: 'div', op: '÷', label: 'Divide' },
];

/** Whole number beside a stacked numerator / denominator. */
function FractionInput({ name, whole, num, den, onWhole, onNum, onDen }: {
  name: string;
  whole: number;
  num: number;
  den: number;
  onWhole: (v: number) => void;
  onNum: (v: number) => void;
  onDen: (v: number) => void;
}) {
  return (
    <fieldset className="flex items-center gap-2">
      <legend className="sr-only">{name}</legend>
      <InlineNumber label={`${name} whole number (optional)`} value={whole} onChange={onWhole} width="w-16" />
      <div className="flex flex-col items-center gap-1.5">
        <InlineNumber label={`${name} numerator`} value={num} onChange={onNum} width="w-20" />
        <span className="h-0.5 w-20 rounded bg-fg" aria-hidden="true" />
        <InlineNumber label={`${name} denominator`} value={den} onChange={onDen} width="w-20" allowNegative={false} />
      </div>
    </fieldset>
  );
}

/** Fraction drawn with a horizontal bar, optionally with a whole part. */
function StackedFraction({ f, mixed = false }: { f: Fraction; mixed?: boolean }) {
  const m = toMixed(f);
  const sign = m.sign < 0 ? '−' : '';
  if (f.d === 1) return <span className="text-5xl font-bold">{sign}{Math.abs(f.n)}</span>;
  const whole = mixed ? m.whole : 0;
  const top = mixed ? m.n : Math.abs(f.n);
  return (
    <span className="tabular inline-flex items-center gap-2 font-bold">
      <span className="text-5xl">
        {sign}
        {whole !== 0 ? whole : ''}
      </span>
      {top !== 0 && (
        <span className="inline-flex flex-col items-center text-3xl leading-tight">
          <span>{top}</span>
          <span className="my-0.5 h-0.5 w-full min-w-6 rounded bg-fg" aria-hidden="true" />
          <span>{f.d}</span>
        </span>
      )}
    </span>
  );
}

export default function FractionCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const op = OPS.find((o) => o.key === s.op) ?? OPS[0];

  const out = useMemo(() => {
    try {
      const a = fromMixed(s.aw, s.an, s.ad);
      const b = fromMixed(s.bw, s.bn, s.bd);
      return { ok: true as const, ...calculate(a, op.op, b) };
    } catch (e) {
      return { ok: false as const, error: e instanceof FractionError ? e.message : 'Check your fractions' };
    }
  }, [s.aw, s.an, s.ad, s.bw, s.bn, s.bd, op.op]);

  const isMixed = out.ok && toMixed(out.result).whole !== 0 && toMixed(out.result).n !== 0;

  return (
    <section aria-label="Fraction calculator" className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-5 p-5 sm:p-8">
        <FractionInput name="First fraction" whole={s.aw} num={s.an} den={s.ad} onWhole={(v) => set('aw', v)} onNum={(v) => set('an', v)} onDen={(v) => set('ad', v)} />

        <div role="group" aria-label="Operation" className="grid grid-cols-4 gap-1 rounded-xl bg-surface-2 p-1 sm:grid-cols-2">
          {OPS.map((o) => (
            <button
              key={o.key}
              type="button"
              aria-label={o.label}
              aria-pressed={o.key === op.key}
              onClick={() => set('op', o.key)}
              className={`grid size-11 place-items-center rounded-lg text-xl font-semibold transition ${o.key === op.key ? 'bg-brand text-brand-fg shadow-sm' : 'text-muted hover:text-fg'}`}
            >
              {o.op === '-' ? '−' : o.op}
            </button>
          ))}
        </div>

        <FractionInput name="Second fraction" whole={s.bw} num={s.bn} den={s.bd} onWhole={(v) => set('bw', v)} onNum={(v) => set('bn', v)} onDen={(v) => set('bd', v)} />
      </div>
      <p className="-mt-2 px-5 pb-5 text-center text-xs text-muted sm:px-8">The small box on the left of each fraction is for a whole number, e.g. 2 in 2 ¾. Leave it at 0 for a simple fraction.</p>

      <div className="border-t border-line bg-surface-2/50 p-5 sm:p-8" aria-live="polite">
        {out.ok ? (
          <div className="grid gap-8 md:grid-cols-[auto_minmax(0,1fr)]">
            <div>
              <div className="flex items-start justify-between gap-6">
                <p className="text-sm font-medium text-muted">Answer</p>
                <div className="flex gap-2 md:hidden">
                  <ShareButton />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
                <StackedFraction f={out.result} />
                {isMixed && (
                  <>
                    <span className="text-2xl text-muted">=</span>
                    <StackedFraction f={out.result} mixed />
                  </>
                )}
              </div>
              <dl className="tabular mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-line bg-surface p-3">
                  <dt className="text-xs text-muted">Simplified</dt>
                  <dd className="mt-1 font-semibold">{format(out.result).replace('-', '−')}</dd>
                </div>
                <div className="rounded-xl border border-line bg-surface p-3">
                  <dt className="text-xs text-muted">Decimal</dt>
                  <dd className="mt-1 font-semibold">{formatResult(out.decimal).replace('-', '−')}</dd>
                </div>
              </dl>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Step by step</h2>
                <div className="hidden gap-2 md:flex">
                  <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
                    Reset
                  </button>
                  <ShareButton />
                </div>
              </div>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6">
                {out.steps.map((step, i) => (
                  <li key={i} className="tabular">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : (
          <p className="text-center font-medium text-warn" role="alert">
            {out.error}
          </p>
        )}
      </div>
    </section>
  );
}
