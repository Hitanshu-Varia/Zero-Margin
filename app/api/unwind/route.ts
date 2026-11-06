import { NextResponse } from "next/server";
import { parseQuoteInput, settle } from "@/lib/quoteService";
import { recordUnwind, nextBlock } from "@/lib/demoStore";

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
  return NextResponse.json({ ok: true, receipt, mode: "LOCAL" });
}

export const dynamic = "force-dynamic";
