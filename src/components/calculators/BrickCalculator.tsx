import { BRICKS, bricks, M2_PER_FT2, M_PER_FT, type BrickId } from '@/lib/calculators/build';
import { CURRENCIES, currencySymbol, formatMoney, formatNumber, localeFor } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, SelectField, Tabs } from '@/components/ui/fields';
import { Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { u: 'metric', l: 6, h: 1.8, lft: 20, hft: 6, open: 0, openft: 0, brick: 'uk', joint: 10, jointin: 0.375, skins: 1, waste: 5, price: 0, cur: 'USD' };

export default function BrickCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const metric = s.u !== 'imperial';
  const brick = (BRICKS.some((b) => b.id === s.brick) ? s.brick : 'uk') as BrickId;
  const skins = s.skins === 2 ? 2 : 1;
  const gross = metric ? s.l * s.h : s.lft * s.hft * M2_PER_FT2;
  const openings = metric ? s.open : s.openft * M2_PER_FT2;
  const area = Math.max(0, gross - openings) * skins;
  const joint = metric ? s.joint / 1000 : s.jointin * 0.0254;
  const r = bricks(area, brick, joint, s.waste);
  const cur = s.cur;
  const sq = (m2: number) => (metric ? `${formatNumber(m2, 2)} m²` : `${formatNumber(m2 / M2_PER_FT2, 1)} ft²`);

  return (
    <section aria-label="Brick calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <Tabs
            value={metric ? 'metric' : 'imperial'}
            onChange={(v) => set('u', v)}
            tabs={[
              { value: 'metric', label: 'Metric (m, mm)' },
              { value: 'imperial', label: 'US (ft, in)' },
            ]}
          />
          <div className="grid grid-cols-2 items-start gap-3">
            {metric ? (
              <>
                <NumberField label="Wall length" value={s.l} onChange={(v) => set('l', v)} suffix="m" min={0} decimals={2} />
                <NumberField label="Wall height" value={s.h} onChange={(v) => set('h', v)} suffix="m" min={0} decimals={2} />
              </>
            ) : (
              <>
                <NumberField label="Wall length" value={s.lft} onChange={(v) => set('lft', v)} suffix="ft" min={0} decimals={1} />
                <NumberField label="Wall height" value={s.hft} onChange={(v) => set('hft', v)} suffix="ft" min={0} decimals={1} />
              </>
            )}
          </div>
          {metric ? (
            <NumberField label="Doors and windows to leave out" value={s.open} onChange={(v) => set('open', v)} suffix="m²" min={0} decimals={2} hint="Total area of any openings." />
          ) : (
            <NumberField label="Doors and windows to leave out" value={s.openft} onChange={(v) => set('openft', v)} suffix="ft²" min={0} decimals={1} hint="Total area of any openings." />
          )}
          <SelectField label="Brick size" value={brick} onChange={(v) => set('brick', v)} options={BRICKS.map((b) => ({ value: b.id, label: b.label }))} />
          <div className="grid grid-cols-2 items-start gap-3">
            {metric ? (
              <NumberField label="Mortar joint" value={s.joint} onChange={(v) => set('joint', v)} suffix="mm" min={0} max={30} decimals={1} />
            ) : (
              <NumberField label="Mortar joint" value={s.jointin} onChange={(v) => set('jointin', v)} suffix="in" min={0} max={1} decimals={3} />
            )}
            <SelectField
              label="Wall thickness"
              value={skins}
              onChange={(v) => set('skins', v)}
              options={[
                { value: 1, label: 'Single brick (half-brick)' },
                { value: 2, label: 'Double brick (one-brick)' },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 items-start gap-3">
            <NumberField label="Extra for waste" value={s.waste} onChange={(v) => set('waste', v)} suffix="%" min={0} max={30} decimals={0} />
            <NumberField label="Price per brick" value={s.price} onChange={(v) => set('price', v)} prefix={currencySymbol(cur)} locale={localeFor(cur)} min={0} decimals={3} />
          </div>
          <SelectField label="Currency" value={cur} onChange={(v) => set('cur', v)} options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} (${currencySymbol(c.code)})` }))} />
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!r ? (
            <p className="text-sm text-muted">Enter the wall size. Openings must be smaller than the wall.</p>
          ) : (
            <>
              <Headline label="Bricks needed" value={formatNumber(r.count, 0)} action={<ShareButton />} />
              <p className="mt-2 text-sm text-muted">
                {formatNumber(Math.ceil(r.exact), 0)} bricks + {s.waste}% for cuts and breakages
                {s.price > 0 && ` · about ${formatMoney(r.count * s.price, cur, 2)}`}
              </p>
              <div className="mt-6">
                <StatGrid
                  items={[
                    ['Wall area', sq(area)],
                    [metric ? 'Bricks per m²' : 'Bricks per ft²', formatNumber(metric ? r.perM2 * skins : r.perM2 * M2_PER_FT2 * skins, metric ? 1 : 2)],
                    ['Mortar (approx.)', metric ? `${formatNumber(r.mortar, 3)} m³` : `${formatNumber(r.mortar / M_PER_FT ** 3, 1)} ft³`],
                    ['Wall thickness', skins === 2 ? 'Double skin' : 'Single skin'],
                  ]}
                />
              </div>
              <p className="mt-4 text-xs text-muted">Mortar is an estimate for the joints only; mixing and droppings add more. Always check structural walls with a builder or engineer.</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
