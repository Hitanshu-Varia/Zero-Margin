import type { Metadata } from "next";
import { Panel } from "@/components/Panel";
import { ArkivFeed } from "@/components/desk/ArkivFeed";
import { ATTESTATIONS } from "@/lib/attestations";

export const metadata: Metadata = {
  title: "Arkiv attestations",
};

export default function ArkivPage() {
  return (
    <main className="mx-auto w-full max-w-[1240px] px-4 pb-16 pt-6 md:px-6">
      <div className="mb-5">
        <h1 className="text-[20px] font-medium">
          Arkiv risk attestations
        </h1>
        <p className="mt-1 max-w-2xl text-pretty text-[14px] leading-relaxed text-muted">
          Wallet-owned risk summaries written to Arkiv Rabdi, expiring 300
          seconds after each write — 150 blocks at 2 seconds per block. A
          keeper reads them for discovery only; the contract recomputes the
          margin before any settlement moves collateral.
        </p>
      </div>

      <Panel accent label="Keeper query">
        <div className="p-5 pt-4">
          <ArkivFeed initialEntities={ATTESTATIONS} />
        </div>
      </Panel>

      <p className="mt-5 max-w-3xl font-pretty font-mono text-[12px] leading-relaxed text-dim">
        schema fields: portfolioId str, trader addr, status str,
        marginRatioBps i32, notionals dec, equityUsdc dec, ttl
        ExpirationTime.fromMinutes(5). The amber tick marks 100% coverage;
        left of it, the book is UNWIND_ELIGIBLE.
      </p>
    </main>
  );
}
