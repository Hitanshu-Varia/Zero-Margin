/**
 * The demo book's local, in-memory state module: a module-scope Map is
 * enough for a single-instance demo; a horizontal deployment would swap
 * this file, and only this file, for a durable store. Written down as a
 * documented limitation in README.md.
 */
import type { SettlementReceipt } from "@/lib/quoteService";

const settlements: SettlementReceipt[] = [];

export function recordUnwind(receipt: SettlementReceipt): void {
  settlements.unshift(receipt);
  if (settlements.length > 50) settlements.pop();
}

export function recentUnwinds(): readonly SettlementReceipt[] {
  return settlements;
}

/** The chain's clock for receipts, frozen for determinism. */
export const GENESIS_BLOCK = 24_692_155;

export function nextBlock(): number {
  // 2-second cadence approximates a live chain without pretending to sync one.
  return GENESIS_BLOCK + Math.floor(Date.now() / 2_000);
}
