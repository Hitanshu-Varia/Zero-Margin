"use client";

import { useEffect, useState } from "react";
import { formatUsdcWhole } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * The dashboard's live band: the server wallet's real book state read from
 * the deployed app, plus the settled-book line the engine confirms, plus
 * live Rabdi row count. Every value names its source onchain/live.
 */
export function LiveDashboardBand() {
  const [state, setState] = useState<{
    app: { isActive: boolean; mark: string; lp?: string; short?: string; posted?: string; strategy?: string };
    arkiv: { source: string; rows: number };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [a, k] = await Promise.all([
          fetch("/api/app/state", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({}) }).then((r) => r.json()),
          fetch("/api/arkiv/query", { cache: "no-store" }).then((r) => r.json()),
        ]);
        if (!alive) return;
        if (!a.ok) {
          setError(a.problems?.join(", ").slice(0, 140) ?? "onchain read failed");
          return;
        }
        setError(null);
        setState({ app: a.onchain, arkiv: { source: k.source, rows: k.entities?.length ?? 0 } });
      } catch (err) {
        if (alive) setError("live reads unavailable");
      }
    };
    load();
    const timer = window.setInterval(load, 15_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  if (state === null && !error) {
    return <p className="mt-3 font-mono text-[11px] text-dim">reading live state from Base Sepolia…</p>;
  }
  if (error) {
    return <p aria-live="polite" className="mt-3 font-mono text-[11px] text-down">{error}</p>;
  }

  const active = state!.app.isActive;
  return (
    <div className="mt-4 rounded-panel border border-line bg-surface px-4 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1.5">
        <p className="flex items-center gap-2 text-[13px]">
          <span aria-hidden="true" className={cn("size-1.5 rounded-full", active ? "bg-saffron" : "bg-up")} />
          <span className="font-medium">{active ? "Live book onchain" : "Live chain state"}</span>
          <span className="font-mono text-[11px] text-dim">every value: eth_call to the deployed app</span>
        </p>
        <p className="font-mono text-[12px] tabular-nums">
          mark {formatUsdcWhole(BigInt(state!.app.mark))} · Rabdi {state!.arkiv.source} rows {state!.arkiv.rows}
        </p>
      </div>
      {active && (
        <dl className="mt-2 grid grid-cols-3 gap-x-6 gap-y-1 font-mono text-[11px] tabular-nums">
          <div className="flex justify-between gap-3">
            <dt className="text-dim">LP notional</dt>
            <dd>{formatUsdcWhole(BigInt(state!.app.lp ?? "0"))}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-dim">Hedge</dt>
            <dd>{formatUsdcWhole(BigInt(state!.app.short ?? "0"))}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-dim">Posted</dt>
            <dd>{formatUsdcWhole(BigInt(state!.app.posted ?? "0"))}</dd>
          </div>
        </dl>
      )}
      {!active && (
        <p className="mt-2 text-[12px] text-muted">
          the demo buyer book is settled (the keeper unwound it live from the
          positions page); open a fresh one on the terminal in one click
        </p>
      )}
    </div>
  );
}
