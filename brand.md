# Brand — ZeroMargin

- **Direction:** industrial/utilitarian trading terminal. Amber-on-black,
  in the lineage of bank dealing desks and bond terminals — not a neon
  crypto site, not a soft SaaS dashboard.
- **Voice:** terse, declarative, numerate. Sentences are short. Claims
  carry their exact test numbers. No hype adjectives.

## Palette

| Token | Hex | Role |
| :--- | :--- | :--- |
| `background` | `#0B0C0E` | Page background. Near-black, warm-neutral. Never `#000000`. |
| `surface` | `#121316` | Panel background. |
| `surface-raised` | `#17191D` | Nested surfaces: table headers, inputs. |
| `line` | `#23262B` | Hairline borders between panels and rows. |
| `line-strong` | `#33373E` | Interactive borders: inputs, hover states. |
| `text` | `#E8EAED` | Primary text. |
| `text-muted` | `#9BA0A8` | Secondary text, labels. AA on `background`. |
| `text-dim` | `#6B7178` | Tertiary text, timestamps. Large text and icons only. |
| `amber` | `#F0B429` | The single brand accent. Capital, savings, focus ring, brand mark. |
| `green` | `#41C98E` | Positive PnL only. |
| `red` | `#F26D5B` | Negative PnL, breaches, liquidation only. |
| `blue` | `#6AAEF0` | Informational links and chain badges only. |

Rules:

- Amber is earned, not sprayed. One accent moment per view region.
- Green and red mean PnL and PnL alone. Never use them decoratively.
- No gradients as decoration. No glassmorphism. No shadows on panels —
  hierarchy comes from border hairlines and background steps.

## Typography

- **Display / UI:** `Space Grotesk` — headings, labels, buttons, body.
- **Data:** `IBM Plex Mono` — every monetary value, ratio, basis point,
  address, and table cell. `tabular-nums` so columns never jitter.
- Weights: `500` (headers), `400` (body/data). A single `600` is allowed
  on the page title. Nothing heavier.
- Sizes: `12px` labels, `13px` data, `14px` body, `20px` section, `28px`
  page title, `34px` hero figures in the terminal.

## Motion

- Micro feedback: `100ms`. Overlay/panel enter: `150ms`. Page-level
  transitions: `250ms` cap. Nothing longer.
- `ease-out` on enter, `ease-in` on exit. Transitions name their
  properties — never `transition: all`.
- Every animation is gated on `prefers-reduced-motion`. The crash replay
  runs at full speed with no animation instead of a slowed one.

## Radius

- Panels: `10px`. Inputs and buttons: `6px`. Chips and badges: full.
- Nothing larger. Pills only for mode badges.

## Voice examples

- Writes: "Net initial margin `10,000e6` against isolated `147,500e6` —
  `93.22%` less locked collateral on GV-01."
- Avoids: "revolutionary", "instant", "unlimited", "next-generation",
  "cutting-edge", any claim without its vector behind it.
