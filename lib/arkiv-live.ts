/**
 * The live Arkiv adapter: writes and reads 300-second risk attestations on
 * Rabdi by way of @arkiv-network/sdk. Server-side only (the access key never
 * reaches the browser). Live mode requires the writer key; a missing writer
 * degrades loudly with `mode: "live-or-error"` in the API response, never
 * as a fake success.
 */
import { createPublicClient, createWalletClient, ExpirationTime } from "@arkiv-network/sdk";
import { defineSchema, str, dec, i32, type DecValue } from "@arkiv-network/sdk/schema";
import { rabdi } from "@arkiv-network/sdk/chains";
import { http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { KEEPER_QUERY, type Attestation } from "@/lib/attestations";

const CHAIN_ID = 7_794_095; // spec F-08
const RABDI_RPC = "https://rpc.rabdi.db-chain.testnet.arkiv.network";

export const ARKIV_SCHEMA = "zeromargin.span_attestations";
const TTL_MINUTES = 5; // spec D-13: 300 s = 150 blocks at 2 s/block

/** The run-time schema the writes and the query both key on. */
export const SPAN_ATTESTATION_SCHEMA = defineSchema(ARKIV_SCHEMA, {
  portfolioId: str().indexed(),
  trader: str().indexed(),
  status: str().indexed(),
  aquaStrategyHash: str(),
  marginRatioBps: i32().indexed(),
  lpNotionalUsdc: dec(),
  shortNotionalUsdc: dec(),
  postedMarginUsdc: dec(),
  netInitialMarginUsdc: dec(),
  netMaintenanceMarginUsdc: dec(),
  equityUsdc: dec(),
  updatedAt: i32(),
});

export function arkivEnabled(): boolean {
  return !!process.env.ARKIV_ACCESS_KEY;
}

function chain() {
  return rabdi({ accessKey: process.env.ARKIV_ACCESS_KEY ?? "" });
}

function transport() {
  // http() with no URL sends to the chain's RPC entry — and on rabdi() the
  // access key is baked into that URL, so the keyed entry always wins.
  return http();
}

function publicClient() {
  return createPublicClient({ chain: chain(), transport: transport() });
}

function walletClient() {
  const raw = process.env.ARKIV_WRITER_PRIVATE_KEY ?? "";
  if (!/^0x[0-9a-fA-F]{64}$/.test(raw)) {
    throw new Error("ARKIV_WRITER_PRIVATE_KEY is missing or malformed in .env.local");
  }
  const account = privateKeyToAccount(raw as `0x${string}`);
  return createWalletClient({
    chain: chain(),
    transport: transport(),
    account,
  });
}

export function writerAddress(): string {
  return walletClient().account.address;
}

export interface WriteResult {
  key: string;
  expiresAt: number; // unix seconds
  tx: string | null;
}

/** Write one risk attestation with a 300-second TTL (spec D-13). */
export async function writeAttestation(fields: {
  portfolioId: string;
  trader: string;
  status: string;
  marginRatioBps: number;
  lpNotionalUsdc: string;
  shortNotionalUsdc: string;
  postedMarginUsdc: string;
  netInitialMarginUsdc: string;
  netMaintenanceMarginUsdc: string;
  equityUsdc: string;
  aquaStrategyHash: string;
}): Promise<WriteResult> {
  const expiresAt = ExpirationTime.fromSeconds(TTL_MINUTES * 60);
  const result = await walletClient().createEntity(
    SPAN_ATTESTATION_SCHEMA,
    {
      portfolioId: fields.portfolioId,
      trader: fields.trader,
      status: fields.status,
      aquaStrategyHash: fields.aquaStrategyHash,
      marginRatioBps: fields.marginRatioBps,
      lpNotionalUsdc: dec(fields.lpNotionalUsdc),
      shortNotionalUsdc: dec(fields.shortNotionalUsdc),
      postedMarginUsdc: dec(fields.postedMarginUsdc),
      netInitialMarginUsdc: dec(fields.netInitialMarginUsdc),
      netMaintenanceMarginUsdc: dec(fields.netMaintenanceMarginUsdc),
      equityUsdc: dec(fields.equityUsdc),
      updatedAt: Math.floor(Date.now() / 1000),
    },
    { expiration: expiresAt },
  );
  const r = result as { entityKey?: string; expiresAt?: unknown; txHash?: string };
  return {
    key: r.entityKey ?? "",
    expiresAt: Number(r.expiresAt ?? 0),
    tx: r.txHash ?? null,
  };
}

/** The keeper's read: UNWIND_ELIGIBLE inside its own margin envelope. */
export async function queryAttestations(): Promise<Attestation[]> {
  const rows: Attestation[] = [];
  // the SDK's typed select wraps the same raw arkiv_query; keep the raw
  // string identical to the README's runnable query out of honesty
  const response = (await walletClient().transport.request({
    method: "arkiv_query",
    params: [
      `arkiv.schema = str('${ARKIV_SCHEMA}') AND status = str('UNWIND_ELIGIBLE') AND marginRatioBps < i32(10000) ORDER BY $key ASC`,
    ],
  })) as { data?: Array<Record<string, unknown>> };
  for (const row of response?.data ?? []) {
    const ann = (row.annotations ?? {}) as Record<string, string | number>;
    const num = (k: string) => ann[k] ?? 0;
    rows.push({
      portfolioId: String(ann.portfolioId ?? String(row.key).slice(0, 18)),
      trader: String(ann.trader ?? "unknown"),
      status: String(ann.status ?? "UNKNOWN") as Attestation["status"],
      marginRatioBps: BigInt(num("marginRatioBps")),
      lpNotionalUsdc: BigInt(num("lpNotionalUsdc")),
      shortNotionalUsdc: BigInt(num("shortNotionalUsdc")),
      postedMarginUsdc: BigInt(num("postedMarginUsdc")),
      netInitialMarginUsdc: BigInt(num("netInitialMarginUsdc")),
      netMaintenanceMarginUsdc: BigInt(num("netMaintenanceMarginUsdc")),
      equityUsdc: BigInt(num("equityUsdc")),
      updatedAtLabel: String(ann.updatedAt ?? new Date().toISOString().slice(11, 19)),
      remainingTtlSeconds: Number(ann.remainingTtlSeconds ?? 0),
      aquaStrategyHash: String(ann.aquaStrategyHash ?? ""),
    });
  }
  return rows;
}

export function keeperQueryText(): string {
  return KEEPER_QUERY;
}

export const ARKIV_CHAIN_ID = CHAIN_ID;
