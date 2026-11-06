"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Real book actions bound to the deployed app on Base Sepolia.
 * "Open" runs approve → ship → openBook through the server wallet;
 * "Settle" broadcasts app.unwind(trader, shock). Every response comes with
 * the real tx hash or an honest degradation reason (never a fake success).
 */
export function LiveBookActions({ shockBps }: { shockBps: bigint }) {
  const [pending, setPending] = useState<"open" | "unwind" | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [nonce, bump] = useState(0);

  const run = useCallback(async (op: "open" | "unwind") => {
    setPending(op);
    setResult(null);
    const res = await fetch("/api/keeper", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ op, shock: Number(shockBps), postedMarginUsdc: 25000 }),
    });
    const body = await res.json();
    setPending(null);
    if (!body.ok) {
      setResult(`${body.problems?.join(", ").slice(0, 160) ?? "failed"}`);
      bump((n) => n + 1);
      return;
    }
    if (body.degraded) {
      setResult(`onchain paths are off in this deployment — ${body.problems?.join(", ")}`);
      return;
    }
    const explorer = body.explorer as string | undefined;
    setResult(`real tx: ${body.tx ?? JSON.stringify(body.txs)} ${explorer ? `· ${explorer}` : ""}`);
    bump((n) => n + 1);
    void 0;
  }, [shockBps, nonce]);

  return (
    <div className="rule-t mt-4 pt-3" data-testid="live-book-actions">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] font-medium">Live book, on the deployed app</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void run("open")}
            disabled={pending !== null}
            className={cn(
              "flex h-10 items-center rounded-field border border-line-strong bg-surface px-4 text-[13px] text-muted transition-colors duration-100 hover:text-text",
              pending === "open" && "opacity-60",
            )}
          >
            {pending === "open" ? "Broadcasting…" : "Open a real book"}
          </button>
          <button
            type="button"
            onClick={() => void run("unwind")}
            disabled={pending !== null}
            className={cn(
              "flex h-10 items-center rounded-field bg-paper px-4 text-[14px] font-medium transition-transform duration-100 ease-out active:scale-[0.97]",
              pending === "unwind" && "opacity-60",
            )}
            style={{ color: "var(--ink)" }}
          >
            {pending === "unwind" ? "Broadcasting…" : "Settle onchain now"}
          </button>
        </div>
      </div>
      {result && (
        <p aria-live="polite" className="mt-2.5 font-mono text-[11px] leading-relaxed text-muted" data-testid="live-book-result">
          {result}
        </p>
      )}
    </div>
  );
}
