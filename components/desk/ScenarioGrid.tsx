import { Fragment } from "react";
import {
  PRICE_SHOCKS_BPS,
  VOL_SHOCKS_BPS,
} from "@/lib/spanMath";
import { formatUsdcCompact } from "@/lib/format";

/**
 * The 16-cell SPAN-style grid, drawn as the map of the book:
 * one cell per (price shock, volatility state), red for loss,
 * green for survival, intensity by magnitude. Pure SVG, no labels
 * on the cells — the axes carry the reading.
 */
export function ScenarioGrid({ values }: { values: bigint[] }) {
  const maxAbs = values.reduce(
    (acc, v) => (v < 0n && -v > acc ? -v : v > acc ? v : acc),
    1n,
  );

  return (
    <div
      className="grid gap-[3px]"
      role="img"
      aria-label="Sixteen-scenario net PnL field; red cells lose money, green cells survive."
      style={{
        gridTemplateColumns: `1.6rem repeat(${PRICE_SHOCKS_BPS.length}, minmax(0,1fr))`,
        gridTemplateRows: "1.18rem 1.18rem 0.9rem",
      }}
    >
      {/* column labels */}
      <span />
      {PRICE_SHOCKS_BPS.map((shock) => (
        <span
          key={shock.toString()}
          className="text-center font-mono text-[9px] tabular-nums text-dim"
          style={{ textTransform: "none" }}
        >
          {shock === 0n ? "0" : `${shock < 0n ? "−" : "+"}${Number(shock < 0n ? -shock : shock) / 100}`}
        </span>
      ))}

      {VOL_SHOCKS_BPS.map((vol, row) => (
        <Fragment key={`v-${vol}`}>
          <span
            className="flex items-center font-mono text-[9px] tabular-nums text-dim"
          >
            ν{Number(vol)}
          </span>
          {PRICE_SHOCKS_BPS.map((shock, col) => {
            const v = values[col * 2 + row] ?? 0n;
            const mag = Number(((v < 0n ? -v : v) * 100n) / maxAbs) / 100;
            return (
              <span
                key={`${shock}-${vol}`}
                className="rounded-[2px]"
                style={{
                  height: "1.18rem",
                  background:
                    v < 0n
                      ? `color-mix(in srgb, var(--red) ${Math.round(28 + 62 * mag)}%, var(--surface))`
                      : v > 0n
                        ? `color-mix(in srgb, var(--green) ${Math.round(22 + 50 * mag)}%, var(--surface))`
                        : "var(--surface-raised)",
                }}
              />
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}
