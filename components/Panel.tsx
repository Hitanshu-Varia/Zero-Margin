import type { ReactNode } from "react";

/**
 * Data card: surface step, hairline border, optional header row with a
 * gold index dot. No shadows and no glass — depth comes from the
 * background ladder and borders.
 */
export function Panel({
  label,
  meta,
  accent = false,
  children,
  className = "",
  bodyClassName = "",
}: {
  label?: string;
  meta?: ReactNode;
  accent?: boolean;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={`rounded-panel border border-line bg-surface overflow-hidden ${className}`}
    >
      {(label || meta) && (
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-line px-5 py-3">
          <h2 className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.08em] text-muted">
            <span
              aria-hidden="true"
              className={`h-[6px] w-[6px] shrink-0 ${accent ? "bg-gold" : "bg-line-strong"}`}
            />
            {label}
          </h2>
          {meta && <div className="text-[12px] text-dim">{meta}</div>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

/** A labeled figure row inside a card. */
export function Stat({
  label,
  value,
  tone = "text",
  hint,
}: {
  label: string;
  value: ReactNode;
  tone?: "text" | "muted" | "up" | "down" | "gold";
  hint?: string;
}) {
  const toneClass =
    tone === "up"
      ? "text-up"
      : tone === "down"
        ? "text-down"
        : tone === "gold"
          ? "text-gold"
          : tone === "muted"
            ? "text-muted"
            : "text-text";
  return (
    <div className="flex items-baseline justify-between gap-4 px-5 py-2.5 rule-b last:border-b-0">
      <span className="text-[12px] uppercase tracking-wide text-muted flex items-center gap-1.5">
        {label}
        {hint && (
          <span
            title={hint}
            className="h-[5px] w-[5px] rounded-full border border-dim"
          />
        )}
      </span>
      <span className={`font-mono tabular-nums text-[13px] ${toneClass}`}>
        {value}
      </span>
    </div>
  );
}

/**
 * KPI tile for the dashboard: oversized mono figure on a card, with an
 * optional dim caption row beneath.
 */
export function KpiCard({
  label,
  value,
  valueClass = "",
  caption,
  children,
  className = "",
}: {
  label: string;
  value: ReactNode;
  valueClass?: string;
  caption?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-panel border border-line bg-surface p-5 ${className}`}
    >
      <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">
        {label}
      </p>
      <div className={`mt-2 font-mono tabular-nums text-[26px] leading-none tracking-tight ${valueClass}`}>
        {value}
      </div>
      {(caption || children) && (
        <div className="mt-2.5 flex items-center gap-2 text-[12px] text-dim">
          {caption}
          {children}
        </div>
      )}
    </section>
  );
}
