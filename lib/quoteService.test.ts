import { describe, expect, it } from "vitest";
import { parseQuoteInput, quote, settle } from "@/lib/quoteService";
import { DEMO_BOOK, DEMO_VOL_SHOCK_BPS } from "@/lib/spanMath";

const GV01 = {
  lpNotionalUsdc: DEMO_BOOK.lpNotionalUsdc,
  shortNotionalUsdc: DEMO_BOOK.shortNotionalUsdc,
  postedMarginUsdc: DEMO_BOOK.postedMarginUsdc,
  priceShockBps: -3_000n,
  volShockBps: DEMO_VOL_SHOCK_BPS,
};

describe("quote service", () => {
  it("returns the golden UNWIND-01 waterfall for GV-01 at −3,000 bps", () => {
    const q = quote(GV01);
    expect(q.netted.lpLossUsdc).toBe(33_750_000_000n);
    expect(q.netted.shortGainUsdc).toBe(28_500_000_000n);
    expect(q.netted.nettedOffsetUsdc).toBe(28_500_000_000n);
    expect(q.netted.protocolFeeUsdc).toBe(50_000_000n);
    expect(q.netted.remainingEquityUsdc).toBe(19_700_000_000n);
    expect(q.netted.badDebtUsdc).toBe(0n);
  });

  it("rejects an over-hedged book and out-of-envelope shocks by name", () => {
    const over = parseQuoteInput({ ...asStrings(GV01), shortNotionalUsdc: "200000000000" });
    expect(over.ok).toBe(false);
    expect(over.problems.join("\n")).toContain("over-hedged");

    const deep = parseQuoteInput({ ...asStrings(GV01), priceShockBps: "-4000" });
    expect(deep.ok).toBe(false);
    expect(deep.problems.join("\n")).toContain("tested envelope");
  });

  it("settles deterministically and reports the balance walk", () => {
    const receipt = settle(GV01, 31337, 1);
    expect(receipt?.state).toBe("settled");
    expect(receipt?.quote.remainingEquityUsdc).toBe(19_700_000_000n);
    expect(receipt?.balancesDuringSettlement.balanceLeft).toBe(
      (DEMO_BOOK.postedMarginUsdc - 5_300_000_000n).toString(),
    );
    expect(receipt?.tx.simulated).toBe(true);
  });

  it("refuses to settle upward shocks and says why", () => {
    const receipt = settle(
      { ...GV01, priceShockBps: 500n },
      31337,
      1,
    );
    expect(receipt?.state).toBe("rejected");
    expect(receipt?.reason).toContain("downward");
  });

  it("is referentially stable for identical inputs", () => {
    const a = quote(GV01);
    const b = quote({ ...GV01 });
    expect(b).toStrictEqual(a);
  });
});

function asStrings(i: typeof GV01) {
  return {
    lpNotionalUsdc: i.lpNotionalUsdc.toString(),
    shortNotionalUsdc: i.shortNotionalUsdc.toString(),
    postedMarginUsdc: i.postedMarginUsdc.toString(),
    priceShockBps: i.priceShockBps.toString(),
    volShockBps: i.volShockBps.toString(),
  };
}
