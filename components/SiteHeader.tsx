import { ModeBadge } from "@/components/Badge";

const links = [
  { href: "/", label: "Terminal", current: true },
  { href: "/replay", label: "Replay", current: false },
  { href: "/arkiv", label: "Arkiv", current: false },
  { href: "/proof", label: "Proof", current: false },
];

/**
 * Desktop top bar. The mode badge is deliberately first-class here: the
 * honest state of the session is part of the product, not a footnote.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-12 w-full max-w-[1240px] items-center gap-6 px-4 md:px-6">
        <a href="/" className="flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-ring">
          <span
            aria-hidden="true"
            className="grid h-[22px] w-[22px] place-items-center rounded-field bg-amber text-background"
          >
            <span className="font-mono text-[13px] font-semibold leading-none">Z</span>
          </span>
          <span className="text-[14px] font-medium tracking-tight text-text">
            ZeroMargin
          </span>
          <span className="hidden font-mono text-[11px] tracking-[0.08em] text-dim sm:inline">
            CLEARING·ENGINE
          </span>
        </a>

        <nav aria-label="Primary" className="flex items-center gap-0.5">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              aria-current={l.current ? "page" : undefined}
              className={`rounded-field px-2.5 py-1.5 text-[13px] transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-ring ${
                l.current
                  ? "bg-surface-raised text-text"
                  : "text-muted hover:text-text hover:bg-surface-raised"
              }`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden items-center gap-1.5 font-mono text-[11px] tracking-[0.06em] text-dim md:flex">
            <span aria-hidden="true" className="h-[6px] w-[6px] rounded-full bg-chain" />
            BASE·8453
          </span>
          <ModeBadge
            variant="local"
            title="SIM·LOCAL"
            description="Every figure on screen is computed by the BigInt engine in lib/spanMath.ts from the same spec the contracts use. No wallet is connected and no funds are at risk in this view."
          />
        </div>
      </div>
    </header>
  );
}
