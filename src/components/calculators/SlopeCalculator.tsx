import { gcd } from "@/lib/calculators/numbers";
import { lineThrough } from "@/lib/calculators/geometry";
import { useUrlState } from "@/lib/hooks/useUrlState";
import { NumberField, Tabs } from "@/components/ui/fields";
import { Headline, ShareButton, StatGrid } from "./shared/results";

const DEFAULTS = { mode: "points", x1: 1, y1: 2, x2: 4, y2: 8, m: 0.5 };

const f = (v: number, d = 6) =>
  Number.isFinite(v)
    ? (Number(v.toPrecision(12)) + 0).toLocaleString("en", {
        maximumFractionDigits: d,
        useGrouping: false,
      })
    : "—";

/** rise/run as a reduced fraction when both scale to whole numbers. */
function fraction(rise: number, run: number): string | null {
  for (const k of [1, 10, 100, 1000]) {
    const r = Math.round(rise * k);
    const n = Math.round(run * k);
    if (
      Math.abs(r - rise * k) < 1e-9 &&
      Math.abs(n - run * k) < 1e-9 &&
      n !== 0
    ) {
      const g = gcd(Math.abs(r), Math.abs(n)) || 1;
      const sign = r * n < 0 ? "−" : "";
      const top = Math.abs(r) / g;
      const bottom = Math.abs(n) / g;
      return bottom === 1 ? null : `${sign}${top}/${bottom}`;
    }
  }
  return null;
}

const equation = (m: number, b: number) => {
  if (m === 0) return `y = ${f(b)}`;
  const mx = m === 1 ? "x" : m === -1 ? "−x" : `${f(m).replace("-", "−")}x`;
  return b === 0
    ? `y = ${mx}`
    : `y = ${mx} ${b < 0 ? "−" : "+"} ${f(Math.abs(b))}`;
};

function Graph({
  x1,
  y1,
  x2,
  y2,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}) {
  const S = 200;
  const pad =
    1 + Math.max(Math.abs(x1), Math.abs(y1), Math.abs(x2), Math.abs(y2)) * 1.25;
  const px = (x: number) => S / 2 + (x / pad) * (S / 2);
  const py = (y: number) => S / 2 - (y / pad) * (S / 2);
  // Extend the line across the whole view.
  const vertical = x1 === x2;
  const m = vertical ? 0 : (y2 - y1) / (x2 - x1);
  const ends = vertical
    ? [
        [x1, -pad],
        [x1, pad],
      ]
    : [
        [-pad, y1 + m * (-pad - x1)],
        [pad, y1 + m * (pad - x1)],
      ];
  return (
    <svg
      viewBox={`0 0 ${S} ${S}`}
      className="mx-auto h-52 w-52 text-fg"
      role="img"
      aria-label="Graph of the line through the two points"
    >
      <defs>
        <clipPath id="slope-clip">
          <rect width={S} height={S} rx="10" />
        </clipPath>
      </defs>
      <rect
        width={S}
        height={S}
        rx="10"
        fill="var(--surface)"
        stroke="var(--line)"
      />
      <g clipPath="url(#slope-clip)">
        <line
          x1="0"
          y1={S / 2}
          x2={S}
          y2={S / 2}
          stroke="var(--muted)"
          strokeWidth="0.75"
        />
        <line
          x1={S / 2}
          y1="0"
          x2={S / 2}
          y2={S}
          stroke="var(--muted)"
          strokeWidth="0.75"
        />
        <line
          x1={px(ends[0][0])}
          y1={py(ends[0][1])}
          x2={px(ends[1][0])}
          y2={py(ends[1][1])}
          stroke="var(--brand)"
          strokeWidth="2"
        />
        {!vertical && y1 !== y2 && (
          <path
            d={`M${px(x1)},${py(y1)} H${px(x2)} V${py(y2)}`}
            fill="none"
            stroke="currentColor"
            strokeDasharray="3 3"
            strokeWidth="1"
          />
        )}
        {[
          [x1, y1],
          [x2, y2],
        ].map(([x, y], i) => (
          <circle
            key={i}
            cx={px(x)}
            cy={py(y)}
            r="4"
            fill="var(--brand)"
            stroke="var(--surface)"
            strokeWidth="1.5"
          />
        ))}
      </g>
    </svg>
  );
}

