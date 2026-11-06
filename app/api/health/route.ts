import { NextResponse } from "next/server";
import { resolveEnv } from "@/lib/env";
import { DEMO_INPUT } from "@/lib/quoteService";

/**
 * GET /api/health — mode badge, chain id, and engine identity.
 * FR-16: the badge must match the actual environment; a missing LIVE
 * configuration surfaces problems here, never as a fake success.
 */
export function GET(): NextResponse {
  const env = resolveEnv(process.env as unknown as Record<string, string | undefined>);
  return NextResponse.json({
    status: env.mode === "ERROR" ? "degraded" : "ok",
    mode: env.display.mode,
    chainId: env.display.chainId,
    arkivMode: env.display.arkivMode,
    arkivSchema: env.display.arkivSchema,
    engine: {
      lpNotionalUsdc: DEMO_INPUT.lpNotionalUsdc.toString(),
      shortNotionalUsdc: DEMO_INPUT.shortNotionalUsdc.toString(),
      postedMarginUsdc: DEMO_INPUT.postedMarginUsdc.toString(),
    },
    problems: env.problems,
  });
}

