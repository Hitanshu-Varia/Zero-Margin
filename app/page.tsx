"use client";

import { useCallback, useMemo, useState } from "react";
import { Num } from "@/components/Num";
import { Panel, Stat } from "@/components/Panel";
import { StatusChip } from "@/components/Badge";
import {
  DEMO_BOOK,
  DEMO_ENTRY_PRICE_USDC,
  DEMO_ISOLATED_BOOK,
  DEMO_VOL_SHOCK_BPS,
  evaluateSpan16,
  isolatedAccountAtShock,
  previewShockUnwind,
  signedFloorDiv,
  BPS,
} from "@/lib/spanMath";
import {
  formatBps,
  formatPercentFromBps,
  formatShock,
  formatShockAbs,
  formatUsdc,
  formatUsdcWhole,
} from "@/lib/format";

const B = BPS;

function markPriceUsdc(shockBps: bigint): bigint {
  return DEMO_ENTRY_PRICE_USDC + signedFloorDiv(DEMO_ENTRY_PRICE_USDC * shockBps, B);
}

function shockPercent(shockBps: bigint): number {
  return Number((shockBps * 100n) / B);
}

const CRASH_PRESETS: Array<{ bps: bigint; label: string }> = [
  { bps: -500n, label: "−5%" },
  { bps: -1_000n, label: "−10%" },
  { bps: -2_000n, label: "−20%" },
  { bps: -3_000n, label: "−30% CRASH" },
];

