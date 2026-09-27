import { flooring, M2_PER_FT2 } from '@/lib/calculators/build';
import { CURRENCIES, currencySymbol, formatMoney, formatNumber, localeFor } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { InlineNumber, NumberField, SelectField, Tabs } from '@/components/ui/fields';
import { Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { u: 'metric', rooms: '4.5x3.6,3.2x3', waste: 10, box: 2.2, price: 25, install: 0, cur: 'USD' };
const MAX_ROOMS = 12;

const decode = (t: string) =>
  t
    .split(',')
    .filter(Boolean)
    .slice(0, MAX_ROOMS)
    .map((p) => {
      const [l = '0', w = '0'] = p.split('x');
      return { l: Number(l) || 0, w: Number(w) || 0 };
    });
const encode = (rooms: { l: number; w: number }[]) => rooms.map((r) => `${r.l}x${r.w}`).join(',');

export default function FlooringCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const metric = s.u !== 'imperial';
  const u = metric ? 'm' : 'ft';
  const rooms = decode(s.rooms);
  // Everything is in the display unit's square measure, converted to m² for the maths.
  const toM2 = metric ? 1 : M2_PER_FT2;
  const areaUnits = rooms.reduce((a, r) => a + r.l * r.w, 0);
  const r = flooring(areaUnits * toM2, s.waste, s.box * toM2, s.price / toM2);
  const cur = s.cur;
  const sq = (m2: number) => `${formatNumber(m2 / toM2, 1)} ${u}²`;
  const installCost = r ? (r.area / toM2) * Math.max(0, s.install) : 0;

  const update = (i: number, patch: Partial<{ l: number; w: number }>) => set('rooms', encode(rooms.map((x, j) => (j === i ? { ...x, ...patch } : x))));

  return (
    <section aria-label="Flooring calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <Tabs
            value={metric ? 'metric' : 'imperial'}
            onChange={(v) => set('u', v)}
            tabs={[
              { value: 'metric', label: 'Metric (m²)' },
              { value: 'imperial', label: 'US (ft²)' },
            ]}
          />
          <div>
            <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,1fr)_2rem] gap-2 px-1 pb-1.5 text-xs text-muted">
              <span>Room</span>
              <span>Length ({u})</span>
              <span>Width ({u})</span>
              <span />
            </div>
            <ol className="space-y-2">
              {rooms.map((room, i) => (
                <li key={i} className="grid grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,1fr)_2rem] items-center gap-2">
                  <span className="text-sm font-medium">Room {i + 1}</span>
                  <InlineNumber label={`Room ${i + 1} length`} value={room.l} onChange={(v) => update(i, { l: v })} width="w-full" allowNegative={false} />
                  <InlineNumber label={`Room ${i + 1} width`} value={room.w} onChange={(v) => update(i, { w: v })} width="w-full" allowNegative={false} />
                  {rooms.length > 1 ? (
                    <button type="button" aria-label={`Remove room ${i + 1}`} onClick={() => set('rooms', encode(rooms.filter((_, j) => j !== i)))} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg">
                      ✕
                    </button>
                  ) : (
                    <span />
                  )}
                </li>
              ))}
            </ol>
            <button type="button" disabled={rooms.length >= MAX_ROOMS} onClick={() => set('rooms', encode([...rooms, { l: 0, w: 0 }]))} className="mt-3 h-10 rounded-xl border border-line bg-surface px-4 text-sm font-medium hover:border-brand/40 disabled:opacity-50">
              + Add room
            </button>
            <p className="mt-2 text-xs text-muted">Split L-shaped rooms into rectangles.</p>
          </div>
          <NumberField label="Waste allowance" value={s.waste} onChange={(v) => set('waste', v)} suffix="%" min={0} max={50} decimals={0} hint="5–10% for straight planks, 15% for diagonal or herringbone." />
          <NumberField label="Coverage per box (optional)" value={s.box} onChange={(v) => set('box', v)} suffix={`${u}²`} min={0} decimals={2} hint="Printed on the box. Set to 0 to skip." />
          <div className="grid grid-cols-2 items-start gap-3">
            <NumberField label={`Flooring price per ${u}²`} value={s.price} onChange={(v) => set('price', v)} prefix={currencySymbol(cur)} locale={localeFor(cur)} min={0} decimals={2} />
            <NumberField label={`Fitting per ${u}²`} value={s.install} onChange={(v) => set('install', v)} prefix={currencySymbol(cur)} locale={localeFor(cur)} min={0} decimals={2} hint="Optional" />
          </div>
          <SelectField label="Currency" value={cur} onChange={(v) => set('cur', v)} options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} (${currencySymbol(c.code)})` }))} />
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!r ? (
            <p className="text-sm text-muted">Enter the length and width of at least one room.</p>
          ) : (
            <>
              <Headline label="Flooring to buy" value={sq(Number.isFinite(r.boxes) ? r.bought : r.buy)} action={<ShareButton />} />
              <p className="mt-2 text-sm text-muted">
                {sq(r.area)} of floor + {s.waste}% waste
                {Number.isFinite(r.boxes) && ` = ${formatNumber(r.boxes, 0)} box${r.boxes === 1 ? '' : 'es'}`}
              </p>
              <div className="mt-6">
                <StatGrid
                  items={[
                    ['Floor area', sq(r.area)],
                    ['With waste', sq(r.buy)],
                    ['Boxes', Number.isFinite(r.boxes) ? formatNumber(r.boxes, 0) : '—'],
                    ['Flooring cost', formatMoney(r.cost, cur, 2)],
                    ['Fitting cost', installCost ? formatMoney(installCost, cur, 2) : '—'],
                    ['Total', formatMoney(r.cost + installCost, cur, 2)],
                  ]}
                />
              </div>
              {rooms.length > 1 && (
                <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface">
                  <table className="tabular w-full text-sm">
                    <tbody className="divide-y divide-line">
                      {rooms.map((room, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2">Room {i + 1}</td>
                          <td className="px-4 py-2 text-muted">
                            {formatNumber(room.l, 2)} × {formatNumber(room.w, 2)} {u}
                          </td>
                          <td className="px-4 py-2 text-right font-medium">{sq(room.l * room.w * toM2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="mt-4 text-xs text-muted">Fitting cost is charged on the floor area, not the waste. Let wood and laminate acclimatise in the room for 48 hours before laying.</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
