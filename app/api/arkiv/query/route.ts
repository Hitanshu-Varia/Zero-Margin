import { NextResponse } from "next/server";
import { ATTESTATIONS, KEEPER_QUERY } from "@/lib/attestations";
import { resolveEnv } from "@/lib/env";

type Entity = Record<string, string | number | bigint | boolean>;

/** BigInt fields are rendered explicitly; JSON cannot carry BigInts. */
function plain(e: Entity): Entity {
  return Object.fromEntries(
    Object.entries(e).map(([k, v]) => [k, typeof v === "bigint" ? v.toString() : v]),
  );
}

/**
 * GET /api/arkiv/query — wallet-owned risk attestations. In cache mode the
 * store is the bundled snapshot; the response names its source so the UI
 * badge can match FR-16 (the badge must describe what is actually live).
 */
export function GET() {
  const env = resolveEnv(process.env as unknown as Record<string, string | undefined>);
  const source = env.display.arkivMode === "live" ? "live-or-error" : "cache";

  return NextResponse.json({
    ok: source === "cache",
    source,
    schema: env.display.arkivSchema,
    keeperQuery: KEEPER_QUERY,
    entities: ATTESTATIONS.map((e): Entity => plain(e as unknown as Entity)),
  });
}

