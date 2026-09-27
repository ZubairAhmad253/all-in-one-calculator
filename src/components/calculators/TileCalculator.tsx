import { M2_PER_FT2, tiles } from '@/lib/calculators/build';
import { CURRENCIES, currencySymbol, formatMoney, formatNumber, localeFor } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, SelectField, Tabs } from '@/components/ui/fields';
import { Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { u: 'metric', l: 4, w: 3, lft: 12, wft: 10, tl: 30, tw: 30, tlin: 12, twin: 12, grout: 3, groutin: 0.125, waste: 10, box: 11, price: 0, cur: 'USD' };

const IN = 0.0254;
const LAYOUTS = [
  { value: 10, label: 'Straight lay (10% waste)' },
  { value: 15, label: 'Diagonal or herringbone (15%)' },
  { value: 5, label: 'Simple room, few cuts (5%)' },
  { value: 20, label: 'Complex room or large tiles (20%)' },
];

export default function TileCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const metric = s.u !== 'imperial';
  const area = metric ? s.l * s.w : s.lft * s.wft * M2_PER_FT2;
  const tl = metric ? s.tl / 100 : s.tlin * IN;
  const tw = metric ? s.tw / 100 : s.twin * IN;
  const grout = metric ? s.grout / 1000 : s.groutin * IN;
  const r = tiles({ area, tileLength: tl, tileWidth: tw, grout, wastePct: s.waste, perBox: Math.round(s.box) });
  const cur = s.cur;
  const showArea = (m2: number) => (metric ? `${formatNumber(m2, 2)} m²` : `${formatNumber(m2 / M2_PER_FT2, 1)} ft²`);

  return (
    <section aria-label="Tile calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <Tabs
            value={metric ? 'metric' : 'imperial'}
            onChange={(v) => set('u', v)}
            tabs={[
              { value: 'metric', label: 'Metric (m, cm)' },
              { value: 'imperial', label: 'US (ft, in)' },
            ]}
          />
          <div>
            <p className="mb-1.5 text-sm font-medium">Area to tile</p>
            <div className="grid grid-cols-2 items-start gap-3">
              {metric ? (
                <>
                  <NumberField label="Length" value={s.l} onChange={(v) => set('l', v)} suffix="m" min={0} decimals={2} />
                  <NumberField label="Width" value={s.w} onChange={(v) => set('w', v)} suffix="m" min={0} decimals={2} />
                </>
              ) : (
                <>
                  <NumberField label="Length" value={s.lft} onChange={(v) => set('lft', v)} suffix="ft" min={0} decimals={1} />
                  <NumberField label="Width" value={s.wft} onChange={(v) => set('wft', v)} suffix="ft" min={0} decimals={1} />
                </>
              )}
            </div>
            <p className="mt-1.5 text-xs text-muted">For a wall, use its width and height.</p>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium">Tile size</p>
            <div className="grid grid-cols-3 items-start gap-3">
              {metric ? (
                <>
                  <NumberField label="Length" value={s.tl} onChange={(v) => set('tl', v)} suffix="cm" min={0} decimals={1} />
                  <NumberField label="Width" value={s.tw} onChange={(v) => set('tw', v)} suffix="cm" min={0} decimals={1} />
                  <NumberField label="Grout" value={s.grout} onChange={(v) => set('grout', v)} suffix="mm" min={0} max={20} decimals={1} />
                </>
              ) : (
                <>
                  <NumberField label="Length" value={s.tlin} onChange={(v) => set('tlin', v)} suffix="in" min={0} decimals={2} />
                  <NumberField label="Width" value={s.twin} onChange={(v) => set('twin', v)} suffix="in" min={0} decimals={2} />
                  <NumberField label="Grout" value={s.groutin} onChange={(v) => set('groutin', v)} suffix="in" min={0} max={1} decimals={3} />
                </>
              )}
            </div>
          </div>
          <SelectField label="Layout and waste" value={LAYOUTS.some((x) => x.value === s.waste) ? s.waste : 10} onChange={(v) => set('waste', v)} options={LAYOUTS} />
          <div className="grid grid-cols-2 items-start gap-3">
            <NumberField label="Tiles per box" value={s.box} onChange={(v) => set('box', v)} min={0} max={1000} decimals={0} />
            <NumberField label="Price per box" value={s.price} onChange={(v) => set('price', v)} prefix={currencySymbol(cur)} locale={localeFor(cur)} min={0} decimals={2} />
          </div>
          <SelectField label="Currency" value={cur} onChange={(v) => set('cur', v)} options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} (${currencySymbol(c.code)})` }))} />
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!r ? (
            <p className="text-sm text-muted">Enter the area and the tile size.</p>
          ) : (
            <>
              <Headline label="Tiles to buy" value={formatNumber(r.count, 0)} action={<ShareButton />} />
              <p className="mt-2 text-sm text-muted">
                {formatNumber(Math.ceil(r.exact), 0)} tiles to cover the area, plus {s.waste}% for cuts and breakages
              </p>
              {Number.isFinite(r.boxes) && (
                <div className="mt-6 rounded-xl border border-brand/40 bg-brand-soft/60 p-4">
                  <p className="text-sm font-semibold">Buy</p>
                  <p className="mt-1 text-lg font-bold">
                    {formatNumber(r.boxes, 0)} box{r.boxes === 1 ? '' : 'es'} of {formatNumber(Math.round(s.box), 0)}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {formatNumber(r.boxes * Math.round(s.box), 0)} tiles
                    {s.price > 0 && ` · ${formatMoney(r.boxes * s.price, cur, 2)}`}
                  </p>
                </div>
              )}
              <div className="mt-6">
                <StatGrid
                  items={[
                    ['Area', showArea(area)],
                    ['One tile with grout', showArea(r.tileArea)],
                    ['Tiles per m²', formatNumber(1 / r.tileArea, 2)],
                    ['Tiles per ft²', formatNumber(M2_PER_FT2 / r.tileArea, 2)],
                  ]}
                />
              </div>
              <p className="mt-4 text-xs text-muted">Buy all tiles from the same batch (lot number) so the colour matches, and keep a few spare for future repairs.</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
