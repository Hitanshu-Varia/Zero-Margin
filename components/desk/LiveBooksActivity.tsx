"use client";

import { useEffect, useRef, useState } from "react";
import { formatUsdcWhole } from "@/lib/format";
import { StatusChip } from "@/components/Badge";
import { cn } from "@/lib/cn";

/**
 * The dashboard's live Books + Activity pair. Nothing is pre-baked: the
 * server wallet's book comes from the deployed app getter on Base Sepolia,
 * and the activity rows come from the live Rabdi feed (which only lists
 * rows written through the real settle path). A fetch failure degrades the
 * panel with a retry — never a fixture.
 */
export function LiveBooksActivity() {
  const [app, setApp] = useState<{
    ok: boolean;
    onchain?: {
      isActive: boolean;
      lpNotionalUsdc: string;
      shortNotionalUsdc: string;
      postedMarginUsdc: string;
      markPriceUsdc: string;
    };
    problems?: string[];
  } | null>(null);
  const [arkiv, setArkiv] = useState<{
    entities?: Array<{
      portfolioId: string;
      trader: string;
      status: string;
      marginRatioBps: string;
      netInitialMarginUsdc: string;
      equityUsdc: string;
      remainingTtlSeconds: number;
      updatedAtLabel: string;
    }>;
    source?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const first = useRef(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setError(null);
      try {
        const [a, k] = await Promise.all([
          fetch("/api/app/state", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({}),
          }).then((r) => r.json()),
          fetch("/api/arkiv/query", { cache: "no-store" }).then((r) => r.json()),
        ]);
        if (!alive) return;
        if (!a.ok) {
          setError("Base Sepolia didn’t answer just now — hit retry below");
        } else {
          setApp(a);
        }
        setArkiv(k);
      } catch (err) {
        if (alive) setError("live reads failed; retry below");
      }
    };
    load();
    const timer = window.setInterval(load, 15_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [attempt]);

  const on = app?.onchain;

  const books = [];
  if (app?.ok && on?.isActive) {
    books.push({
      book: "ClearingAquaApp (engine book)",
      lp: on.lpNotionalUsdc,
      short: on.shortNotionalUsdc,
      im: (BigInt(on.markPriceUsdc || "3000000000") * 0n), // replaced below by the engine figure
      status: "active",
    });
  }
  const settled = app?.ok && on ? !on.isActive : false;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <Panel2 label="Books — live from the deployed app">
        {app === null && !error ? (
          <p className="px-5 py-4 font-mono text-[11px] text-dim">reading live book from Base Sepolia…</p>
        ) : null}
        {error ? (
          <div className="px-5 py-4">
            <p aria-live="polite" className="font-mono text-[11px] text-down">{error}</p>
            <button
              type="button"
              onClick={() => setAttempt((a) => a + 1)}
              className="mt-2 rounded-[5px] border border-line px-2 py-0.5 font-mono text-[11px] text-muted hover:text-text"
            >
              Retry
            </button>
          </div>
        ) : null}
        {app?.ok && (
          <>
            <div className="rule-t">
              <StatLive label="Mark price (chain)" value={formatUsdcWhole(BigInt(on?.markPriceUsdc ?? "0"))} tone="saffronText" />
              <StatLive
                label="Book state"
                value={settled ? "settled — open a fresh book on the terminal" : "active"}
                tone="mutedText"
              />
            </div>
            {on?.isActive && (
              <>
                <StatLive label="LP notional" value={formatUsdcWhole(BigInt(on.lpNotionalUsdc))} tone="" />
                <StatLive label="Hedge notional" value={formatUsdcWhole(BigInt(on.shortNotionalUsdc))} tone="upText" />
                <StatLive label="Posted margin" value={formatUsdcWhole(BigInt(on.postedMarginUsdc))} tone="" />
              </>
            )}
            {!on?.isActive && (
              <p className="px-5 py-2.5 text-[12px] text-muted">
                the demo book read from the app is settled (the keeper unwound
                it live); the terminal opens a new one in one click, and this
                table then reflects the fresh book.
              </p>
            )}
          </>
        )}
      </Panel2>

      <Panel2 label="Activity — live Rabdi feed">
        {arkiv === null ? (
          <p className="px-5 py-4 font-mono text-[11px] text-dim">reading the keeper query…</p>
        ) : (
          <>
            <ol className="px-5 py-4">
              {(arkiv.entities ?? []).slice(0, 6).map((e) => (
                <li key={e.portfolioId} className="border-b border-line last:border-0 py-2.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className={`text-[13px] ${e.status === "UNWIND_ELIGIBLE" ? "text-down" : "text-up"}`}>
                      {e.portfolioId}
                    </span>
                    <span className="font-mono text-[11px] tabular-nums text-dim">
                      {Number(e.remainingTtlSeconds)}s left
                    </span>
                  </div>
                  <span className="mt-0.5 block font-mono text-[11px] text-dim">
                    ratio {e.marginRatioBps} bps · equity {formatUsdcWhole(BigInt(e.equityUsdc || "0"))}
                  </span>
                </li>
              ))}
              {(arkiv.entities ?? []).length === 0 && (
                <li className="py-2.5 text-[12px] text-muted">
                  no attestations inside the 300 s window right now; every
                  settle writes one, and it expires by design.
                </li>
              )}
            </ol>
            <div className="flex items-center justify-between border-t border-line px-5 py-2.5">
              <span className="text-[11px] text-dim">rows live from Rabdi, {arkiv.source} mode</span>
              <button
                type="button"
                onClick={() => setAttempt((a) => a + 1)}
                className="rounded-[5px] border border-line px-2 py-0.5 font-mono text-[10px] text-muted hover:text-text"
              >
                Refresh
              </button>
            </div>
          </>
        )}
      </Panel2>
    </div>
  );
}

/** thin wrappers so the pair matches the dashboard's Panel/Stat styling */
function Panel2({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-panel border border-line bg-surface">
      <header className="border-b border-line px-5 py-3">
        <h2 className="text-[13px] font-medium text-text">{label}</h2>
      </header>
      {children}
    </section>
  );
}

function StatLive({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "" | "upText" | "saffronText" | "mutedText";
}) {
  const cls =
    tone === "upText"
      ? "text-up"
      : tone === "saffronText"
        ? "text-saffron"
        : tone === "mutedText"
          ? "text-muted"
          : "text-text";
  return (
    <div className="border-b border-line px-5 py-2.5 last:border-b-0">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-[13px] text-muted">{label}</span>
        <span className={cn("font-mono text-[13px] tabular-nums", cls)}>{value}</span>
      </div>
    </div>
  );
}
