import { useLayoutEffect, useRef, useState } from 'react';

export interface BarLayer {
  label: string;
  color: string;
  values: number[];
}

interface Props {
  labels: (string | number)[];
  /** Stacked bottom to top. */
  layers: BarLayer[];
  formatY: (v: number) => string;
  formatTooltip: (v: number) => string;
  xTitle?: string;
}

const PAD = { top: 16, right: 12, bottom: 32, left: 64 };

function niceMax(v: number) {
  if (v <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * mag >= v / 4)! * mag;
  return Math.ceil(v / step) * step;
}

/** Stacked column chart (e.g. deposits + interest per year) with hover details. */
export function StackedBarChart({ labels, layers, formatY, formatTooltip, xTitle }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  // Draw at the real on-screen width so text stays readable on phones.
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(640);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    // Measure before first paint so labels never flash at the wrong size.
    setW(Math.max(Math.round(el.getBoundingClientRect().width), 280));
    const ro = new ResizeObserver(([e]) => setW(Math.max(Math.round(e.contentRect.width), 280)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const H = W < 480 ? 220 : 260;
  const n = labels.length;
  const totals = labels.map((_, i) => layers.reduce((s, l) => s + Math.max(l.values[i] ?? 0, 0), 0));
  const max = niceMax(Math.max(...totals, 0));
  const iw = W - PAD.left - PAD.right;
  const ih = H - PAD.top - PAD.bottom;
  const slot = iw / Math.max(n, 1);
  const barW = Math.max(Math.min(slot * 0.7, 36), 2);
  const x = (i: number) => PAD.left + slot * i + (slot - barW) / 2;
  const y = (v: number) => PAD.top + ih - (v / max) * ih;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const labelEvery = Math.max(1, Math.ceil(n / (W < 480 ? 6 : 12)));

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.floor((px - PAD.left) / slot);
    setHover(i >= 0 && i < n ? i : null);
  };

  return (
    <div ref={box} className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-pan-y select-none"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`${layers.map((l) => l.label).join(' and ')} by ${xTitle?.toLowerCase() ?? 'period'}`}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--line)" />
            <text x={PAD.left - 10} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize="11" fill="var(--muted)">
              {formatY(t)}
            </text>
          </g>
        ))}
        {labels.map((label, i) => {
          let base = 0;
          return (
            <g key={i} opacity={hover === null || hover === i ? 1 : 0.45} style={{ transition: 'opacity 120ms' }}>
              {layers.map((l) => {
                const v = Math.max(l.values[i] ?? 0, 0);
                const top = y(base + v);
                const h = y(base) - top;
                base += v;
                return h > 0 ? <rect key={l.label} x={x(i)} y={top} width={barW} height={h} fill={l.color} rx={Math.min(3, barW / 4)} /> : null;
              })}
              {(i % labelEvery === 0 || i === n - 1) && (n - 1 - i >= labelEvery / 2 || i === n - 1) && (
                <text x={x(i) + barW / 2} y={H - 10} textAnchor="middle" fontSize="11" fill="var(--muted)">
                  {label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-2 rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-card"
          style={{ left: `${((x(hover) + barW / 2) / W) * 100}%`, transform: `translateX(${hover > n / 2 ? '-110%' : '10%'})` }}
        >
          <p className="font-semibold">
            {xTitle} {labels[hover]}
          </p>
          {layers
            .slice()
            .reverse()
            .map((l) => (
              <p key={l.label} className="tabular mt-1 flex items-center gap-2 whitespace-nowrap">
                <span className="size-2 rounded-full" style={{ background: l.color }} />
                {l.label}: <span className="font-medium">{formatTooltip(l.values[hover] ?? 0)}</span>
              </p>
            ))}
          <p className="tabular mt-1 border-t border-line pt-1 font-medium">Total: {formatTooltip(totals[hover])}</p>
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
        {layers.map((l) => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}
