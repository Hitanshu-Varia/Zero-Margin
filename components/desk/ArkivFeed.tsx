"use client";

import { useEffect, useState } from "react";
import { KEEPER_QUERY, type Attestation } from "@/lib/attestations";
import { QueryBlock } from "@/components/QueryBlock";
import { ModeBadge, StatusChip } from "@/components/Badge";
import { formatUsdcWhole, formatPercentFromBps } from "@/lib/format";
import { cn } from "@/lib/cn";

interface Feed {
  source: string;
  schema: string;
  entities: Attestation[];
}

const BIGINT_FIELDS = [
  "marginRatioBps",
  "lpNotionalUsdc",
  "shortNotionalUsdc",
  "postedMarginUsdc",
  "netInitialMarginUsdc",
  "netMaintenanceMarginUsdc",
  "equityUsdc",
  "remainingTtlSeconds",
] as const;

/** The API serializes BigInts as strings; restore them for the formatters. */
function coerce(raw: Record<string, string | number>): Attestation {
  return { ...raw, ...Object.fromEntries(BIGINT_FIELDS.map((f) => [f, BigInt(raw[f] ?? 0)])) } as unknown as Attestation;
}

/**
 * The /arkiv feed: fetched from GET /api/arkiv/query so the badge on this
 * page names the real source (FR-16). The bundled snapshot is the initial
 * render, and a retry is one click away if the endpoint fails.
 */
export function ArkivFeed({ initialEntities }: { initialEntities: Attestation[] }) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [feed, setFeed] = useState<Feed | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    fetch("/api/arkiv/query")
      .then(async (res) => {
        if (!res.ok) throw new Error(`api ${res.status}`);
        const body = await res.json();
        if (!body?.entities || !Array.isArray(body.entities)) throw new Error("bad body");
        if (!alive) return;
        setFeed({ ...body, entities: body.entities.map(coerce) } as Feed);
        setState("ready");
      })
      .catch(() => {
        if (!alive) return;
        setFeed(null);
        setState("error");
      });
    return () => {
      alive = false;
    };
  }, [attempt, initialEntities]);

  const sourceLabel =
    state === "loading"
      ? "checking store"
      : state === "error"
        ? "API unreachable"
        : feed?.source === "cache"
          ? "CACHE"
          : "LOCAL";

  return (
    <div>
      <QueryBlock query={KEEPER_QUERY} />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-muted">
          span_attestations — {state === "error" ? initialEntities.length : (feed?.entities.length ?? initialEntities.length)} entities in the
          window
        </p>
        <div className="flex items-center gap-2">
          <span
            aria-live="polite"
            className={cn(
              "rounded-chip border px-2 py-0.5 font-mono text-[10px]",
              state === "error" ? "border-down-dim text-down" : "border-line text-dim",
            )}
          >
            {sourceLabel}
          </span>
          {state === "error" && (
            <button
              type="button"
              onClick={() => {
                setState("loading");
                setAttempt((a) => a + 1);
              }}
              className="rounded-[5px] border border-line px-2 py-0.5 font-mono text-[10px] text-muted transition-colors hover:text-text"
            >
              Retry
            </button>
          )}
          <ModeBadge
            variant="cache"
            title={sourceLabel}
            description={
              state === "error"
                ? "The attestations endpoint is unreachable; the page falls back to the bundled engine-computed snapshot with a retry."
                : "Entities from GET /api/arkiv/query. In cache mode the store is the bundled snapshot; the live writer replaces this feed on a funded Rabdi wallet."
            }
          />
        </div>
      </div>

      <table className="mt-3 w-full min-w-[860px] border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-line bg-surface-raised text-left">
            {["portfolio", "status", "margin ratio", "LP / short", "net IM", "equity", "ttl"].map(
              (h, i) => (
                <th
                  key={h}
                  className={`px-4 py-2 text-[11px] font-medium text-dim ${i > 1 ? "text-right" : ""}`}
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {(feed?.entities ?? initialEntities).map((a) => (
            <tr key={a.portfolioId} className="border-b border-line last:border-b-0">
              <td className="px-4 py-3">
                <div className="font-mono text-[13px]">{a.portfolioId}</div>
                <div className="mt-0.5 font-mono text-[11px] text-dim">{a.trader}</div>
              </td>
              <td className="px-4 py-3">
                <StatusChip tone={a.status === "UNWIND_ELIGIBLE" ? "down" : "up"}>
                  {a.status === "UNWIND_ELIGIBLE" ? "unwind eligible" : "active hedged"}
                </StatusChip>
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums">
                {formatPercentFromBps(a.marginRatioBps, 0)}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums text-muted">
                {formatUsdcWhole(a.lpNotionalUsdc)} / {formatUsdcWhole(a.shortNotionalUsdc)}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums">
                {formatUsdcWhole(a.netInitialMarginUsdc)}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums">
                {formatUsdcWhole(a.equityUsdc)}
              </td>
              <td className="px-4 py-3 text-right font-mono text-[11px] tabular-nums text-dim">
                {a.remainingTtlSeconds >= 0 ? `T−${a.remainingTtlSeconds}s` : "expired"}
                <div className="mt-0.5 text-[10px]">{a.updatedAtLabel}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
