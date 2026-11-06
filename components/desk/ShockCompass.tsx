"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { DEMO_BOOK, PRICE_SHOCKS_BPS, evaluateSpan16, previewShockUnwind } from "@/lib/spanMath";
import { formatShock } from "@/lib/format";
import { cn } from "@/lib/cn";

const span = evaluateSpan16(DEMO_BOOK.lpNotionalUsdc, DEMO_BOOK.shortNotionalUsdc);
const TICKS = PRICE_SHOCKS_BPS;

/** Remaining equity after each grid shock — the spokes are data. */
const spokes = TICKS.map((shock) => {
  const q = previewShockUnwind(
    DEMO_BOOK.lpNotionalUsdc,
    DEMO_BOOK.shortNotionalUsdc,
    DEMO_BOOK.postedMarginUsdc,
    shock,
    150n,
  );
  return { shock, equity: q.remainingEquityUsdc, tick: shockTick(shock) };
});

function shockTick(shock: bigint): string {
  if (shock === 0n) return "0";
  const sign = shock < 0n ? "−" : "+";
  const abs = shock < 0n ? -shock : shock;
  return `${sign}${abs / 100n}%`;
}

const maxEquity = spokes.reduce((m, s) => (s.equity > m ? s.equity : m), 1n);

/**
 * The book's eight shocks as a compass: spoke length is equity that
 * comes back, the amber needle shows the selection, and the readout
 * answers in the center. One motion: the needle only.
 */
export function ShockCompass({ className = "", initialIndex = 3 }: { className?: string; initialIndex?: number }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(initialIndex);
  const active = spokes[index];

  const angle = (i: number) => ((i * 360) / spokes.length - 90) * (Math.PI / 180);

  return (
    <div className={cn("w-full max-w-[340px]", className)}>
      <div className="relative aspect-square w-full">
        <svg
          viewBox="0 0 100 100"
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <circle cx="50" cy="50" r="46" fill="none" stroke="var(--line-strong)" strokeWidth="0.4" />
          <circle cx="50" cy="50" r="18" fill="none" stroke="var(--line)" strokeWidth="0.4" />
          <line x1="50" y1="2" x2="50" y2="6" stroke="var(--line-strong)" strokeWidth="0.6" />
        </svg>

        {/* spokes: length encodes surviving equity */}
        {spokes.map((s, i) => {
          const a = angle(i);
          const inner = 18;
          const share = Number((s.equity * 100n) / maxEquity) / 100;
          const outer = inner + Math.max(0.1, share) * 24;
          const hot = i === index;
          return (
            <svg
              key={s.shock.toString()}
              viewBox="0 0 100 100"
              className="pointer-events-none absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              <line
                x1={50 + Math.cos(a) * inner}
                y1={50 + Math.sin(a) * inner}
                x2={50 + Math.cos(a) * outer}
                y2={50 + Math.sin(a) * outer}
                stroke={hot ? "var(--saffron)" : "var(--bone)"}
                strokeWidth={hot ? 1.4 : 0.7}
                strokeLinecap="round"
                opacity={hot ? 1 : 0.42}
              />
            </svg>
          );
        })}

        {/* the needle: the only motion on this instrument */}
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[27%] w-[2px]"
          style={{
            transformOrigin: "50% 100%",
            x: "-50%",
            y: "-100%",
          }}
          animate={{ rotate: index * (360 / spokes.length) }}
          transition={
            reduce ? { duration: 0 } : { type: "spring", duration: 0.5, bounce: 0.12 }
          }
        >
          <div aria-pressed={false} className="h-full w-full bg-[var(--saffron)]" />
        </motion.div>

        {/* center readout */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="font-mono text-[20px] tabular-nums text-[var(--saffron)]">
              {active.tick}
            </p>
            <p className="mt-1 font-mono text-[11px] tabular-nums text-dim">
              {formatShock(active.shock)} bps
            </p>
          </div>
        </div>

        {/* node buttons as the real controls */}
        {spokes.map((s, i) => {
          const a = angle(i);
          const left = 50 + Math.cos(a) * 42;
          const top = 50 + Math.sin(a) * 42;
          const hot = i === index;
          return (
            <button
              key={s.shock.toString()}
              type="button"
              aria-pressed={hot}
              aria-label={`Shock ${formatShock(s.shock)} basis points`}
              onClick={() => setIndex(i)}
              className={cn(
                "absolute grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border font-mono text-[11px] tabular-nums transition-colors duration-150",
                hot
                  ? "border-saffron bg-saffron"
                  : "border-line bg-surface-raised text-muted hover:border-line-strong hover:text-text",
              )}
              style={{ left: `${left}%`, top: `${top}%`, ...(hot ? { color: "var(--ink)" } : {}) }}
            >
              {s.tick.replace("%", "")}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-center text-pretty text-[12px] text-dim">
        spoke length is equity returned at each shock
      </p>
    </div>
  );
}
