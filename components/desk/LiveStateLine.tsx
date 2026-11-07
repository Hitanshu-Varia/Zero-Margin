"use client";

import { useEffect, useState } from "react";
import { formatUsdcWhole } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * The terminal's live book state, read straight from the deployed app for
 * the server wallet. Chain hiccups are handled: the raw error never reaches
 * the screen — the band degrades to a clean line with a retry, and the
 * figures below keep computing locally from the engine either way.
 */

// guarded BigInt: any unexpected shape degrades to 0 instead of crashing
function asBig(v: unknown): bigint {
  try {
    const n = typeof v === "string" ? v : String(v ?? "0");
    return BigInt(n === "" || n === "undefined" || n === "null" ? "0" : n);
  } catch {
    return 0n;
  }
}

interface LiveState {
  kind: "book" | "empty" | "error";
  text: string;
  equityUsdc?: string;
  lp?: string;
  short?: string;
  posted?: string;
  mark?: string;
}

const CHAIN_NOTE =
  "onchain mark: this price walks when real swaps hit the pool — in the demo it sits at the entry until a pool swap lands";

export function LiveStateLine() {
  const [state, setState] = useState<LiveState | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    // self-rescheduling poll; `attempt` forces an immediate reconnect
    let stopped = false;
    let timer = 0;
    const tick = () => {
      if (!stopped) timer = window.setTimeout(load, 20_000);
    };
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
          setState({
            kind: "error",
            text: "Base Sepolia didn't answer just now — the figures below still compute locally; the live check retries on its own.",
          });
          tick();
          return;
        }
        const on = body.onchain;
        if (on.isActive) {
          setState({
            kind: "book",
            text: "",
            lp: on.lpNotionalUsdc,
            short: on.shortNotionalUsdc,
            posted: on.postedMarginUsdc,
            equityUsdc: on.postedMarginUsdc,
            mark: on.markPriceUsdc,
          });
        } else {
          setState({ kind: "empty", text: "no book is open onchain right now; open one with the button below" });
        }
        tick();
      } catch {
        if (alive) {
          setState({ kind: "error", text: "Base Sepolia didn't answer just now — the figures below still compute locally." });
          tick();
        }
      }
    };
    load();
    return () => {
      alive = false;
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [attempt]);

  if (state === null) return null;

  if (state.kind === "book") {
    return (
      <div className="mb-3 rounded-panel border border-line bg-surface px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1.5">
          <p className="flex items-center gap-2 text-[13px]">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-saffron" />
            <span className="font-medium">Live book on Base Sepolia</span>
            <span className="font-mono text-[11px] text-dim">values read from the deployed app</span>
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
            <dt className="text-dim" title={CHAIN_NOTE}>
              Mark (moves on real swaps)
            </dt>
            <dd title={CHAIN_NOTE}>{formatUsdcWhole(asBig(state.mark))}</dd>
          </div>
        </dl>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div aria-live="polite" className="mb-3 rounded-panel border border-line bg-surface px-4 py-2.5">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-muted">
          {state.text}
          <button
            type="button"
            onClick={() => setAttempt((a) => a + 1)}
            className="rounded-[5px] border border-line px-2 py-0.5 text-muted transition-colors hover:text-text"
          >
            Reconnect
          </button>
        </p>
      </div>
    );
  }

  return (
    <p aria-live="polite" className="mb-3 font-mono text-[11px] leading-relaxed text-dim">
      {state.text}
    </p>
  );
}
