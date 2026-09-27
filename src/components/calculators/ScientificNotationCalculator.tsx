import { useId } from 'react';
import { parseScientific, roundSig, toScientific } from '@/lib/calculators/stats';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, SelectField, Tabs } from '@/components/ui/fields';
import { ShareButton } from './shared/results';

const DEFAULTS = { mode: 'convert', x: '602200000000000000000000', a: '3.2e5', b: '4e-2', op: '*', sig: 0 };

const SUP: Record<string, string> = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sup = (n: number) => String(n).replace(/./g, (c) => SUP[c] ?? c);

const OPS = [
  { value: '+', label: 'Add (+)' },
  { value: '-', label: 'Subtract (−)' },
  { value: '*', label: 'Multiply (×)' },
  { value: '/', label: 'Divide (÷)' },
];

function TextField({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  const id = useId();
  const invalid = value.trim() !== '' && Number.isNaN(parseScientific(value));
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="text"
        autoComplete="off"
        spellCheck={false}
        value={value}
        aria-invalid={invalid}
        onChange={(e) => onChange(e.target.value)}
        className={`tabular h-12 w-full rounded-xl border bg-surface px-3.5 text-base font-medium outline-none focus:ring-4 ${
          invalid ? 'border-warn focus:ring-warn/15' : 'border-line focus:border-brand focus:ring-brand/15'
        }`}
      />
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/** Full decimal form, e.g. 602,200,000,000,000,000,000,000 or 0.00000042. */
function decimalForm(x: number): string {
  if (x === 0) return '0';
  const abs = Math.abs(x);
  if (abs >= 1) return x.toLocaleString('en', { maximumSignificantDigits: 21 });
  const places = Math.min(100, -Math.floor(Math.log10(abs)) + 14);
  return x.toLocaleString('en', { maximumFractionDigits: places }).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}

const mant = (m: number) => String(Number(m.toPrecision(12)));

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-2.5">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="tabular text-right font-medium break-all">{value}</dd>
    </div>
  );
}

export default function ScientificNotationCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const mode = s.mode === 'math' ? 'math' : 'convert';

  let x = parseScientific(s.x);
  let working = '';
  if (mode === 'math') {
    const a = parseScientific(s.a);
    const b = parseScientific(s.b);
    x = s.op === '+' ? a + b : s.op === '-' ? a - b : s.op === '/' ? (b === 0 ? Number.NaN : a / b) : a * b;
    if (Number.isFinite(a) && Number.isFinite(b) && (s.op === '*' || s.op === '/')) {
      const A = toScientific(a);
      const B = toScientific(b);
      const m = s.op === '*' ? A.mantissa * B.mantissa : A.mantissa / B.mantissa;
      const e = s.op === '*' ? A.exponent + B.exponent : A.exponent - B.exponent;
      working = `(${mant(A.mantissa)} ${s.op === '*' ? '×' : '÷'} ${mant(B.mantissa)}) × 10${sup(e)} = ${mant(m)} × 10${sup(e)}`;
    }
  }
  const sig = Math.round(s.sig);
  if (Number.isFinite(x) && sig > 0) x = roundSig(x, sig);
  const ok = Number.isFinite(x);
  const sci = ok ? toScientific(x) : null;
  const eng = ok ? toScientific(x, true) : null;

  return (
    <section aria-label="Scientific notation calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <Tabs
            value={mode}
            onChange={(v) => set('mode', v)}
            tabs={[
              { value: 'convert', label: 'Convert' },
              { value: 'math', label: 'Arithmetic' },
            ]}
          />
          {mode === 'convert' ? (
            <TextField label="Number" value={s.x} onChange={(v) => set('x', v)} hint="Type 0.00042, 6.022e23 or 6.022 × 10^23." />
          ) : (
            <>
              <TextField label="First number" value={s.a} onChange={(v) => set('a', v)} hint="e.g. 3.2e5 or 3.2 × 10^5" />
              <SelectField label="Operation" value={s.op} onChange={(v) => set('op', v)} options={OPS} />
              <TextField label="Second number" value={s.b} onChange={(v) => set('b', v)} />
            </>
          )}
          <NumberField label="Significant figures (0 = keep all)" value={s.sig} onChange={(v) => set('sig', v)} min={0} max={15} decimals={0} />
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted">Scientific notation</p>
              <p className="tabular mt-1 text-4xl font-bold tracking-tight break-all">
                {sci ? (
                  <>
                    {mant(sci.mantissa)} × 10<sup>{sci.exponent}</sup>
                  </>
                ) : (
                  '—'
                )}
              </p>
            </div>
            <ShareButton />
          </div>
          {!ok && <p className="mt-3 text-sm text-warn">Enter a valid number{mode === 'math' && s.op === '/' ? ' (and don’t divide by zero)' : ''}.</p>}
          {sci && eng && (
            <dl className="mt-6 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface text-sm">
              <Row label="Decimal" value={decimalForm(x)} />
              <Row label="E notation" value={`${mant(sci.mantissa)}e${sci.exponent}`} />
              <Row label="Engineering" value={`${mant(eng.mantissa)} × 10${sup(eng.exponent)}`} />
              <Row label="Mantissa" value={mant(sci.mantissa)} />
              <Row label="Exponent" value={String(sci.exponent)} />
              {working && <Row label="Working" value={working} />}
            </dl>
          )}
        </div>
      </div>
    </section>
  );
}
