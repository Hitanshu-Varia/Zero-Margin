import type { Metadata } from "next";
import { Num } from "@/components/Num";
import { Panel } from "@/components/Panel";
import { ModeBadge } from "@/components/Badge";
import {
  BASIS_ROWS,
  CRASH_WINDOWS,
  computeBasisStats,
  sampleRows,
} from "@/lib/replayData";
import { BASIS_HAIRCUT_BPS } from "@/lib/spanMath";

export const metadata: Metadata = {
  title: "Replay",
};

const STATS = computeBasisStats(BASIS_ROWS);
const SAMPLE = sampleRows(90);

const W = 1080;
const H = 180;
const PAD_Y = 14;

/** Signed chart scale: the sampled basis range with headroom. */
const Y_MAX = (() => {
  const abs = SAMPLE.reduce((m, r) => Math.max(m, Math.abs(r.basisBps)), 0);
  return Math.ceil((abs * 1.15) / 50) * 50;
})();

function mid(): number {
  return PAD_Y + (H - PAD_Y * 2) / 2;
}

function y(v: number): number {
  const usable = H - PAD_Y * 2;
  const mid = PAD_Y + usable / 2;
  const clamped = Math.max(-Y_MAX, Math.min(Y_MAX, v));
  return mid - (clamped / Y_MAX) * (usable / 2);
}

function basisPath(): string {
  return SAMPLE.map((r, i) => {
    const x = (i / (SAMPLE.length - 1)) * W;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y(r.basisBps).toFixed(1)}`;
  }).join(" ");
}

export default function ReplayPage() {
  const haircut = BASIS_HAIRCUT_BPS / 100n; // 500 bps = 5.00%
  const covers = STATS.maxBps < 500;

  return (
    <main className="mx-auto w-full max-w-[1240px] px-4 pb-16 pt-6 md:px-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-medium tracking-tight">
            Cross-venue basis replay
          </h1>
          <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-muted">
            One-minute perp-versus-spot spread across three named crash
            windows. The engine charges a {Number(haircut)}% haircut on
            matched notional; the record below shows whether the worst
            one-minute spike sits inside it.
          </p>
        </div>
        <ModeBadge
          variant="local"
          title="DEMO DATASET"
          description="A deterministic, seeded series built by lib/replayData.ts — the seed and generator are committed in this repo. The submission pipeline replaces it with exchange candles whose SHA-256 is printed on each run."
        />
      </div>

      {/* Stat rail */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Panel bodyClassName="px-4 py-3.5">
          <div className="text-[11px] text-dim">
            Median basis
          </div>
          <Num size="lg" tone="text" className="mt-1.5 block">
            {STATS.medianBps.toFixed(1)} bps
          </Num>
        </Panel>
        <Panel bodyClassName="px-4 py-3.5">
          <div className="text-[11px] text-dim">
            99th percentile, nearest-rank
          </div>
          <Num size="lg" tone="cobalt" className="mt-1.5 block">
            {STATS.p99Bps.toFixed(1)} bps
          </Num>
        </Panel>
        <Panel bodyClassName="px-4 py-3.5">
          <div className="text-[11px] text-dim">
            Worst one-minute spike
          </div>
          <Num size="lg" tone="down" className="mt-1.5 block">
            {STATS.maxBps.toFixed(1)} bps
          </Num>
        </Panel>
      </div>

      {/* Chart */}
      <Panel
        className="mt-3"
        label="Basis, bps — 30 days sampled every 90 minutes"
        accent
        meta={covers ? "haircut covers the record" : "record exceeds the haircut"}
      >
        <div className="px-4 pb-4 pt-3">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            role="img"
            aria-label={`Basis time series reaching ${STATS.maxBps.toFixed(0)} basis points at its worst one-minute spike, inside a ${Number(haircut)} percent cross-venue haircut`}
          >
            {/* zero line */}
            <line
              x1="0"
              x2={W}
              y1={mid()}
              y2={mid()}
              stroke="var(--line)"
              strokeWidth="1"
            />
            {/* haircut ceiling */}
            <line
              x1="0"
              x2={W}
              y1={y(500)}
              y2={y(500)}
              stroke="var(--cobalt)"
              strokeWidth="1"
              strokeDasharray="5 5"
              opacity="0.6"
            />
            <text x={W - 4} y={y(500) - 5} textAnchor="end" fill="var(--cobalt)" fontSize="10" fontStyle="monospace">
              500 bps haircut
            </text>
            {/* crash windows */}
            {CRASH_WINDOWS.map((w) => {
              const x1 = (w.startRow / BASIS_ROWS.length) * W;
              const x2 = ((w.startRow + w.widthRows) / BASIS_ROWS.length) * W;
              const peak = Math.max(
                ...SAMPLE.filter(
                  (r) => r.ts >= w.startRow && r.ts <= w.startRow + w.widthRows,
                ).map((r) => r.basisBps),
              );
              return (
                <g key={w.date}>
                  <rect
                    x={x1}
                    y={PAD_Y / 2}
                    width={Math.max(4, x2 - x1)}
                    height={H - PAD_Y}
                    fill="var(--red-dim)"
                    opacity="0.5"
                  />
                  <text
                    x={(x1 + x2) / 2}
                    y={H - 2}
                    textAnchor="middle"
                    fill="var(--text-dim)"
                    fontSize="10"
                    fontFamily="var(--font-data), monospace"
                  >
                    {w.label}, {peak.toFixed(0)} bps
                  </text>
                </g>
              );
            })}
            <path
              d={basisPath()}
              fill="none"
              stroke="var(--text-dim)"
              strokeWidth="1"
            />
            {/* colored spikes over the crash windows */}
            {CRASH_WINDOWS.map((w) => {
              const pts = SAMPLE.filter(
                (r) => r.ts >= w.startRow - 30 && r.ts <= w.startRow + w.widthRows + 90,
              );
              const d = pts
                .map((r, i) => {
                  const x = ((r.ts / SAMPLE[SAMPLE.length - 1].ts)) * W;
                  return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y(r.basisBps).toFixed(1)}`;
                })
                .join(" ");
              return (
                <path
                  key={w.date}
                  d={d}
                  fill="none"
                  stroke="var(--red)"
                  strokeWidth="1.5"
                />
              );
            })}
          </svg>
        </div>
      </Panel>

      <p className="mt-5 max-w-3xl font-mono text-[12px] leading-relaxed text-dim">
        rows 43,200, seed 0x5A3F077, percentile method: nearest-rank on
        the sorted array, basisBps = (perpUsdc − spotUsdc) × 10,000 ÷
        spotUsdc, no smoothing and no outlier removal
      </p>
    </main>
  );
}
