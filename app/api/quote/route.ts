import { NextResponse } from "next/server";
import { parseQuoteInput, quote } from "@/lib/quoteService";

/**
 * POST /api/quote — the deterministic engine quote for one input.
 * NFR-01: integer money in, integer money out; NFR-03: this is pure math,
 * so the 500 ms budget is trivial and latency comes from transport only.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, problems: ["body must be JSON with integer stringifies"] },
      { status: 400 },
    );
  }

  const parsed = parseQuoteInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, problems: parsed.problems }, { status: 400 });
  }

  const result = quote(parsed.input!);
  return NextResponse.json({
    ok: true,
    netted: ints(result.netted),
    isolated: ints(result.isolated),
    netInitialMarginUsdc: result.netInitialMarginUsdc.toString(),
    isolatedInitialMarginUsdc: result.isolatedInitialMarginUsdc.toString(),
    input: result.input,
  });
}

function ints(o: Record<string, bigint>) {
  return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v.toString()]));
}

export const dynamic = "force-dynamic";
