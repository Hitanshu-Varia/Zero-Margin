"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Verifies the on-screen figures against the server engine via
 * POST /api/quote. The pages compute the same pure functions inline, so
 * this check turns "the numbers cannot drift from the engine" into a
 * fact the user can see — and an error state with a retry when the API
 * is unreachable (a stale success is never shown, NFR-13).
 */
export function EngineVerifier({
  input,
  expectedRemainingEquityUsdc,
}: {
  input: {
    lpNotionalUsdc: string;
    shortNotionalUsdc: string;
    postedMarginUsdc: string;
    priceShockBps: string;
    volShockBps: string;
  };
  expectedRemainingEquityUsdc: string;
}) {
  const [state, setState] = useState<"checking" | "verified" | "error">("checking");
  const [nonce, setNonce] = useState(0);
  const abort = useRef<AbortController | null>(null);

  const run = useCallback(() => {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setState("checking");
    fetch("/api/quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`api ${res.status}`);
        const body = await res.json();
        if (body?.netted?.remainingEquityUsdc !== expectedRemainingEquityUsdc) {
          throw new Error("engine mismatch");
        }
        setState("verified");
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setState("error");
        console.error("engine verification failed:", err instanceof Error ? err.message : err);
      });
  }, [input, expectedRemainingEquityUsdc]);

  useEffect(() => {
    const timer = setTimeout(run, 250);
    return () => clearTimeout(timer);
  }, [run, nonce]);

  const label =
    state === "verified"
      ? "engine parity verified via /api/quote"
      : state === "checking"
        ? "verifying against /api/quote"
        : "engine check failed";

  return (
    <div className="flex items-center gap-2 rounded-field border border-line bg-surface px-3 py-2">
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          state === "verified" ? "bg-up" : state === "checking" ? "bg-saffron" : "bg-down",
        )}
      />
      <span
        className={cn(
          "min-w-0 flex-1 font-mono text-[11px]",
          state === "verified" ? "text-up" : state === "checking" ? "text-muted" : "text-down",
        )}
      >
        {label}
      </span>
      {state === "error" && (
        <button
          type="button"
          onClick={() => setNonce((n) => n + 1)}
          className="shrink-0 rounded-[5px] border border-line px-2 py-0.5 font-mono text-[11px] text-muted transition-colors hover:text-text"
        >
          Retry
        </button>
      )}
    </div>
  );
}
