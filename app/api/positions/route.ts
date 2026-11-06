/**
 * POST /api/positions — real, live position reads for any addresses the user
 * added. Body: { wallets: string[] } (max 20). Response names every source:
 * native ETH from getBalance, USDC from balanceOf on the deployed demo token,
 * books from the deployed app getter. No cache, no fixture data.
 */
import { NextResponse } from "next/server";
import { readWallets } from "@/lib/wallets";

const ADDR = /^0x[0-9a-fA-F]{40}$/;

export async function POST(request: Request) {
  let body: { wallets?: unknown };
  try {
    body = (await request.json()) as { wallets?: unknown };
  } catch {
    return NextResponse.json({ ok: false, problems: ["body must be JSON"] }, { status: 400 });
  }

  const raw = Array.isArray(body.wallets) ? body.wallets : [];
  const valid = raw.filter((a): a is string => typeof a === "string" && ADDR.test(a)).slice(0, 20);
  if (valid.length === 0) {
    return NextResponse.json({ ok: false, problems: ["wallets must hold at least one 0x address"] }, { status: 400 });
  }

  const positions = await readWallets(valid);
  return NextResponse.json({
    ok: true,
    chainId: 84_532,
    positions,
    source: "onchain",
    rpc: process.env.BASE_SEPOLIA_RPC_URL ?? "https://sepolia.base.org",
  });
}
