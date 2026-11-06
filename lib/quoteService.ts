/**
 * The quote and settlement service: one deterministic core that both the
 * pages and the API routes call, so the UI can never drift from the API
 * and the API can never drift from the engine.
 */
import {
  DEMO_BOOK,
  DEMO_VOL_SHOCK_BPS,
  MAX_SHOCK_BPS,
  MIN_SHOCK_BPS,
  evaluateSpan16,
  isolatedAccountAtShock,
  previewShockUnwind,
} from "@/lib/spanMath";
import { createHash } from "node:crypto";

export interface QuoteInput {
  lpNotionalUsdc: bigint;
  shortNotionalUsdc: bigint;
  postedMarginUsdc: bigint;
  priceShockBps: bigint;
  volShockBps: bigint;
}

export interface ParseResult {
  ok: boolean;
  problems: string[];
  input: QuoteInput | null;
}

const MAX_INT = 2_000_000n * 1_000_000n; // $2,000,000 as a sanity ceiling

/** Parse and validate a quote request. Rejects negatives, over-hedged books and out-of-envelope shocks with the variable name, not a stack trace. */
export function parseQuoteInput(body: Record<string, unknown>): ParseResult {
  const problems: string[] = [];
  const read = (key: keyof QuoteInput & string): bigint | null => {
    const raw = body[key];
    if (typeof raw !== "string" && typeof raw !== "number") {
      problems.push(`${key} is required as an integer`);
      return null;
    }
    try {
      const value = BigInt(raw);
      if (value < 0n || value > MAX_INT * 100n) {
        problems.push(`${key} must be a non-negative integer within the tested range`);
        return null;
      }
      return value;
    } catch {
      problems.push(`${key} is not an integer`);
      return null;
    }
  };

  const lpNotionalUsdc = read("lpNotionalUsdc");
  const shortNotionalUsdc = read("shortNotionalUsdc");
  const postedMarginUsdc = read("postedMarginUsdc");
  const rawShock = read("priceShockBps");
  const rawVol = read("volShockBps");

  let priceShockBps: bigint | null = null;
  if (rawShock !== null) {
    if (rawShock < MIN_SHOCK_BPS || rawShock > MAX_SHOCK_BPS) {
      problems.push(`priceShockBps is outside the tested envelope [${MIN_SHOCK_BPS}, ${MAX_SHOCK_BPS}] bps`);
    } else {
      priceShockBps = rawShock;
    }
  }
  let volShockBps: bigint | null = null;
  if (rawVol !== null) {
    if (rawVol !== 0n && rawVol !== 150n) {
      problems.push("volShockBps must be 0 or 150 inside the tested grid");
    } else {
      volShockBps = rawVol;
    }
  }

  if (lpNotionalUsdc !== null && shortNotionalUsdc !== null && shortNotionalUsdc > lpNotionalUsdc) {
    problems.push("shortNotionalUsdc cannot exceed lpNotionalUsdc; an over-hedged book cannot open");
  }
  if (lpNotionalUsdc !== null && lpNotionalUsdc === 0n) {
    problems.push("lpNotionalUsdc must be greater than zero");
  }

  const ok = problems.length === 0;
  return {
    ok,
    problems,
    input:
      ok && lpNotionalUsdc && shortNotionalUsdc && postedMarginUsdc && priceShockBps !== null && volShockBps !== null
        ? { lpNotionalUsdc, shortNotionalUsdc, postedMarginUsdc, priceShockBps, volShockBps }
        : null,
  };
}

