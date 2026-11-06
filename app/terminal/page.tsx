"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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

import { PRICE_SHOCKS_BPS } from "@/lib/spanMath";

function WaterfallRow({
  label,
  value,
  sign,
  tone,
  rule = false,
}: {
  label: string;
  value: string;
  sign: string;
  tone: "down" | "up" | "amber" | "muted" | "text";
  rule?: boolean;
}) {
  const toneClass =
    tone === "down"
      ? "text-down"
      : tone === "up"
        ? "text-up"
        : tone === "amber"
          ? "text-amber"
          : tone === "muted"
            ? "text-muted"
            : "text-text";
  return (
    <tr className={rule ? "border-b border-line" : ""}>
      <td className="py-1 text-[12px] uppercase tracking-wide text-muted">{label}</td>
      <td className="py-1 text-right">
        <span className="font-mono text-[12px] tabular-nums text-dim">
          {sign}
        </span>{" "}
        <span className={`font-mono text-[13px] tabular-nums ${toneClass}`}>
          {value}
        </span>
      </td>
    </tr>
  );
}

function ScenarioGrid({
  scenarioNetPnlUsdc,
  activeIndex = -1,
}: {
  scenarioNetPnlUsdc: bigint[];
  activeIndex?: number;
}) {
  const maxAbs = scenarioNetPnlUsdc.reduce(
    (acc, v) => (v < 0n && -v > acc ? -v : v > acc ? v : acc),
    1n,
  );
  const labels = ["−30", "−20", "−10", "−5", "0", "+5", "+10", "+20"];

  return (
    <div className="space-y-1.5">
      {[0, 1].map((m) => (
        <div key={m} className="flex items-end gap-2">
          <span className="w-12 shrink-0 pt-3 font-mono text-[10px] text-dim">
            ν {m === 0 ? "0" : "150"}
          </span>
          <div className="grid flex-1 grid-cols-8 gap-1">
            {PRICE_SHOCKS_BPS.map((_, k) => {
              const i = k * 2 + m;
              const pnl = scenarioNetPnlUsdc[i];
              const magnitude = pnl < 0n ? -pnl : pnl;
              const height = Number((magnitude * 28n) / maxAbs) + 2;
              const negative = pnl < 0n;
              const active = i === activeIndex;
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    aria-hidden="true"
                    style={{ height: `${height}px` }}
                    className={`w-3/4 min-w-[10px] rounded-[2px] ${
                      negative
                        ? active ? "bg-down" : "bg-down-dim"
                        : active ? "bg-up" : "bg-up-dim"
                    } ${active ? "ring-1 ring-amber" : ""}`}
                  />
                  <span
                    className={`font-mono text-[10px] leading-none ${
                      active ? "text-amber" : "text-dim"
                    }`}
                  >
                    {labels[k]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <p className="font-mono text-[10px] text-dim">
        net PnL in USDC per scenario · amber highlight marks the current
        shock band
      </p>
    </div>
  );
}

export default function TerminalPage() {
  return (
    <Suspense fallback={null}>
      <Terminal />
    </Suspense>
  );
}

function Terminal() {
  const params = useSearchParams();
  const initialShock = useMemo(() => {
    const raw = params.get("shock");
    if (raw === null) return 0n;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return 0n;
    const clamped = Math.max(-3000, Math.min(2000, Math.round(parsed / 10) * 10));
    return BigInt(clamped);
  }, [params]);
  const [shockBps, setShockBps] = useState<bigint>(initialShock);

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
  /** The −30% replay figures, always computed at the demo crash depth. */
  const crashQuote = useMemo(
    () =>
      previewShockUnwind(
        DEMO_BOOK.lpNotionalUsdc,
        DEMO_BOOK.shortNotionalUsdc,
        DEMO_BOOK.postedMarginUsdc,
        -3_000n,
        DEMO_VOL_SHOCK_BPS,
      ),
    [],
  );
  const crashIsolated = useMemo(
    () =>
      isolatedAccountAtShock(
        DEMO_ISOLATED_BOOK.lpNotionalUsdc,
        DEMO_ISOLATED_BOOK.postedMarginUsdc,
        -3_000n,
        DEMO_VOL_SHOCK_BPS,
      ),
    [],
  );

  const mark = markPriceUsdc(shockBps);

  const activeScenarioIndex = useMemo(() => {
    let k = 0;
    let best = 1_000_000n;
    PRICE_SHOCKS_BPS.forEach((candidate, idx) => {
      const d = candidate > shockBps ? candidate - shockBps : shockBps - candidate;
      if (d < best) {
        best = d;
        k = idx;
      }
    });
    return k * 2 + 1; // ν = 150 row
  }, [shockBps]);

  const isolatedTone = isolated.liquidated
    ? "down"
    : isolated.equityUsdc < isolated.maintenanceMarginUsdc
      ? "amber"
      : "text";
  const settled = quote.protocolFeeUsdc > 0n && shockBps <= 0n;
  const bookTone =
    quote.badDebtUsdc > 0n ? "down" : settled ? "amber" : "text";
  const hedgeRatio = (DEMO_BOOK.shortNotionalUsdc * 10_000n) / DEMO_BOOK.lpNotionalUsdc;

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
      <div className="mt-5">
        <div className="mb-3 flex items-center gap-3">
          <span aria-hidden="true" className="h-px flex-1 bg-line" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-dim">
            SAME SHOCK · SAME OBSERVATION WINDOW
          </span>
          <span aria-hidden="true" className="h-px flex-1 bg-line" />
        </div>
        <div className="grid gap-5 lg:grid-cols-[5fr_6fr]">
        {/* Left: isolated account */}
        <Panel
          label="Isolated LP account"
          className="flex flex-col"
          bodyClassName="flex flex-1 flex-col"
          meta={<StatusChip tone={isolated.liquidated ? "down" : "status"}>
            {isolated.liquidated ? "liquidated" : "open"}
          </StatusChip>}
        >
          <div className="flex h-full flex-col px-4 pb-4 pt-4">
            <div className="text-[12px] uppercase tracking-wide text-muted">
              Current equity
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

            {/* Margin-health track: equity against a posted-margin scale */}
            <div
              role="img"
              aria-label={`Margin health: equity ${formatUsdcWhole(isolated.equityUsdc)} against maintenance threshold ${formatUsdcWhole(isolated.maintenanceMarginUsdc)}`}
              className="relative mt-4 h-[6px] overflow-visible rounded-full bg-transparent"
            >
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-visible rounded-full bg-surface"
              >
              <div
                aria-hidden="true"
                className={`h-full rounded-full ${
                  isolated.liquidated
                    ? "bg-down"
                    : isolated.equityUsdc <= isolated.maintenanceMarginUsdc
                      ? "bg-down"
                      : isolated.breachMarginBps < 15_000n
                        ? "bg-amber"
                        : "bg-line-strong"
                }`}
                style={{
                  width: `${
                    isolated.liquidated
                      ? 4
                      : isolated.postedMarginUsdc === 0n
                        ? 0
                        : Math.max(
                            2,
                            Math.min(
                              100,
                              Number(
                                (isolated.equityUsdc * 100n) /
                                  isolated.postedMarginUsdc,
                              ),
                            ),
                          )
                  }%`,
                }}
              />
              <div
                aria-hidden="true"
                title="Maintenance threshold — breach liquidates the account"
                className="absolute top-[-4px] h-[11px] w-[2px] rounded-full bg-line-strong"
                style={{ left: "50%" }}
              />
              </div>
            </div>
            <div className="mt-1 flex justify-between font-mono text-[10px] text-dim">
              <span>equity {formatPercentFromBps(isolated.breachMarginBps, 0)} of maint.</span>
              <span>breach liquidates at 50%</span>
            </div>

            {isolated.liquidated ? (
              <div className="mt-4 rounded-field border border-down-dim bg-down-dim/30 px-3 py-2.5">
                <StatusChip tone="down">liquidation executed</StatusChip>
                <p className="mt-2 font-mono text-[12px] leading-relaxed text-muted">
                  LP loss{" "}
                  <span className="text-down">
                    {formatUsdcWhole(isolated.lpPnlUsdc < 0n ? -isolated.lpPnlUsdc : isolated.lpPnlUsdc)}
                  </span>{" "}
                  · penalty{" "}
                  <span className="text-down">
                    {formatUsdcWhole(isolated.liquidationPenaltyUsdc)}
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
              <Stat label="Hedge" value={<span className="text-dim">none</span>} />
            </div>

            {/* Cost recap — computed from the engine, never stored */}
            <div className="mt-auto pt-5">
              <div className="mb-2 rule-t pt-3 text-[12px] uppercase tracking-wide text-muted">
                Cost of the −30% replay
              </div>
              <div className="grid grid-cols-1 gap-px sm:grid-cols-3 sm:gap-px overflow-hidden rounded-field border border-line bg-line">
                {[
                  {
                    label: "Isolated penalty",
                    value: crashIsolated.liquidationPenaltyUsdc,
                    tone: "text-down",
                  },
                  {
                    label: "ZeroMargin fee",
                    value: crashQuote.protocolFeeUsdc,
                    tone: "text-amber",
                  },
                  {
                    label: "Netted offset",
                    value: crashQuote.nettedOffsetUsdc,
                    tone: "text-up",
                  },
                ].map((cell) => (
                  <div key={cell.label} className="bg-surface-raised px-3 py-2.5">
                    <div className="text-[10px] uppercase tracking-wide text-dim">
                      {cell.label}
                    </div>
                    <div className={`mt-1 font-mono text-[13px] tabular-nums ${cell.tone}`}>
                      {formatUsdcWhole(cell.value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Panel>

        {/* Right: ZeroMargin book */}
        <Panel
          accent
          label="ZeroMargin book"
          meta={
            <StatusChip tone={quote.badDebtUsdc > 0n ? "down" : shockBps < 0n ? "amber" : "status"}>
              {quote.badDebtUsdc > 0n
                ? "breach"
                : shockBps < 0n
                  ? "settled"
                  : "open hedged"}
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
              <Stat label="Hedge ratio" value={formatPercentFromBps(hedgeRatio, 0)} />
            </div>

            {/* ── Settlement waterfall ──────────────────────── */}
            <div className="rule-t mt-4 pt-3">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-[12px] uppercase tracking-wide text-muted">
                  Settlement waterfall
                </span>
                <span className="font-mono text-[11px] text-dim">
                  quote ≡ execution
                </span>
              </div>
              <table className="w-full border-separate border-spacing-0">
                <tbody>
                  <WaterfallRow
                    label="LP leg loss"
                    sign={quote.lpLossUsdc === 0n ? "" : "−"}
                    tone="down"
                    value={formatUsdc(quote.lpLossUsdc)}
                  />
                  <WaterfallRow
                    label="Short gain"
                    sign="+"
                    tone="up"
                    value={formatUsdc(quote.shortGainUsdc)}
                  />
                  <WaterfallRow
                    label="Netted offset"
                    sign="="
                    tone="amber"
                    value={formatUsdc(quote.nettedOffsetUsdc)}
                    rule
                  />
                  <WaterfallRow
                    label="Unwind fee · 5 bps"
                    sign={quote.protocolFeeUsdc === 0n ? "" : "−"}
                    tone="muted"
                    value={formatUsdc(quote.protocolFeeUsdc)}
                  />
                  <WaterfallRow
                    label="Margin spent"
                    sign={quote.traderMarginUsedUsdc === 0n ? "" : "−"}
                    tone="text"
                    value={formatUsdc(quote.traderMarginUsedUsdc)}
                    rule
                  />
                  {quote.badDebtUsdc > 0n && (
                    <WaterfallRow
                      label="Bad debt"
                      sign="!"
                      tone="down"
                      value={formatUsdc(quote.badDebtUsdc)}
                    />
                  )}
                  <tr>
                    <td className="pt-2.5 text-[12px] uppercase tracking-wide text-text">
                      Remaining equity
                    </td>
                    <td className="pt-2.5 text-right">
                      <Num tone={bookTone} size="lg">
                        {formatUsdc(quote.remainingEquityUsdc)}
                      </Num>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ── Aqua transfer ledger ──────────────────────── */}
            <div className="rule-t mt-4 pt-3">
              <div className="mb-2 text-[12px] uppercase tracking-wide text-muted">
                Aqua virtual balance
              </div>
              <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                <span className="rounded-field border border-line bg-surface-raised px-2 py-1 text-muted">
                  <span className="text-amber">ship</span> {formatUsdcWhole(DEMO_BOOK.postedMarginUsdc)}
                </span>
                <span aria-hidden="true" className="text-dim">→</span>
                <span className="rounded-field border border-line bg-surface-raised px-2 py-1 text-muted">
                  <span className="text-up">push</span> {formatUsdcWhole(quote.nettedOffsetUsdc)}
                </span>
                <span aria-hidden="true" className="text-dim">→</span>
                <span className="rounded-field border border-line bg-surface-raised px-2 py-1 text-muted">
                  <span className="text-down">pull</span> {formatUsdcWhole(quote.nettedOffsetUsdc + quote.traderMarginUsedUsdc)}
                </span>
                <span aria-hidden="true" className="text-dim">=</span>
                <span className="rounded-field border border-amber-dim bg-amber-dim/20 px-2 py-1 text-amber">
                  {formatUsdcWhole(quote.remainingEquityUsdc)} equity
                </span>
              </div>
            </div>

            {/* ── 16-scenario grid ──────────────────────────── */}
            <div className="rule-t mt-4 pt-3">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-[12px] uppercase tracking-wide text-muted">
                  SPAN-grid net PnL
                </span>
                <span className="font-mono text-[11px] text-dim">
                  16 scenarios · ν 0 / 150 bps
                </span>
              </div>
              <ScenarioGrid
                scenarioNetPnlUsdc={span.scenarioNetPnlUsdc}
                activeIndex={activeScenarioIndex}
              />
            </div>
          </div>
        </Panel>
        </div>
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
