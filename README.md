# ZeroMargin

A non-custodial margin engine that cross-margins a Uniswap v4 LP position
against an offsetting short hedge inside one 1inch Aqua virtual balance,
and settles a flash crash in a single transaction with no liquidation
penalty inside the tested envelope.

This repository is the web terminal. It computes every number on screen
from the same deterministic `BigInt` fixed-point spec the contracts use:
a 16-scenario SPAN-style risk grid, a `500 bps` cross-venue basis haircut,
and a cross-leg settlement waterfall.

## Pages

| Route | What it shows |
| :--- | :--- |
| `/` | Split-screen terminal: isolated account versus the ZeroMargin book under the same price shock. |
| `/replay` | Basis statistics and the three named crash windows. |
| `/arkiv` | Wallet-owned risk attestations with a `300`-second expiration. |
| `/proof` | Sponsor proof points, golden vectors, and stated limitations. |

## Math

`lib/spanMath.ts` is the TypeScript mirror of `SpanMathLib.sol`. All
monetary values are USDC base units (`1e6 = $1.00`). There is no
floating-point arithmetic in the math path — `BigInt` and integer
division only, with ceiling rounding on every requirement and floor
rounding on every credit.

Verified golden vectors:

| ID | Book | Net initial margin | Isolated margin | Savings |
| :--- | :--- | ---: | ---: | ---: |
| GV-01 | `$100,000` LP / `$95,000` short | `$10,000` | `$147,500` | `9,322 bps` |
| GV-02 | `$100,000` LP / `$80,000` short | `$13,750` | `$140,000` | `9,017 bps` |
| GV-03 | `$100,000` LP / unhedged | `$33,750` | `$100,000` | `6,625 bps` |

## Status

A hackathon prototype. Not audited. The atomic unwind is demonstrated on
a fork with a pre-funded demo hedge adapter that settles both legs —
there is no live venue connected. Basis, venue, smart-contract, and
oracle risk remain.
