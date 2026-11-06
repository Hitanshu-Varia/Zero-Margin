# Brand — ZeroMargin (v2)

- **Direction:** precision trading product. A sidebar app-shell dashboard in the
  lineage of MetEngine and modern pro-trading suites — soft geometric sans for
  chrome, monospace only where numbers are data, near-black neutrals, one gold
  accent, white primary actions.
- **Voice:** numerate and specific. Claims carry their test numbers. No hype.

## Palette

| Token | Hex | Role |
| :--- | :--- | :--- |
| `background` | `#0A0B0D` | App background. Neutral charcoal, never pure black. |
| `surface` | `#101114` | Cards and panels. |
| `surface-raised` | `#15171B` | Nested surfaces: table headers, inputs, hovers. |
| `line` | `#1E2126` | Hairline borders (≈ white 7% on background). |
| `line-strong` | `#2A2E34` | Interactive borders, dividers. |
| `text` | `#EDEEF0` | Primary text. |
| `text-muted` | `#A2A7AE` | Secondary text. AA on all surfaces. |
| `text-dim` | `#6E747C` | Metadata, timestamps. Large text or icons only. |
| `gold` | `#E9C176` | The single accent. Savings, focus, brand, active nav. |
| `gold-soft` | `#F3DDA6` | Gradient top stop for headline accents. |
| `green` | `#45D48D` | Positive PnL only. |
| `red` | `#F0654F` | Negative PnL, breaches, liquidation only. |
| `blue` | `#7FB5F5` | Chain and link badges only. |
| `paper` | `#F5F5F3` | Primary button fill (dark text on it). |

Rules:

- Gold gradient (`gold-soft → gold`) is allowed **only** on the brand wordmark
  and on the page hero value. One gradient moment per view.
- Green and red mean PnL and PnL alone.
- Depth comes from surface steps (`background → surface → surface-raised`),
  hairline borders, and one soft ambient glow behind the dashboard hero
  region. No glassmorphism blur, no neon, no box-shadow Stacks.

## Typography

- **Chrome / UI:** `Instrument Sans` — sidebar, headings, labels, body.
  Premium geometric sans; tight tracking on headings.
- **Data:** `JetBrains Mono` — monetary values, ratios, bps, addresses,
  table numerics. `tabular-nums` always.
- Weights: `500` headings, `400` body, `600` for the page title and active
  nav only. Nothing heavier. No italic.
- Scale: `11px` labels, `13px` data, `14px` body, `18px` section titles,
  `15px` sidebar, `30px` page title, `38px` hero figures.

## Shape

- Cards: `16px`. Inputs and buttons: `10px`. Chips: full.
- Sidebar nav items: `10px` with a 3px gold active rail.

## Motion

- Micro: `120ms`. Region transitions: `200ms`. Cap `400ms`.
- `ease-out` enters, `ease-in` exits, and every animation obeys
  `prefers-reduced-motion`.

## UI roles

- Primary action: white `paper` button, background-colored text.
- Secondary action: `surface-raised` with a `line-strong` border.
- Active nav: gold 3px left rail plus `surface-raised` fill.
- Live/wallet chip in the topbar: `surface-raised` pill with a green pulse dot.
