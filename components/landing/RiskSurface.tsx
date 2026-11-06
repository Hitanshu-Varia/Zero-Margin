"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  DEMO_BOOK,
  DEMO_VOL_SHOCK_BPS,
  PRICE_SHOCKS_BPS,
  VOL_SHOCKS_BPS,
  evaluateSpan16,
  previewShockUnwind,
} from "@/lib/spanMath";
import { formatUsdcWhole, formatShock, formatShockAbs, formatPercentFromBps } from "@/lib/format";

/**
 * The risk surface: the product's own 16-scenario grid drawn to scale.
 * Eight price-shock columns by two volatility states, each cell
 * extruded by that scenario's net PnL on the demo book. Hovering or
 * scrubbing sweeps a scanner across the column band and the readout
 * answers beside it. Heights and colours are data, not decoration.
 */
export function RiskSurface() {
  const reduce = useReducedMotion();
  const [activeCol, setActiveCol] = useState(0);
  const touched = useRef(false);

  // One orchestrated entrance: the scanner marches across the columns
  // once, the way a desk calibrates on boot. Any interaction cancels it,
  // and reduced motion starts at the crash column, statically.
  useEffect(() => {
    if (reduce) {
      setActiveCol(0);
      return;
    }
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let step = 0; step <= 7; step++) {
      timers.push(
        setTimeout(() => {
          // march from the +2,000 edge down to the crash column
          if (!cancelled && !touched.current) setActiveCol(7 - step);
        }, 240 + step * 420),
      );
    }
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [reduce]);

  const takeControl = (col: number) => {
    touched.current = true;
    setActiveCol(col);
  };

  const span = useMemo(
    () => evaluateSpan16(DEMO_BOOK.lpNotionalUsdc, DEMO_BOOK.shortNotionalUsdc),
    [],
  );

  // signed net PnL per cell: index = col * 2 + volState
  const cells = useMemo(() => {
    const out: Array<{ col: number; row: number; pnl: bigint }> = [];
    for (let col = 0; col < PRICE_SHOCKS_BPS.length; col++) {
      for (let row = 0; row < VOL_SHOCKS_BPS.length; row++) {
        out.push({ col, row, pnl: span.scenarioNetPnlUsdc[col * 2 + row] });
      }
    }
    return out;
  }, [span]);

  const maxAbs = useMemo(
    () => cells.reduce((acc, c) => (c.pnl < 0n && -c.pnl > acc ? -c.pnl : c.pnl > acc ? c.pnl : acc), 1n),
    [cells],
  );

  // iso geometry
  const HW = 40; // diamond half-width
  const HH = 21; // diamond half-height
  const ROW_DX = 34; // front-row offset to the right
  const ROW_DY = 26;
  const BASE_Y = 128;
  const OX = 72;
  const MAX_Z = 116;

  const zOf = (pnl: bigint) => {
    const magnitude = pnl < 0n ? -pnl : pnl;
    return Math.max(2, Number((magnitude * BigInt(MAX_Z)) / maxAbs));
  };

  const originX = (col: number, row: number) => OX + col * (HW + 4) + row * ROW_DX;
  const originY = (col: number, row: number) => BASE_Y + row * ROW_DY;

  const diamond = (x: number, y: number, z: number) => {
    const top = `${x},${y - HH - z}`;
    const right = `${x + HW},${y - z}`;
    const bottom = `${x},${y + HH - z}`;
    const left = `${x - HW},${y - z}`;
    return { top, right, bottom, left };
  };

  const activeShock = PRICE_SHOCKS_BPS[activeCol];
  const activeQuote = previewShockUnwind(
    DEMO_BOOK.lpNotionalUsdc,
    DEMO_BOOK.shortNotionalUsdc,
    DEMO_BOOK.postedMarginUsdc,
    activeShock,
    DEMO_VOL_SHOCK_BPS,
  );

  return (
    <div className="rounded-panel border border-line bg-surface">
      {/* readout strip: the scanner answers here */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line px-5 py-3">
        <p className="text-[13px] font-medium text-text">
          Risk surface, 16 scenarios
        </p>
        <p className="font-mono text-[11px] tabular-nums text-dim">
          column {activeCol + 1} of 8, shock {formatShock(activeShock)} bps
        </p>
      </div>

      <svg
        viewBox="0 0 720 320"
        className="w-full touch-pan-y select-none"
        role="img"
        aria-label={`Isometric risk surface of sixteen margin scenarios. The current column is a ${formatShockAbs(activeShock)} basis point shock where the netted book settles with ${formatUsdcWhole(activeQuote.remainingEquityUsdc)} of equity.`}
        onMouseLeave={() => takeControl(0)}
      >
        {/* column hover bands, transparent, drive the scanner */}
        {PRICE_SHOCKS_BPS.map((_, col) => (
          <rect
            key={`band-${col}`}
            x={OX + col * (HW + 4) - HW - 2}
            y={10}
            width={HW * 2 + 8}
            height={290}
            fill={col === activeCol ? "color-mix(in srgb, var(--cobalt) 7%, transparent)" : "transparent"}
            onMouseEnter={() => takeControl(col)}
            style={{ cursor: "crosshair" }}
          />
        ))}

        {/* back row first so the front row overlaps correctly */}
        {[0, 1].map((row) =>
          cells
            .filter((c) => c.row === row)
            .map(({ col, row: r, pnl }) => {
              const x = originX(col, r);
              const y = originY(col, r);
              const z = zOf(pnl);
              const d = diamond(x, y, z);
              const loss = pnl < 0n;
              const intensity = Number(((pnl < 0n ? -pnl : pnl) * 100n) / maxAbs) / 100;
              const topFill = loss
                ? `color-mix(in srgb, var(--red) ${Math.round(30 + 70 * intensity)}%, var(--surface))`
                : pnl > 0n
                  ? `color-mix(in srgb, var(--green) ${Math.round(24 + 52 * intensity)}%, var(--surface))`
                  : "var(--line-strong)";
              const sideFill = loss
                ? `color-mix(in srgb, var(--red) ${Math.round(38 + 56 * intensity)}%, var(--background))`
                : pnl > 0n
                  ? `color-mix(in srgb, var(--green) ${Math.round(30 + 48 * intensity)}%, var(--background))`
                  : "var(--line)";
              const active = col === activeCol;
              return (
                <motion.g
                  key={`${col}-${r}`}
                  initial={reduce ? { opacity: 1 } : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 0.4,
                    delay: reduce ? 0 : 0.05 * col + 0.02 * r,
                    ease: "easeOut",
                  }}
                >
                  {/* left side face */}
                  <polygon
                    points={`${d.left} ${d.bottom} ${x},${y + HH} ${x - HW},${y}`}
                    fill={sideFill}
                  />
                  {/* right side face */}
                  <polygon
                    points={`${d.right} ${d.bottom} ${x},${y + HH} ${x + HW},${y}`}
                    fill={sideFill}
                    opacity="0.82"
                  />
                  {/* top face */}
                  <polygon
                    points={`${d.top} ${d.right} ${d.bottom} ${d.left}`}
                    fill={topFill}
                    stroke={active ? "var(--cobalt)" : "var(--line-strong)"}
                    strokeWidth={active ? 1.4 : 0.6}
                  />
                </motion.g>
              );
            }),
        )}

        {/* column tick strip */}
        {PRICE_SHOCKS_BPS.map((shock, col) => {
          const x = originX(col, 1) + 8;
          const active = col === activeCol;
          return (
            <g key={`tick-${col}`} onMouseEnter={() => takeControl(col)}>
              <text
                x={x}
                y={BASE_Y + ROW_DY + HH + 18}
                textAnchor="middle"
                fontSize="10"
                fontFamily="var(--font-data), monospace"
                fill={active ? "var(--cobalt)" : "var(--text-dim)"}
              >
                {shock === 0n ? "0" : `${shock < 0n ? "−" : "+"}${formatShockAbs(shock / 100n)}`}
              </text>
            </g>
          );
        })}
        <text
          x={12}
          y={BASE_Y + ROW_DY + HH + 18}
          fontSize="10"
          fontFamily="var(--font-data), monospace"
          fill="var(--text-dim)"
        >
          %
        </text>

        {/* scale legend: heights are scenario losses */}
        <g>
          <line x1={640} y1={150} x2={640} y2={252} stroke="var(--line-strong)" />
          <line x1={634} y1={150} x2={646} y2={150} stroke="var(--line-strong)" />
          <line x1={634} y1={252} x2={646} y2={252} stroke="var(--line-strong)" />
          <text
            x={652}
            y={154}
            fontSize="10"
            fontFamily="var(--font-data), monospace"
            fill="var(--text-dim)"
          >
            {formatUsdcWhole(maxAbs)}
          </text>
          <text
            x={652}
            y={256}
            fontSize="10"
            fontFamily="var(--font-data), monospace"
            fill="var(--text-dim)"
          >
            0
          </text>
        </g>
      </svg>

      {/* readout rows */}
      <div className="flex flex-wrap items-baseline gap-x-8 gap-y-1 border-t border-line px-5 py-3 font-mono text-[12px] tabular-nums">
        <span className="text-dim">
          shock <span className="text-text">{formatShock(activeShock)} bps</span>
        </span>
        <span className="text-dim">
          net PnL ν0 <span className="text-text">{formatUsdcWhole(span.scenarioNetPnlUsdc[activeCol * 2])}</span>
        </span>
        <span className="text-dim">
          net PnL ν150 <span className="text-text">{formatUsdcWhole(span.scenarioNetPnlUsdc[activeCol * 2 + 1])}</span>
        </span>
        <span className="text-dim">
          book after settle <span className="text-cobalt">{formatUsdcWhole(activeQuote.remainingEquityUsdc)}</span>
        </span>
        <span className="text-dim">
          haircut on matched notional <span className="text-text">{formatPercentFromBps(500n, 0)}</span>
        </span>
      </div>
    </div>
  );
}
