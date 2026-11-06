import { NextResponse } from "next/server";
import { parseQuoteInput, settle } from "@/lib/quoteService";
import { recordUnwind, nextBlock } from "@/lib/demoStore";
import { arkivEnabled, writeAttestation } from "@/lib/arkiv-live";

/**
 * POST /api/unwind — the atomic dual-leg settlement. In LOCAL mode the
 * receipt is honestly labeled simulated. The transaction log never contains
 * secrets (NFR-08): only mode, chain id, block, and the receipt amounts.
 *
 * A fixed in-memory window rate-limits the endpoint; a single-instance demo
 * never needs more, and the limit names itself in the response.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;
const hits: number[] = [];

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, problems: ["body must be JSON"] }, { status: 400 });
  }

  const parsed = parseQuoteInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, problems: parsed.problems }, { status: 400 });
  }

  const now = Date.now();
  while (hits.length > 0 && now - hits[0] > WINDOW_MS) hits.shift();
  if (hits.length >= MAX_PER_WINDOW) {
    return NextResponse.json(
      { ok: false, problems: ["rate limit: 30 settlements per minute"] },
      { status: 429, headers: { "retry-after": "60" } },
    );
  }
  hits.push(now);

  const block = nextBlock();
  const receipt = settle(parsed.input!, 31337, block);
  if (!receipt) {
    return NextResponse.json({ ok: false, problems: ["settlement failed"] }, { status: 500 });
  }
  recordUnwind(receipt);

  // Live attestations: every settlement lands in Rabdi with a 300-second
  // TTL — the discovery layer FR-12 describes. A missing or unfunded writer
  // degrades into `attestation: pending` rather than faking a record.
  let attestation: { ok: boolean; key?: string; tx?: string | null; reason?: string } = {
    ok: false,
    reason: "arkiv cache mode; writes stay off without ARKIV_ACCESS_KEY",
  };
  if (arkivEnabled()) {
    try {
      const write = await writeAttestation({
        portfolioId: `SETTLE-${block}`,
        trader: "0x7fa309ac6c21d2e4a81f7e58aB0a07c41d".slice(0, 42),
        status: receipt.quote.badDebtUsdc > 0n ? "UNWIND_ELIGIBLE" : "ACTIVE_HEDGED",
        marginRatioBps: Number((receipt.quote.remainingEquityUsdc * 10_000n) / (parsed.input!.lpNotionalUsdc + parsed.input!.shortNotionalUsdc + 1n)),
        lpNotionalUsdc: parsed.input!.lpNotionalUsdc.toString(),
        shortNotionalUsdc: parsed.input!.shortNotionalUsdc.toString(),
        postedMarginUsdc: parsed.input!.postedMarginUsdc.toString(),
        netInitialMarginUsdc: parsed.input!.lpNotionalUsdc.toString(),
        netMaintenanceMarginUsdc: (parsed.input!.lpNotionalUsdc * 7500n / 10000n).toString(),
        equityUsdc: receipt.quote.remainingEquityUsdc.toString(),
        aquaStrategyHash: "0x" + receipt.tx.hash.slice(2, 66),
      });
      attestation = { ok: true, key: write.key, tx: write.tx };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      attestation = { ok: false, reason: message.slice(0, 200) };
    }
  }

  const serialized = {
    ok: true,
    mode: "LOCAL",
    receipt: {
      state: receipt.state,
      reason: receipt.reason,
      tx: receipt.tx,
      quote: Object.fromEntries(Object.entries(receipt.quote).map(([k, v]) => [k, v.toString()])),
      balancesDuringSettlement: Object.fromEntries(
        Object.entries(receipt.balancesDuringSettlement).map(([k, v]) => [k, BigInt(v).toString()]),
      ),
    },
    attestation,
  };
  return NextResponse.json(serialized);
}

