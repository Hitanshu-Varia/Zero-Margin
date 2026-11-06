import {
  DEMO_BOOK,
  DEMO_ISOLATED_BOOK,
  DEMO_VOL_SHOCK_BPS,
  PRICE_SHOCKS_BPS,
  evaluateSpan16,
  isolatedAccountAtShock,
  previewShockUnwind,
} from "@/lib/spanMath";

export const span = evaluateSpan16(
  DEMO_BOOK.lpNotionalUsdc,
  DEMO_BOOK.shortNotionalUsdc,
);

export interface ShockQuote {
  shock: bigint;
  netted: ReturnType<typeof previewShockUnwind>;
  isolated: ReturnType<typeof isolatedAccountAtShock>;
}

/** All eight price shocks of the grid, quoted for both desk models. */
export const quotes: ShockQuote[] = PRICE_SHOCKS_BPS.map((shock) => ({
  shock,
  netted: previewShockUnwind(
    DEMO_BOOK.lpNotionalUsdc,
    DEMO_BOOK.shortNotionalUsdc,
    DEMO_BOOK.postedMarginUsdc,
    shock,
    DEMO_VOL_SHOCK_BPS,
  ),
  isolated: isolatedAccountAtShock(
    DEMO_ISOLATED_BOOK.lpNotionalUsdc,
    DEMO_ISOLATED_BOOK.postedMarginUsdc,
    shock,
    DEMO_VOL_SHOCK_BPS,
  ),
}));

/** "−30%" / "0" / "+20%" — a shock tick for the compass or staff. */
export function shockTick(shock: bigint): string {
  if (shock === 0n) return "0";
  const sign = shock < 0n ? "−" : "+";
  const abs = shock < 0n ? -shock : shock;
  return `${sign}${abs / 100n}%`;
}