/** The deterministic quote — the same input always yields the same output. */
export function quote(input: QuoteInput) {
  const netted = previewShockUnwind(
    input.lpNotionalUsdc,
    input.shortNotionalUsdc,
    input.postedMarginUsdc,
    input.priceShockBps,
    input.volShockBps,
  );
  const isolated = isolatedAccountAtShock(
    input.lpNotionalUsdc,
    input.postedMarginUsdc,
    input.priceShockBps,
    input.volShockBps,
  );
  const span = evaluateSpan16(input.lpNotionalUsdc, input.shortNotionalUsdc);
  return {
    netted,
    isolated,
    netInitialMarginUsdc: span.netInitialMarginUsdc,
    isolatedInitialMarginUsdc: span.isolatedInitialMarginUsdc,
    input: {
      lpNotionalUsdc: input.lpNotionalUsdc.toString(),
      shortNotionalUsdc: input.shortNotionalUsdc.toString(),
      postedMarginUsdc: input.postedMarginUsdc.toString(),
      priceShockBps: input.priceShockBps.toString(),
      volShockBps: input.volShockBps.toString(),
    },
  };
}

export interface SettlementReceipt {
  quote: ReturnType<typeof previewShockUnwind>;
  state: "settled" | "rejected";
  reason?: string;
  tx: {
    simulated: true;
    hash: string;
    block: number;
    chainId: number;
  };
  balancesDuringSettlement: {
    lpDeficitPaid: string;
    hedgeGainPushed: string;
    feeCharged: string;
    balanceLeft: string;
  };
}

/** The engine can only settle a book downward inside the envelope (FR-06). */
function settlementPrecheck(input: QuoteInput): string | null {
  if (input.priceShockBps > 0) {
    return "unsupported shock direction; unwind settles downward shocks only";
  }
  return null;
}

/**
 * Run the deterministic dual-leg settlement. LOCAL mode: the receipt is a
 * simulation of exactly what unwind() writes — the quote is the execution,
 * which is the product's core property. LIVE adapters receive the identical
 * precheck and quote; wiring them is gated by lib/env.ts.
 */
export function settle(input: QuoteInput, chainId: number, block: number): SettlementReceipt | null {
  const reason = settlementPrecheck(input);
  if (reason) {
    return {
      quote: previewShockUnwind(
        input.lpNotionalUsdc,
        input.shortNotionalUsdc,
        input.postedMarginUsdc,
        input.priceShockBps,
        input.volShockBps,
      ),
      state: "rejected",
      reason,
      tx: { simulated: true, hash: "", block, chainId },
      balancesDuringSettlement: { lpDeficitPaid: "0", hedgeGainPushed: "0", feeCharged: "0", balanceLeft: input.postedMarginUsdc.toString() },
    };
  }

  const q = previewShockUnwind(
    input.lpNotionalUsdc,
    input.shortNotionalUsdc,
    input.postedMarginUsdc,
    input.priceShockBps,
    input.volShockBps,
  );

  // The aubalance changes: posted + hedge push - lp deficit - fee
  const virtualBalance =
    input.postedMarginUsdc + q.shortGainUsdc - q.lpLossUsdc - q.protocolFeeUsdc;

  const seed = [
    input.lpNotionalUsdc,
    input.shortNotionalUsdc,
    input.postedMarginUsdc,
    input.priceShockBps,
    input.volShockBps,
    block,
  ].join(":");
  const hash = createHash("sha256").update(seed).digest("hex").slice(0, 64);

  return {
    quote: q,
    state: "settled",
    tx: { simulated: true, hash, block, chainId },
    balancesDuringSettlement: {
      lpDeficitPaid: q.lpLossUsdc.toString(),
      hedgeGainPushed: q.shortGainUsdc.toString(),
      feeCharged: q.protocolFeeUsdc.toString(),
      balanceLeft: virtualBalance.toString(),
    },
  };
}

/** Public, deterministic constants for the demo book identity. */
export const DEMO_INPUT: QuoteInput = {
  lpNotionalUsdc: DEMO_BOOK.lpNotionalUsdc,
  shortNotionalUsdc: DEMO_BOOK.shortNotionalUsdc,
  postedMarginUsdc: DEMO_BOOK.postedMarginUsdc,
  priceShockBps: 0n,
  volShockBps: DEMO_VOL_SHOCK_BPS,
};
