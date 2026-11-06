/**
 * Footer. One honest status line, three links, no newsletter.
 */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-5 md:px-6">
        <span className="flex items-center gap-2 font-mono text-[11px] tracking-[0.08em] text-dim">
          <span aria-hidden="true" className="grid h-[16px] w-[16px] place-items-center rounded-[3px] bg-amber text-background">
            <span className="font-mono text-[10px] font-semibold leading-none">Z</span>
          </span>
          ZEROMARGIN · CLEARING ENGINE
        </span>
        <span className="font-mono text-[11px] text-dim">
          hackathon prototype · not audited · demo hedge adapter
        </span>
        <nav aria-label="Footer" className="ml-auto flex gap-4">
          {[
            ["Terminal", "/"],
            ["Replay", "/replay"],
            ["Arkiv", "/arkiv"],
            ["Proof", "/proof"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="font-mono text-[11px] tracking-wide text-muted transition-colors duration-100 hover:text-amber"
            >
              {label.toUpperCase()}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
