"use client";

import { useCallback, useState } from "react";
import { formatUsdcWhole } from "@/lib/format";
import { cn } from "@/lib/cn";

interface ReceiptBody {
  ok: boolean;
  mode?: string;
  receipt?: {
    state: "settled" | "rejected";
    reason?: string;
    tx: { simulated: boolean; hash: string; block: number; chainId: number };
    quote: {
      remainingEquityUsdc: string;
      protocolFeeUsdc: string;
      badDebtUsdc: string;
      lpLossUsdc: string;
      shortGainUsdc: string;
      nettedOffsetUsdc: string;
    };
    balancesDuringSettlement: {
      lpDeficitPaid: string;
      hedgeGainPushed: string;
      feeCharged: string;
      balanceLeft: string;
    };
  };
  attestation?: {
    ok: boolean;
    key?: string;
    tx?: string | null;
    reason?: string;
  };
  problems?: string[];
}

/**
 * The settlement action: a real API call that runs the deterministic
 * unwind server-side and renders the receipt it returned. In LOCAL mode
 * the transaction is labeled simulated; when the terminal is pointed at a
 * fork, this same call carries the live adapter config from lib/env.ts.
 */
export function SettleAction({
  input,
}: {
  input: {
    lpNotionalUsdc: string;
    shortNotionalUsdc: string;
    postedMarginUsdc: string;
    priceShockBps: string;
    volShockBps: string;
  };
}) {
  const [pending, setPending] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptBody | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(() => {
    setPending(true);
    setError(null);
    fetch("/api/unwind", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok || !body.ok) {
          setError((body?.problems ?? [`server responded ${res.status}`]).join(", "));
          setReceipt(null);
        } else {
          setReceipt(body);
          setError(null);
        }
      })
      .catch(() => {
        setError("the settlement endpoint is unreachable; retry when the server is back");
      })
      .finally(() => setPending(false));
  }, [input]);

  return (
    <div className="rule-t mt-4 pt-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={run}
          disabled={pending}
          className={cn(
            "flex h-10 items-center rounded-field bg-paper px-5 text-[14px] font-medium transition-transform duration-100 ease-out active:scale-[0.97]",
            pending && "opacity-60",
          )}
          style={{ color: "var(--ink)" }}
          data-testid="settle-action"
        >
          {pending ? "Settling" : "Settle this book"}
        </button>
        <p className="font-mono text-[11px] text-dim">
          {formatUsdcWhole(BigInt(input.postedMarginUsdc))} on the virtual balance settles
          both legs
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-field border border-down-dim bg-down-dim/30 px-3 py-2 text-[12px] text-down"
        >
          {error}{" "}
          <button type="button" onClick={run} className="font-mono underline">
            Retry
          </button>
        </p>
      )}

      {receipt?.receipt?.state === "settled" && (
        <div
          data-testid="settlement-receipt"
          className="mt-3 rounded-field border border-line bg-surface px-4 py-3"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="text-[13px] font-medium">Settlement receipt</p>
            <p className="font-mono text-[10px] text-dim">
              mode {receipt.mode} · simulated {receipt.receipt.tx.simulated ? "yes" : "no"} ·
              block {receipt.receipt.tx.block}
            </p>
          </div>
          <dl className="mt-2.5">
            {[
              ["Hedge gain pushed", receipt.receipt.balancesDuringSettlement.hedgeGainPushed],
              ["LP deficit paid", receipt.receipt.balancesDuringSettlement.lpDeficitPaid],
              ["Fee charged", receipt.receipt.balancesDuringSettlement.feeCharged],
              ["Equity returned", receipt.receipt.quote.remainingEquityUsdc],
              ["Balance left", receipt.receipt.balancesDuringSettlement.balanceLeft],
            ].map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-4 py-1">
                <dt className="text-[12px] text-dim">{label}</dt>
                <dd className="font-mono text-[12px] tabular-nums">{formatUsdcWhole(BigInt(value))}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 font-mono text-[10px] leading-relaxed text-dim">
            {receipt.receipt.tx.hash}
          </p>
        </div>
      )}

      {receipt?.attestation && (
        <p
          data-testid="attestation-line"
          className={cn(
            "mt-2 font-mono text-[11px] leading-relaxed",
            receipt.attestation.ok ? "text-up" : "text-dim",
          )}
        >
          {receipt.attestation.ok
            ? `attestation written to Rabdi testnet — key ${receipt.attestation.key} — expires in 300 s`
            : `attestation pending: ${receipt.attestation.reason}`}
        </p>
      )}

      {receipt?.receipt?.state === "rejected" && (
        <p
          role="status"
          className="mt-3 rounded-field border border-line bg-surface px-3 py-2 text-[12px] text-muted"
        >
          {receipt.receipt.reason}
        </p>
      )}
    </div>
  );
}
