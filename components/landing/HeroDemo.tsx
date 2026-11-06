"use client";

import { useEffect, useRef, useState } from "react";
import {
  DEMO_BOOK,
  DEMO_ISOLATED_BOOK,
  DEMO_VOL_SHOCK_BPS,
  isolatedAccountAtShock,
  previewShockUnwind,
  signedFloorDiv,
} from "@/lib/spanMath";
import { formatUsdcWhole } from "@/lib/format";
import { DEMO_ENTRY_PRICE_USDC } from "@/lib/spanMath";
import { BPS } from "@/lib/spanMath";

const TARGET = -3_000n;

/**
 * The landing demo: the demo book played on a loop. The slider drives
 * the crash; auto-play sweeps 0 bps down to −3,000 bps with an eased
 * rAF loop (skipped under prefers-reduced-motion, which pins the crash).
 */
export function HeroDemo() {
  const [shock, setShock] = useState(0n);
  const [playing, setPlaying] = useState(true);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setPlaying(false);
      setShock(TARGET);
      return;
    }
    if (!playing) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const frame = () => {
      // sweep
      const start = performance.now();
      const duration = 1500;
      const sweep = (now: number) => {
        if (cancelled) return;
        const t = Math.min(1, (now - start) / duration);
        // accelerate into the crash — shock easing
        const eased = t * t;
        setShock(TARGET * BigInt(Math.round(eased * 1_000)) / 1_000n);
        if (t < 1) {
          raf.current = requestAnimationFrame(sweep);
        } else {
          timer = setTimeout(() => {
            if (cancelled) return;
            setShock(0n);
            frame();
          }, 2600);
        }
      };
      raf.current = requestAnimationFrame(sweep);
    };
    frame();
    return () => {
      cancelled = true;
      if (raf.current) cancelAnimationFrame(raf.current);
      clearTimeout(timer);
    };
  }, [playing]);

  const isolated = isolatedAccountAtShock(
    DEMO_ISOLATED_BOOK.lpNotionalUsdc,
    DEMO_ISOLATED_BOOK.postedMarginUsdc,
    shock,
    DEMO_VOL_SHOCK_BPS,
  );
  const quote = previewShockUnwind(
    DEMO_BOOK.lpNotionalUsdc,
    DEMO_BOOK.shortNotionalUsdc,
    DEMO_BOOK.postedMarginUsdc,
    shock,
    DEMO_VOL_SHOCK_BPS,
  );
  const mark = DEMO_ENTRY_PRICE_USDC + signedFloorDiv(DEMO_ENTRY_PRICE_USDC * shock, BPS);
  const crashDepth = Number((-shock * 100n) / 100n) / 100; // 0..30 (%)

  // waterfall bars, scaled against the worst absolute leg in this quote
  const maxLeg = (v: bigint) => {
    const abs = v < 0n ? -v : v;
    const peak = abs > quote.lpLossUsdc ? abs : quote.lpLossUsdc > 0n ? quote.lpLossUsdc : 1n;
    return Number((abs * 100n) / (peak === 0n ? 1n : peak));
  };

  return (
    <section
      aria-label="Live demo of the ZeroMargin settlement"
      className="overflow-hidden rounded-panel border border-line bg-surface"
    >
      {/* console bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3">
        <span className="flex items-center gap-2 font-mono text-[11px] tracking-[0.08em] text-dim">
          <span aria-hidden="true" className="pulse-dot h-[6px] w-[6px] rounded-full bg-up" />
          LIVE DEMO
        </span>
        <span className="font-mono text-[11px] text-dim">
          entry $3,000.00 → <span className="text-gold">{formatUsdcWhole(mark)}</span> / WETH
        </span>
        <button
          type="button"
          onClick={() => setPlaying((v) => !v)}
          className="ml-auto rounded-chip border border-line bg-surface-raised px-2.5 py-1 font-mono text-[11px] text-muted transition-colors duration-120 hover:border-line-strong hover:text-text"
        >
          {playing ? "⏸ pause" : "▶ play"}
        </button>
      </div>

      {/* readout */}
      <div className="grid gap-6 px-5 pb-5 pt-4 md:grid-cols-[auto_1fr] md:gap-10">
        <div className="flex w-full flex-row justify-between gap-8 md:w-56 md:flex-col md:justify-start md:gap-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-dim">
              Isolated account
            </p>
            <p
              className={`mt-1 font-mono text-[26px] leading-none tracking-tight settle ${
                isolated.liquidated ? "text-down" : "text-muted"
              }`}
            >
              {formatUsdcWhole(isolated.equityUsdc)}
            </p>
            <p className="mt-1.5 font-mono text-[11px] text-dim">
              {isolated.liquidated ? "liquidated · 10% penalty" : "4× leverage on the LP leg"}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-gold">
              ZeroMargin book
            </p>
            <p className="mt-1 font-mono text-[26px] leading-none tracking-tight settle text-gold">
              {formatUsdcWhole(quote.remainingEquityUsdc)}
            </p>
            <p className="mt-1.5 font-mono text-[11px] text-dim">
              one transaction · {quote.badDebtUsdc === 0n ? "no liquidation penalty" : "bad debt"}
            </p>
          </div>
        </div>

        <div className="min-w-0">
          {/* waterfall bars */}
          <div className="space-y-2">
            <FlowBar
              label="LP leg loss"
              value={formatUsdcWhole(quote.lpLossUsdc)}
              width={maxLeg(quote.lpLossUsdc)}
              tone="down"
            />
            <FlowBar
              label="Short gain"
              value={formatUsdcWhole(quote.shortGainUsdc)}
              width={maxLeg(quote.shortGainUsdc)}
              tone="up"
            />
            <FlowBar
              label="Netted offset"
              value={formatUsdcWhole(quote.nettedOffsetUsdc)}
              width={maxLeg(quote.nettedOffsetUsdc)}
              tone="gold"
            />
          </div>

          {/* interactive slider */}
          <div className="mt-5">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <label htmlFor="hero-shock" className="text-[12px] text-muted">
                Price shock — drag it
              </label>
              <span className="font-mono text-[13px] tabular-nums text-gold">
                {crashDepth > 0 ? "−" : ""}
                {crashDepth.toFixed(0)}%
              </span>
            </div>
            <input
              id="hero-shock"
              type="range"
              min={-3000}
              max={0}
              step={10}
              value={Number(shock)}
              aria-valuetext={`down ${crashDepth.toFixed(0)} percent from entry`}
              onChange={(e) => {
                setPlaying(false);
                setShock(BigInt(e.target.value));
              }}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function FlowBar({
  label,
  value,
  width,
  tone,
}: {
  label: string;
  value: string;
  width: number;
  tone: "down" | "up" | "gold";
}) {
  const bar = tone === "down" ? "bg-down" : tone === "up" ? "bg-up" : "bg-gold";
  const glow = tone === "down" ? "bg-down-dim" : tone === "up" ? "bg-up-dim" : "bg-gold-dim";
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-[11px] uppercase tracking-wide text-muted">
        {label}
      </span>
      <div className="relative h-[14px] min-w-0 flex-1 overflow-hidden rounded-full bg-surface-raised">
        <div
          aria-hidden="true"
          className={`absolute inset-y-0 left-0 rounded-full ${glow}`}
          style={{ width: "100%" }}
        />
        <div
          aria-hidden="true"
          className={`absolute inset-y-0 left-0 rounded-full ${bar}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="w-24 shrink-0 text-right font-mono text-[12px] tabular-nums text-muted">
        {value}
      </span>
    </div>
  );
}
