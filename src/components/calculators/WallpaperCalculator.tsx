import { M_PER_FT, wallpaper } from '@/lib/calculators/build';
import { CURRENCIES, currencySymbol, formatMoney, formatNumber, localeFor } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, SelectField, Tabs } from '@/components/ui/fields';
import { Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { u: 'metric', l: 4.5, w: 3.5, h: 2.4, lft: 14, wft: 12, hft: 8, doors: 1, windows: 1, roll: 'eu', rep: 0, repin: 0, waste: 0, price: 0, cur: 'USD' };

const IN = 0.0254;
const ROLLS = [
  { value: 'eu', label: 'Standard (10.05 m × 53 cm)', length: 10.05, width: 0.53 },
  { value: 'eu-wide', label: 'Wide (10.05 m × 70 cm)', length: 10.05, width: 0.7 },
  { value: 'us-double', label: 'US double roll (27 ft × 20.5 in)', length: 27 * M_PER_FT, width: 20.5 * IN },
  { value: 'us-single', label: 'US single roll (13.5 ft × 20.5 in)', length: 13.5 * M_PER_FT, width: 20.5 * IN },
];
const DOOR_W = 0.9;
const WINDOW_W = 1.2;

export default function WallpaperCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const metric = s.u !== 'imperial';
  const roll = ROLLS.find((r) => r.value === s.roll) ?? ROLLS[0];
  const L = metric ? s.l : s.lft * M_PER_FT;
  const W = metric ? s.w : s.wft * M_PER_FT;
  const H = metric ? s.h : s.hft * M_PER_FT;
  const repeat = metric ? s.rep / 100 : s.repin * IN;
  // Doors skip a full drop; windows only half, since you still paper above and below them.
  const openingsWidth = Math.max(0, s.doors) * DOOR_W + Math.max(0, s.windows) * WINDOW_W * 0.5;
  const r = wallpaper({ perimeter: 2 * (L + W), height: H, rollLength: roll.length, rollWidth: roll.width, repeat, openingsWidth, wastePct: s.waste });
  const cur = s.cur;
  const len = (m: number) => (metric ? `${formatNumber(m, 2)} m` : `${formatNumber(m / M_PER_FT, 1)} ft`);

  return (
    <section aria-label="Wallpaper calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <Tabs
            value={metric ? 'metric' : 'imperial'}
            onChange={(v) => {
              set('u', v);
              set('roll', v === 'imperial' ? 'us-double' : 'eu');
            }}
            tabs={[
              { value: 'metric', label: 'Metric (m, cm)' },
              { value: 'imperial', label: 'US (ft, in)' },
            ]}
          />
          <div className="grid grid-cols-3 items-start gap-3">
            {metric ? (
              <>
                <NumberField label="Room length" value={s.l} onChange={(v) => set('l', v)} suffix="m" min={0} decimals={2} />
                <NumberField label="Room width" value={s.w} onChange={(v) => set('w', v)} suffix="m" min={0} decimals={2} />
                <NumberField label="Wall height" value={s.h} onChange={(v) => set('h', v)} suffix="m" min={0} decimals={2} />
              </>
            ) : (
              <>
                <NumberField label="Room length" value={s.lft} onChange={(v) => set('lft', v)} suffix="ft" min={0} decimals={1} />
                <NumberField label="Room width" value={s.wft} onChange={(v) => set('wft', v)} suffix="ft" min={0} decimals={1} />
                <NumberField label="Wall height" value={s.hft} onChange={(v) => set('hft', v)} suffix="ft" min={0} decimals={1} />
              </>
            )}
          </div>
          <div className="grid grid-cols-2 items-start gap-3">
            <NumberField label="Doors" value={s.doors} onChange={(v) => set('doors', v)} min={0} max={20} decimals={0} />
            <NumberField label="Windows" value={s.windows} onChange={(v) => set('windows', v)} min={0} max={20} decimals={0} />
          </div>
          <SelectField label="Roll size" value={roll.value} onChange={(v) => set('roll', v)} options={ROLLS.map(({ value, label }) => ({ value, label }))} />
          <div className="grid grid-cols-2 items-start gap-3">
            {metric ? (
              <NumberField label="Pattern repeat" value={s.rep} onChange={(v) => set('rep', v)} suffix="cm" min={0} max={200} decimals={1} hint="0 for plain paper" />
            ) : (
              <NumberField label="Pattern repeat" value={s.repin} onChange={(v) => set('repin', v)} suffix="in" min={0} max={80} decimals={1} hint="0 for plain paper" />
            )}
            <NumberField label="Extra rolls" value={s.waste} onChange={(v) => set('waste', v)} suffix="%" min={0} max={50} decimals={0} hint="Optional spare" />
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_7rem] items-end gap-3">
            <NumberField label="Price per roll (optional)" value={s.price} onChange={(v) => set('price', v)} prefix={currencySymbol(cur)} locale={localeFor(cur)} min={0} decimals={2} />
            <SelectField label="Currency" value={cur} onChange={(v) => set('cur', v)} options={CURRENCIES.map((c) => ({ value: c.code, label: c.code }))} />
          </div>
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!r ? (
            <p className="text-sm text-muted">Enter the room’s length, width and wall height.</p>
          ) : !Number.isFinite(r.rolls) ? (
            <p className="text-sm text-warn">One drop ({len(r.drop)}) is longer than a roll ({len(roll.length)}). Choose a longer roll or check the wall height and pattern repeat.</p>
          ) : (
            <>
              <Headline label="Rolls of wallpaper" value={formatNumber(r.rolls, 0)} action={<ShareButton />} />
              <p className="mt-2 text-sm text-muted">
                {r.drops} drops, {r.dropsPerRoll} from each roll
                {s.price > 0 && ` · about ${formatMoney(r.rolls * s.price, cur, 2)}`}
              </p>
              <div className="mt-6">
                <StatGrid
                  items={[
                    ['Wall width to cover', len(Math.max(0, 2 * (L + W) - openingsWidth))],
                    ['Length of each drop', len(r.drop)],
                    ['Drops per roll', String(r.dropsPerRoll)],
                    ['Drops needed', String(r.drops)],
                  ]}
                />
              </div>
              <p className="mt-4 text-xs text-muted">
                Each drop is the wall height rounded up to a whole pattern repeat, so patterned paper needs more rolls. Buy every roll from the same batch number, and consider one spare for repairs.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
