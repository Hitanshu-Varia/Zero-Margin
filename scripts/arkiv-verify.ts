/**
 * `npm run arkiv:verify` — the T-11 gate: write one real entity to Rabdi
 * with the configured writer, then read it back through the keeper query.
 * Prints the entity key, the writer, the expiry countdown, and the query
 * row. Honest failure names the problem; it never exits 0 on a lie.
 *
 * Run through tsx so the project's `@/` path aliases resolve:
 *   ARKIV_MODE=live npx tsx scripts/arkiv-verify.ts
 */
import { arkivEnabled, queryAttestations, writeAttestation, ARKIV_SCHEMA } from "@/lib/arkiv-live";
import { privateKeyToAccount } from "viem/accounts";

async function main() {
  if (!arkivEnabled()) {
    console.error("ARKIV_OFFLINE: no ARKIV_ACCESS_KEY in .env.local; nothing was written.");
    process.exit(1);
  }

  const writerKey = process.env.ARKIV_WRITER_PRIVATE_KEY ?? "";
  if (!/^0x[0-9a-fA-F]{64}$/.test(writerKey) || /^0x0{64}$/.test(writerKey)) {
    console.error("WRITER_KEY_MISSING: paste a Rabdi-funded testnet private key into");
    console.error("  .env.local → ARKIV_WRITER_PRIVATE_KEY   (faucet: hub.arkiv.network/faucet)");
    console.error("Nothing was written to Rabdi. Exiting.");
    process.exit(1);
  }
  const writer = privateKeyToAccount(writerKey as `0x${string}`);

  const fields = {
    portfolioId: `VERIFY-${Date.now().toString(36)}`,
    trader: writer.address,
    status: "UNWIND_ELIGIBLE",
    marginRatioBps: 7272,
    lpNotionalUsdc: "100000000000",
    shortNotionalUsdc: "95000000000",
    postedMarginUsdc: "25000000000",
    netInitialMarginUsdc: "16500000000",
    netMaintenanceMarginUsdc: "12375000000",
    equityUsdc: "12000000000",
    aquaStrategyHash: "0xf00dcade" + "0".repeat(58),
  };

  console.log("→ writing", ARKIV_SCHEMA, "entity", fields.portfolioId, "as", writer.address);
  const write = await writeAttestation(fields);
  console.log("  key      ", write.key);
  console.log("  expiresAt", write.expiresAt, `(+${Math.max(0, write.expiresAt - Math.floor(Date.now() / 1000))}s)`);

  const rows = await queryAttestations();
  const mine = rows.filter((r) => r.portfolioId === fields.portfolioId);
  console.log("keeper query returned", rows.length, "rows;");
  if (mine.length === 0) {
    console.error("VERIFY_FAIL: the written row did not come back through the keeper query.");
    process.exit(1);
  }
  console.log("✅ VERIFY_OK — the written attestation is live, queryable, and expiring:");
  for (const row of mine) {
    console.log("  ", row.portfolioId, row.status, "ratio", Number(row.marginRatioBps), "bps");
  }
}

main().catch((err) => {
  console.error("VERIFY_FAIL:", err instanceof Error ? err.message : err);
  process.exit(1);
});
