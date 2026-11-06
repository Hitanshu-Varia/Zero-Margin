# Brand — ZeroMargin (v4, production revision)

The user rejected v2 (amber-on-black: tropical, skip) and v3 (paper memo:
wrong mood for a trading product). v4 commits to what top operational
trading products (Hyperliquid-class terminals, Linear-class app chrome)
actually ship: a deep neutral dark theme, dense information layout, and
chrome that looks like software someone runs eight hours a day.

## Color (base palette)

| Token | Hex | Role |
| :--- | :--- | :--- |
| `background` | `#0D0F12` | App canvas. Deep neutral charcoal, cool cast. |
| `surface` | `#13161A` | Cards, panels, sidebar. |
| `surface-raised` | `#171B21` | Wells, inputs, hover fills, table headers. |
| `line` | `#23282E` | Hairline borders (white at 8%). |
| `line-strong` | `#31383F` | Emphatic frames, active borders. |
| `text` | `#E9ECEF` | Primary text. |
| `muted` | `#98A1AB` | Secondary text. |
| `dim` | `#68727D` | Metadata, large numbers of small size forbidden below 4.5:1 exceptions. |
| `accent` | `#4D8DF6` | The product accent (calm signal blue). Links, primary actions, charts, active nav. |
| `accent-dim` | `#1B2740` | Accent wash for chips and fills. |
| `up` | `#3FCF8E` | Gains only. |
| `down` | `#F26354` | Losses, breaches, liquidation only. |

The accent is blue because the product is an instrument (data, links,
positions) — not decoration. Green/red remain strictly PnL semantics.

## Type

- `Inter` 400/500/600 for every readable string, headings included.
  Set deliberately: `-0.01em` tracking on headings; `tabular` numerals
  everywhere data appears. This is the production default face precisely
  because Linear/Hyperliquid-grade products choose it and then set it
  properly — weights carry hierarchy, tracking tightens at display sizes.
- `Geist Mono` 400/500 for data: monetary values, bps, addresses, table
  numerics, console readouts. Mono never styles buttons or captions.
- Scale: 11px metadata, 13px data, 14px body, 15px sidebar, 17px panel
  titles (sentence case), 30–34px dashboard title, hero display 40/48.

## Shape

- Cards 12px, fields 8px, chips full. Shadows near-zero; elevation from
  surface steps and hairlines. One exception: dropdown-style overlays
  get a soft 16px shadow for separation.
- Tables: header row with a raised fill, 13px numerics, row hover,
  right-aligned numerics.

## Chrome (the part that failed before)

Sidebar: `surface` column, one small-caps group label ("Trading"), 40px
rows with 16px icons and a 3px accent rail on the active item, hover fills
on rows, network + version pinned to the bottom.

Topbar: 52px, contains (a) the page breadcrumb, (b) command bar with `/`
hint, (c) network chip, (d) accent-filled primary action, (e) wallet pill
with avatar dot. Height consistent, no giant gaps.

## Landing

Full dark throughout. The hero console is a panel of the same system, not
a foreign inset; the accent moment is the `$147,500 → $10,000` figure.

## Motion

120ms standard, 200ms max for panels; motion answers actions. Live
figures get the 160ms settle. Reduced motion: instant.
