/**
 * Display-only formatting. Every renderer converts from the canonical
 * USDC base unit (1e6 = $1.00) using BigInt arithmetic; Number() appears
 * only on already-computed integer quotients, never in the math path.
 */

const USDC_UNIT = 1_000_000n;
const BPS = 10_000n;

function groupThousands(digits: bigint): string {
  return Number(digits).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });
}

/** "$19,700.00" — exact, two decimal places, never rounded silently. */
export function formatUsdc(value: bigint, decimals = 2): string {
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const unit = 10n ** BigInt(decimals) * (USDC_UNIT / 100n);
  const whole = abs / unit;
  const frac = (abs % unit) * 100n / unit;
  const fracStr = frac.toString().padStart(decimals, "0");
  return `${negative ? "−" : ""}$${groupThousands(whole)}.${fracStr}`;
}

/** "$100,000" — whole dollars, for chart axes and compact callouts. */
export function formatUsdcWhole(value: bigint): string {
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const dollars = abs / USDC_UNIT;
  const cents = (abs % USDC_UNIT) * 100n / USDC_UNIT;
  const centsStr = cents === 0n ? "" : `.${cents.toString().padStart(2, "0")}`;
  return `${negative ? "−" : ""}$${groupThousands(dollars)}${centsStr}`;
}

/** "+$28,500.00" / "−$33,750.00" — signed flows in the waterfall. */
export function formatSignedUsdc(value: bigint, decimals = 2): string {
  const base = formatUsdc(value < 0n ? -value : value, decimals);
  if (value === 0n) return `$${base.slice(1)}`;
  return `${value > 0n ? "+" : "−"}${base}`;
}

/** "9,322 bps" */
export function formatBps(value: bigint): string {
  const negative = value < 0n;
  const abs = negative ? -value : value;
  return `${negative ? "−" : ""}${Number(abs).toLocaleString("en-US")} bps`;
}

/** "93.22%" — two decimals from a bps integer. */
export function formatPercentFromBps(value: bigint, decimals = 2): string {
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const scale = 10n ** BigInt(decimals);
  const whole = abs / BPS;
  const frac = (abs % BPS) * scale / BPS;
  return `${negative ? "−" : ""}${whole.toString()}.${frac
    .toString()
    .padStart(decimals, "0")}%`;
}

/** "$10.5M" — axis labels only. */
export function formatUsdcCompact(value: bigint): string {
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const dollars = abs / USDC_UNIT;
  const sign = negative ? "−" : "";
  if (dollars >= 1_000_000n) {
    const m = (dollars * 10n) / 1_000_000n;
    const whole = m / 10n;
    const frac = m % 10n;
    return `${sign}$${Number(whole).toLocaleString("en-US")}${
      frac === 0n ? "" : `.${frac}`
    }M`;
  }
  if (dollars >= 1_000n) {
    const k = (dollars * 10n) / 1_000n;
    const whole = k / 10n;
    const frac = k % 10n;
    return `${sign}$${whole.toString()}${frac === 0n ? "" : `.${frac}`}k`;
  }
  return `${sign}$${dollars.toLocaleString("en-US")}`;
}

/** Signed bps price shock as a slider readout: "−3,000 bps". */
export function formatShock(value: bigint): string {
  const negative = value < 0n;
  const abs = negative ? -value : value;
  return `${negative ? "−" : "+"}${Number(abs).toLocaleString("en-US")}`;
}

/** "3,000" as a shock magnitude label. */
export function formatShockAbs(value: bigint): string {
  const abs = value < 0n ? -value : value;
  return Number(abs).toLocaleString("en-US");
}
