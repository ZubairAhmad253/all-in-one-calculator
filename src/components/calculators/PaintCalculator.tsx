import { DOOR_M2, L_PER_US_GAL, M2_PER_FT2, M_PER_FT, paint, tins, WINDOW_M2 } from '@/lib/calculators/build';
import { CURRENCY_CODES, currencySymbol, formatMoney, formatNumber, localeFor } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, Tabs } from '@/components/ui/fields';
import { CurrencyPicker } from '@/components/ui/CurrencyPicker';
import { Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { u: 'metric', l: 4, w: 3.5, h: 2.4, lft: 14, wft: 12, hft: 8, doors: 1, windows: 1, coats: 2, ceil: 'no', cov: 10, covft: 350, price: 0, cur: 'USD' };

export default function PaintCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const metric = s.u !== 'imperial';
  const len = (m: number, ft: number) => (metric ? m : ft * M_PER_FT);
  // Coverage in m² per litre either way.
  const coverage = metric ? s.cov : (s.covft * M2_PER_FT2) / L_PER_US_GAL;
  const r = paint({ length: len(s.l, s.lft), width: len(s.w, s.wft), height: len(s.h, s.hft), doors: s.doors, windows: s.windows, coats: s.coats, includeCeiling: s.ceil === 'yes', coverage });

  const area = (m2: number) => (metric ? `${formatNumber(m2, 1)} m²` : `${formatNumber(m2 / M2_PER_FT2, 0)} ft²`);
  const amount = r ? (metric ? r.litres : r.litres / L_PER_US_GAL) : 0;
  const sizes = metric ? [10, 5, 2.5, 1] : [5, 1, 0.25];
  const pack = r ? tins(amount, sizes) : [];
  const tinLabel = (size: number) => (metric ? `${formatNumber(size, 1)} L` : size === 0.25 ? 'quart' : size === 1 ? 'gallon' : '5-gallon bucket');
  const bought = pack.reduce((a, t) => a + t.size * t.count, 0);
  const cur = s.cur;

  return (
    <section aria-label="Paint calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <Tabs
            value={metric ? 'metric' : 'imperial'}
            onChange={(v) => set('u', v)}
            tabs={[
              { value: 'metric', label: 'Metric (m, litres)' },
              { value: 'imperial', label: 'US (ft, gallons)' },
            ]}
          />
          <div className="grid grid-cols-3 items-start gap-3">
            {metric ? (
              <>
                <NumberField label="Length" value={s.l} onChange={(v) => set('l', v)} suffix="m" min={0} decimals={2} />
                <NumberField label="Width" value={s.w} onChange={(v) => set('w', v)} suffix="m" min={0} decimals={2} />
                <NumberField label="Height" value={s.h} onChange={(v) => set('h', v)} suffix="m" min={0} decimals={2} />
              </>
            ) : (
              <>
                <NumberField label="Length" value={s.lft} onChange={(v) => set('lft', v)} suffix="ft" min={0} decimals={1} />
                <NumberField label="Width" value={s.wft} onChange={(v) => set('wft', v)} suffix="ft" min={0} decimals={1} />
                <NumberField label="Height" value={s.hft} onChange={(v) => set('hft', v)} suffix="ft" min={0} decimals={1} />
              </>
            )}
          </div>
          <div className="grid grid-cols-3 items-start gap-3">
            <NumberField label="Doors" value={s.doors} onChange={(v) => set('doors', v)} min={0} max={20} decimals={0} />
            <NumberField label="Windows" value={s.windows} onChange={(v) => set('windows', v)} min={0} max={30} decimals={0} />
            <NumberField label="Coats" value={s.coats} onChange={(v) => set('coats', v)} min={1} max={5} decimals={0} />
          </div>
          <label className="flex items-center gap-2.5 text-sm">
            <input type="checkbox" checked={s.ceil === 'yes'} onChange={(e) => set('ceil', e.target.checked ? 'yes' : 'no')} className="size-4 accent-[var(--brand)]" />
            Paint the ceiling too
          </label>
          {metric ? (
            <NumberField label="Coverage" value={s.cov} onChange={(v) => set('cov', v)} suffix="m² per litre" min={1} max={30} decimals={1} hint="On the tin; most emulsions cover 10–12 m² per litre per coat." />
          ) : (
            <NumberField label="Coverage" value={s.covft} onChange={(v) => set('covft', v)} suffix="ft² per gallon" min={50} max={1000} decimals={0} hint="On the can; most paints cover 350–400 ft² per gallon per coat." />
          )}
          <div className="grid grid-cols-[minmax(0,1fr)_7rem] items-end gap-3">
            <NumberField label={`Price per ${metric ? 'litre' : 'gallon'} (optional)`} value={s.price} onChange={(v) => set('price', v)} prefix={currencySymbol(cur)} locale={localeFor(cur)} min={0} decimals={2} />
            <CurrencyPicker label="Currency" value={cur} onChange={(v) => set('cur', v)} codes={CURRENCY_CODES} />
          </div>
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!r ? (
            <p className="text-sm text-muted">Enter the room’s length, width and height.</p>
          ) : (
            <>
              <Headline label="Paint needed" value={metric ? `${formatNumber(amount, 1)} L` : `${formatNumber(amount, 2)} gal`} action={<ShareButton />} />
              <p className="mt-2 text-sm text-muted">
                {area(r.area)} × {r.coats} coat{r.coats === 1 ? '' : 's'}
              </p>
              <div className="mt-6 rounded-xl border border-brand/40 bg-brand-soft/60 p-4">
                <p className="text-sm font-semibold">Buy</p>
                <p className="mt-1 text-lg font-bold">{pack.map((t) => `${t.count} × ${tinLabel(t.size)}`).join(' + ')}</p>
                <p className="mt-1 text-xs text-muted">
                  {metric ? `${formatNumber(bought, 1)} L` : `${formatNumber(bought, 2)} gal`} in total
                  {s.price > 0 && ` · about ${formatMoney(bought * s.price, cur, 2)}`}
                </p>
              </div>
              <div className="mt-6">
                <StatGrid
                  items={[
                    ['Wall area', area(r.walls)],
                    ['Doors and windows', `− ${area(r.openings)}`],
                    ['Ceiling', r.ceiling ? area(r.ceiling) : 'Not included'],
                    ['Area to paint', area(r.area)],
                  ]}
                />
              </div>
              <p className="mt-4 text-xs text-muted">
                Assumes doors of about {area(DOOR_M2)} and windows of about {area(WINDOW_M2)}. Rough, porous or dark-to-light surfaces may need an extra coat or a primer.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
