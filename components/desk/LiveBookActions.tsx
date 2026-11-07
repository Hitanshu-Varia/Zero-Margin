"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Real book actions bound to the deployed app on Base Sepolia.
 * "Open a real book" runs approve → ship → openBook through the server
 * wallet; "Settle onchain now" broadcasts app.unwind(trader, shock) — and
 * it only appears while a book is actually open onchain, because that is
 * the only state the contract will accept it in. Every response comes with
 * the real tx hash or an honest degradation reason (never a fake success).
 */
export function LiveBookActions({ shockBps }: { shockBps: bigint }) {
  const [pending, setPending] = useState<"open" | "unwind" | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [bookActive, setBookActive] = useState<boolean | null>(null);
  const [nonce, bump] = useState(0);

  // poll the deploy's book state; the buttons follow the truth
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
        if (body.ok) setBookActive(body.onchain.isActive === true);
      } catch {
        // keep the last known state; the state line handles messaging
      }
    };
    load();
    const timer = window.setInterval(load, 15_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [nonce]);

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
  }, [shockBps, nonce]);

  return (
    <div className="rule-t mt-4 pt-3" data-testid="live-book-actions">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-[46ch] text-[13px] font-medium">
          {bookActive === null
            ? "Live book, on the deployed app"
            : bookActive
              ? "Your book is live onchain — settle it whenever you want"
              : "Your last book settled. Open a fresh one to move the chain again."}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void run("open")}
            disabled={pending !== null}
            className={cn(
              "flex items-center rounded-field border px-4 text-[13px] transition-colors duration-100",
              bookActive === false
                ? "h-10 border-line-strong bg-surface text-text"
                : "h-10 border-line bg-surface text-muted hover:border-line-strong hover:text-text",
              pending === "open" && "opacity-60",
            )}
          >
            {pending === "open" ? "Broadcasting…" : bookActive === false ? "Open a real book" : "Open another book"}
          </button>
          {bookActive && (
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
          )}
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
