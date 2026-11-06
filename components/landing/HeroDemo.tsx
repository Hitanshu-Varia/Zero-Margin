"use client";

import { useEffect, useRef, useState } from "react";
import {
  BPS,
  DEMO_BOOK,
  DEMO_ENTRY_PRICE_USDC,
  DEMO_ISOLATED_BOOK,
  DEMO_VOL_SHOCK_BPS,
  isolatedAccountAtShock,
  previewShockUnwind,
  signedFloorDiv,
} from "@/lib/spanMath";
import { formatUsdcWhole } from "@/lib/format";

const TARGET = -3_000n;

/**
 * The settlement console: the one dark element in the paper design,
 * pinned into the hero like a terminal taped to a memo. Auto-play sweeps
 * entry to −3,000 bps on a loop; the slider takes over the moment it is
 * touched; prefers-reduced-motion pins the crash statically.
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
      const start = performance.now();
      const duration = 1500;
      const sweep = (now: number) => {
        if (cancelled) return;
        const t = Math.min(1, (now - start) / duration);
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
  const crashDepth = Number(shock < 0n ? -shock : 0n) / 100;

  const peak = quote.lpLossUsdc > quote.shortGainUsdc ? quote.lpLossUsdc : quote.shortGainUsdc;
  const barOf = (v: bigint) =>
    Number(((v < 0n ? -v : v) * 100n) / (peak === 0n ? 1n : peak));

  return (
    <section
      aria-label="Live demo of the ZeroMargin settlement"
      className="overflow-hidden rounded-panel border border-console-line bg-console text-console-text"
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-console-line px-5 py-3">
        <span className="flex items-center gap-2 font-mono text-[11px] tracking-[0.08em] text-console-amber uppercase">
          {/* ALL-CAPS kept only here: a console title is literally how terminals write */}
          <span aria-hidden="true" className="pulse-dot h-[6px] w-[6px] rounded-full bg-up" />
          Settlement console
        </span>
        <span className="ml-auto font-mono text-[11px] tabular-nums text-surface/60">
          {formatUsdcWhole(DEMO_ENTRY_PRICE_USDC)} →{" "}
          <span className="text-console-amber">{formatUsdcWhole(mark)}</span> / WETH
        </span>
        <button
          type="button"
          onClick={() => setPlaying((v) => !v)}
          className="rounded-chip border border-console-line px-2.5 py-1 font-mono text-[11px] text-console-text/70 transition-colors duration-100 hover:border-console-amber hover:text-console-amber"
        >
          {playing ? "pause" : "play"}
        </button>
      </div>

      <div className="grid gap-6 px-5 pb-5 pt-4 md:grid-cols-[168px_1fr] md:gap-8">
        {/* the two accounts */}
        <div className="flex flex-row justify-between gap-6 md:flex-col md:justify-start md:gap-5">
          <div>
            <p className="text-[12px] text-surface/55">Isolated desk</p>
            <p
              className={`mt-1 font-mono text-[24px] leading-none tabular-nums tracking-tight settle ${
                isolated.liquidated ? "text-down-bright" : "text-console-text"
              }`}
            >
              {formatUsdcWhole(isolated.equityUsdc)}
            </p>
            <p className="mt-1.5 text-[11px] leading-snug text-surface/50">
              4× leverage, no hedge
            </p>
          </div>
          <div>
            <p className="text-[12px] text-surface/55">ZeroMargin book</p>
            <p
              className={`mt-1 font-mono text-[24px] leading-none tabular-nums tracking-tight text-console-amber settle`}
            >
              {formatUsdcWhole(quote.remainingEquityUsdc)}
            </p>
            <p className="mt-1.5 text-[11px] leading-snug text-surface/50">
              one transaction, netted
            </p>
          </div>
        </div>

        {/* waterfall */}
        <div className="min-w-0">
          <div className="space-y-2.5">
            <ConsoleBar
              label="LP leg loss"
              value={formatUsdcWhole(quote.lpLossUsdc)}
              width={barOf(quote.lpLossUsdc)}
              tone="loss"
            />
            <ConsoleBar
              label="Short gain"
              value={formatUsdcWhole(quote.shortGainUsdc)}
              width={barOf(quote.shortGainUsdc)}
              tone="gain"
            />
            <ConsoleBar
              label="Netted"
              value={formatUsdcWhole(quote.nettedOffsetUsdc)}
              width={barOf(quote.nettedOffsetUsdc)}
              tone="amber"
            />
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <label
                htmlFor="hero-shock"
                className="text-[12px] text-surface/60"
              >
                shock (bps)
              </label>
              <span className="font-mono text-[13px] tabular-nums text-console-amber">
                {shock < 0n ? "−" : ""}
                {Number((shock < 0n ? -shock : shock)).toLocaleString("en-US")} bps
              </span>
            </div>
            <input
              id="hero-shock"
              type="range"
              min={-3000}
              max={0}
              step={10}
              value={Number(shock)}
              aria-valuetext={`down ${crashDepth.toFixed(1)} percent from entry`}
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

function ConsoleBar({
  label,
  value,
  width,
  tone,
}: {
  label: string;
  value: string;
  width: number;
  tone: "loss" | "gain" | "amber";
}) {
  const bar =
    tone === "loss"
      ? "bg-down-bright"
      : tone === "gain"
        ? "bg-up-bright"
        : "bg-console-amber";
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-[11px] text-surface/55">{label}</span>
      <div className="relative h-[12px] min-w-0 flex-1 overflow-hidden rounded-full bg-surface/10">
        <div
          aria-hidden="true"
          className={`absolute inset-y-0 left-0 rounded-full ${bar}`}
          style={{ width: `${width}%`, opacity: 0.9 }}
        />
      </div>
      <span className="w-20 shrink-0 text-right font-mono text-[11px] tabular-nums text-console-text/80">
        {value}
      </span>
    </div>
  );
}
