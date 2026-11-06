"use client";

import { useMemo, useState } from "react";
import {
  DEMO_BOOK,
  DEMO_ISOLATED_BOOK,
  DEMO_VOL_SHOCK_BPS,
  isolatedAccountAtShock,
  previewShockUnwind,
} from "@/lib/spanMath";
import { formatPercentFromBps, formatUsdcWhole } from "@/lib/format";

const e6 = (n: number) => BigInt(n) * 1_000_000n;

interface SweepPoint {
  shock: bigint;
  isolatedEquity: bigint;
  liquidated: boolean;
  bookEquity: bigint;
}

const SWEEP: SweepPoint[] = [];
{
  let shock = 2_000n;
  while (shock >= -3_000n) {
    const iso = isolatedAccountAtShock(
      DEMO_ISOLATED_BOOK.lpNotionalUsdc,
      DEMO_ISOLATED_BOOK.postedMarginUsdc,
      shock,
      DEMO_VOL_SHOCK_BPS,
    );
    const book = previewShockUnwind(
      DEMO_BOOK.lpNotionalUsdc,
      DEMO_BOOK.shortNotionalUsdc,
      DEMO_BOOK.postedMarginUsdc,
      shock,
      DEMO_VOL_SHOCK_BPS,
    );
    SWEEP.push({
      shock,
      isolatedEquity: iso.equityUsdc,
      liquidated: iso.liquidated,
      bookEquity: book.remainingEquityUsdc,
    });
    shock -= 100n;
  }
}

const CRASH_INDEX = SWEEP.length - 1;
const W = 740;
const H = 240;
const TICK_H = 210;
const PAD_R = 14;
const Y_MAX = e6(26_000);

const cx = (shock: bigint) => {
  const t = Number((2_000n - shock) * 1000n) / 1000 / 5000;
  return Math.max(2, Math.min(W - PAD_R, 2 + t * (W - 2 - PAD_R)));
};
const cy = (eq: bigint) => {
  const t = Number((eq * 1000n) / Y_MAX) / 1000;
  return TICK_H - Math.max(0, Math.min(1, t)) * TICK_H;
};

function path(select: (s: SweepPoint) => bigint): string {
  return SWEEP.map(
    (s, i) => `${i === 0 ? "M" : "L"}${cx(s.shock).toFixed(1)},${cy(select(s)).toFixed(1)}`,
  ).join(" ");
}

const firstLiquidation = SWEEP.findIndex((s) => s.liquidated);

const Y_TICKS = [26_000, 20_000, 15_000, 10_000, 5_000].map((v) => ({
  v: e6(v),
  label: `$${v / 1000}k`,
}));

/**
 * Interactive: drag, scrub with arrow keys, or hover the plot to read
 * both accounts at any shock in the sweep. The crash end point —
 * where the demo book is evaluated — is the default cursor.
 */