export default function SlopeCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const mode = s.mode === "point-slope" ? "point-slope" : "points";
  // In point-slope mode the second point is one unit along the line.
  const x2 = mode === "points" ? s.x2 : s.x1 + 1;
  const y2 = mode === "points" ? s.y2 : s.y1 + s.m;
  const l = lineThrough(s.x1, s.y1, x2, y2);
  const frac = l && !l.vertical ? fraction(l.rise, l.run) : null;

  return (
    <section aria-label="Slope calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <Tabs
            value={mode}
            onChange={(v) => set("mode", v)}
            tabs={[
              { value: "points", label: "Two points" },
              { value: "point-slope", label: "Point and slope" },
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="x₁"
              value={s.x1}
              onChange={(v) => set("x1", v)}
              decimals={6}
            />
            <NumberField
              label="y₁"
              value={s.y1}
              onChange={(v) => set("y1", v)}
              decimals={6}
            />
          </div>
          {mode === "points" ? (
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="x₂"
                value={s.x2}
                onChange={(v) => set("x2", v)}
                decimals={6}
              />
              <NumberField
                label="y₂"
                value={s.y2}
                onChange={(v) => set("y2", v)}
                decimals={6}
              />
            </div>
          ) : (
            <NumberField
              label="Slope (m)"
              value={s.m}
              onChange={(v) => set("m", v)}
              decimals={6}
            />
          )}
          <button
            type="button"
            onClick={reset}
            className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg"
          >
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!l ? (
            <p className="text-sm text-warn">
              The two points are the same, so they don’t define a line.
            </p>
          ) : (
            <>
              <Headline
                label="Slope (m)"
                value={
                  l.vertical
                    ? "Undefined"
                    : `${f(l.slope)}${frac ? ` = ${frac}` : ""}`
                }
                action={<ShareButton />}
                compact
              />
              {mode === "points" && (
                <p className="tabular mt-2 text-sm text-muted">
                  m = (y₂ − y₁) ÷ (x₂ − x₁) = ({f(s.y2)} − {f(s.y1)}) ÷ (
                  {f(s.x2)} − {f(s.x1)}) = {f(l.rise)} ÷ {f(l.run)}
                </p>
              )}
              <p className="tabular mt-3 text-lg font-semibold">
                {l.vertical ? `x = ${f(s.x1)}` : equation(l.slope, l.intercept)}
              </p>
              <div className="my-5">
                <Graph x1={s.x1} y1={s.y1} x2={x2} y2={y2} />
              </div>
              <StatGrid
                items={[
                  ["Angle", `${f(l.angle, 4)}°`],
                  ["Grade", l.vertical ? "—" : `${f(l.slope * 100, 4)}%`],
                  ["y-intercept", l.vertical ? "None" : f(l.intercept)],
                  [
                    "x-intercept",
                    Number.isFinite(l.xIntercept) ? f(l.xIntercept) : "None",
                  ],
                  ...(mode === "points"
                    ? ([
                        ["Distance", f(l.distance)],
                        [
                          "Midpoint",
                          `(${f(l.midpoint[0])}, ${f(l.midpoint[1])})`,
                        ],
                      ] as [string, string][])
                    : []),
                  [
                    "Perpendicular slope",
                    l.vertical
                      ? "0"
                      : l.slope === 0
                        ? "Undefined"
                        : f(-1 / l.slope),
                  ],
                  [
                    "Direction",
                    l.vertical
                      ? "Vertical"
                      : l.slope > 0
                        ? "Rising"
                        : l.slope < 0
                          ? "Falling"
                          : "Horizontal",
                  ],
                ]}
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
