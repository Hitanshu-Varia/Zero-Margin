# ZeroMargin — web terminal

A non-custodial margin engine: it cross-margins a Uniswap v4 LP position
against an offsetting short hedge on one SPAN-style 16-scenario grid, and
settles a flash crash in one transaction with no liquidation penalty.

On the 95%-hedged golden vector (GV-01), a $100,000 WETH/USDC LP hedged with
a $95,000 short needs **$10,000** of net initial margin instead of **$147,500**
isolated — a **93.22%** reduction in locked collateral. In the −30% crash
replay (UNWIND-01) the book nets a $28,500 short gain against a $33,750 LP
loss, pays a $50 unwind fee, and returns **$19,700** of equity.

## Run it

```bash
npm ci
npm run build
npm start          # serves on :3123 in CI; production default is :3000
```

For development:

```bash
npm run dev
npm test           # unit + golden-vector parity
npm run lint:claims
npm run e2e        # needs a built app; `E2E_BASE=... node scripts/e2e.mjs`
```

## What is live, what is simulated

The mode chip in the header comes from `GET /api/health` and names the
engine's actual state (FR-16):

- **LOCAL (default)** — the deterministic span engine runs in-process; the
  settlement API returns receipts labeled `simulated: true`. This is the
  demo continuity mode and it works fully offline.
- **LIVE-FORK** — stays dormant until all required addresses and RPCs are
  present in `.env.local` (see `.env.example`); missing configuration is
  reported by name under `GET /api/health`, never as a fake success.
- **CACHE / LIVE** — the Arkiv attestation feed names its source on
  `/api/arkiv/query`.

Every engine number on screen is computed from `lib/spanMath.ts` — the same
pure functions the API serves — and the terminal cross-checks itself against
`POST /api/quote` live (engine parity line, with a visible Retry on failure).

## API surface

| Route | Behavior |
| :--- | :--- |
| `GET /api/health` | mode, chainId, arkiv mode, engine book identity, validation problems |
| `POST /api/quote` | deterministic quote for one input; 400 with named problems on bad input |
| `POST /api/unwind` | runs the settlement; rate-limited (30 per minute); receipts are honestly simulated in LOCAL mode |
| `GET /api/arkiv/query` | attestations + keeper query, with the source badge |

## Limitations (honest)

- The short leg settles against a pre-funded demo adapter, not a live venue.
- The code is tested, not audited. There is no audit of any contract this
  design references.
- The settlement store behind `POST /api/unwind` is an in-memory demo store
  (documented in `lib/demoStore.ts`); a horizontal deployment swaps that one
  file for a durable sink.
- Positive shocks are preview-only; `unwind` settles downward inside the
  tested envelope [−3,000, +2,000] bps.
- The SPAN grid is SPAN-style and simplified; it is not any production
  clearing algorithm.

## AI disclosure

This repository was built with AI assistance (model: GLM-5.3-Flash via
OpenCode Agents) based on the product specification in `agent/Agent.md`.
All code was human-reviewed before commit; golden-vector parity tests pin
the deterministic math.

## Yield

MIT. See [LICENSE](./LICENSE).
