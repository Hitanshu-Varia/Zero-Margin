# Brand — ZeroMargin (v3, per anthropics/skills frontend-design)

## Design plan (built before code, reviewed against the tell-list)

### Subject

A clearing-layer margin engine. Its native visual world is institutional
finance printed matter: settlement memos, SPAN contract specifications,
ledger sheets, exchange rulebooks with numbered clauses.Crypto products
are shipped dark by default; a printed-memo light theme with a dark
terminal inset is a choice made for this subject, not a default.

### Color (base palette)

| Token | Hex | Role |
| :--- | :--- | :--- |
| `paper` | `#FBFBF9` | Page ground. Porcelain, close to white, no cream warmth. |
| `card` | `#FFFFFF` | Raised sheets: cards, tables, panels. |
| `well` | `#F1F2EF` | Inset wells: inputs, tracks, table headers (warm-neutral gray). |
| `ink` | `#1A1D21` | Text, rules of weight. Not tinted near-black — plain ink. |
| `rule` | `#E5E6E2` | Hairlines. |
| `rule-strong` | `#CDD0CA` | Emphatic rules and frames. |
| `cobalt` | `#2C55A0` | The single accent: links, active states, the sweep line. |
| `up` | `#177B4B` | PnL gains only. |
| `down` | `#C2412F` | PnL losses, breaches, liquidation only. |

### Type

Two families from one design system — IBM Plex, the type of engineering
and financial documentation:

- `IBM Plex Sans` 400/500/600 for everything readable (headings included).
  Headings are sentence case, tracking tight. No eyebrow caps, no all-caps
  labels; structure carries meaning instead.
- `IBM Plex Mono` 400/500/600 **only for data**: monetary figures, bps,
  addresses, table numerics, the live demo readout. It never styles
  labels, buttons, or captions.

Scale (approx. Elements of Typographic Style ratios): body 15px/1.55;
data 13px; section 19px; display 46px/1.06 at 500; the two numerals of
the settlement ($147,500 → $10,000) are the typographic moment — set at
40px/600 mono with a red one and an ink one.

### Layout

- Left-aligned, asymmetric, document-like. Max measure 64ch.
- Sections start with a full-width rule and a right-hung clause number
  (`§1`, `§2`, …) because the copy really is an ordered mechanism — the
  numbered marker carries the sequence information.
- Landing save the dark for ONE element: the settlement console inset
  (`#14161A`) pinned inside the paper hero, digits in amber. Everything
  else is ink on paper.

### Principles

1. Paper carries the identity; red and cobalt only ever appear on data
   they describe.
2. Structure is information: rules, clause numbers, and footnotes do the
   work decorative badges would otherwise fake.
3. Motion answers actions only (opening, settling, scrubbing); no
   section entrance choreography.
4. Words are plain, active, and specific; no arrows appended to links,
   no middle-dot metadata strings, no em-dash fragment labels.

### Tell-list review (what was deliberately killed from v2)

| v2 (tell) | v3 (choice) |
| :--- | :--- |
| Near-black `#0A0B0D` + single bright accent | Porcelain paper + semantic red/green/cobalt |
| Mono for labels and captions | Mono is data-only; labels are Plex Sans |
| ALL-CAPS eyebrows over every heading | Clause rules with § numbers, sentence case |
| `A · B · C` middle-dot meta strings | Full sentences or tables |
| `→` appended to links/buttons | Plain verb links |
| 16px radius on all cards (SaaS kit) | 2px paper-crisp cards, 8px fields, chips round |
| Numbered 01/02/03 feature cards | Ordered settlement clauses, which is genuinely a sequence |
| Gold gradient wordmark/hero | No gradient anywhere; the two-numeral settlement is the moment |
