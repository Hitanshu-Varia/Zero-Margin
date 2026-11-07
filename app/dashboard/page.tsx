import { Panel } from "@/components/Panel";
import { LiveDashboardBand } from "@/components/desk/LiveDashboardBand";
import { LiveBooksActivity } from "@/components/desk/LiveBooksActivity";
import { StressChart } from "@/components/dashboard/StressChart";
export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-[1128px] px-4 pb-14 pt-8 md:px-6">
      {/* Landing page hero */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-balance text-[26px] font-medium md:text-[30px]">
            Overview
          </h1>
          <p className="mt-1 max-w-[62ch] text-pretty text-[14px] leading-relaxed text-muted">
            Live state of the demo book on{" "}
            <a href="/positions" className="text-text underline decoration-line hover:decoration-saffron">Base Sepolia</a>{" "}
            and the span engine's own proof sheet — open a book on the terminal and this page follows it live.
          </p>
        </div>
        <a
          href="/terminal?shock=-3000"
          className="flex h-10 items-center rounded-field bg-paper px-4 text-[14px] font-medium transition-transform duration-100 ease-out active:scale-[0.97]"
          style={{ color: "var(--ink)" }}
        >
          Open the terminal
        </a>
      </div>

      {/* Live chain band */}
      {/* Live chain band */}
      <LiveDashboardBand />

      {/* Chart + risk monitor */}
      {/* Equity under stress, full width */}
      <Panel label="Equity under price stress" className="mt-4">
        <StressChart />
      </Panel>

      {/* Books + activity — live reads, zero fixtures */}
      <LiveBooksActivity />
    </div>
  );
}

function toneClass(tone: "up" | "down" | "cobalt" | "muted") {
  return tone === "up"
    ? "text-up"
    : tone === "down"
      ? "text-down"
      : tone === "cobalt"
        ? "text-saffron"
        : "text-text";
}