export default function TerminalPage() {
  const [shockBps, setShockBps] = useState<bigint>(0n);

  const span = useMemo(
    () => evaluateSpan16(DEMO_BOOK.lpNotionalUsdc, DEMO_BOOK.shortNotionalUsdc),
    [],
  );
  const isolated = useMemo(
    () =>
      isolatedAccountAtShock(
        DEMO_ISOLATED_BOOK.lpNotionalUsdc,
        DEMO_ISOLATED_BOOK.postedMarginUsdc,
        shockBps,
        DEMO_VOL_SHOCK_BPS,
      ),
    [shockBps],
  );
  const quote = useMemo(
    () =>
      previewShockUnwind(
        DEMO_BOOK.lpNotionalUsdc,
        DEMO_BOOK.shortNotionalUsdc,
        DEMO_BOOK.postedMarginUsdc,
        shockBps,
        DEMO_VOL_SHOCK_BPS,
      ),
    [shockBps],
  );

  const mark = markPriceUsdc(shockBps);

  const isolatedTone = isolated.liquidated
    ? "down"
    : isolated.equityUsdc < isolated.maintenanceMarginUsdc
      ? "amber"
      : "text";
  const settled = quote.protocolFeeUsdc > 0n && shockBps <= 0n;
  const bookTone =
    quote.badDebtUsdc > 0n ? "down" : settled ? "amber" : "text";

  const runCrash = useCallback(
    (target: bigint) => {
      const reduce =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        setShockBps(target);
        return;
      }
      const from = shockBps;
      const start = performance.now();
      const duration = 900;
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
        const current = from + ((target - from) * BigInt(Math.round(eased * 1000))) / 1000n;
        setShockBps(current);
        if (t < 1) requestAnimationFrame(step);
        else setShockBps(target);
      };
      requestAnimationFrame(step);
    },
    [shockBps],
  );

  return (
    <main className="mx-auto w-full max-w-[1240px] px-4 pb-16 pt-6 md:px-6">
      {/* ── Shock console ─────────────────────────────────────── */}
      <Panel
        label="Price shock console"
        accent
        meta={
          <span className="flex items-center gap-2">
            <span className="font-mono text-dim">entry $3,000.00</span>
            <span aria-hidden="true">→</span>
            <Num tone="amber" size="xs">
              {formatUsdcWhole(mark)}
            </Num>
            <span className="text-dim">/ WETH</span>
          </span>
        }
      >
        <div className="grid gap-5 px-4 pb-4 pt-3 md:grid-cols-[1fr_auto] md:items-center md:gap-8">
          <div>
            <div className="mb-2.5 flex items-baseline justify-between gap-4">
              <label
                htmlFor="shock"
                className="text-[12px] uppercase tracking-wide text-muted"
              >
                WETH spot shock — both books observe the same move
              </label>
              <Num tone={shockBps > 0n ? "up" : shockBps < 0n ? "down" : "text"} size="lg">
                {formatShock(shockBps)}
                <span className="ml-1 text-[12px] text-dim">bps</span>
              </Num>
            </div>
            <input
              id="shock"
              type="range"
              min={-3000}
              max={2000}
              step={10}
              value={Number(shockBps)}
              aria-valuetext={`${formatShock(shockBps)} basis points, ${shockPercent(shockBps)} percent`}
              onChange={(e) => setShockBps(BigInt(e.target.value))}
              className="w-full"
            />
            <div className="mt-1.5 flex justify-between font-mono text-[11px] text-dim">
              <span>−3,000</span>
              <span>0</span>
              <span>+2,000</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 md:flex-col md:items-end">
            {CRASH_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => runCrash(p.bps)}
                className={`rounded-field border px-3 py-1.5 font-mono text-[12px] transition-colors duration-100 ${
                  p.label === "−30% CRASH"
                    ? "border-down-dim bg-down-dim/40 text-down hover:border-down"
                    : "border-line bg-surface-raised text-muted hover:border-line-strong hover:text-text"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      {/* ── Split screen ──────────────────────────────────────── */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
        {/* Left: isolated account */}
        <Panel
          label="Isolated LP account"
          meta={<StatusChip tone={isolated.liquidated ? "down" : "status"}>
            {isolated.liquidated ? "liquidated" : "open"}
          </StatusChip>}
        >
          <div className="px-4 pb-4 pt-4">
            <div className="text-[12px] uppercase tracking-wide text-muted">
              Returned to trader
            </div>
            <Num key={shockBps} tone={isolatedTone} size="hero" className="settle">
              {formatUsdc(isolated.equityUsdc)}
            </Num>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-mono text-[12px] text-dim">
                posted {formatUsdcWhole(isolated.postedMarginUsdc)}
              </span>
              <span className="font-mono text-[12px] text-dim">
                maint. {formatUsdcWhole(isolated.maintenanceMarginUsdc)}
              </span>
            </div>

            {isolated.liquidated ? (
              <div className="mt-4 rounded-field border border-down-dim bg-down-dim/30 px-3 py-2.5">
                <StatusChip tone="down">liquidation executed</StatusChip>
                <p className="mt-2 font-mono text-[12px] leading-relaxed text-muted">
                  {formatBps(isolated.lpPnlUsdc < 0n ? -isolated.lpPnlUsdc : isolated.lpPnlUsdc)}{" "}
                  LP loss ·{" "}
                  <span className="text-down">
                    {formatBps(isolated.liquidationPenaltyUsdc)} penalty
                  </span>{" "}
                  · returned{" "}
                  <span className="text-down">{formatUsdc(isolated.returnedToTraderUsdc)}</span>
                </p>
              </div>
            ) : null}

            <div className="rule-t mt-4">
              <Stat label="LP notional" value={formatUsdcWhole(DEMO_ISOLATED_BOOK.lpNotionalUsdc)} />
              <Stat
                label="LP leg PnL"
                tone={isolated.lpPnlUsdc < 0n ? "down" : "up"}
                value={formatUsdc(isolated.lpPnlUsdc)}
              />
              <Stat
                label="Margin ratio"
                tone={isolated.liquidated ? "down" : "text"}
                value={`${formatPercentFromBps(isolated.breachMarginBps, 0)} of maint.`}
              />
              <Stat label="Hedge" value={<span className="text-dim">none</span>} />
            </div>
          </div>
        </Panel>

        {/* Right: ZeroMargin book */}
        <Panel
          accent
          label="ZeroMargin book"
          meta={
            <StatusChip tone={quote.badDebtUsdc > 0n ? "down" : settled ? "amber" : "status"}>
              {quote.badDebtUsdc > 0n ? "breach" : settled ? "unwind eligible" : "open"}
            </StatusChip>
          }
        >
          <div className="px-4 pb-4 pt-4">
            <div className="text-[12px] uppercase tracking-wide text-muted">
              Equity after settlement
            </div>
            <Num key={shockBps} tone={bookTone} size="hero" className="settle">
              {formatUsdc(quote.remainingEquityUsdc)}
            </Num>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-mono text-[12px] text-dim">
                posted {formatUsdcWhole(DEMO_BOOK.postedMarginUsdc)}
              </span>
              <span className="font-mono text-[12px] text-dim">
                net IM {formatUsdcWhole(span.netInitialMarginUsdc)}
              </span>
            </div>

            <div className="mt-4 rounded-field border border-amber-dim bg-amber-dim/20 px-3 py-2.5">
              <p className="font-mono text-[12px] leading-relaxed text-muted">
                short leg nets{" "}
                <span className="text-up">{formatUsdc(quote.shortGainUsdc)}</span> against{" "}
                <span className="text-down">{formatUsdc(quote.lpLossUsdc)}</span> LP loss ·
                offset{" "}
                <span className="text-amber">{formatUsdc(quote.nettedOffsetUsdc)}</span>
                {quote.badDebtUsdc === 0n && (
                  <span className="text-dim"> · no liquidation penalty</span>
                )}
              </p>
            </div>

            <div className="rule-t mt-4">
              <Stat label="Net initial margin" value={formatUsdcWhole(span.netInitialMarginUsdc)} />
              <Stat
                label="Isolated margin"
                value={formatUsdcWhole(span.isolatedInitialMarginUsdc)}
                tone="muted"
              />
              <Stat
                label="Capital savings"
                tone="amber"
                value={`${formatBps(span.capitalSavingsBps)} · ${formatPercentFromBps(span.capitalSavingsBps)}`}
              />
              <Stat label="Hedge ratio" value={`${shockPercent((DEMO_BOOK.shortNotionalUsdc * 100n) / DEMO_BOOK.lpNotionalUsdc)}%`} />
            </div>
          </div>
        </Panel>
      </div>

      <p className="mt-5 max-w-3xl font-mono text-[12px] leading-relaxed text-dim">
        Both panels evaluate the identical price shock through the identical
        deterministic engine. Demo books: $100,000 LP; the ZeroMargin book
        carries a $95,000 short against it. Numbers are USDC base units,
        computed at {formatShockAbs(shockBps)} bps from entry.
      </p>
    </main>
  );
}
