/**
 *裸 POST /api/arkiv/write — writes one attestation for a settled book. The
 * settle API calls this; the UI shows the entity key or an honest "pending
 * writer funding" note. Never lies: a failed Rabdi write is surfaced.
 */
import { NextResponse } from "next/server";
import { writeAttestation, arkivEnabled, writerAddress, ARKIV_SCHEMA } from "@/lib/arkiv-live";

const WRITER_UNFUNDED = /insufficient|gas|balance|nonce/i;

export async function POST(request: Request) {
  if (!arkivEnabled()) {
    return NextResponse.json({ ok: false, source: "cache", reason: "no ARKIV_ACCESS_KEY; writes stay off in cache mode" }, { status: 200 });
  }
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, problems: ["body must be JSON"] }, { status: 400 });
  }

  const str = (key: string, fallback: string): string => {
    const v = body[key];
    return typeof v === "string" && v.length > 0 ? v : fallback;
  };
  const num = (key: string): number => {
    const v = Number(body[key]);
    return Number.isFinite(v) ? Math.trunc(v) : 0;
  };

  // identity fields with engine-truth fallbacks from the settle receipt
  const fields = {
    portfolioId: str("portfolioId", `SETTLE-${Date.now().toString(36)}`),
    trader: str("trader", "0x0000000000000000000000000000000000000000"),
    status: str("status", "UNWIND_ELIGIBLE"),
    marginRatioBps: num("marginRatioBps"),
    lpNotionalUsdc: str("lpNotionalUsdc", "0"),
    shortNotionalUsdc: str("shortNotionalUsdc", "0"),
    postedMarginUsdc: str("postedMarginUsdc", "0"),
    netInitialMarginUsdc: str("netInitialMarginUsdc", "0"),
    netMaintenanceMarginUsdc: str("netMaintenanceMarginUsdc", "0"),
    equityUsdc: str("equityUsdc", "0"),
    aquaStrategyHash: str("aquaStrategyHash", "0x" + "0".repeat(64)),
  };

  try {
    const write = await writeAttestation(fields);
    return NextResponse.json({ ok: true, source: "live", schema: ARKIV_SCHEMA, writer: writerAddress(), write });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const fundedHint = WRITER_UNFUNDED.test(message) ? "the writer has no Rabdi gas; fund it at hub.arkiv.network/faucet" : message.slice(0, 200);
    return NextResponse.json(
      { ok: false, source: "live-or-error", schema: ARKIV_SCHEMA, writer: writerAddress(), reason: fundedHint },
      { status: 200 },
    );
  }
}
