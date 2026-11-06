"use client";

import { useEffect, useRef, useState } from "react";
import { formatUsdcWhole } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * Live onchain state: one line that reads the deployed app's book for the
 * server wallet (the demo trader) plus the local mark. Read only — the
 * <LiveBookActions> component owns the mutation buttons.
 */
export function LiveStateLine() {
  const [state, setState] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const load = () => {
      fetch("/api/app/state", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      })
        .then(async (res) => {
          const body = await res.json();
          if (!body.ok) {
            setState(`onchain read unavailable: ${body.problems?.join(", ").slice(0, 110)}`);
            return;
          }
          const on = body.onchain;
          setState(
            on.isActive
              ? `live book onchain — LP ${formatUsdcWhole(BigInt(on.lpNotionalUsdc))}, hedge ${formatUsdcWhole(BigInt(on.shortNotionalUsdc))}, posted ${formatUsdcWhole(BigInt(on.postedMarginUsdc))}`
              : "no active book onchain; open one below",
          );
        })
        .catch(() => setState("onchain read unavailable"));
    };
    load();
    timer.current = window.setInterval(load, 20_000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  if (state === null) return null;
  return (
    <p aria-live="polite" className={cn("mb-3 font-mono text-[11px] leading-relaxed text-dim")}>
      {state}
    </p>
  );
}
