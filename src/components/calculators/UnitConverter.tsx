import { useState } from 'react';
import { QUANTITIES, belowMinimum, convert, findUnit, formatValue, joinCompound, splitCompound, type Quantity } from '@/lib/calculators/units';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, SelectField } from '@/components/ui/fields';
import { ShareButton } from './shared/results';

/** Formula text for pairs that aren't a simple multiplication. */
const TEMPERATURE_FORMULAS: Record<string, string> = {
  'c>f': '°F = °C × 9/5 + 32',
  'f>c': '°C = (°F − 32) × 5/9',
  'c>k': 'K = °C + 273.15',
  'k>c': '°C = K − 273.15',
  'f>k': 'K = (°F − 32) × 5/9 + 273.15',
  'k>f': '°F = (K − 273.15) × 9/5 + 32',
};

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copy ${label}`}
      title="Copy"
      onClick={async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* Clipboard blocked: nothing to do. */
        }
      }}
      className="grid size-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-fg"
    >
      {done ? (
        <span className="text-xs font-semibold text-accent">✓</span>
      ) : (
        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15V5a2 2 0 0 1 2-2h10" />
        </svg>
      )}
    </button>
  );
}

export default function UnitConverter({ quantity }: { quantity: string }) {
  const q: Quantity = QUANTITIES[quantity];
  const [s, set, reset] = useUrlState({ v: q.defaults.value, from: q.defaults.from, to: q.defaults.to });

  const c = q.compound;
  const validId = (id: string) => !!findUnit(q, id) || id === c?.id;
  const from = validId(s.from) ? s.from : q.defaults.from;
  const to = validId(s.to) ? s.to : q.defaults.to;
  /** A compound unit (ft + in) is stored and converted in its major unit (ft). */
  const base = (id: string) => (c && id === c.id ? c.major : id);

  const result = convert(q, s.v, base(from), base(to));
  const tooLow = belowMinimum(q, s.v, base(from));

  const unitName = (id: string) => (c && id === c.id ? c.name : findUnit(q, id)!.name);
  const shown = (v: number, id: string) => {
    if (c && id === c.id) {
      const p = splitCompound(c, v);
      return `${p.sign < 0 ? '−' : ''}${p.major} ${findUnit(q, c.major)!.symbol} ${formatValue(p.minor)} ${findUnit(q, c.minor)!.symbol}`;
    }
    return `${formatValue(v)} ${findUnit(q, id)!.symbol}`;
  };

  const options = [...q.units.map((u) => ({ value: u.id, label: `${u.name} (${u.symbol})` })), ...(c ? [{ value: c.id, label: c.name }] : [])];
  const min = q.positiveOnly ? 0 : undefined;

  const formula = (() => {
    if (quantity === 'temperature') return TEMPERATURE_FORMULAS[`${from}>${to}`];
    const f = convert(q, 1, base(from), base(to));
    if (from === to) return null;
    if (c && to === c.id) {
      const major = findUnit(q, c.major)!.name.toLowerCase();
      return `Multiply by ${formatValue(f)} to get ${major}, then multiply the decimal part by ${c.ratio} for ${findUnit(q, c.minor)!.name.toLowerCase()}`;
    }
    if (c && from === c.id) return `Add the ${findUnit(q, c.minor)!.name.toLowerCase()} ÷ ${c.ratio} to the ${findUnit(q, c.major)!.name.toLowerCase()}, then multiply by ${formatValue(f)}`;
    return `Multiply by ${formatValue(f)}`;
  })();

  const swap = () => {
    set('from', to);
    set('to', from);
    if (Number.isFinite(result)) set('v', Number(result.toPrecision(12)));
  };

  const valueInput = (id: string, value: number, onChange: (v: number) => void, label: string) => {
    if (c && id === c.id) {
      const p = splitCompound(c, value, 2);
      return (
        <div className="grid grid-cols-2 gap-2">
          <NumberField label={findUnit(q, c.major)!.name} value={p.major} onChange={(v) => onChange(joinCompound(c, v, p.minor))} suffix={findUnit(q, c.major)!.symbol} min={0} decimals={0} />
          <NumberField label={findUnit(q, c.minor)!.name} value={p.minor} onChange={(v) => onChange(joinCompound(c, p.major, v))} suffix={findUnit(q, c.minor)!.symbol} min={0} decimals={2} />
        </div>
      );
    }
    return <NumberField label={label} value={value} onChange={onChange} suffix={findUnit(q, id)!.symbol} min={min} decimals={10} />;
  };

  return (
    <div className="space-y-6">
      <section aria-label={`${q.noun} converter`} className="card p-5 sm:p-7">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-start">
          <div className="space-y-3">
            <SelectField label="From" value={from} onChange={(v) => set('from', v)} options={options} />
            {valueInput(from, s.v, (v) => set('v', v), 'Value')}
          </div>

          <button
            type="button"
            onClick={swap}
            aria-label="Swap units"
            title="Swap units"
            className="grid size-12 place-items-center justify-self-center rounded-full border border-line bg-surface text-muted transition hover:border-brand/40 hover:text-brand md:mt-7"
          >
            <svg className="size-5 md:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M8 20V4M8 4 4.5 7.5M8 4l3.5 3.5M16 4v16M16 20l-3.5-3.5M16 20l3.5-3.5" />
            </svg>
            <svg className="hidden size-5 md:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 7h11l-3-3M17 17H6l3 3" />
            </svg>
          </button>

          <div className="space-y-3">
            <SelectField label="To" value={to} onChange={(v) => set('to', v)} options={options} />
            {c && to === c.id ? (
              <div>
                <p className="mb-1.5 text-sm font-medium">Result</p>
                <p className="tabular flex h-12 items-center rounded-xl border border-line bg-surface-2 px-3.5 font-medium">{shown(result, to)}</p>
              </div>
            ) : (
              valueInput(to, Number.isFinite(result) ? Number(result.toPrecision(12)) : 0, (v) => set('v', convert(q, v, base(to), base(from))), 'Result')
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5" aria-live="polite">
          <div className="min-w-0">
            {tooLow ? (
              <p className="font-medium text-warn">That’s below absolute zero (−273.15 °C), the lowest possible temperature.</p>
            ) : (
              <>
                <p className="tabular text-2xl font-bold tracking-tight break-words sm:text-3xl">
                  {shown(s.v, from)} = {shown(result, to)}
                </p>
                {formula && <p className="mt-1 text-sm text-muted">{formula}</p>}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <CopyButton text={shown(result, to)} label="result" />
            <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
              Reset
            </button>
            <ShareButton />
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm font-medium">Common conversions</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {q.popular.map(([a, b]) => {
              const on = a === from && b === to;
              return (
                <button
                  key={a + b}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    set('from', a);
                    set('to', b);
                  }}
                  className={`h-8 rounded-lg border px-3 text-sm font-medium transition ${on ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface text-muted hover:border-brand/40 hover:text-fg'}`}
                >
                  {findUnit(q, a)!.symbol} → {findUnit(q, b)!.symbol}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {!tooLow && (
        <section aria-labelledby="all-units-heading" className="card overflow-hidden">
          <h2 id="all-units-heading" className="border-b border-line px-5 py-4 text-lg font-semibold sm:px-7">
            {shown(s.v, from)} in every unit
          </h2>
          <ul className="divide-y divide-line">
            {options
              .filter((o) => o.value !== from)
              .map((o) => {
                const v = convert(q, s.v, base(from), base(o.value));
                const text = shown(v, o.value);
                return (
                  <li key={o.value}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => set('to', o.value)}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), set('to', o.value))}
                      className={`flex cursor-pointer items-center gap-3 px-5 py-2.5 hover:bg-surface-2 sm:px-7 ${o.value === to ? 'bg-brand-soft/60' : ''}`}
                    >
                      <span className="min-w-0 flex-1 truncate text-sm text-muted">{unitName(o.value)}</span>
                      <span className="tabular text-right font-medium">{text}</span>
                      <CopyButton text={text} label={unitName(o.value)} />
                    </div>
                  </li>
                );
              })}
          </ul>
        </section>
      )}
    </div>
  );
}
