import {
  circleFrom,
  sector,
  type CircleInput,
} from "@/lib/calculators/geometry";
import { useUrlState } from "@/lib/hooks/useUrlState";
import { NumberField, SelectField } from "@/components/ui/fields";
import { Headline, ShareButton, StatGrid } from "./shared/results";

const DEFAULTS = { k: "r", v: 5, t: 90 };

const KINDS: { value: CircleInput; label: string }[] = [
  { value: "r", label: "Radius (r)" },
  { value: "d", label: "Diameter (d)" },
  { value: "C", label: "Circumference (C)" },
  { value: "A", label: "Area (A)" },
];

const f = (v: number, d = 6) =>
  Number.isFinite(v)
    ? Number(v.toFixed(d)).toLocaleString("en", { maximumFractionDigits: d })
    : "—";

function Diagram({ angle }: { angle: number }) {
  const r = 60;
  const cx = 80;
  const cy = 75;
  const t = (Math.min(359.999, Math.max(0, angle)) * Math.PI) / 180;
  const x = cx + r * Math.cos(-t);
  const y = cy + r * Math.sin(-t);
  return (
    <svg
      viewBox="0 0 160 150"
      className="mx-auto h-36 w-auto text-fg"
      role="img"
      aria-label="Circle with radius and highlighted sector"
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="var(--surface)"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {angle > 0 && (
        <path
          d={`M${cx},${cy} L${cx + r},${cy} A${r},${r} 0 ${t > Math.PI ? 1 : 0} 0 ${x},${y} Z`}
          fill="var(--brand-soft)"
          stroke="var(--brand)"
          strokeWidth="1.5"
        />
      )}
      <line
        x1={cx}
        y1={cy}
        x2={cx + r}
        y2={cy}
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx={cx} cy={cy} r="2.5" fill="currentColor" />
      <text
        x={cx + r / 2}
        y={cy + 13}
        textAnchor="middle"
        fontSize="12"
        fontWeight="600"
        fill="currentColor"
      >
        r
      </text>
    </svg>
  );
}

export default function CircleCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const kind = (KINDS.some((k) => k.value === s.k) ? s.k : "r") as CircleInput;
  const c = circleFrom(kind, s.v);
  const sec = c ? sector(c.radius, s.t) : null;
  const headline = kind === "A" ? ["Radius", c?.radius] : ["Area", c?.area];

  return (
    <section aria-label="Circle calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <SelectField
            label="I know the"
            value={kind}
            onChange={(v) => set("k", v)}
            options={KINDS}
          />
          <NumberField
            label={KINDS.find((k) => k.value === kind)!.label}
            value={s.v}
            onChange={(v) => set("v", v)}
            min={0}
            decimals={6}
          />
          <NumberField
            label="Sector angle (optional)"
            value={s.t}
            onChange={(v) => set("t", v)}
            min={0}
            max={360}
            suffix="°"
            decimals={4}
            slider={{ min: 0, max: 360, step: 1 }}
            hint="For arc length and the area of a slice."
          />
          <button
            type="button"
            onClick={reset}
            className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg"
          >
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!c || !sec ? (
            <p className="text-sm text-warn">Enter a positive value.</p>
          ) : (
            <>
              <Headline
                label={headline[0] as string}
                value={f(headline[1] as number)}
                action={<ShareButton />}
              />
              <div className="my-5">
                <Diagram angle={s.t} />
              </div>
              <StatGrid
                items={[
                  ["Radius (r)", f(c.radius)],
                  ["Diameter (d = 2r)", f(c.diameter)],
                  ["Circumference (C = 2πr)", f(c.circumference)],
                  ["Area (A = πr²)", f(c.area)],
                ]}
              />
              {s.t > 0 && (
                <>
                  <p className="mt-6 mb-3 text-sm font-semibold">
                    Sector of {f(s.t, 4)}°
                  </p>
                  <StatGrid
                    items={[
                      ["Arc length", f(sec.arc)],
                      ["Sector area", f(sec.area)],
                      ["Chord length", f(sec.chord)],
                      ["Share of the circle", `${f((s.t / 360) * 100, 2)}%`],
                    ]}
                  />
                </>
              )}
              <p className="mt-4 text-xs text-muted">
                Results use π = 3.14159265…. Units: lengths share your input’s
                unit, and areas are in that unit squared.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