export function StressChart() {
  const [index, setIndex] = useState(CRASH_INDEX);
  const current = SWEEP[index];

  const bookPath = useMemo(() => path((s) => s.bookEquity), []);
  const isoPath = useMemo(() => path((s) => s.isolatedEquity), []);
  const areaPath = useMemo(
    () =>
      path((s) => s.bookEquity) +
      ` L${cx(-3_000n).toFixed(1)},${cy(0n).toFixed(1)} L${cx(2_000n).toFixed(1)},${cy(0n).toFixed(1)} Z`,
    [],
  );

  const cursorX = cx(current.shock);
  const tooltipLeft = Math.min(72, Math.max(2, (cursorX / W) * 100));

  const onScrub = (value: string) => setIndex(Number(value));

  return (
    <div className="px-5 pb-4 pt-4">
      <div className="mb-3 flex flex-wrap items-center gap-5 text-[12px] text-muted">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="h-[2px] w-5 rounded-full bg-cobalt" />
          ZeroMargin book
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="h-[2px] w-5 rounded-full bg-line-strong" />
          Isolated LP account
        </span>
        {firstLiquidation !== -1 && (
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="h-3 w-3 rounded-[3px] bg-down-dim" />
            Liquidation zone from{" "}
            {formatPercentFromBps(-SWEEP[firstLiquidation].shock, 0)}
          </span>
        )}
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label={`Interactive equity sweep: ${formatPercentFromBps(-current.shock, 0)} shock, isolated account ${formatUsdcWhole(current.isolatedEquity)}, ZeroMargin book ${formatUsdcWhole(current.bookEquity)}`}
        >
          {Y_TICKS.map((t) => (
            <g key={t.label}>
              <line x1={0} x2={W} y1={cy(t.v)} y2={cy(t.v)} stroke="var(--line)" />
              <text
                x={8}
                y={cy(t.v) - 4}
                fill="var(--text-dim)"
                fontSize="10"
                fontFamily="var(--font-data), monospace"
              >
                {t.label}
              </text>
            </g>
          ))}

          {firstLiquidation !== -1 && (
            <rect
              x={cx(SWEEP[firstLiquidation].shock)}
              y={0}
              width={W - cx(SWEEP[firstLiquidation].shock)}
              height={TICK_H + 14}
              fill="var(--red-dim)"
              opacity="0.45"
            />
          )}

          <path d={isoPath} fill="none" stroke="var(--line-strong)" strokeWidth="2" />
          <path d={areaPath} fill="var(--cobalt-dim)" opacity="0.35" />
          <path d={bookPath} fill="none" stroke="var(--cobalt)" strokeWidth="2.5" />

          {/* cursor */}
          <line
            x1={cursorX}
            x2={cursorX}
            y1={0}
            y2={TICK_H + 14}
            stroke="var(--line-strong)"
            strokeDasharray="3 4"
          />
          <circle cx={cursorX} cy={cy(current.bookEquity)} r="4.5" fill="var(--cobalt)" />
          <circle
            cx={cursorX}
            cy={cy(current.isolatedEquity)}
            r="4.5"
            fill={current.liquidated ? "var(--red)" : "var(--line-strong)"}
          />

          <line
            x1={0}
            x2={W}
            y1={TICK_H + 14}
            y2={TICK_H + 14}
            stroke="var(--line-strong)"
          />
        </svg>

        {/* tooltip */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1 z-10 w-44 -translate-x-1/2 rounded-card border border-line-strong bg-surface-raised/95 p-3 backdrop-blur"
          style={{ left: `${tooltipLeft}%` }}
        >
          <p className="font-mono text-[11px] tracking-wide text-dim">
            shock {current.shock < 0n ? "−" : "+"}
            {formatPercentFromBps(current.shock < 0n ? -current.shock : current.shock, 0)}
          </p>
          <p className="mt-1.5 flex justify-between gap-2 text-[12px]">
            <span className="text-muted">Isolated</span>
            <span
              className={`font-mono tabular-nums ${current.liquidated ? "text-down" : "text-muted"}`}
            >
              {formatUsdcWhole(current.isolatedEquity)}
            </span>
          </p>
          <p className="mt-1 flex justify-between gap-2 text-[12px]">
            <span className="text-muted">ZeroMargin</span>
            <span className="font-mono tabular-nums text-cobalt">
              {formatUsdcWhole(current.bookEquity)}
            </span>
          </p>
        </div>
      </div>

      {/* scrub control — keyboard accessible */}
      <div className="mt-2 flex items-center gap-3">
        <label htmlFor="sweep-scrub" className="text-[12px] text-dim">
          Inspect the sweep
        </label>
        <input
          id="sweep-scrub"
          type="range"
          min={0}
          max={SWEEP.length - 1}
          step={1}
          value={index}
          onChange={(e) => onScrub(e.target.value)}
          className="w-full"
          aria-valuetext={`shock ${formatPercentFromBps(current.shock, 0)} — isolated ${formatUsdcWhole(current.isolatedEquity)}, book ${formatUsdcWhole(current.bookEquity)}`}
        />
        <span className="shrink-0 font-mono text-[12px] tabular-nums text-muted">
          {current.shock < 0n ? "−" : "+"}
          {formatPercentFromBps(current.shock < 0n ? -current.shock : current.shock, 0)}
        </span>
      </div>
    </div>
  );
}
