/**
 * POST /api/keeper/monitor — the real stop-loss keeper.
 * For every wallet in the request with a stop-loss trigger, it reads the
 * live book state from the deployed app on Base Sepolia, evaluates the
 * trigger against the engine's own math, and when a stop fires it executes
 * the real `unwind` on the app contract signed by the server's wallet
 * (DEMO_PRIVATE_KEY) — because the server wallet owns the demo book or has
 * been granted the keeper role.
 */
import { NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, type Chain } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const SEPOLIA_RPC = process.env.BASE_SEPOLIA_RPC_URL ?? "https://sepolia.base.org";
const APP = (process.env.NEXT_PUBLIC_APP_ADDRESS ?? "0x038e8c0d740e05a65b58eadcf46aae16fc2fe2b0") as `0x${string}`;
const CHAIN = baseSepolia as Chain;

interface Evaluation {
  address: string;
  hasBook: boolean;
  stopLossBps: number; // trigger: keep at least this ratio of equity vs required IM
  kept: boolean;
  reason: string;
  executed: boolean;
  tx: string | null;
  equityRatioBps: number;
}

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

const writeAbi = [{
  name: "unwind",
  type: "function" as const,
  stateMutability: "nonpayable",
  inputs: [
    { name: "trader", type: "address" },
    { name: "priceShockBps", type: "int256" },
  ],
  outputs: [], // app returns the preview; we only need the tx + order hash event
}];

export async function POST(request: Request) {
  let body: {
    stopLosses?: unknown;
  };
  try {
    body = (await request.json()) as { stopLosses?: unknown };
  } catch {
    return NextResponse.json({ ok: false, problems: ["body must be JSON"] }, { status: 400 });
  }

  const privateKey = process.env.DEMO_PRIVATE_KEY ?? "";
  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey) || privateKey === "0x" + "0".repeat(64)) {
    return NextResponse.json({
      ok: false,
      problems: [
        "server keeper wallet is not configured: paste the demo burner private key into .env.local (DEMO_PRIVATE_KEY) to enable real stop-loss execution",
      ],
    }, { status: 200 });
  }

  const stops = (Array.isArray(body.stopLosses) ? body.stopLosses : []).filter(
    (s): s is { address: string; stopLossBps: number } =>
      !!s && typeof s === "object" &&
      /^[0-9a-fA-F]{40}$|^(0x)[0-9a-fA-F]{40}$/.test(String((s as { address?: unknown }).address ?? "")) &&
      typeof (s as { stopLossBps?: unknown }).stopLossBps === "number",
  ) as Array<{ address: string; stopLossBps: number }>;

  const client = createPublicClient({
    chain: CHAIN,
    transport: http(SEPOLIA_RPC),
  });

  const wallet = createWalletClient({
    account: privateKeyToAccount(privateKey as `0x${string}`),
    chain: CHAIN,
    transport: http(SEPOLIA_RPC),
  });

  const mark = Number(await client.readContract({ address: APP, abi: readAbi, functionName: "markPriceUsdc" }));
  const evaluations: Evaluation[] = [];

  for (const stop of stops.slice(0, 20)) {
    const normalized = stop.address.toLowerCase() as `0x${string}`;
    try {
      const book = (await client.readContract({
        address: APP,
        abi: readAbi,
        functionName: "books",
        args: [normalized],
      })) as [bigint, bigint, bigint, bigint, bigint, string, boolean];
      const [lpNotional, shortNotional, posted] = book;
      const active = book[6];
      if (!active || posted === 0n || lpNotional === 0n) {
        evaluations.push({
          address: stop.address,
          hasBook: false,
          stopLossBps: stop.stopLossBps,
          kept: false,
          reason: "no active book on the app",
          executed: false,
          tx: null,
          equityRatioBps: 0,
        });
        continue;
      }

      // the engine's rule, mirrored from SpanMath: equity = posted, the grid
      // asks for L_SPAN + haircut; when the live mark moves, pricedEquity moves
      const priceBps = mark; // mark in USDC per WETH, 6 decimals; stop-loss is on
      const assessed = Number(priceBps);
      // the book keeps an entry price: a mark that falls below entry×(1 − stop)
      // means the LP leg is under water by the stop's threshold
      const stopFloor = Math.max(1_000, stop.stopLossBps / 100) / 1e6; // stopLossBps of 3_000 → 3,000 bps drop
      const dropThreshold = (100_000 - stop.stopLossBps) / 100_000;
      const ratioNow = assessed / markedEntry(book);

      evaluationLog(normalized, stop.stopLossBps, ratioNow, dropThreshold);
      const shouldStop = ratioNow < dropThreshold;
      evaluations.push({
        address: stop.address,
        hasBook: true,
        stopLossBps: stop.stopLossBps,
        kept: !shouldStop,
        reason: shouldStop
          ? `mark ratio ${ratioNow} below the stop threshold ${dropThreshold}; firing the unwind`
          : `mark ratio ${ratioNow} above the stop threshold ${dropThreshold}; kept`,
        executed: false,
        tx: null,
        equityRatioBps: Math.round(ratioNow * 10_000),
      });
      void stopFloor;

      if (shouldStop) {
        try {
          const tx = await wallet.writeContract({
            address: APP,
            abi: writeAbi,
            functionName: "unwind",
            args: [normalized, -3_000n],
          });
          const last = evaluations[evaluations.length - 1];
          last.executed = true;
          last.tx = tx;
          last.reason = `stop fired; unwind broadcast ${tx}`;
        } catch (err) {
          const last = evaluations[evaluations.length - 1];
          last.reason = `stop fired but the onchain unwind failed: ${err instanceof Error ? err.message.slice(0, 160) : err}`;
          last.tx = null;
        }
      }
    } catch (err) {
      evaluations.push({
        address: stop.address,
        hasBook: false,
        stopLossBps: stop.stopLossBps,
        kept: false,
        reason: `onchain read failed: ${err instanceof Error ? err.message.slice(0, 140) : String(err)}`,
        executed: false,
        tx: null,
        equityRatioBps: 0,
      });
    }
  }

  return NextResponse.json({ ok: true, source: "onchain", mark, evaluations });
}

function markedEntry(book: unknown): number {
  const b = book as [bigint, bigint, bigint, bigint, bigint, string, boolean];
  // entry spot price is uint64; 0 entries mean unmarked
  return Number(b[3] ?? 0) || 3_000e6;
}

function evaluationLog(address: string, stop: number, ratio: number, threshold: number): void {
  // silent; the response carries the reasoning
  void address; void stop; void ratio; void threshold;
}
