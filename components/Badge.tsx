import type { ReactNode } from "react";

type BadgeVariant = "local" | "fork" | "cache" | "error" | "status";

const variantClass: Record<BadgeVariant, string> = {
  local: "border-cobalt/30 bg-cobalt-dim text-cobalt",
  fork: "border-up/30 bg-up-dim text-up",
  cache: "border-chain/30 bg-chain-dim text-chain",
  error: "border-down/30 bg-down-dim text-down",
  status: "border-line-strong bg-surface-raised text-muted",
};

/**
 * Mode badge. Every badge is focusable and paired with a description
 * that states exactly what is live and what is simulated.
 */
export function ModeBadge({
  variant,
  title,
  description,
  className = "",
}: {
  variant: BadgeVariant;
  title: string;
  description: ReactNode;
  className?: string;
}) {
  const id = `badge-desc-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <span className={`relative group inline-flex ${className}`}>
      <button
        type="button"
        aria-describedby={id}
        className={`cursor-help rounded-chip border px-2.5 py-0.5 text-[12px] font-medium transition-colors duration-100 hover:border-line-strong ${variantClass[variant]}`}
      >
        {title}
      </button>
      <span
        role="tooltip"
        id={id}
        className="pointer-events-none absolute right-0 top-full z-20 mt-1.5 w-64 rounded-field border border-line-strong bg-surface p-3 text-[12px] leading-snug text-muted opacity-0 shadow-[0_4px_16px_rgba(26,29,33,0.08)] transition-opacity duration-100 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {description}
      </span>
    </span>
  );
}

/** Status chip: dot plus sentence-case words. */
export function StatusChip({
  children,
  tone = "status",
}: {
  children: ReactNode;
  tone?: "status" | "up" | "down" | "cobalt";
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-chip border px-2.5 py-0.5 text-[12px] font-medium ${
        variantClass[tone === "status" ? "status" : tone]
      }`}
    >
      <span aria-hidden="true" className="h-[5px] w-[5px] rounded-full bg-current" />
      {children}
    </span>
  );
}
