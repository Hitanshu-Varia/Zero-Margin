/**
 * POST /api/app/state — live onchain state for the web terminal:
 * mark price, one wallet's book (from the deployed app getter), and the
 * local adapter reserve. Everything comes from `eth_call` on the public
 * Sepolia RPC; no local fixtures.
 */
import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { APP_ADDRESS } from "@/lib/wallets";

const SEPOLIA_RPC = process.env.BASE_SEPOLIA_RPC_URL ?? "https://sepolia.base.org";
const APP = (process.env.NEXT_PUBLIC_APP_ADDRESS ?? APP_ADDRESS) as `0x${string}`;

const readAbi = [{
  name: "books",
  type: "function" as const,
  stateMutability: "view",
  inputs: [{ name: "", type: "address" }],
  outputs: [
    { name: "lpNotionalUsdc", type: "uint128" },
    { name: "shortNotionalUsdc", type: "uint128" },
    { name: "postedMarginUsdc", type: "uint128" },
    { name: "entrySpotPriceUsdc", type: "uint64" },
    { name: "lastUpdateTimestamp", type: "uint64" },
    { name: "aquaStrategyHash", type: "bytes32" },
    { name: "isActive", type: "bool" },
  ],
}, {
  name: "markPriceUsdc",
  type: "function" as const,
  stateMutability: "view",
  inputs: [],
  outputs: [{ name: "", type: "uint64" }],
}];

export async function POST(request: Request) {
  let wallet = "0xB18C4Be38412E8A12961a09988a9DD211257476F";
  let shock = -3000;
  try {
    const body = (await request.json()) as { wallet?: string; shock?: number };
    if (typeof body.wallet === "string" && /^0x[0-9a-fA-F]{40}$/.test(body.wallet)) wallet = body.wallet;
    if (Number.isFinite(body.shock)) shock = Math.trunc(body.shock as number);
  } catch {
    // defaults stand
  }

  const client = createPublicClient({ chain: baseSepolia, transport: http(SEPOLIA_RPC) });

  try {
    const [book, mark] = (await Promise.all([
      client.readContract({ address: APP, abi: readAbi, functionName: "books", args: [wallet as `0x${string}`] }) as unknown as Promise<[bigint, bigint, bigint, bigint, bigint, `0x${string}`, boolean]>,
      client.readContract({ address: APP, abi: readAbi, functionName: "markPriceUsdc" }) as unknown as Promise<bigint>,
    ])) as [[bigint, bigint, bigint, bigint, bigint, `0x${string}`, boolean], bigint];

    const [lpNotional, shortNotional, posted] = book;
    const active = book[6];

    return NextResponse.json({
      ok: true,
      chainId: 84_532,
      app: APP,
      wallet,
      onchain: {
        isActive: active,
        lpNotionalUsdc: lpNotional.toString(),
        shortNotionalUsdc: shortNotional.toString(),
        postedMarginUsdc: posted.toString(),
        entrySpotPriceUsdc: book[3].toString(),
        lastUpdateTimestamp: book[4].toString(),
        aquaStrategyHash: book[5],
        markPriceUsdc: mark.toString(),
      },
      source: "onchain",
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      source: "onchain-or-error",
      problems: [err instanceof Error ? err.message.slice(0, 200) : "onchain read failed"],
    });
  }
}
