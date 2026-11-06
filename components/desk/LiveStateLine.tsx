"use client";

import { useEffect, useRef, useState } from "react";
import { formatUsdcWhole } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * The terminal's live book state, read straight from the deployed app for
 * the server wallet, plus the local mark. Every label names its source.
 */
export function LiveStateLine() {
  const [state, setState] = useState<{
    kind: "book" | "empty" | "error";
    text: string;
    equityUsdc?: string;
    lp?: string;
    short?: string;
    posted?: string;
    mark?: string;
  } | null>(null);
  const loadRef = useRef<() => void>(() => {});

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/app/state", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({}),
        });
        const body = await res.json();
        if (!alive) return;
        if (!body.ok) {
          setState({ kind: "error", text: `onchain read unavailable: ${body.problems?.join(", ").slice(0, 110)}` });
          return;
        }
        const on = body.onchain;
        if (on.isActive) {
          setState({
            kind: "book",
            text: `live book onchain — engine at mark ${formatUsdcWhole(asBig(on.markPriceUsdc))}`,
            lp: on.lpNotionalUsdc,
            short: on.shortNotionalUsdc,
            posted: on.postedMarginUsdc,
            equityUsdc: on.postedMarginUsdc,
            mark: on.markPriceUsdc,
          });
        } else {
          setState({ kind: "empty", text: "no active book onchain; open one below" });
        }
      } catch (err) {
        if (alive) setState({ kind: "error", text: "onchain read unavailable" });
      }
    };
    loadRef.current = load;
    load();
    const timer = window.setInterval(load, 20_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  // guarded BigInt: any unexpected shape degrades to 0 instead of crashing
  const asBig = (v: unknown): bigint => {
    try {
      const n = typeof v === "string" ? v : String(v ?? "0");
      return BigInt(n === "" || n === "undefined" || n === "null" ? "0" : n);
    } catch {
      return 0n;
    }
  };

  if (state === null) return null;

  if (state.kind === "book") {
    return (
      <div className="mb-3 rounded-panel border border-line bg-surface px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1.5">
          <p className="flex items-center gap-2 text-[13px]">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-saffron" />
            <span className="font-medium">Live book on Base Sepolia</span>
            <span className="font-mono text-[11px] text-dim">
              deployed app reads, span engine pricing
            </span>
          </p>
          <p className="font-mono text-[12px] tabular-nums text-text">
            {formatUsdcWhole(asBig(state.equityUsdc))} posted
          </p>
        </div>
        <dl className="mt-2 grid grid-cols-3 gap-x-6 gap-y-1 font-mono text-[11px] tabular-nums">
          <div className="flex justify-between gap-3">
            <dt className="text-dim">LP notional</dt>
            <dd>{formatUsdcWhole(asBig(state.lp))}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-dim">Hedge</dt>
            <dd>{formatUsdcWhole(asBig(state.short))}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-dim">Mark (chain)</dt>
            <dd>{formatUsdcWhole(asBig(state.mark))}</dd>
          </div>
        </dl>
      </div>
    );
  }

  return (
    <p
      aria-live="polite"
      className={cn(
        "mb-3 font-mono text-[11px] leading-relaxed",
        state.kind === "error" ? "text-down" : "text-dim",
      )}
    >
      {state.text}
    </p>
  );
}
