/**
 * Live-mode attestation routes: real writes to Rabdi via the adapter in
 * lib/arkiv-live.ts. In cache mode (no access key) the snapshot path stays,
 * and the response names its source so the badge matches the truth (FR-16).
 */
import { NextResponse } from "next/server";
import { ATTESTATIONS, KEEPER_QUERY, type Attestation } from "@/lib/attestations";
import { arkivEnabled, queryAttestations, ARKIV_SCHEMA, writerAddress } from "@/lib/arkiv-live";

type Entity = Record<string, string | number | bigint | boolean>;

/** BigInt fields are rendered explicitly; JSON cannot carry BigInts. */
function plain(e: Entity): Entity {
  return Object.fromEntries(
    Object.entries(e).map(([k, v]) => [k, typeof v === "bigint" ? v.toString() : v]),
  );
}

export async function GET() {
  if (!arkivEnabled()) {
    return NextResponse.json({
      ok: true,
      source: "cache",
      schema: ARKIV_SCHEMA,
      keeperQuery: KEEPER_QUERY,
      entities: ATTESTATIONS.map((e): Entity => plain(e as unknown as Entity)),
    });
  }
  try {
    const live = await queryAttestations();
    return NextResponse.json({
      ok: true,
      source: "live",
      mode: "live",
      schema: ARKIV_SCHEMA,
      writer: writerAddress(),
      keeperQuery: KEEPER_QUERY,
      entities: live.map((e): Entity => plain(e as unknown as Entity)),
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      source: "live-or-error",
      schema: ARKIV_SCHEMA,
      keeperQuery: KEEPER_QUERY,
      problems: [`live Rabdi read failed: ${err instanceof Error ? err.message : String(err)}`],
      entities: ATTESTATIONS.map((e): Entity => plain(e as unknown as Entity)),
    });
  }
}
