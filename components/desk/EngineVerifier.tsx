"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Verifies the on-screen figures against the server engine via
 * POST /api/quote. The pages compute the same pure functions inline, so
 * this check turns "the numbers cannot drift from the engine" into a
 * fact the user can see — and an error state with a retry when the API
 * is unreachable (a stale success is never shown, NFR-13).
 *
 * The zero book is not an error: the engine refuses to quote an LP leg
 * of zero (414-style named problems, policy in parseQuoteInput), so
 * before the user sets amounts the verifier stands down and says so —
 * the same gate SettleAction applies ("set an LP notional above").
 * A 4xx is not thrown away either: the API names its problems, and
 * those names are the label, not a bare status code.
 */

type VerifierInput = {
  lpNotionalUsdc: string;
  shortNotionalUsdc: string;
  postedMarginUsdc: string;
  priceShockBps: string;
  volShockBps: string;
};

type State = "checking" | "verified" | "error" | "idle";

/** guarded BigInt, as in SettleAction: an unexpected shape is not a crash */
function asBig(v: unknown): bigint | null {
  try {
    const s = typeof v === "string" ? v : String(v ?? "");
    if (s === "") return 0n;
    return BigInt(s);
  } catch {
    return null;
  }
}

export function EngineVerifier({
  input,
  expectedRemainingEquityUsdc,
}: {
  input: VerifierInput;
  expectedRemainingEquityUsdc: string;
}) {
  const [state, setState] = useState<State>("checking");
  const [problem, setProblem] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const abort = useRef<AbortController | null>(null);

  const run = useCallback(() => {
    // before a book amounts to anything there is nothing to verify: an
    // LP leg of zero (or a field that is not an integer yet) cannot be
    // quoted, and refusing to fake a verdict is the honest zero-state
    const lp = asBig(input.lpNotionalUsdc);
    const expected = asBig(expectedRemainingEquityUsdc);
    if (lp === null || lp === 0n || expected === null) {
      setState("idle");
      setProblem(null);
      return;
    }
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
        if (!res.ok) {
          // the api names its problems; show them, not "api 400"
          let detail = `api ${res.status}`;
          try {
            const body = await res.json();
            if (Array.isArray(body?.problems) && body.problems.length > 0) {
              detail = body.problems.join(", ");
            }
          } catch {
            // body unreadable: keep the status code
          }
          throw new Error(detail);
        }
        const body = await res.json();
        if (body?.netted?.remainingEquityUsdc !== expectedRemainingEquityUsdc) {
          throw new Error("engine mismatch");
        }
        setState("verified");
        setProblem(null);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : String(err);
        setState("error");
        setProblem(message);
        console.error("engine verification failed:", message);
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
        : state === "idle"
          ? "engine parity starts when an LP notional is set — the zero book has nothing to verify"
          : (problem ?? "engine check failed");

  return (
    <div className="flex items-center gap-2 rounded-field border border-line bg-surface px-3 py-2">
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          state === "verified"
            ? "bg-up"
            : state === "checking"
              ? "bg-saffron"
              : state === "idle"
                ? "bg-line-strong"
                : "bg-down",
        )}
      />
      <span
        className={cn(
          "min-w-0 flex-1 truncate font-mono text-[11px]",
          state === "verified"
            ? "text-up"
            : state === "checking"
              ? "text-muted"
              : state === "idle"
                ? "text-dim"
                : "text-down",
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
