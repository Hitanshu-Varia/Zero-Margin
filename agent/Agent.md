# `zeromargin_agent.md` — ZeroMargin (`ClearingHook`) — ETHGlobal Mumbai 2026

- **STATUS**: `BUILD-READY, RULES-GATED`. The mechanism is validated by a read-only reference implementation, but the submission must be written from scratch after kickoff. Read Section 0.3 before writing a line of code. If the team cannot satisfy Section 0.3, do not build this idea.
- **FOCUS / SPONSORS**: **1inch** (`Build an Aqua App`, `$5,000` Classic, 3 places) + **Uniswap Foundation** (`Build with Uniswap`, `$10,000` Classic, 4 places) + **Arkiv** (`Build on Arkiv (from scratch)`, `$4,000`, 2 places). **Reachable Classic pool: `$19,000`.** The advertised total across the three sponsors is `$37,000`, but a project submits to one track per sponsor and the Continuity tracks are not eligible for a new project. **Exactly three partner prizes**; the cap is three.
- **TEAM / TIME**: 2 engineers, 40 active hours (36 scheduled + 4 buffer). Submission cutoff Sat Nov 7 2026 09:00 IST `[verified: ethglobal.com/events/mumbai/info/details, 2026-11-03]`. The public page does not state the opening time; this plan assumes hacking begins Thu Nov 5 2026 10:00 IST `[assumption; confirm at check-in]`. Internal code freeze Fri Nov 6 2026 19:30 IST (33.5 hours after the assumed kickoff).
- **CHAIN / STACK**: Base Mainnet (`8453`) plus an Anvil Base fork (`31337`); Solidity `0.8.26` + Foundry; TypeScript + Next.js `15`; Arkiv Rabdi (`7794095`). Base Sepolia (`84532`) is a fallback for contracts that do not need canonical Aqua.
- **HONEST MEAN**: **`7.9 / 10`** (`Technicality 8.2`, `Originality 8.2`, `Practicality 7.3`, `Usability 7.5`, `WOW 8.1`). **Band: Medium-High (`7.2–8.3`).** **Team-adjusted finalist probability: `14%`.** **At least one of the three partner prizes: `30%`.**
- **WITH COUNTED BAND-RAISERS `BR1–BR5`**: **`8.5 / 10`** (`Technicality 8.9`, `Originality 8.4`, `Practicality 8.1`, `Usability 8.1`, `WOW 8.8`). **Band: High (`8.0–8.8`).** **Finalist probability: `21%`.** **At least one partner prize: `45%`.**
- **STRETCH `BR6` (custom SwapVM instruction `0xf1`)**: not counted in the `8.5` target because it is high-variance. If it lands with real token transfers and `quote == swap` parity, the honest mean rises to `8.7` and the 1inch hit probability rises from `20%` to `28%`. It is not the core 1inch integration and never appears in the core claims.
- **PRIOR CLAIM RETRACTED**: an earlier draft of this file claimed `8.3 → 9.1`, `16.0% → 22.5%` finalist probability, and `80% → 90%` joint partner probability. The `80–90%` figure was not a probability; it was an optimism score. The calibrated numbers above replace it everywhere.

> **Read this before anything else.** `agents/zeromargin/scaffold/` is a **pre-event reference implementation**, not submission code. ETHGlobal's Classic rules require all project-specific code, designs, and assets to be created after kickoff. The scaffold may be read to understand the mechanism and to check expected outputs. It may **not** be copied, vendored, imported, or committed. Every line in the submission repo must be written during the window. Section 0.3 makes this a hard gate.

---

## Context & Sources

### C.1 What this file is

This is the single source of truth for building, testing, deploying, and demoing **ZeroMargin**. It is written for a coding model that follows instructions literally and cannot ask questions. Where reality can differ from this document, the difference is isolated behind an adapter and listed in Section C.6. Every non-obvious claim carries `[verified: source, date]`, `[assumption]`, or `[to verify]`. The full source list is in `Sources` at the end of this file.

### C.2 Verified facts

| # | Fact | Evidence |
| :---: | :--- | :--- |
| **F-01** | The submission deadline is Sat Nov 7 2026 09:00 IST. The public details page does not state the opening time; this plan assumes hacking begins Thu Nov 5 2026 10:00 IST `[assumption; confirm at check-in]`. Judging is 7 minutes: 4-minute demo plus 3-minute Q&A. Up to 3 partner prizes may be selected. Demo video must be 2–4 minutes, at least 720p, human-voiced, not sped up, not recorded on a phone. | `[verified: ethglobal.com/events/mumbai/info/details, 2026-11-03]` |
| **F-02** | Classic track: all work must begin after kickoff. Prior project-specific code, designs, or assets are not allowed. Large single commits or missing history may be disqualified. AI use is allowed with attribution; spec files must be committed. | `[verified: ethglobal.com/events/mumbai/info/details, 2026-11-03]` |
| **F-03** | 1inch `Build an Aqua App` pays `$2,500 / $1,500 / $1,000` (`$5,000`, 3 places). Official Aqua/SwapVM contracts must be used; a modified SwapVM redeployment is allowed; onchain token transfers must be shown; local forks are acceptable; proper git history is required. Projects that use SwapVM are scored higher. | `[verified: ethglobal.com/events/mumbai/prizes/1inch, 2026-11-03]` |
| **F-04** | Uniswap Foundation `Build with Uniswap` pays `$4,000 / $3,000 / $2,000 / $1,000` (`$10,000`, 4 places). Requirements: public open-source repo, `FEEDBACK.md`, and a completed Uniswap Developer Feedback Form (`https://developers.uniswap.org/hackathon-feedback`) that includes the `FEEDBACK.md` link. | `[verified: ethglobal.com/events/mumbai/prizes/uniswap-foundation, 2026-11-03]` |
| **F-05** | Arkiv `Build on Arkiv (from scratch)` pays `$3,000 / $1,000` (`$4,000`, 2 places). Requirements: built from scratch; writes to the current Arkiv testnet with `@arkiv-network/sdk` or JSON-RPC; at least one user-visible feature reads Arkiv; README lists writer wallet(s) and one runnable query; `/arkiv/schema.md`, `/arkiv/friction.md`, `/arkiv/reach.md`, `/arkiv/why-arkiv.md`, `/arkiv/how-you-use-arkiv.md`; public repo with an open-source license; AI usage disclosed; one Arkiv track prize per team. | `[verified: ethglobal.com/events/mumbai/prizes/arkiv, 2026-11-03]` |
| **F-06** | Aqua registry `0x1111113ccf1426a8e30e2bff5e005d929bf6a90a` has `5,619` bytes of code on Base `8453` and `0` bytes on Base Sepolia `84532`. AquaSwapVMRouter v1.0.2 `0x111111338c5091e8440b67b168bae16a668ac0de` has `20,541` bytes on Base. | `[verified: eth_getCode via mainnet.base.org and sepolia.base.org, 2026-11-03]` |
| **F-07** | Uniswap v4 `PoolManager` is `0x498581ff718922c3f8e6a244956af099b2652b2b` on Base `8453` (`24,009` bytes) and `0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408` on Base Sepolia `84532` (`24,009` bytes). | `[verified: eth_getCode, 2026-11-03]` |
| **F-08** | Arkiv Rabdi is chain ID `7794095`, RPC `https://rpc.rabdi.db-chain.testnet.arkiv.network`, `2`-second block duration. `@arkiv-network/sdk` latest is `1.0.1`. | `[verified: docs.arkiv.network; arkiv_getBlockTiming; registry.npmjs.org, 2026-11-03]` |
| **F-09** | The reference implementation passes `9/9` Foundry tests (including `256` fuzz runs), `4/4` TypeScript golden-vector parity checks, and the claim lint. Dataset SHA-256 `0a02606eaba0740af2dbfadeeaeb4cafc34a8b582e1a2b26fdcf21663f2b8dc3`; basis P99 `142 bps`, max `318 bps`. | `[verified: reference run in the read-only scaffold, 2026-11-03]` |

### C.3 Lane statistics (own corpus, N=10,510)

| Lane | Projects | Finalists | Finalist rate |
| :--- | :---: | :---: | :---: |
| All ETHGlobal projects 2024–2026 | `10,510` | `275` | `2.62%` |
| In-person events | `5,116` | `157` | `3.07%` |
| Online events | `5,394` | `118` | `2.19%` |
| 2026 in-person events | `951` | `39` | `4.10%` |
| `margin` | `14` | `0` | `0.00%` |
| portfolio margin / netting | `4` | `1` | `25.00%` (N<30, weak) |
| hedge / delta-neutral | `63` | `0` | `0.00%` |
| v4 hook | `166` | `5` | `3.01%` |
| aqua / swapvm | `84` | `2` | `2.38%` |
| perp / derivatives | `72` | `2` | `2.78%` |
| LP hedging | `8` | `0` | `0.00%` |
| liquidation | `44` | `0` | `0.00%` |
| SPAN | `0` | `0` | — |
| margin + Uniswap | `2` | `0` | `0.00%` |
| margin + Aqua | `1` | `0` | `0.00%` |
| hedge + Uniswap | `3` | `0` | `0.00%` |
| hedge + perp | `5` | `0` | `0.00%` |

The corpus is a local file, not a public API. Every count above is a count, not an estimate. Rows with `N < 30` are marked weak and are not used as evidence of an empty lane.

### C.4 Prior art

| Project | Event / source | Overlap | Real difference |
| :--- | :--- | :--- | :--- |
| GammaHedge | ETHGlobal showcase | Delta-hedged LP | No cross-margin account, no atomic dual-leg unwind, no Aqua settlement. |
| HedgeLP | ETHGlobal showcase | LP hedging | Hedging is advisory; margin is not netted onchain. |
| DefiSalmon | ETHGlobal showcase | Perp hedge of LP | Single venue; no virtual-balance margin engine. |
| Iceberg | ETHGlobal showcase | LP risk | Freezes passive reserves; different mechanism and goal. |
| Galvanic | ETHGlobal showcase | Collateral isolation | Ring-fences tokenized bonds; no margin netting. |
| TenorFi | ETHGlobal showcase | Funding-rate swap | Exchanges funding rates; not a margin engine. |
| OddsFlow | ETHGlobal showcase | Shared balance | Same-type prediction bets only; no LP or hedge. |
| Aqua0 | 1inch Aqua ecosystem | Aqua app | A simple Aqua app; no risk engine, no hook, no Arkiv. |

**Negative result.** No project in the corpus combines cross-venue portfolio-margin netting for a Uniswap v4 LP plus a short hedge, an Aqua-settled dual-leg unwind, and a v4 hook that enforces the post-withdrawal margin rule. This is a search result over `10,510` projects, not proof that no such project exists anywhere.

### C.5 Assumptions

| # | Assumption | Why | If wrong |
| :---: | :--- | :--- | :--- |
| **A-01** | Hacking begins Thu Nov 5 2026 10:00 IST. | The public page publishes only the deadline. | Shift every phase by the difference; the deadline and the freeze do not move. |
| **A-02** | The team has both engineers available for the full window. | Two-person team, no other commitments stated. | Trigger K-08 and cut scope. |
| **A-03** | The demo trader is a burner wallet, not a real fund. | No real funds are used at a hackathon. | No change; this is a requirement, not an assumption. |
| **A-04** | A public Base RPC can serve an Anvil fork at a fixed block. | Public RPCs support `eth_getCode` and forks. | Use a private RPC in `.env.local`; the fork block and addresses do not change. |
| **A-05** | The reference dataset (`43,200` one-minute rows) can be rebuilt from public candles with a cited license. | The replay must be reproducible inside the submission repo. | Drop BR4 and Claim 3; do not paste the reference hash. |

### C.6 Top `[to verify]` items before kickoff

1. **Aqua ABI on Base**: run `cast interface 0x1111113ccf1426a8e30e2bff5e005d929bf6a90a --chain 8453` and confirm the exact `ship`, `dock`, `pull`, `push`, `rawBalances`, and `safeBalances` signatures. `[to verify]`
2. **v4-core / v4-periphery versions**: pin the exact tags and confirm `IHooks`, `BaseHook`, `HookMiner`, `StateLibrary`, `LiquidityAmounts`, `TickMath`, and `PoolManager.extsload` match the imports used in the build. `[to verify at pin time]`
3. **Hook address mining**: confirm the `CREATE2_DEPLOYER` address and the `BEFORE_REMOVE_LIQUIDITY_FLAG | AFTER_SWAP_FLAG` mask for the pinned v4-periphery version. `[to verify at pin time]`
4. **Arkiv SDK**: confirm `@arkiv-network/sdk` version and the exact `createEntity`, `ExpirationTime.fromMinutes`, `ownedBy`, `where`, and `$expiresAt` APIs against the installed package, not only the docs. `[to verify on the day]`
5. **Uniswap form**: confirm `https://developers.uniswap.org/hackathon-feedback` is live and accepts the `FEEDBACK.md` link on the submission day. `[to verify]`
6. **Base RPC**: confirm `https://mainnet.base.org` rate limits and whether a private RPC is needed for the live demo. `[to verify at setup]`
7. **1inch taker access**: confirm whether the custom AquaApp needs a `KycNFT` credential or the `Controls` opcode for the demo taker. The registry itself is permissionless; the canonical router's dApp strategies have a taker gate. `[to verify on the fork]`

---

## 0. Rules for the building model

### 0.1 Single source of truth

This file is the specification. `zeromargin_build_plan.md` is a card-by-card execution plan that must agree with this file. If they disagree, this file wins. Record every deviation in `DECISIONS.md` with a timestamp, the component, the decision, and the reason.

### 0.2 Ambiguity policy

If an implementation detail is not specified, choose the simplest deterministic option that satisfies the nearest acceptance criterion. Write a three-line entry in `DECISIONS.md`. Do not ask a human unless a human-only gate in `HUMAN_TASKS.md` is blocking. Do not invent a new feature to resolve ambiguity.

### 0.3 Rules gate: from scratch (hard gate)

1. The submission repository must be **created empty at kickoff**. The first commit is a `README.md` and `LICENSE`; the second commit copies this file to `docs/SPEC.md` and the build plan to `docs/BUILD_PLAN.md`, committed as planning artifacts with an AI-attribution note.
2. **Do not copy, vendor, import, or transcribe** any file from `agents/zeromargin/scaffold/`. Do not copy its tests, markdown, UI, data files, or comments. The scaffold is a reference for expected outputs only. Reading it is allowed; copying it is a disqualification risk.
3. Every submission file must be written after kickoff. If a file already existed before kickoff, delete it and rewrite it.
4. Commit at least once per work block and at least 20 times across the window. No single-commit dump on the final day.
5. Disclose AI usage in `README.md`: which files were AI-assisted, which prompts/specs were used, and what humans reviewed and changed.
6. If an organizer says this spec is a pre-event design asset, rewrite it in your own words during the first hour and commit the rewrite. Do not argue with the organizer.
7. **If any of rules 1–6 cannot be met, stop. Do not build ZeroMargin.** A rules violation loses every prize, not one track.

### 0.4 Never-invent rule

Never invent a contract address, an ABI selector, an SDK method, an endpoint, a token address, a hook flag, or a prize amount. Use only the verified values in this file or a value you verified on-chain or in the installed package. If a value is unknown, put it behind an adapter and add it to Section C.6.

### 0.5 Adapter rule

Every external dependency is isolated behind one interface:

| Dependency | Interface | Live implementation | Offline implementation |
| :--- | :--- | :--- | :--- |
| 1inch Aqua | `IAqua` | canonical registry on Base `8453` | local `Aqua` built from the pinned source commit, or `MockAqua` |
| Uniswap v4 | `IPoolManagerMinimal`, `IHooks` | canonical `PoolManager` on Base `8453` or Base Sepolia `84532` | `MockPoolManager` |
| Short hedge venue | `IShortHedgeAdapter` | `ShortHedgeAdapter` with a pre-funded demo reserve | same adapter with a local reserve |
| Arkiv | `IRiskAttestationStore` | Rabdi `7794095` via SDK or JSON-RPC | `CachedAttestationStore` with a visible `source: "cache"` badge |
| Price mark | `IMarkOracle` | v4 `StateLibrary.getSlot0` plus the hook's stored mark | `DemoMarkOracle` with a scripted crash |

A wrong guess must break one adapter file, not the whole demo.

### 0.6 Banned words and claim lint

The submission repo must not contain incomplete markers or unqualified claims. Two classes are enforced differently:

- **Always banned:** `TBD`, `TODO`, `FIXME`, `PLACEHOLDER`, `etc.`, `as needed`, `guaranteed profit`, `guarantees profit`, `eliminates risk`, `eliminates liquidation risk`, `zero risk`, `first ever`, `world's first`, `institutional-grade`, `SEC-compliant`, `CME-compliant`, `trustless`, `live hedge`, `real-time`.
- **Banned unless negated in the same sentence:** `audited`, `production-ready`, `risk-free`. The honest phrases `not audited`, `not production-ready`, and `not risk-free` are allowed. A positive claim such as `the code is audited` fails.

`make lint` runs `python3 scripts/lint_claims.py` and must exit `0`. The script scans `contracts/`, `web/`, `arkiv/`, `docs/`, `README.md`, and `FEEDBACK.md` for `.sol`, `.ts`, `.tsx`, `.md`, `.json`, `.yml`, and `.yaml` files. It skips `node_modules`, `out`, `cache`, `.next`, `lib`, and `screenshots`.

```python
#!/usr/bin/env python3
"""Fail on incomplete markers and unqualified claims in the submission repo."""
from __future__ import annotations
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
TARGET_DIRS = ["contracts", "web", "arkiv", "docs"]
TARGET_FILES = ["README.md", "FEEDBACK.md"]
SUFFIXES = {".sol", ".ts", ".tsx", ".md", ".json", ".yml", ".yaml"}
SKIP = {"node_modules", "out", "cache", ".next", "lib", "screenshots"}

ALWAYS = [
    r"\bTBD\b", r"\bTODO\b", r"\bFIXME\b", r"\bPLACEHOLDER\b",
    r"\betc\.", r"\bas needed\b", r"\bguaranteed? profit\b",
    r"\beliminates? (all )?(trading )?(liquidation )?risk\b",
    r"\bzero risk\b", r"\bfirst ever\b", r"\bworld'?s first\b",
    r"\binstitutional-grade\b", r"\bSEC-compliant\b", r"\bCME-compliant\b",
    r"\btrustless\b", r"\blive hedge\b", r"\breal-time\b",
]
NEGATED = [r"\baudited\b", r"\bproduction-ready\b", r"\brisk[- ]free\b"]
NEGATION = re.compile(r"\b(not|never|no|without|isn't|is not|doesn't|does not)\b[^.]{0,60}$", re.I)
WARN = [r"\bCME SPAN\b", r"\bclearinghouse\b"]


def files():
    for name in TARGET_DIRS:
        base = ROOT / name
        if not base.exists():
            continue
        for path in base.rglob("*"):
            if path.is_file() and path.suffix in SUFFIXES and not (set(path.parts) & SKIP):
                yield path
    for name in TARGET_FILES:
        path = ROOT / name
        if path.exists():
            yield path


errors: list[str] = []
warnings: list[str] = []
for path in files():
    rel = path.relative_to(ROOT)
    for number, line in enumerate(path.read_text(encoding="utf-8", errors="ignore").splitlines(), 1):
        for pattern in ALWAYS:
            if re.search(pattern, line, re.I):
                errors.append(f"{rel}:{number}: always banned: {pattern} :: {line.strip()[:160]}")
        for pattern in NEGATED:
            for match in re.finditer(pattern, line, re.I):
                if not NEGATION.search(line[: match.start()]):
                    errors.append(f"{rel}:{number}: unqualified claim: {pattern} :: {line.strip()[:160]}")
        for pattern in WARN:
            if re.search(pattern, line, re.I):
                warnings.append(f"{rel}:{number}: prefer 'SPAN-style' or 'margin engine': {line.strip()[:160]}")

for warning in warnings:
    print("WARN", warning)
if errors:
    for error in errors:
        print("FAIL", error)
    sys.exit(1)
print("PASS: no incomplete markers or unqualified claims")
```

Use `SPAN-style` rather than `CME SPAN`. Use `clearing layer` or `margin engine` rather than `clearinghouse` in legal or marketing copy. The project name `ClearingHook` is a product name, not a regulatory claim.

### 0.7 Determinism rule

No floating-point arithmetic in Solidity. No floating-point arithmetic in TypeScript margin calculations. Use integer or `BigInt` fixed-point math with `BPS = 10_000` and `USDC = 10^6`. All monetary values are USDC with 6 decimals unless a field name says otherwise. All formulas are defined once in Section 4.3 and referenced everywhere else.

### 0.8 Build protocol

1. Read this file and `zeromargin_build_plan.md` once, end to end.
2. Work one card at a time, in order. Run the card's verification command. Never proceed on red.
3. After a green card, commit with the card's message. After every checkpoint, run the full suite.
4. If a verification fails, apply the card's failure list. After three failed attempts, switch to the card's fallback, record the deviation in `DECISIONS.md`, and continue. Never delete a failing test or weaken an acceptance criterion.
5. If reality differs from this spec, trust the live chain, the installed package, or the official docs. Fix the adapter and update `DECISIONS.md`.
6. Do not add features outside the plan. Do not refactor outside the current card.
7. Keep secrets out of the repo and logs. Use `.env` only.
8. Stop and report if a kill condition triggers, a required key is missing, a human task is blocking, or an invariant fails.
9. At each checkpoint, update `PROGRESS.md`: cards done, tests passing, deviations, risks, next five cards.
10. After the freeze point, only bug fixes and demo rehearsal. No new features.

### 0.9 Definition of done

A card is done when its acceptance command exits `0`, its output matches the expected output, the change is committed, and `PROGRESS.md` is updated. A component is done when its section in this file has a passing test and a README link. The project is done when Section 17 is fully ticked.

---

## 1. What it is / is not

### 1.1 One-line pitch

**ZeroMargin is a non-custodial margin engine that lets a trader cross-margin a Uniswap v4 LP position against an offsetting short hedge inside one 1inch Aqua virtual balance, cuts required initial margin by `90.17%–93.22%` on the 80%–95% hedged golden vectors, and settles a flash crash in one transaction with no liquidation penalty.**

### 1.2 What it is

ZeroMargin is a Solidity and TypeScript system with five parts:

1. **`SpanMathLib.sol`** — a deterministic 16-scenario, SPAN-style risk grid (`8` price shocks × `2` volatility states) plus a `500 bps` cross-venue basis haircut. It returns isolated initial margin, worst-case loss, net initial margin, net maintenance margin, and the 16 scenario PnLs. It is a simplified risk model, not CME's production SPAN algorithm.
2. **`ClearingAquaApp.sol`** — a custom 1inch AquaApp. The trader ships a virtual USDC balance to the app, opens a book, and the app settles the LP deficit and the short-hedge gain from the same Aqua balance. `quoteUnwind` and `unwind` use the same math so the quote equals the execution.
3. **`PortfolioMarginHook.sol`** — a real Uniswap v4 hook. It implements `getHookPermissions()` with `beforeRemoveLiquidity` and `afterSwap`, is deployed at a mined hook address, and reverts `beforeRemoveLiquidity` with `SpanMarginBreach` when a withdrawal would leave the book below its required initial margin.
4. **`ShortHedgeAdapter.sol`** — an `IShortHedgeAdapter` implementation that represents the short leg. In the hackathon build it holds a pre-funded USDC reserve and pushes the realized hedge gain into the trader's Aqua balance. In production, the same interface wraps a live perp venue.
5. **`arkivAdapter.ts` + `/arkiv/*.md`** — wallet-owned, `300-second` risk attestations on Arkiv Rabdi. A keeper queries `status = 'UNWIND_ELIGIBLE' AND marginRatioBps < 10000`; the onchain contract recomputes the margin before any settlement, so Arkiv is a discovery and audit layer, not a settlement authority.

The demo is a split-screen terminal: the left side is an isolated LP account that is liquidated with a `10%` penalty in a `-30%` crash; the right side is the ZeroMargin book that nets the short gain against the LP loss, pays a `5 bps` unwind fee, and returns `$19,700` of equity.

**This is a software-only project.** No custom hardware, no physical device, no firmware. Section 18 has no hardware addendum.

### 1.3 What it is not

- **Not a live perp venue.** The hackathon build does not route orders to any venue. The `ShortHedgeAdapter` is a pre-funded settlement adapter. The README and the demo say this explicitly.
- **Not a custodial vault.** Tokens stay in the trader's wallet. The Aqua registry holds `0` tokens. The app can only `pull` from the maker's wallet under the maker's ERC-20 approval.
- **Not a funding-rate swap.** It does not exchange funding rates like TenorFi.
- **Not a collateral-isolation product.** It does not ring-fence a tokenized bond like Galvanic.
- **Not an uncollateralized credit protocol.** Every book posts at least the net initial margin for the 16-scenario grid plus the basis haircut.
- **Not a general-purpose margin system.** The tested scope is one WETH/USDC Uniswap v4 LP plus one short WETH hedge. Multi-asset correlation, cross-chain collateral, and live venue risk are out of scope.
- **Not CME SPAN.** The grid is SPAN-style and simplified. Do not call it "CME SPAN" on stage or in the README.

---

## 2. Final claims — exact wording

### 2.1 Claims to use

**Claim 1 — margin reduction (tested on GV-01).**

> "On our 16-scenario SPAN-style grid with a `500 bps` cross-venue basis haircut, a `$100,000` WETH/USDC Uniswap v4 LP hedged with a `$95,000` short requires `$10,000` of net initial margin instead of `$147,500` of isolated margin. That is a `93.22%` reduction in locked collateral. The same test passes at `90.17%` on an 80%-hedged book."

Source: GV-01 and GV-02 in Section 4.7. The test asserts the exact integer amounts.

**Claim 2 — crash settlement (tested on GV-01 + `UNWIND-01`).**

> "In our deterministic `-30%` crash replay, an isolated account with `$25,000` of margin is liquidated with a `$10,000` penalty and `$0` equity left. ZeroMargin settles the same book in one transaction: it nets `$28,500` of short gain against `$33,750` of LP loss, pays a `$50` unwind fee, and returns `$19,700` of equity with `$0` liquidation penalty and `$0` bad debt. The short leg is settled against our pre-funded demo adapter, not a live venue."

Source: `UNWIND-01` in Section 4.7. The test asserts the exact amounts.

**Claim 3 — basis coverage (tested on the replay dataset).**

> "Across `43,200` one-minute observations, including the Aug 5 2024, Feb 3 2025, and Oct 30 2026 ETH crashes, the 99th-percentile inter-venue basis was `142 bps` and the worst one-minute spike was `318 bps`. Our `500 bps` haircut covers both. The replay script prints the SHA-256 of the dataset used in the submission."

Source: `data/basis_30d.json` in the submission repo. The `142`/`318` values are the reference target from the pre-event dataset. If the rebuilt dataset produces different values, replace them in this claim, the README, the UI, and the video before submission. The dataset hash is whatever `npm run replay` prints; it is recorded in `data/README.md` and shown on screen. Do not paste the reference hash if the rebuilt file differs.

**Claim 4 — originality (research finding, not "first ever").**

> "We found no project in the 10,510-project ETHGlobal corpus from 2024–2026 that combines cross-venue portfolio-margin netting for a Uniswap v4 LP and a short hedge, an Aqua-settled dual-leg unwind, and a v4 hook that enforces the post-withdrawal margin rule. Adjacent projects exist: GammaHedge, HedgeLP, DefiSalmon, Iceberg, Galvanic, TenorFi, OddsFlow, and Aqua0. None of them does this combination."

Source: Section C.4 and the corpus query recorded in `docs/PRIOR_ART.md`.

**Claim 5 — sponsor integration.**

> "The demo executes real Aqua `ship`, `push`, and `pull` token transfers on a Base mainnet fork, calls a real Uniswap v4 `PoolManager` with a hook deployed at a mined hook address, and writes and queries a real Arkiv entity on Rabdi `7794095` with a `300-second` expiration."

Source: the fork tests and the Arkiv script. If any of these is not true on demo day, remove that clause and drop the corresponding sponsor track.

### 2.2 Wording to avoid

| Do not say | Say instead | Why |
| :--- | :--- | :--- |
| "risk-free" / "zero risk" | "no liquidation penalty inside the tested SPAN envelope" | Basis, venue, smart-contract, and oracle risk remain. |
| "guaranteed profit" | "the tested book returns `$19,700` of equity in the `-30%` replay" | A single deterministic scenario is not a guarantee. |
| "eliminates liquidation risk" | "reduces required initial margin by `93.22%` on GV-01" | The book can still breach margin outside the grid. |
| "CME SPAN" | "SPAN-style 16-scenario grid" | The algorithm is simplified, not CME's production model. |
| "live hedge" | "pre-funded demo hedge adapter" | No live venue is connected in the hackathon build. |
| "audited" | "tested; not audited" | There is no audit. |
| "production-ready" | "hackathon prototype with a production adapter interface" | The product is not production-ready. |
| "first ever" | "we found no direct prior in the 10,510-project corpus" | A corpus search is not a global first. |
| "institutional-grade" | "designed for a delta-hedged LP desk" | No institutional deployment or compliance review. |
| "clearinghouse" in legal copy | "margin engine" or "clearing layer" | Avoid a regulated term. |

### 2.3 Claim-to-test map

| Claim | Test / artifact | Acceptance |
| :--- | :--- | :--- |
| Claim 1 | `forge test --match-test test_GV01` and `test_GV02` | Exact `$10,000` / `$147,500` and `$13,750` / `$140,000`; `9,322` / `9,017` bps savings. |
| Claim 2 | `forge test --match-test test_UNWIND01` | `$28,500` netted, `$33,750` LP loss, `$50` fee, `$19,700` equity, `$0` bad debt. |
| Claim 3 | `npm run replay` | SHA-256 is printed and recorded; P99 and max match the claim text. If the rebuilt dataset differs from the reference target, the claim, UI, and video are updated before submission. |
| Claim 4 | `docs/PRIOR_ART.md` | The file records the corpus size (`10,510`), the retrieval date, the exact query terms, the hit counts, and the adjacent project names. The counts match Section C.3. |
| Claim 5 | `forge test --match-contract AquaForkTest`, `PortfolioMarginHookForkTest`; `npm run arkiv:verify` | Real `Pushed`/`Pulled` events; real `SpanMarginBreach` revert; real entity key and query result. |

---

## 3. Scoring, sponsor fit, and band-raisers

### 3.1 Scores and band

| Criterion | Baseline | With `BR1–BR5` | One-line justification |
| :--- | :---: | :---: | :--- |
| Technicality | `8.2` | `8.9` | Deterministic fixed-point margin math with a real v4 hook and a real Aqua app; the missing half is the live venue and the oracle. |
| Originality | `8.2` | `8.4` | No direct prior in the corpus; the mechanism is a combination, not a new primitive. |
| Practicality | `7.3` | `8.1` | Real capital-efficiency value for delta-hedged LPs, but the demo adapter is not a venue and the model is calibrated on one dataset. |
| Usability | `7.5` | `8.1` | A split-screen terminal that shows the comparison in seconds; the input is a book and a shock, not a wallet flow. |
| WOW | `8.1` | `8.8` | `$147,500` → `$10,000` on screen, then a one-transaction settlement with `$0` bad debt next to a liquidation. |
| **Honest mean** | **`7.9`** | **`8.5`** | Sum divided by five; no rounding up. |
| **Band** | Medium-High (`7.2–8.3`) | High (`8.0–8.8`) | Calibrated against a corpus where the mean winning score sits near `8`. |
| **Finalist probability** | `14%` | `21%` | Team-adjusted from the `4.10%` 2026 IRL base rate using lane overlap, demo risk, and the 2-person team. |
| **At least one partner prize** | `30%` | `45%` | Three independent tracks, each with a real proof path; the joint number is not the sum of the three. |

### 3.2 Sponsor-track fit

| Sponsor | Fit /10 | Load-bearing? | Hit probability | What must be shown on stage |
| :--- | :---: | :---: | :---: | :--- |
| **1inch** | `8` | Yes | `20%` | A custom `AquaApp`, a real `ship` of `25,000e6` USDC, a `push` of `28,500e6`, a `pull` of `33,800e6`, the canonical registry address, and a fork tx hash. `SwapVM` is scored higher, so `0xf1` is upside, not the claim. |
| **Uniswap Foundation** | `9` | Yes | `22%` | A real v4 hook at a mined `0x240` address on a canonical `PoolManager`, the `SpanMarginBreach(12,000e6, 16,500e6)` revert, a safe withdrawal in the same pool, `FEEDBACK.md`, and the submitted form. |
| **Arkiv** | `7` | No — convenient, not required | `12%` | A live Rabdi entity key, the writer wallet, the `300`-second expiry countdown, one runnable query, and the five `/arkiv/*.md` files. Dropping it does not break the mechanism. |

If a track's live proof fails, that track is dropped and its claim is removed. A fake integration loses all three tracks, not one.

### 3.3 Kill-condition summary

Full table in Section 15. The four that decide the project: **K-01** the rules gate (if the repo cannot start empty, stop), **K-05** the golden-vector gate (if GV-01–GV-04 do not match, abandon), **K-06** the atomic settlement gate (if the two legs cannot settle in one transaction, remove the word "atomic" or abandon), **K-07** the zero-bad-debt invariant (if bad debt appears inside the tested envelope, stop).

### 3.4 Differentiation sentence

**The difference from every prior found is the combination: a cross-venue portfolio-margin account that nets a Uniswap v4 LP against a short hedge, settles both legs from one 1inch Aqua virtual balance in a single transaction, and is enforced on the withdrawal path by a real v4 hook.**

### 3.5 Band-raising conditions

Band-raisers are concrete levers, not wishes. Each row states the score criteria it moves, the acceptance test, the failure mode, and whether it is grindable (effort) or luck-bound (do first if the opportunity exists). `BR1`, `BR2`, and `BR3` are **conjunctive for the full three-sponsor story**: if one fails, drop that sponsor track and remove its claims rather than faking it.

| ID | Lever | Effect on criteria | Acceptance test | Failure mode | Grindable / luck-bound | Conjunctive? |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **BR1** | Real Uniswap v4 hook at a mined hook address, attached to a real `PoolManager` pool on a Base fork; `beforeRemoveLiquidity` reverts `SpanMarginBreach`. | Technicality `+0.4`, Practicality `+0.3`, WOW `+0.2` | `forge test --match-contract PortfolioMarginHookForkTest -vv` passes; the hook permissions match the mined address; the `PoolManager` call reverts with `SpanMarginBreach(trader, postEquity, requiredIM)`. | Hook address flags mismatch → the PoolManager never calls the hook. Fix with `HookMiner`; assert the flags in the test. | Grindable | Yes, for Uniswap |
| **BR2** | Real Aqua token transfers on a Base fork: `ship` `$25,000`, `push` `$28,500` hedge gain, `pull` `$33,800` settlement; assert wallet and virtual balances. | Technicality `+0.3`, Practicality `+0.3`, WOW `+0.2` | `forge test --match-contract AquaForkTest -vv` passes; the test asserts `Pushed` and `Pulled` events and the trader's USDC balance changes; a fork tx hash is printed. | `pull` reverts on allowance or balance; `push` reverts because the adapter did not approve Aqua. Fix the approval and pre-fund the adapter. | Grindable | Yes, for 1inch |
| **BR3** | Live Arkiv write and query: create a `zeromargin.span_attestations` entity, query it through the SDK and raw JSON-RPC, show the `300-second` expiration. | Usability `+0.3`, Practicality `+0.2` | `npm run arkiv:verify` prints the entity key, writer address, `expiresAt`, and a query result with `source: "live-rabdi"`; the README has the writer address and the runnable query; all five `/arkiv/*.md` files exist. | Faucet or access key unavailable; entity write fails; query syntax differs. Use the public RPC, retry with a funded wallet, or drop the Arkiv track. | Grindable + partly luck-bound (faucet) | Yes, for Arkiv |
| **BR4** | Reproducible crash and basis replay: 43,200 one-minute observations, three named crashes, SHA-256, P99 and max basis. | WOW `+0.3`, Usability `+0.2`, credibility of Claim 3 | `npm run replay` prints the SHA-256, the recomputed P99 and max, and the three crash dates; the UI shows the same numbers; the video includes the replay. The reference target is `P99 = 142 bps`, `max = 318 bps`; if the rebuild differs, update Claim 3, the UI, and the video before submission. | Data source or license issue; numbers differ after a rebuild. Use public candles with a cited license; record the rebuilt hash; update the claim to the rebuilt numbers rather than forcing the reference numbers. | Grindable | No |
| **BR5** | A real delta-hedged LP trader or a DeFi risk advisor on camera for 20 seconds, saying what they would use and what they would not trust. | Practicality `+0.4`, WOW `+0.3` | A signed consent, a 20-second clip in the video, a name and role in the README, and one concrete quote. | No user available; a fake quote would be a credibility failure. Skip it. | Luck-bound | No |
| **BR6** | Custom 1inch SwapVM instruction `0xf1` on a forked `AquaSwapVMRouter` v1.0.2, with `quote == swap` parity and real token transfers. | Technicality `+0.5`, Originality `+0.3`, WOW `+0.3` | The official `swap-vm` test suite passes; `forge test --match-contract SpanNetUnwindOpcodeTest -vv` passes; `quote` and `swap` return identical `(amountIn, amountOut)`; a fork tx executes the instruction. | The instruction table, `MakerTraits`, or `TakerTraits` differ from the pinned tag; the custom router is not a valid SwapVM router. Fall back to the AquaApp path and do not claim the opcode. | Grindable, high variance | No; stretch only |

**What the counted band-raisers buy.** `BR1` makes the Uniswap integration real. `BR2` makes the 1inch integration real. `BR3` makes the Arkiv integration real. `BR4` makes the risk claim reproducible. `BR5` adds a human signal. With all five, the mean is `8.5` and the joint partner probability is `45%`. `BR6` is upside, not a promise.

---

## 4. Product definition with exact semantics

### 4.1 Objects and types

```solidity
struct PositionBook {
    uint128 lpNotionalUsdc;        // 6 decimals; 1e6 = $1.00
    uint128 shortNotionalUsdc;     // 6 decimals; <= lpNotionalUsdc on the open path
    uint128 postedMarginUsdc;      // 6 decimals; >= netInitialMarginUsdc at open
    uint64  entrySpotPriceUsdc;    // 6 decimals; USDC per WETH at openBook
    uint64  lastUpdateTimestamp;   // unix seconds
    bytes32 aquaStrategyHash;      // the Aqua strategy that holds the virtual balance
    bool    isActive;              // one active book per trader
}

struct SpanResult {
    uint256 isolatedInitialMarginUsdc;
    uint256 worstScenarioLossUsdc;   // L_SPAN
    uint8   worstScenarioIndex;      // 0..15
    uint256 basisHaircutUsdc;        // H_basis
    uint256 netInitialMarginUsdc;    // IM_net
    uint256 netMaintenanceMarginUsdc;// MM_net
    int256[16] scenarioNetPnlUsdc;   // the full grid, index = k * 2 + m
    uint256 capitalSavingsBps;
}

struct UnwindPreview {
    uint256 lpLossUsdc;
    uint256 shortGainUsdc;
    uint256 nettedOffsetUsdc;        // netted = min(shortGain, lpLoss)
    uint256 protocolFeeUsdc;
    uint256 traderMarginUsedUsdc;
    uint256 remainingEquityUsdc;
    uint256 badDebtUsdc;
}
```

### 4.2 Parameters with defaults and units

| Parameter | Symbol | Default | Unit | Meaning |
| :--- | :---: | ---: | :--- | :--- |
| `BPS` | `B` | `10_000` | bps | `100.00% = 10,000 bps`. |
| `USDC_UNIT` | — | `1_000_000` | base units | `1e6 = $1.00`. |
| `GAMMA_LP_BPS` | `γ` | `5_000` | bps (`0.50`) | Quadratic convexity factor for concentrated LP impermanent loss. |
| `BASIS_HAIRCUT_BPS` | `h` | `500` | bps (`5.00%`) | Cross-venue basis buffer on matched notional. |
| `MAINT_MARGIN_RATIO_BPS` | `m` | `7_500` | bps (`75.00%`) | Maintenance margin as a share of net initial margin. |
| `ISOLATED_SHORT_IM_BPS` | `α` | `5_000` | bps (`50.00%`) | Isolated initial margin for a `2×` short. |
| `ISOLATED_LIQ_PENALTY_BPS` | `π` | `1_000` | bps (`10.00%`) | Isolated liquidation penalty on LP notional. |
| `NETTED_UNWIND_FEE_BPS` | `φ` | `5` | bps (`0.05%`) | Protocol fee on the atomic unwind. |
| `ARKIV_TTL_SECONDS` | `T` | `300` | seconds | `150` Rabdi blocks at 2 seconds per block. |
| `PRICE_SHOCKS_BPS` | `δ` | `[-3000,-2000,-1000,-500,0,500,1000,2000]` | bps | The eight price shocks in the grid. |
| `VOL_SHOCKS_BPS` | `ν` | `[0,150]` | bps | The two volatility states. |
| `MIN_LP_NOTIONAL_USDC` | — | `1_000e6` | USDC | Minimum book size. |
| `MAX_LP_NOTIONAL_USDC` | — | `10_000_000e6` | USDC | Maximum book size for the demo; prevents overflow. |
| `MAX_HEDGE_RATIO_BPS` | — | `10_000` | bps | Short notional may not exceed LP notional. |
| `MIN_SHOCK_BPS` | — | `-3_000` | bps | Lower bound of the supported unwind range. |
| `MAX_SHOCK_BPS` | — | `2_000` | bps | Upper bound of the supported unwind range. |
| `DEMO_ENTRY_PRICE_USDC` | — | `3_000e6` | USDC | `$3,000` per WETH in the demo. |
| `DEMO_CRASH_BPS` | — | `-3_000` | bps | `-30%` crash in the demo. |
| `DEMO_LP_NOTIONAL_USDC` | — | `100_000e6` | USDC | GV-01 LP notional. |
| `DEMO_SHORT_NOTIONAL_USDC` | — | `95_000e6` | USDC | GV-01 short notional. |
| `DEMO_POSTED_MARGIN_USDC` | — | `25_000e6` | USDC | GV-01 posted margin. |
| `DEMO_HEDGE_RESERVE_USDC` | — | `100_000e6` | USDC | Pre-funded reserve in the demo `ShortHedgeAdapter`. |

All parameters are `internal constant` or `immutable` in the contracts, except the mark price and the demo reserve. No parameter is governance-upgradeable in the hackathon build.

### 4.3 Formulas (exact integer math)

Given `N_LP = lpNotionalUsdc`, `N_S = shortNotionalUsdc`, `B = 10_000`, all in USDC base units (`1e6 = $1.00`).

**1. LP impermanent-loss convexity penalty for price shock `δ` (bps):**

```text
IL(δ) = floor( N_LP × γ × |δ|² / (2 × B³) )
```

**2. Scenario net PnL for price shock `δ` and volatility shock `ν`:**

```text
NetPnL(δ,ν) = floor( (N_LP − N_S) × δ / B ) − IL(δ) − floor( N_LP × ν / B )
```

**3. Worst-case scenario loss, basis haircut, net initial margin, net maintenance margin:**

```text
L_SPAN = max(0, −NetPnL(s)) for s in the 16 scenarios
H_basis = ceil( min(N_LP, N_S) × h / B )
IM_net  = L_SPAN + H_basis
MM_net  = ceil( IM_net × m / B )
```

**4. Isolated initial margin baseline:**

```text
IM_isolated = N_LP + ceil( N_S × α / B )
```

**5. Capital savings (bps, truncated):**

```text
savings_bps = floor( (IM_isolated − IM_net) × B / IM_isolated )
```

**6. Unwind PnL at price shock `δ` and volatility shock `ν`:**

```text
lp_delta   = signedFloorDiv( N_LP × δ, B )
IL         = floor( N_LP × γ × |δ|² / (2 × B³) )   // γ = 5,000 bps; see the note below
vol        = floor( N_LP × ν / B )
lp_net     = lp_delta − IL − vol
short_net  = signedFloorDiv( −N_S × δ, B )

// Cross-leg waterfall. Exactly one of the two branches can net a gain.
if lp_net < 0 and short_net >= 0:
    lp_loss = −lp_net
    short_gain = short_net
elif short_net < 0 and lp_net >= 0:
    lp_loss = −short_net
    short_gain = lp_net
elif lp_net < 0 and short_net < 0:
    lp_loss = −lp_net − short_net
    short_gain = 0
else:
    lp_loss = 0
    short_gain = lp_net + short_net

netted     = min(short_gain, lp_loss)
fee        = ceil( N_LP × φ / B )
residual   = lp_loss − netted
required   = residual + fee
excess     = short_gain − netted
available  = posted_margin + excess

if available >= required:
    margin_used = required
    equity_left = available − required
    bad_debt    = 0
else:
    margin_used = available
    equity_left = 0
    bad_debt    = required − available
```

**Direction limit.** The onchain `unwind` executes only for `δ ∈ [−3,000, 0]`, where the short leg gains and the adapter can push that gain into Aqua. For `δ > 0`, `previewShockUnwind` still returns the waterfall for the withdrawal guard and the GV-04 test, but `unwind` reverts `UnsupportedShockDirection`. The README states this limitation. Do not claim an atomic unwind for an upward shock.

**IL substitution note.** `γ` is stored in bps (`5_000`). The raw integer form is `N_LP × 5_000 × δ² / (2 × 10_000³)`. The dimensionless form is `N_LP × 0.50 × (δ / 10_000)² / 2`. Both produce `2,250e6` for GV-01. Mixing the two forms is the most likely arithmetic bug in this build; the golden vectors catch it.

**7. `amountIn` and `amountOut` for the atomic settlement (`δ ≤ 0` only):**

```text
amountIn  = netted                 // USDC pushed from the hedge adapter into Aqua
amountOut = netted + margin_used   // USDC pulled from Aqua to the LP settlement recipient and fee collector
amountOut = lp_loss + fee          // equivalent, because netted + residual = lp_loss
```

For `δ > 0`, `unwind` is not executed; the preview exists only to test the withdrawal guard.

**8. Fixed-point helpers:**

```solidity
function ceilDiv(uint256 a, uint256 b) internal pure returns (uint256) {
    if (a == 0) return 0;
    return (a + b - 1) / b;
}

function signedFloorDiv(int256 a, int256 b) internal pure returns (int256) {
    // b > 0 in every call site.
    if (a >= 0) return a / b;
    return -((-a + b - 1) / b);
}
```

The reference implementation uses Solidity's truncating `/` for signed PnL. That differs from `signedFloorDiv` by at most `1` USDC base unit on non-exact inputs. The rebuilt code must use `signedFloorDiv`; the golden vectors are exact and unaffected. Record this as a deliberate correction in `DECISIONS.md`.

**9. Margin ratio for Arkiv:**

```text
margin_ratio_bps = floor( equity_left × B / IM_net )   // 0 if IM_net == 0
status = "UNWIND_ELIGIBLE" if margin_ratio_bps < 10_000 else "ACTIVE_HEDGED"
```

### 4.4 State machine

```text
                 openBook()
   EMPTY ─────────────────────────────► OPEN
     ▲                                   │
     │                                   ├── addMargin() ──► OPEN (postedMarginUsdc increases)
     │                                   │
     │                                   ├── equity < 100% margin ──► AT_RISK
     │                                   │        │
     │                                   │        ├── unwind() ──► SETTLED
     │                                   │        └── addMargin() ──► OPEN
     │                                   │
     └── closeBook() ◄── SETTLED         │
                                         └── unsafe LP withdrawal
                                             (hook reverts SpanMarginBreach)
```

| State | Meaning | Allowed transitions | Invariant |
| :--- | :--- | :--- | :--- |
| `EMPTY` | No book for this trader. | `openBook` → `OPEN`. | `isActive == false`. |
| `OPEN` | Book posted at or above `IM_net`. | `addMargin` → `OPEN`; `unwind` → `SETTLED`; `closeBook` only after `SETTLED`. | `isActive == true`; `postedMarginUsdc >= IM_net` at open. |
| `AT_RISK` | Book is below 100% margin but not yet unwound. | `unwind` → `SETTLED`; `addMargin` → `OPEN`. | `isActive == true`; the trader or an authorized keeper may call `unwind`. |
| `SETTLED` | Unwind executed; the book is inactive. | `closeBook` docks the strategy and returns to `EMPTY`. | `isActive == false`; `postedMarginUsdc == remainingEquityUsdc`. |

`beforeRemoveLiquidity` does not change the state. It reverts or returns the selector. A revert leaves the state unchanged. `unwind` is callable only for `δ ∈ [−3,000, 0]`; a positive-shock preview is used by the withdrawal guard but cannot transition the book.

### 4.5 Invariants

| ID | Invariant | Enforcement | Test |
| :---: | :--- | :--- | :--- |
| **I1** | No LP withdrawal may leave `postWithdrawalEquity < requiredInitialMargin` for an active book. | `PortfolioMarginHook.beforeRemoveLiquidity` calls `previewEquityAfterWithdrawal` and reverts `SpanMarginBreach`. | `test_UnsafeWithdrawalReverts`, `invariant_NoWithdrawalBelowIM`. |
| **I2** | Atomic settlement conservation: `amountOut == nettedOffset + traderMarginUsed` and `amountOut == lpLoss + protocolFee`. | `ClearingAquaApp.unwind` checks the equations before `AQUA.pull`. | `test_UNWIND01`, `invariant_AquaConservation`. |
| **I3** | Zero bad debt inside the tested envelope: for `N_S/N_LP ∈ [80%, 100%]`, `posted >= IM_net`, and `δ ∈ [-3000, +2000]`, `badDebt == 0`. | `SpanMathLib` plus fuzz test. | `testFuzz_ZeroBadDebtWithinEnvelope` with 256 runs. |
| **I4** | Quote/swap parity: `quoteUnwind(trader, δ)` returns exactly the same `UnwindPreview` as `unwind(trader, δ)` for the same state and inputs. | Shared internal `_preview` function; `quote` is `view`, `unwind` is state-changing. | `testFuzz_QuoteMatchesUnwind` with 256 runs. |
| **I5** | Conservative rounding: margin requirements use `ceilDiv`; profit credits use `signedFloorDiv`; no float. | `SpanMathLib` helpers; TypeScript `bigint` helpers. | `test_RoundingDirection`, `spanParity.test.ts`. |
| **I6** | Arkiv freshness: every attestation expires at `now + 300s`; an expired entity is not returned. | `ExpirationTime.fromMinutes(5)`; `$expiresAt` query. | `npm run arkiv:verify` checks `expiresAt - now <= 300`. |
| **I7** | Aqua self-custody: the app never holds maker tokens; `pull` transfers from the maker wallet; `push` transfers from the adapter to the maker. | Aqua registry semantics; no token custody in the app. | `AquaForkTest` asserts wallet balances before and after. |
| **I8** | Hook authorization: only the v4 `PoolManager` may call the hook's `beforeRemoveLiquidity` and `afterSwap`. | `BaseHook.onlyPoolManager` or `require(msg.sender == address(poolManager))`. | `test_OnlyPoolManager`. |
| **I9** | Book monotonicity: `lpNotionalUsdc` and `shortNotionalUsdc` never increase after open without a new `openBook`. | `openBook` overwrites; no `increaseNotional` function. | `test_BookImmutableAfterOpen`. |
| **I10** | No reentrancy in `unwind`: the book is marked inactive before external calls; a guard blocks nested calls. | Checks-effects-interactions + `nonReentrant`. | `test_ReentrancyBlocked`. |
| **I11** | No token custody: `USDC.balanceOf(address(app)) == 0` at the end of `openBook`, `unwind`, `addMargin`, and `closeBook`. | Every external call ends with a transfer out or a pull from the maker. | `test_NoTokenCustody`. |
| **I12** | `markPriceUsdc` changes only through `updateMarkPrice` called by the hook. | `onlyHook` on `updateMarkPrice`; the hook reads `StateLibrary.getSlot0`. | `test_MarkPriceOnlyHook`, `test_AfterSwapUpdatesMark`. |
| **I13** | `setHook` succeeds once; `owner == address(0)` after `renounceOwnership`. | One-time set plus an immediate renounce in the deploy batch. | `test_HookSetOnce`, `test_OwnerRenounced`. |
| **I14** | One active book per trader; a second `openBook` reverts `BookAlreadyActive`. | The `books` mapping is keyed by trader; `isActive` is checked on open. | `test_OneBookPerTrader`. |
| **I15** | A keeper can only call `unwind`; it cannot withdraw, add margin, set another keeper, or close the book. | The keeper mapping is checked only in `unwind`. | `test_KeeperScope`. |
| **I16** | `unwind` reverts for a caller that is neither the trader nor an authorized keeper. | `NotAuthorized`. | `test_UnauthorizedUnwind`. |
| **I17** | The hook is stateless: it stores no mutable storage, performs no `delegatecall`, and has no `selfdestruct`. | Only immutables and no mutable slots. | `forge inspect PortfolioMarginHook storage-layout`; `grep -nE 'delegatecall\|selfdestruct' contracts/src` returns nothing. |

### 4.6 Edge cases and rounding

| Case | Behavior |
| :--- | :--- |
| `N_LP == 0` | Revert `InvalidNotional`. |
| `N_LP < 1_000e6` | Revert `InvalidNotional`. |
| `N_S > N_LP` | Revert `OverHedged`. The product does not support net-short books. |
| `posted < IM_net` | Revert `InsufficientPostedMargin(posted, IM_net)`. |
| `posted > IM_net` | Allow. The excess is part of `available` and is returned as equity. |
| `δ < -3000` or `δ > +2000` | Revert `ShockOutOfRange(δ)`. The risk grid does not cover it. |
| `δ > 0` on `unwind` | Revert `UnsupportedShockDirection(δ)`. The preview is allowed for the withdrawal guard; the atomic netted unwind only supports downward shocks. |
| `N_S == 0` | Allow. The book is an unhedged LP; the basis haircut is `0`; savings are lower (GV-03). |
| `short_gain > lp_loss` | `netted = lp_loss`; the excess short gain stays in Aqua and is returned as equity; `margin_used = fee`; `bad_debt = 0`. |
| `lp_loss > short_gain + posted` | `bad_debt > 0`; the app emits `BadDebtRealized`; the demo adapter's reserve must be large enough to avoid this in the tested scenario. |
| Aqua `tokensCount == 0` | Revert `StrategyInactive`. The maker must `ship` first. |
| Aqua `tokensCount == 0xff` | Revert `StrategyDocked`. |
| Aqua `balance < posted` | Revert `InsufficientAquaBalance(balance, posted)`. |
| `hookData` is empty | The hook uses `msg.sender` (the `PoolManager` caller) as the trader and checks that trader's book. A non-ZeroMargin LP with no active book is allowed. |
| `hookData` is non-empty and does not encode `msg.sender` | Revert `InvalidHookData`. The hook never trusts a caller-supplied trader address. |
| Withdrawal through a router | The hook sees the router as `sender` and cannot identify the position owner; the guard does not apply. The README lists this limitation. |
| `trader` has no active book | The hook returns the selector and allows the withdrawal. The guard only applies to active books. |
| Negative PnL rounding | `signedFloorDiv` rounds toward negative infinity, which increases the loss by at most `1` base unit. |
| Fee rounding | `ceilDiv`, so the protocol never undercharges. |
| Equity rounding | `available - required`, exact integer subtraction; no rounding. |
| `IM_net == 0` | Only possible if `N_LP == 0`, which is rejected. The margin ratio formula returns `0` defensively. |
| Token decimals | USDC `6`, WETH `18`. The hook's USD conversion uses the token ordering and decimals from the pool key; a unit test covers both orderings. |

### 4.7 Golden vectors

The submission repo's `data/golden_vectors.json` must contain these exact vectors. The reference implementation's IDs are reused, but its test names are not: the rebuilt repo must use `GV-01`..`GV-04` for the JSON vectors and `UNWIND-01` for the crash preview.

| ID | Inputs | Expected |
| :--- | :--- | :--- |
| **GV-01** | `N_LP = 100,000e6`, `N_S = 95,000e6`, `posted = 25,000e6`, `δ = -3,000`, `ν = 150` | `IM_isolated = 147,500e6`; `L_SPAN = 5,250e6`; `H_basis = 4,750e6`; `IM_net = 10,000e6`; `MM_net = 7,500e6`; `savings = 9,322 bps`. |
| **GV-02** | `N_LP = 100,000e6`, `N_S = 80,000e6`, `posted = 20,000e6`, `δ = -3,000`, `ν = 150` | `IM_isolated = 140,000e6`; `L_SPAN = 9,750e6`; `H_basis = 4,000e6`; `IM_net = 13,750e6`; `MM_net = 10,312.5e6`; `savings = 9,017 bps`. |
| **GV-03** | `N_LP = 100,000e6`, `N_S = 0`, `posted = 35,000e6`, `δ = -3,000`, `ν = 150` | `IM_isolated = 100,000e6`; `L_SPAN = 33,750e6`; `H_basis = 0`; `IM_net = 33,750e6`; `MM_net = 25,312.5e6`; `savings = 6,625 bps`. |
| **GV-04** | Post-withdrawal state: remaining `N_LP = 20,000e6`, `N_S = 95,000e6`, `posted = 12,000e6`, `δ = +2,000`, `ν = 150` | `IM_isolated = 67,500e6`; `L_SPAN = 15,500e6`; `H_basis = 1,000e6`; `IM_net = 16,500e6`; `MM_net = 12,375e6`; `savings = 7,555 bps`. This is the unsafe-withdrawal state; the hook reverts. |
| **UNWIND-01** | `N_LP = 100,000e6`, `N_S = 95,000e6`, `posted = 25,000e6`, `δ = -3,000`, `ν = 150` | `lpLoss = 33,750e6`; `shortGain = 28,500e6`; `netted = 28,500e6`; `fee = 50e6`; `marginUsed = 5,300e6`; `equity = 19,700e6`; `badDebt = 0`. |

**GV-04 is not an `openBook` input.** It is the state after a book opened with `N_LP = 100,000e6`, `N_S = 95,000e6`, and `posted = 12,000e6` (which is above the `10,000e6` initial margin) withdraws `80,000e6` of LP notional. The engine evaluates it through `previewEquityAfterWithdrawal(trader, 80,000e6)`, which returns `postWithdrawalEquity = 12,000e6` and `requiredInitialMargin = 16,500e6`; the hook reverts `SpanMarginBreach`.

### 4.8 Worked example (GV-01 and UNWIND-01)

At `δ = -3,000` bps:

```text
lp_delta  = -100,000 × 0.30 = -30,000
IL        = 100,000 × 0.50 × 0.30² / 2 = 2,250
vol       = 100,000 × 150 / 10,000 = 1,500
lp_net    = -30,000 − 2,250 − 1,500 = -33,750
short_net = +95,000 × 0.30 = +28,500
netted    = min(28,500, 33,750) = 28,500
fee       = ceil(100,000 × 5 / 10,000) = 50
residual  = 33,750 − 28,500 = 5,250
required  = 5,250 + 50 = 5,300
available = 25,000 + (28,500 − 28,500) = 25,000
equity    = 25,000 − 5,300 = 19,700
bad_debt  = 0
```

At `δ = +2,000` bps for GV-04 (remaining `$20,000` LP against `$95,000` short):

```text
lp_delta   = +20,000 × 0.20 = +4,000
IL         = 20,000 × 0.50 × 0.20² / 2 = 200
vol        = 20,000 × 150 / 10,000 = 300
lp_net     = +4,000 − 200 − 300 = +3,500
short_net  = -95,000 × 0.20 = -19,000
lp_loss    = 19,000
short_gain = 3,500
netted     = 3,500
fee        = ceil(20,000 × 5 / 10,000) = 10
residual   = 19,000 − 3,500 = 15,500
required   = 15,500 + 10 = 15,510
available  = 12,000 + 0 = 12,000
bad_debt   = 3,510
```

The `IM_net` for GV-04 is `16,500`; the posted margin is `12,000`; the hook reverts. The unwind would produce `$3,510` of bad debt, which is why the hook must block the withdrawal.

### 4.9 Arkiv schema and query semantics

```text
schema:   zeromargin.span_attestations
fields:   portfolioId: str, trader: addr, status: str, marginRatioBps: i32,
          lpNotionalUsdc: dec, shortNotionalUsdc: dec, postedMarginUsdc: dec,
          netInitialMarginUsdc: dec, netMaintenanceMarginUsdc: dec, equityUsdc: dec,
          aquaStrategyHash: str, updatedAt: u64
indexes:  portfolioId, trader, status, marginRatioBps, updatedAt
ttl:      ExpirationTime.fromMinutes(5) = 300 seconds = 150 Rabdi blocks at 2s/block
```

Runnable query (raw JSON-RPC `arkiv_query`), the exact string that appears in `README.md`:

```text
arkiv.schema = str('zeromargin.span_attestations') AND status = str('UNWIND_ELIGIBLE') AND marginRatioBps < i32(10000) ORDER BY $key ASC
```

The SDK equivalent chains `.from(SpanAttestations).ownedBy(writerAddress).where(and(eq("status","UNWIND_ELIGIBLE"), lt("marginRatioBps", 10_000))).fetch()`; the exact argument shape is taken from the installed SDK examples, not guessed. Arkiv is a discovery and audit layer. The onchain `unwind` recomputes the margin; it never reads an Arkiv entity.

### 4.10 Hook notional formula

```text
sqrtP  = sqrtPriceX96 from StateLibrary.getSlot0(POOL_MANAGER, poolId)
sqrtA  = TickMath.getSqrtPriceAtTick(tickLower)
sqrtB  = TickMath.getSqrtPriceAtTick(tickUpper)
L      = uint128(-params.liquidityDelta)        // removal is negative

amount0 = LiquidityAmounts.getAmount0ForLiquidity(sqrtA, sqrtB, L)   // WETH, 18 decimals
amount1 = LiquidityAmounts.getAmount1ForLiquidity(sqrtA, sqrtB, L)   // USDC, 6 decimals

spotUsdc      = (sqrtP × sqrtP × 1e18) / 2^192       // USDC per WETH, 6 decimals
entryUsdc     = engine.bookEntryPrice(trader)         // 6 decimals, set at openBook
wethPriceUsdc = max(spotUsdc, entryUsdc)              // conservative for the guard
withdrawnUsd  = (amount0 × wethPriceUsdc) / 1e18 + amount1
```

**Do not add a `1e12` divisor.** The `1e18` factor converts WETH's 18 decimals against USDC's 6 decimals. Sanity check: at `$3,000` per WETH, `sqrtP² / 2^192 = 3e-9`, and `3e-9 × 1e18 = 3e9`, which is `$3,000` in 6-decimal USDC. A test with a known `sqrtPriceX96` asserts this exact value.

`LiquidityAmounts` handles the in-range and out-of-range cases. The hook reads `sqrtP` from the pool manager; it does not trust a caller-supplied price. **The hook uses `msg.sender` as the trader, never `hookData`.** If `hookData` is non-empty, it must `abi.encodePacked(msg.sender)` or the hook reverts `InvalidHookData`; this blocks a caller from pointing the guard at another trader's book. If the pool's token ordering is reversed, use the inverse price `wethPriceUsdc = (2^192 × 1e18) / (sqrtP × sqrtP)` and swap the amount branches. A unit test covers both orderings.

The `max(spotUsdc, entryUsdc)` rule makes the guard stricter under a manipulated spot price: a downward push cannot lower the withdrawn WETH valuation below the entry price, and an upward push raises it (which can only block a withdrawal, not release funds). This is a griefing-resistant simplification, not a TWAP.

The hook passes `withdrawnUsd` to `previewEquityAfterWithdrawal(trader, withdrawnUsd)`. The engine uses the book's `lpNotionalUsdc` as the pre-withdrawal notional and `postedMarginUsdc` as the post-withdrawal equity. If `withdrawnUsd > lpNotionalUsdc`, the engine treats the remaining LP as `0` and requires the full short margin; the hook reverts unless the trader posts more margin. This is conservative.

### 4.11 Pseudocode for the two tricky paths

**`openBook`:**

```solidity
function openBook(uint128 lpNotional, uint128 shortNotional, uint128 posted, bytes32 strategyHash)
    external
    returns (SpanResult memory span)
{
    if (lpNotional < MIN_LP_NOTIONAL_USDC || lpNotional > MAX_LP_NOTIONAL_USDC) revert InvalidNotional();
    if (shortNotional > lpNotional) revert OverHedged();
    span = SpanMathLib.evaluateSpan16(lpNotional, shortNotional);
    if (posted < span.netInitialMarginUsdc) revert InsufficientPostedMargin(posted, span.netInitialMarginUsdc);

    (uint248 bal, uint8 count) = AQUA.rawBalances(msg.sender, address(this), strategyHash, USDC);
    if (count == 0) revert StrategyInactive();
    if (count == 0xff) revert StrategyDocked();
    if (uint256(bal) < posted) revert InsufficientAquaBalance(uint256(bal), posted);

    books[msg.sender] = PositionBook({
        lpNotionalUsdc: lpNotional,
        shortNotionalUsdc: shortNotional,
        postedMarginUsdc: posted,
        entrySpotPriceUsdc: markPriceUsdc,
        lastUpdateTimestamp: uint64(block.timestamp),
        aquaStrategyHash: strategyHash,
        isActive: true
    });
    emit BookOpened(msg.sender, strategyHash, lpNotional, shortNotional, posted, span.netInitialMarginUsdc);
}
```

**`unwind`:**

```solidity
function unwind(address trader, int256 priceShockBps)
    external
    nonReentrant
    returns (UnwindPreview memory prev, bytes32 orderHash)
{
    if (priceShockBps < MIN_SHOCK_BPS || priceShockBps > MAX_SHOCK_BPS) revert ShockOutOfRange(priceShockBps);
    if (priceShockBps > 0) revert UnsupportedShockDirection(priceShockBps);
    if (msg.sender != trader && !keepers[trader][msg.sender]) revert NotAuthorized(msg.sender);
    PositionBook storage b = books[trader];
    if (!b.isActive) revert BookNotActive(trader);

    prev = _preview(b, priceShockBps);          // pure math, same as quoteUnwind
    b.isActive = false;                         // effects before interactions
    b.postedMarginUsdc = uint128(prev.remainingEquityUsdc);

    if (prev.nettedOffsetUsdc > 0) {
        IShortHedgeAdapter(HEDGE_ADAPTER).realizeGainToAqua(
            trader, address(this), b.aquaStrategyHash, prev.nettedOffsetUsdc
        );
    }

    (uint248 bal, uint8 count) = AQUA.rawBalances(trader, address(this), b.aquaStrategyHash, USDC);
    if (count == 0 || count == 0xff) revert StrategyInactive();
    if (uint256(bal) < prev.nettedOffsetUsdc + prev.traderMarginUsedUsdc) {
        revert InsufficientAquaBalance(uint256(bal), prev.nettedOffsetUsdc + prev.traderMarginUsedUsdc);
    }

    uint256 amountOut = prev.nettedOffsetUsdc + prev.traderMarginUsedUsdc;
    AQUA.pull(trader, b.aquaStrategyHash, USDC, amountOut, address(this));

    uint256 feePaid = prev.badDebtUsdc == 0 ? prev.protocolFeeUsdc : 0;
    uint256 lossPaid = amountOut - feePaid;
    if (lossPaid > 0) {
        IShortHedgeAdapter(HEDGE_ADAPTER).receiveLpLoss(lossPaid);
    }
    if (feePaid > 0) {
        IERC20Minimal(USDC).transfer(FEE_COLLECTOR, feePaid);
    }
    if (prev.badDebtUsdc > 0) emit BadDebtRealized(trader, prev.badDebtUsdc);

    emit BookUnwound(trader, b.aquaStrategyHash, priceShockBps, prev);
    orderHash = keccak256(abi.encode(trader, b.aquaStrategyHash, priceShockBps, prev));
}
```

The demo adapter receives the LP leg's loss, so the closed demo economy balances. The app pulls `lp_loss + fee` from the trader's Aqua balance and pushes `short_gain` into it; the trader's remaining equity is `19,700e6` on UNWIND-01, the adapter's reserve changes by `lp_loss − short_gain`, and the fee collector receives the fee. The README states that the adapter is the demo counterparty for both legs; it is not a live venue. If `badDebt > 0`, the fee is not paid and the unpaid loss is recorded, not socialized.

---

## 5. Architecture & repo layout

### 5.1 System diagram

```text
                    ┌──────────────────────────────┐
                    │        Trader wallet          │
                    │  USDC (6d) + WETH (18d)       │
                    └───────┬───────────────┬──────┘
                            │ approve/ship  │ holds LP position
                            ▼               ▼
              ┌───────────────────────────────┐  ┌────────────────────────┐
              │  Aqua registry                │  │  Uniswap v4           │
              │  0x1111113ccf1426a8e30e2bff5e │  │  PoolManager          │
              │  005d929bf6a90a               │  │  0x498581ff718922c3f8 │
              │  (virtual balances)           │  │  e6a244956af099b2652b2│
              └───────┬───────────────────────┘  └───────┬────────────────┘
                      │ ship / push / pull               │ modifyLiquidity / swap
                      ▼                                  ▼
              ┌──────────────────────────────────────────┐
              │          ClearingAquaApp                 │
              │  books, keepers, mark price, fees        │
              │  quoteUnwind / unwind / addMargin        │
              └───┬──────────────────┬────────────────┬──┘
                  │ SpanMathLib      │ IShortHedgeAdapter│
                  ▼                  ▼                   ▼
        ┌──────────────────┐  ┌───────────────┐  ┌─────────────────┐
        │ 16-scenario grid │  │ demo reserve  │  │ PortfolioMargin │
        │ fixed-point math │  │ 100,000e6     │  │ Hook (0x240)    │
        └──────────────────┘  └───────────────┘  └─────────────────┘
                                                          │
                                                          ▼
                                              ┌───────────────────────┐
                                              │ Arkiv Rabdi 7794095   │
                                              │ 300s attestations     │
                                              └───────────────────────┘

Canonical addresses used in the diagram: Aqua registry `0x1111113ccf1426a8e30e2bff5e005d929bf6a90a`; Uniswap v4 `PoolManager` `0x498581ff718922c3f8e6a244956af099b2652b2b`.
```

### 5.2 Submission repo tree

```text
zeromargin/
├── README.md
├── LICENSE                              # MIT
├── FEEDBACK.md                          # Uniswap feedback
├── DECISIONS.md
├── PROGRESS.md
├── Makefile
├── remappings.txt
├── foundry.toml
├── package.json
├── package-lock.json
├── scripts/
│   └── lint_claims.py
├── .env.example
├── .gitignore
├── contracts/
│   ├── src/
│   │   ├── SpanMathLib.sol
│   │   ├── ClearingAquaApp.sol
│   │   ├── PortfolioMarginHook.sol
│   │   ├── ShortHedgeAdapter.sol
│   │   ├── interfaces/
│   │   │   ├── IAqua.sol
│   │   │   ├── IShortHedgeAdapter.sol
│   │   │   ├── IClearingMarginEngine.sol
│   │   │   └── IRiskAttestationStore.sol
│   │   └── swapvm/                      # optional BR6 only
│   │       ├── SpanNetUnwindOpcode.sol
│   │       └── ZeroMarginSwapVMRouter.sol
│   ├── test/
│   │   ├── SpanMath.t.sol
│   │   ├── ClearingAquaApp.t.sol
│   │   ├── PortfolioMarginHook.t.sol
│   │   ├── PortfolioMarginHookFork.t.sol
│   │   ├── AquaFork.t.sol
│   │   ├── Invariants.t.sol
│   │   ├── Attack.t.sol
│   │   └── SpanNetUnwindOpcode.t.sol   # optional BR6
│   └── script/
│       ├── Deploy.s.sol
│       ├── DeployFork.s.sol
│       ├── DeploySepolia.s.sol
│       └── SeedDemo.s.sol
├── web/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                 # split-screen terminal
│   │   │   ├── arkiv/page.tsx           # attestation inspector
│   │   │   ├── replay/page.tsx          # crash and basis replay
│   │   │   ├── proof/page.tsx           # sponsor proof and limitations
│   │   │   └── api/
│   │   │       ├── quote/route.ts
│   │   │       ├── unwind/route.ts
│   │   │       ├── arkiv/query/route.ts
│   │   │       └── health/route.ts
│   │   ├── lib/
│   │   │   ├── spanMath.ts
│   │   │   ├── arkiv.ts
│   │   │   ├── contracts.ts
│   │   │   └── format.ts
│   │   ├── test/
│   │   │   └── spanParity.test.ts
│   │   ├── scripts/
│   │   │   ├── replay.ts
│   │   │   └── arkivVerify.ts
│   │   └── data/
│   │       └── arkiv-cache.json
│   └── package.json
├── data/
│   ├── golden_vectors.json
│   ├── basis_30d.json
│   └── README.md                         # source, license, retrieval date, SHA-256
├── arkiv/
│   ├── schema.md
│   ├── friction.md
│   ├── reach.md
│   ├── why-arkiv.md
│   └── how-you-use-arkiv.md
├── docs/
│   ├── SPEC.md                           # planning artifact, AI-attributed
│   ├── BUILD_PLAN.md                     # planning artifact, AI-attributed
│   ├── ARCHITECTURE.md
│   ├── LIMITATIONS.md
│   ├── DEMO.md
│   ├── PRIOR_ART.md
│   ├── SECURITY_REVIEW.md
│   ├── DEPENDENCIES.md
│   ├── STORAGE.md
│   ├── REPRO.md
│   ├── README_CHECKLIST.md
│   ├── SUBMISSION.md
│   ├── UNISWAP_FORM.md
│   └── screenshots/
│       ├── split.png
│       ├── guard.png
│       ├── crash.png
│       └── arkiv.png
├── .gas-snapshot
└── .github/workflows/ci.yml             # optional; local `make ci` is required
```

**Paths used elsewhere in this file.** `web/src/lib/arkiv.ts` is the Arkiv adapter (Section 6.5). `web/src/scripts/replay.ts` backs `npm run replay`. `web/src/scripts/arkivVerify.ts` backs `npm run arkiv:verify`. `docs/SPEC.md` and `docs/BUILD_PLAN.md` are copies of this file and the build plan, committed as planning artifacts with an AI note, as ETHGlobal's rules require.

### 5.3 Component interfaces

```solidity
interface IAqua {
    function ship(address maker, address app, bytes32 strategy, address[] memory tokens, uint256[] memory amounts) external;
    function dock(address app, bytes32 strategy, address[] memory tokens) external;
    function push(address maker, address app, bytes32 strategy, address token, uint256 amount) external;
    function pull(address maker, bytes32 strategy, address token, uint256 amount, address recipient) external;
    function rawBalances(address maker, address app, bytes32 strategy, address token)
        external view returns (uint248 balance, uint8 tokensCount);
    function safeBalances(address maker, address app, bytes32 strategy, address token)
        external view returns (uint256 balance, bool isActive, bool isDocked);
}

interface IClearingMarginEngine {
    function previewEquityAfterWithdrawal(address trader, uint256 withdrawnLpNotionalUsdc)
        external view returns (uint256 postWithdrawalEquityUsdc, uint256 requiredInitialMarginUsdc, bool isActive);
    function bookEntryPrice(address trader) external view returns (uint64 entrySpotPriceUsdc);
    function updateMarkPrice(bytes32 poolId, uint64 newSpotPriceUsdc) external; // only the hook
}

interface IShortHedgeAdapter {
    function previewShortGainUsdc(uint256 shortNotionalUsdc, int256 priceShockBps) external pure returns (uint256);
    function realizeGainToAqua(address maker, address app, bytes32 strategyHash, uint256 gainUsdc)
        external returns (uint256);
    function receiveLpLoss(uint256 lossUsdc) external;
}

interface IPoolManagerMinimal {
    function modifyLiquidity(PoolKey memory key, ModifyLiquidityParams memory params, bytes memory hookData)
        external returns (BalanceDelta delta);
    function swap(PoolKey memory key, SwapParams memory params, bytes memory hookData)
        external returns (BalanceDelta delta);
}
```

The `IAqua` signatures are the working assumption from the reference implementation. **Verify against `cast interface 0x1111113ccf1426a8e30e2bff5e005d929bf6a90a --chain 8453` before the first compile** (Section C.6, item 1). If a signature differs, change only `contracts/src/interfaces/IAqua.sol`.

### 5.4 Data flow

1. Trader approves the Aqua registry, then `ship`s `25,000e6` USDC to the app under a strategy hash.
2. Trader calls `openBook(100,000e6, 95,000e6, 25,000e6, strategyHash)`. The app checks the Aqua virtual balance, runs `evaluateSpan16`, and stores the book with `entrySpotPriceUsdc = markPriceUsdc`.
3. A swap in the guarded pool triggers `afterSwap`; the hook reads `StateLibrary.getSlot0` and calls `updateMarkPrice`.
4. The trader calls `PoolManager.modifyLiquidity` to remove LP. `beforeRemoveLiquidity` computes `withdrawnUsd` and calls `previewEquityAfterWithdrawal`. If the post-withdrawal equity is below the required IM, the hook reverts `SpanMarginBreach` and the pool state is unchanged.
5. The web app calls `POST /api/quote` → `quoteUnwind` for the preview, then `POST /api/unwind` → the signed `unwind` from the demo burner.
6. `unwind` computes the preview, marks the book inactive, calls `IShortHedgeAdapter.realizeGainToAqua` (which calls `AQUA.push`), verifies the balance, calls `AQUA.pull` for the LP deficit plus fee, forwards the LP loss to the adapter, and emits `BookUnwound`.
7. `arkivAdapter.ts` writes a `zeromargin.span_attestations` entity with a `300`-second TTL; `/arkiv` reads it; the keeper query orders by `marginRatioBps`.

### 5.5 Deployment topology

| Component | Local unit | Base fork | Base Sepolia | Base mainnet (optional) |
| :--- | :--- | :--- | :--- | :--- |
| `SpanMathLib` | library, linked | same | same | same |
| `ClearingAquaApp` | local deploy | Base fork deploy | Base Sepolia deploy with a local Aqua | Base Mainnet deploy with canonical Aqua |
| `PortfolioMarginHook` | local `MockPoolManager` | Base fork `PoolManager` + mined hook | Base Sepolia `PoolManager` + mined hook | Base Mainnet `PoolManager` + mined hook |
| `ShortHedgeAdapter` | local reserve | local reserve | local reserve | local reserve for the demo |
| Aqua registry | local `Aqua` or `MockAqua` | canonical `0x1111113ccf1426a8e30e2bff5e005d929bf6a90a` | self-deployed `Aqua` on Base Sepolia (canonical not deployed) | canonical `0x1111113ccf1426a8e30e2bff5e005d929bf6a90a` |
| Uniswap `PoolManager` | `MockPoolManager` | canonical `0x498581ff718922c3f8e6a244956af099b2652b2b` | canonical `0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408` | canonical `0x498581ff718922c3f8e6a244956af099b2652b2b` |
| Arkiv | cached | live Rabdi | live Rabdi | live Rabdi |

**Primary demo:** Anvil fork of Base Mainnet. It is the only environment where both canonical Aqua and canonical Uniswap v4 are available at the same time. **Fallback:** local `Aqua` + `MockPoolManager` with a visible `local` badge; this is not eligible for the 1inch or Uniswap tracks, so it is only a demo-continuity fallback.

---

## 6. Component specifications

Every contract is written from scratch after kickoff. The reference implementation is read-only evidence for expected numbers. Gas budgets are upper bounds; `forge snapshot` records actual values and the build fails if a budget is exceeded. All amounts are USDC base units (`1e6 = $1.00`) unless a field name says otherwise.

### 6.1 `SpanMathLib.sol`

| Item | Specification |
| :--- | :--- |
| Type | `library SpanMathLib`; all functions `internal pure`; no storage, no events, no external calls. |
| Constants | `BPS = 10_000`; `GAMMA_LP_BPS = 5_000`; `BASIS_HAIRCUT_BPS = 500`; `MAINT_MARGIN_RATIO_BPS = 7_500`; `ISOLATED_SHORT_IM_BPS = 5_000`; `ISOLATED_LIQ_PENALTY_BPS = 1_000`; `NETTED_UNWIND_FEE_BPS = 5`. |
| Structs | `PositionBook`, `SpanResult`, `UnwindPreview` exactly as Section 4.1. |
| Storage | None. |
| Events | None. |
| Errors | None. Input validation belongs to `ClearingAquaApp`; the library assumes `lpNotional > 0` and `shortNotional <= lpNotional` for the open path, and accepts `shortNotional > lpNotional` only for the post-withdrawal preview. |
| Access control | Internal; inlined into the app. No external surface. |
| Invariants | I2 (settlement conservation), I3 (zero bad debt inside the tested envelope), I4 (quote equals execution), I5 (conservative rounding). |
| Acceptance | `forge test --match-contract SpanMathTest -vv` passes 4/4 golden vectors and 256 fuzz runs; `forge snapshot` shows `evaluateSpan16 <= 30,000` gas. |

**Functions.**

| Function | Signature | Exact behavior |
| :--- | :--- | :--- |
| `evaluateSpan16` | `function evaluateSpan16(uint256 lpNotionalUsdc, uint256 shortNotionalUsdc) internal pure returns (SpanResult memory)` | Loops `k = 0..7` over `[-3000,-2000,-1000,-500,0,500,1000,2000]` bps and `m = 0..1` over `[0,150]` bps. Computes `NetPnL` exactly as Section 4.3. Tracks the most negative PnL and its index. Returns isolated IM, worst loss, basis haircut, net IM, net MM, the 16 PnLs, and the worst index. |
| `previewShockUnwind` | `function previewShockUnwind(uint256 lpNotionalUsdc, uint256 shortNotionalUsdc, uint256 postedMarginUsdc, int256 priceShockBps, uint256 volShockBps) internal pure returns (UnwindPreview memory)` | Uses the cross-leg waterfall in Section 4.3 item 6. Rounds the fee up and profit credits down. Supports both shock directions for the guard; the app restricts execution to `priceShockBps <= 0`. |
| `previewWithdrawal` | `function previewWithdrawal(uint256 lpNotionalUsdc, uint256 shortNotionalUsdc, uint256 postedMarginUsdc, uint256 withdrawnUsd) internal pure returns (uint256 postEquityUsdc, uint256 requiredInitialMarginUsdc, uint256 remainingLpUsdc)` | `remainingLp = lpNotionalUsdc > withdrawnUsd ? lpNotionalUsdc - withdrawnUsd : 0`; `postEquity = postedMarginUsdc`; `required = evaluateSpan16(remainingLp, shortNotionalUsdc).netInitialMarginUsdc`. It does not mark the book to market; this is conservative and is the exact function used by the hook guard. |
| `capitalSavingsBps` | `function capitalSavingsBps(uint256 isolatedIm, uint256 netIm) internal pure returns (uint256)` | Returns `0` if `isolatedIm == 0`; otherwise `(isolatedIm - netIm) * BPS / isolatedIm`, truncated. |
| `ceilDiv` | `function ceilDiv(uint256 a, uint256 b) internal pure returns (uint256)` | `a == 0 ? 0 : (a + b - 1) / b`; `b > 0`. |
| `signedFloorDiv` | `function signedFloorDiv(int256 a, int256 b) internal pure returns (int256)` | `b > 0`; if `a >= 0` return `a / b`; otherwise `-((-a + b - 1) / b)`. |

**Rounding rules.** Margin requirements (`basisHaircutUsdc`, `netInitialMarginUsdc`, `netMaintenanceMarginUsdc`), the protocol fee, and the isolated IM round up. Unrealized profit credits, the short gain, and `capitalSavingsBps` round down. `signedFloorDiv` is used for every signed PnL division so a loss is never understated by truncation toward zero.

**Gas budgets.** `evaluateSpan16 <= 30,000`; `previewShockUnwind <= 8,000`; `previewWithdrawal <= 40,000`; `capitalSavingsBps <= 1,000`. Reference measurements from the read-only implementation: `22,769` and `4,116`. The rebuilt values may differ; only the budget is binding.

**Tests.** `test_GV01`, `test_GV02`, `test_GV03`, `test_GV04Preview`, `testFuzz_ZeroBadDebtWithinEnvelope` (256 runs, `N_S/N_LP` in `[80%,100%]`, `posted >= IM_net`, `δ` in `[-3000,0]`), `test_RoundingDirection`, `test_CapitalSavingsBps`, `test_NoFloatingPoint` (grep for `float`, `double`, and decimal literals in the math path), `test_GasBudget`.

### 6.2 `ClearingAquaApp.sol`

| Item | Specification |
| :--- | :--- |
| Type | `contract ClearingAquaApp is IClearingMarginEngine, Ownable, ReentrancyGuard`; a custom 1inch AquaApp; no proxy; no token custody. |
| Immutables | `IAqua AQUA`, `address USDC`, `address HEDGE_ADAPTER`, `address FEE_COLLECTOR`, `IPoolManager POOL_MANAGER`, `bytes32 POOL_ID`, `uint64 INITIAL_MARK_PRICE_USDC`. |
| Mutable state | `address public hook`; `uint64 public markPriceUsdc`; `mapping(address => PositionBook) public books`; `mapping(address => mapping(address => bool)) public keepers`; `uint256 public totalBadDebtUsdc`; `uint256 public totalFeesUsdc`; `uint256 public totalLpLossSettledUsdc`; `address public owner`; `uint256 private _status`. |
| Constants | `MIN_LP_NOTIONAL_USDC = 1_000e6`; `MAX_LP_NOTIONAL_USDC = 10_000_000e6`; `MAX_HEDGE_RATIO_BPS = 10_000`; `MIN_SHOCK_BPS = -3_000`; `MAX_SHOCK_BPS = 2_000`; `MIN_MARK_PRICE_USDC = 1e6`; `MAX_MARK_PRICE_USDC = 1_000_000e6`. |
| Storage | One `PositionBook` per trader; no arrays; no enumerable set. `books` is the only mapping that grows. |
| Events | `BookOpened`, `BookUnwound`, `MarginAdded`, `BookClosed`, `BadDebtRealized`, `MarkPriceUpdated`, `HookSet`, `KeeperSet`, `FeeCollected`, `LpLossSettled`, `OwnershipRenounced`. |
| Errors | `BookAlreadyActive`, `InvalidNotional`, `OverHedged`, `InsufficientPostedMargin`, `StrategyInactive`, `StrategyDocked`, `InsufficientAquaBalance`, `BookNotActive`, `ShockOutOfRange`, `UnsupportedShockDirection`, `NotAuthorized`, `NotHook`, `HookAlreadySet`, `ZeroAddress`, `PriceOutOfBounds`, `BookStillActive`, `NoActiveBook`, `TransferFailed`. |
| Access control | See the matrix below. No admin can move user tokens. The owner can set the hook once and then renounces ownership. |
| Invariants | I1–I17, defined once in Section 4.5. |
| Acceptance | `forge test --match-contract ClearingAquaAppTest -vv` and `forge test --match-contract AquaForkTest -vv` pass; `forge inspect ClearingAquaApp storage-layout` is recorded in `docs/STORAGE.md`. |

**Functions.**

| Function | Signature | Behavior |
| :--- | :--- | :--- |
| `constructor` | `constructor(IAqua aqua, address usdc, address hedgeAdapter, address feeCollector, IPoolManager poolManager, bytes32 poolId, uint64 initialMarkPriceUsdc)` | Rejects zero addresses; requires `initialMarkPriceUsdc` in bounds; sets `owner = msg.sender`; sets `markPriceUsdc`. |
| `setHook` | `function setHook(address hook_) external onlyOwner` | One-time: requires `hook == address(0)` and `hook_ != address(0)`; sets `hook`; emits `HookSet`; the deploy script calls `renounceOwnership()` in the same transaction batch. Reverts `HookAlreadySet` on a second call. |
| `renounceOwnership` | `function renounceOwnership() external onlyOwner` | Sets `owner = address(0)`; emits `OwnershipRenounced`. After this, no admin function exists. |
| `openBook` | `function openBook(uint128 lpNotionalUsdc, uint128 shortNotionalUsdc, uint128 postedMarginUsdc, bytes32 aquaStrategyHash) external returns (SpanResult memory span)` | Reverts if the caller already has an active book; validates `lpNotional` bounds and `shortNotional <= lpNotional * MAX_HEDGE_RATIO_BPS / BPS`; computes `span`; requires `posted >= span.netInitialMarginUsdc`; reads `rawBalances(msg.sender, address(this), hash, USDC)` and requires `count != 0`, `count != 0xff`, and `balance >= posted`; stores the book with `entrySpotPriceUsdc = markPriceUsdc`; emits `BookOpened`. |
| `quoteOpen` | `function quoteOpen(uint128 lpNotionalUsdc, uint128 shortNotionalUsdc, uint128 postedMarginUsdc) external view returns (SpanResult memory span, bool acceptable, uint256 requiredMarginUsdc)` | Pure view for the UI. `acceptable = posted >= required && short <= lp`. No state change. |
| `quoteUnwind` | `function quoteUnwind(address trader, int256 priceShockBps) external view returns (UnwindPreview memory)` | Requires an active book and `priceShockBps` in `[-3000, +2000]`; returns the exact `previewShockUnwind` result. |
| `unwind` | `function unwind(address trader, int256 priceShockBps) external nonReentrant returns (UnwindPreview memory prev, bytes32 orderHash)` | Requires `msg.sender == trader || keepers[trader][msg.sender]`; requires `-3000 <= priceShockBps <= 0`; computes the preview; marks the book inactive before external calls; calls the adapter's `realizeGainToAqua` for the netted gain; verifies the Aqua balance; pulls `netted + marginUsed`; forwards the LP loss to the adapter; pays the fee only if `badDebt == 0`; emits `BookUnwound`; returns the preview and `keccak256(abi.encode(trader, hash, shock, prev))`. |
| `addMargin` | `function addMargin(uint256 amountUsdc) external` | Requires an active book and `amountUsdc > 0`; reads `rawBalances` and requires `balance >= posted + amountUsdc`; increases `postedMarginUsdc`; emits `MarginAdded`. The trader must call `AQUA.push` first; the app never pulls margin on its own. |
| `setKeeper` | `function setKeeper(address keeper, bool allowed) external` | Only the book owner; rejects `address(0)`; sets `keepers[msg.sender][keeper]`; emits `KeeperSet`. A keeper can only call `unwind`; it cannot withdraw, add margin, or change the book. |
| `previewEquityAfterWithdrawal` | `function previewEquityAfterWithdrawal(address trader, uint256 withdrawnUsd) external view returns (uint256 postEquityUsdc, uint256 requiredInitialMarginUsdc, bool isActive)` | Calls `SpanMathLib.previewWithdrawal`. Returns `(0,0,false)` if the book is inactive. |
| `bookEntryPrice` | `function bookEntryPrice(address trader) external view returns (uint64)` | Returns `books[trader].entrySpotPriceUsdc`; used by the hook's conservative valuation. |
| `updateMarkPrice` | `function updateMarkPrice(bytes32 poolId, uint64 newSpotPriceUsdc) external` | Only `hook`; requires `poolId == POOL_ID`; requires `newSpotPriceUsdc` in `[1e6, 1_000_000e6]`; sets `markPriceUsdc`; emits `MarkPriceUpdated`. |
| `closeBook` | `function closeBook() external nonReentrant` | Only the book owner; requires `!books[msg.sender].isActive`; calls `AQUA.dock(address(this), hash, tokens)`; requires the strategy is docked (`tokensCount == 0xff`); clears the book; emits `BookClosed`. The trader's tokens are already in their wallet; Aqua holds none. |

**Access-control matrix.**

| Caller | `openBook` | `unwind` | `addMargin` | `setKeeper` | `closeBook` | `updateMarkPrice` | `setHook` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Any EOA | Yes, one active book | No | No | No | No | No | No |
| Book owner | Yes | Yes | Yes | Yes | Yes, when inactive | No | No |
| Authorized keeper | No | Yes | No | No | No | No | No |
| Hook | No | No | No | No | No | Yes | No |
| Owner | No | No | No | No | No | No | Once, before renounce |
| PoolManager | No | No | No | No | No | No | No |

**Events.**

| Event | Parameters | When |
| :--- | :--- | :--- |
| `BookOpened` | `address indexed trader, bytes32 indexed aquaStrategyHash, uint128 lpNotionalUsdc, uint128 shortNotionalUsdc, uint128 postedMarginUsdc, uint256 netInitialMarginUsdc` | After a successful `openBook`. |
| `BookUnwound` | `address indexed trader, bytes32 indexed aquaStrategyHash, int256 priceShockBps, uint256 lpLossUsdc, uint256 shortGainUsdc, uint256 nettedOffsetUsdc, uint256 protocolFeeUsdc, uint256 traderMarginUsedUsdc, uint256 remainingEquityUsdc, uint256 badDebtUsdc` | After a successful `unwind`. |
| `MarginAdded` | `address indexed trader, uint256 amountUsdc, uint256 newPostedMarginUsdc` | After `addMargin`. |
| `KeeperSet` | `address indexed trader, address indexed keeper, bool allowed` | After `setKeeper`. |
| `BookClosed` | `address indexed trader, bytes32 indexed aquaStrategyHash` | After `closeBook`. |
| `BadDebtRealized` | `address indexed trader, uint256 amountUsdc` | When `unwind` realizes a shortfall. |
| `MarkPriceUpdated` | `bytes32 indexed poolId, uint64 newSpotPriceUsdc, address indexed hook` | After a hook-driven mark update. |
| `FeeCollected` | `address indexed trader, uint256 amountUsdc` | When the protocol fee is paid. |
| `LpLossSettled` | `address indexed trader, uint256 amountUsdc` | When the LP loss is forwarded to the adapter. |
| `HookSet` | `address indexed hook` | After the one-time hook set. |
| `OwnershipRenounced` | `address indexed previousOwner` | After `renounceOwnership`. |

**Gas budgets.** `openBook <= 180,000`; `unwind <= 220,000`; `quoteUnwind <= 20,000`; `previewEquityAfterWithdrawal <= 40,000`; `addMargin <= 70,000`; `closeBook <= 90,000`; `updateMarkPrice <= 30,000`. Reference measurements from the read-only implementation: `openNettedBook 148,624`, `unwindNettedBook 151,234`, `quote 7,835`. The rebuilt app has extra authorization and loss-routing logic; the budgets allow for that.

**Acceptance.** `forge test --match-contract ClearingAquaAppTest -vv` passes all unit tests; `forge test --match-contract AquaForkTest -vv` passes against the Base fork; `forge inspect ClearingAquaApp storage-layout` is recorded; `forge build --sizes` shows the app below `24,576` bytes.

### 6.3 `PortfolioMarginHook.sol`

| Item | Specification |
| :--- | :--- |
| Type | `contract PortfolioMarginHook is BaseHook`; real Uniswap v4 hook; immutable; no proxy. |
| Immutables | `IPoolManager poolManager` (from `BaseHook`), `IClearingMarginEngine engine`, `PoolId poolId`, `PoolKey poolKey`. |
| Storage | None beyond immutables. The hook is stateless. |
| Permissions | `beforeRemoveLiquidity = true`; `afterSwap = true`; every other permission `false`. |
| Hook address | Low 14 bits must equal `0x240` (`BEFORE_REMOVE_LIQUIDITY_FLAG = 1 << 9`, `AFTER_SWAP_FLAG = 1 << 6`). Mined with `HookMiner.find(CREATE2_DEPLOYER, 0x240, creationCode, constructorArgs)`. |
| Events | None. The engine emits `MarkPriceUpdated`; the breach is a custom error. |
| Errors | `SpanMarginBreach(address trader, uint256 postWithdrawalEquityUsdc, uint256 requiredInitialMarginUsdc)`, `InvalidHookData`, `NotPoolManager`, `WrongPool`, `InvalidLiquidityDelta`, `PriceOutOfBounds`. |
| Access control | `onlyPoolManager` on both hooks. The hook never transfers tokens and never calls an arbitrary address. |
| Gas budgets | `beforeRemoveLiquidity <= 100,000`; `afterSwap <= 50,000`. |
| Invariants | I1 (withdrawal guard), I8 (only PoolManager), I12 (mark price source), I17 (hook is stateless). |
| Acceptance | `forge test --match-contract PortfolioMarginHookTest -vv` and `forge test --match-contract PortfolioMarginHookForkTest -vv` pass; `test_HookAddressFlags` asserts `uint160(address(hook)) & 0x3FFF == 0x240`; `test_OnlyPoolManager` asserts both hooks revert for a random caller. |

**`getHookPermissions()`.** Return the v4-periphery `Hooks.Permissions` struct with only `beforeRemoveLiquidity` and `afterSwap` set to `true`. Pin the exact `v4-periphery` tag in `foundry.toml`; do not copy the struct from a different version. If the pinned version uses a different struct name or field order, adapt the override and record it in `DECISIONS.md`.

**`beforeRemoveLiquidity`.**

```solidity
function beforeRemoveLiquidity(
    address sender,
    PoolKey calldata key,
    ModifyLiquidityParams calldata params,
    bytes calldata hookData
) external override onlyPoolManager returns (bytes4) {
    if (PoolId.unwrap(key.toId()) != PoolId.unwrap(poolId)) revert WrongPool();
    if (params.liquidityDelta >= 0 || params.liquidityDelta == type(int256).min) revert InvalidLiquidityDelta();

    address trader = sender; // never trust hookData as the trader
    if (hookData.length > 0) {
        address encoded;
        assembly { encoded := shr(96, calldataload(hookData.offset)) }
        if (hookData.length != 20 || encoded != sender) revert InvalidHookData();
    }

    uint256 withdrawnUsd = _withdrawnUsd(trader, key, params);
    (uint256 postEquity, uint256 requiredIM, bool active) =
        engine.previewEquityAfterWithdrawal(trader, withdrawnUsd);
    if (active && postEquity < requiredIM) {
        revert SpanMarginBreach(trader, postEquity, requiredIM);
    }
    return this.beforeRemoveLiquidity.selector;
}
```

**`afterSwap`.**

```solidity
function afterSwap(
    address,
    PoolKey calldata key,
    SwapParams calldata,
    BalanceDelta,
    bytes calldata
) external override onlyPoolManager returns (bytes4, int128) {
    if (PoolId.unwrap(key.toId()) == PoolId.unwrap(poolId)) {
        (uint160 sqrtP,,,) = StateLibrary.getSlot0(poolManager, poolId);
        uint64 price = _priceFromSqrtP(sqrtP, key);
        if (price < 1e6 || price > 1_000_000e6) revert PriceOutOfBounds();
        engine.updateMarkPrice(PoolId.unwrap(poolId), price);
    }
    return (this.afterSwap.selector, 0);
}
```

**`_withdrawnUsd`.** Compute the removed token amounts with `LiquidityAmounts.getAmount0ForLiquidity` and `getAmount1ForLiquidity` using `TickMath.getSqrtPriceAtTick(tickLower)` and `getSqrtPriceAtTick(tickUpper)`. Convert the WETH leg at `max(spotUsdc, engine.bookEntryPrice(trader))` using the formula in Section 4.10. If the pool's token0 is WETH, `withdrawnUsd = amount0 * price / 1e18 + amount1`; if token0 is USDC, `withdrawnUsd = amount0 + amount1 * price / 1e18`. Revert `PriceOutOfBounds` if the computed price is outside `[1e6, 1_000_000e6]`. The hook reads `sqrtP` from `StateLibrary`, never from `hookData`.

**Router limitation.** `beforeRemoveLiquidity` receives the caller of `PoolManager.modifyLiquidity` as `sender`. A trader who withdraws through a router appears as the router, has no active book, and is not guarded. The product requires the book owner to hold the position and withdraw directly. The README and the video state this limitation. A production version would use a position NFT or a pool-level caller allowlist.

**Hook mining.** Deploy the hook with `CREATE2` from the pinned `CREATE2_DEPLOYER`; find the salt with `HookMiner`. The test asserts the low bits, the `PoolManager` address, and the `engine` address. Do not deploy at an address mined for different flags; the PoolManager will not call the hook.

**Acceptance.** Unit tests with `MockPoolManager` cover: safe withdrawal passes; GV-04 unsafe withdrawal reverts with `SpanMarginBreach(trader, 12,000e6, 16,500e6)`; only the PoolManager can call; empty `hookData` uses `sender`; a 20-byte `hookData` that encodes a different trader reverts; both token orderings value the withdrawal correctly; a `+2,000` bps price still values the WETH leg at the higher of spot and entry. Fork tests use the canonical Base `PoolManager`, a freshly initialized WETH/USDC pool with the hook, and a real `modifyLiquidity` call.

### 6.4 `ShortHedgeAdapter.sol`

| Item | Specification |
| :--- | :--- |
| Type | `contract ShortHedgeAdapter is IShortHedgeAdapter`; demo counterparty for both legs; no proxy. |
| Immutables | `IAqua AQUA`, `address USDC`, `address APP`, `address OWNER`. |
| Mutable state | `uint256 public reserveUsdc`; `uint256 public totalGainRealizedUsdc`; `uint256 public totalLpLossReceivedUsdc`. |
| Events | `ShortGainRealizedToAqua(address indexed maker, address indexed app, bytes32 indexed strategyHash, uint256 amountUsdc)`, `LpLossReceived(address indexed app, uint256 amountUsdc)`, `ReserveFunded(address indexed funder, uint256 amountUsdc)`, `ReserveWithdrawn(address indexed owner, address indexed to, uint256 amountUsdc)`. |
| Errors | `NotApp`, `NotOwner`, `InsufficientReserve`, `ZeroAmount`, `ZeroAddress`, `TransferFailed`. |
| Access control | `realizeGainToAqua` and `receiveLpLoss` only `APP`; `fundReserve` and `withdrawReserve` only `OWNER`. |
| Gas budgets | `realizeGainToAqua <= 90,000`; `receiveLpLoss <= 40,000`; `previewShortGainUsdc <= 5,000`. |
| Invariants | `reserveUsdc == initialReserve + totalLpLossReceivedUsdc - totalGainRealizedUsdc` while no owner withdrawal has occurred; the adapter never pushes more than its reserve; the adapter approves Aqua exactly for the pushed amount. |
| Acceptance | `forge test --match-contract ShortHedgeAdapterTest -vv` passes; the fork test asserts the canonical Aqua `Pushed` event and the trader's wallet balance increase by exactly the gain. |

**Functions.**

| Function | Signature | Behavior |
| :--- | :--- | :--- |
| `previewShortGainUsdc` | `function previewShortGainUsdc(uint256 shortNotionalUsdc, int256 priceShockBps) external pure returns (uint256)` | Returns `0` for `priceShockBps >= 0`; otherwise `shortNotionalUsdc * uint256(-priceShockBps) / 10_000`, truncated. For GV-01 at `-3,000`, returns `28,500e6`. |
| `realizeGainToAqua` | `function realizeGainToAqua(address maker, address app, bytes32 strategyHash, uint256 gainUsdc) external onlyApp returns (uint256)` | Requires `app == APP`, `gainUsdc > 0`, and `gainUsdc <= reserveUsdc`; decrements the reserve; approves Aqua for `gainUsdc`; calls `AQUA.push(maker, app, strategyHash, USDC, gainUsdc)`; increments `totalGainRealizedUsdc`; emits `ShortGainRealizedToAqua`; returns `gainUsdc`. |
| `receiveLpLoss` | `function receiveLpLoss(uint256 lossUsdc) external onlyApp` | Requires `lossUsdc > 0`; increments the reserve and `totalLpLossReceivedUsdc`; emits `LpLossReceived`. This closes the demo economy: the adapter pays the short gain and receives the LP loss. |
| `fundReserve` | `function fundReserve(uint256 amountUsdc) external onlyOwner` | `transferFrom(msg.sender, address(this), amountUsdc)`; increments the reserve; emits `ReserveFunded`. The deploy script calls this with `DEMO_HEDGE_RESERVE_USDC = 100_000e6`. |
| `withdrawReserve` | `function withdrawReserve(uint256 amountUsdc, address to) external onlyOwner` | Requires `to != address(0)` and `amountUsdc <= reserveUsdc`; decrements the reserve; transfers to `to`; emits `ReserveWithdrawn`. The demo script does not call it before judging. |

**Why the adapter receives the LP loss.** The demo treats the LP leg's loss as a debit from the margin account and routes it to the adapter, so the closed demo economy balances: trader `-5,300e6`, adapter `+5,250e6`, fee collector `+50e6`. The adapter is explicitly the demo counterparty for both legs; it is not a live perp venue, and the README says so. A production adapter would route the LP loss to the LP settlement module and the short gain from the venue.

### 6.5 Arkiv adapter (`web/src/lib/arkiv.ts`)

| Item | Specification |
| :--- | :--- |
| Interface | `RiskAttestationStore` from Section 5.3. |
| Schema | `zeromargin.span_attestations` exactly as Section 4.9. That exact schema string appears in `arkiv/schema.md`, `README.md`, and the runnable query. |
| Fields | `portfolioId: str`, `trader: addr`, `status: str`, `marginRatioBps: i32`, `lpNotionalUsdc: dec`, `shortNotionalUsdc: dec`, `postedMarginUsdc: dec`, `netInitialMarginUsdc: dec`, `netMaintenanceMarginUsdc: dec`, `equityUsdc: dec`, `aquaStrategyHash: str`, `updatedAt: u64`. Index `portfolioId`, `trader`, `status`, `marginRatioBps`, `updatedAt`. |
| TTL | `ExpirationTime.fromMinutes(5)` = `300` seconds = `150` Rabdi blocks at `2` seconds per block. The writer's clock is checked against `arkiv_getBlockTiming`; if the drift exceeds `30` seconds, the TTL is reduced to `240` seconds so the entity still expires within the intended window. |
| Write path | `walletClient.createEntity(SpanAttestations, record, { expiration: ExpirationTime.fromMinutes(5) })`; retries `3` times with `2,000` ms backoff; a failed write surfaces `source: "error"` and the UI shows the error text. |
| Read path | The SDK query chains `.from(SpanAttestations).ownedBy(writerAddress).where(and(eq("status","UNWIND_ELIGIBLE"), lt("marginRatioBps", 10_000))).fetch()`; it sorts by `marginRatioBps` ascending; the raw JSON-RPC fallback uses `arkiv_query`. |
| Live mode | `ARKIV_MODE=live`; requires `ARKIV_ACCESS_KEY` and a funded writer; the UI badge is `LIVE-RABDI`. |
| Cache mode | `ARKIV_MODE=cache`; reads `web/src/data/arkiv-cache.json`; the UI badge is `CACHE`; every record carries `source: "cache"`; the demo voiceover says the live write is unavailable if the badge is `CACHE`. |
| Acceptance | `npm run arkiv:verify` prints the entity key, writer address, `expiresAt`, `expiresAt - now <= 300`, and one query result. The run fails if the entity is missing, expired, or not returned by the query. `npm run arkiv:verify:cache` passes offline with the `CACHE` badge. |

### 6.6 Web terminal

| Item | Specification |
| :--- | :--- |
| Stack | Next.js `15` App Router, React `19`, TypeScript `5.6+`, Tailwind CSS, `viem` `2.21.45`. No component library that hides the numbers. |
| Pages | `/` split-screen terminal; `/arkiv` attestation inspector; `/replay` crash and basis replay; `/proof` sponsor proof and limitations. |
| API routes | `POST /api/quote` -> `quoteUnwind`; `POST /api/unwind` -> signed `unwind` from the demo burner; `GET /api/arkiv/query` -> live or cached attestations; `GET /api/health` -> chain id, block number, mode badge. |
| UI states | `LIVE-FORK`, `LOCAL`, `CACHE`, `ERROR`; each badge has a tooltip that states exactly what is live and what is simulated. |
| Split screen | Left: isolated LP account with `$25,000` margin, liquidation at `-30%`, `10%` penalty. Right: ZeroMargin book with `$25,000` margin, `$95,000` short, `$100,000` LP, net IM `$10,000`. Both panels use the same shock slider and the same timestamp. |
| Numbers | Every number comes from the API or the contract; no hardcoded result strings. The golden vector values are displayed only in the `/proof` page and are labeled "golden vector". |
| Accessibility | Keyboard reachable controls; visible focus ring; contrast ratio at least `4.5:1` for body text; `prefers-reduced-motion` disables the crash animation. |
| Performance | Local quote response under `500` ms; unwind transaction confirmation under `5` s on Anvil; first contentful paint under `2` s on the venue laptop. |
| Acceptance | `npm run build` exits `0`; `npm run test:e2e` runs the scripted demo against the fork and asserts the four key numbers; `npm run screenshots` produces `docs/screenshots/split.png`, `guard.png`, `crash.png`, `arkiv.png`. |

### 6.7 Repository and build files

| File | Required content | Acceptance |
| :--- | :--- | :--- |
| `foundry.toml` | `solc = "0.8.26"`, `evm_version = "cancun"`, `optimizer = true`, `optimizer_runs = 200`, `via_ir = false` unless stack-too-deep, `fs_permissions` only for `data/`. | `forge config --json` matches. |
| `remappings.txt` | `@uniswap/v4-core/=lib/v4-core/`, `@uniswap/v4-periphery/=lib/v4-periphery/`, `@openzeppelin/=lib/openzeppelin-contracts/`, `@arkiv-network/sdk/=node_modules/@arkiv-network/sdk/`. | `forge remappings` matches. |
| `lib/` | `v4-core` and `v4-periphery` pinned to exact tags; `openzeppelin-contracts` pinned to `v5.1.0` or the version required by v4-periphery. | `git submodule status` shows exact commits; `docs/DEPENDENCIES.md` lists tags and commit hashes. |
| `Makefile` | `setup`, `build`, `test`, `fork-test`, `arkiv-verify`, `replay`, `lint`, `demo`, `demo-offline`, `check-submission`, `snapshot`, `screenshots`, `ci`. | `make ci` runs `lint`, `build`, `test`, `fork-test`, `snapshot`, `check-submission` and exits `0`. |
| `package.json` (root) | Scripts: `replay`, `arkiv:verify`, `arkiv:verify:cache`, `test:parity`, `test:e2e`, `test:a11y`, `build`, `screenshots`, `readme:check`, `security:map`, `security-lite`, `bench`, `demo:rehearse`. Each maps to a file in `web/src/scripts/` or `web/src/test/`. | `npm run` lists every script; `npm run replay` and `npm run arkiv:verify` run without extra arguments. |
| `.env.example` | Every variable in Section 16, with a safe default and a comment; no secret values. | `grep -E 'PRIVATE_KEY\|ACCESS_KEY\|MNEMONIC' .env.example` returns no value, only variable names. |
| `LICENSE` | MIT. | `head -1 LICENSE` contains `MIT`. |
| `.gitignore` | `.env`, `.env.local`, `out/`, `cache/`, `node_modules/`, `.next/`, `broadcast/`, `*.log`. The four screenshots in `docs/screenshots/` are committed so a judge can see them without running the app. | `git status --ignored` shows the ignored paths; `git ls-files docs/screenshots` returns the four PNGs. |

### 6.8 Data pipeline: basis and crash replay

| Stage | What happens | Determinism rule |
| :--- | :--- | :--- |
| **S1 Fetch** | `web/src/scripts/replay.ts` downloads one-minute candles for `43,200` rows covering the Aug 5 2024, Feb 3 2025, and Oct 30 2026 ETH crash windows, from a public source with a cited license. | The raw response is cached to `data/raw/` and never regenerated on a re-run; the cache is gitignored but the derived `data/basis_30d.json` is committed. |
| **S2 Normalize** | Convert to a single array of `{ts, ethUsdc, perpUsdc}` with both prices in 6-decimal USDC. | Sorting by timestamp; duplicate timestamps are rejected, not averaged. |
| **S3 Basis** | `basisBps = (perpUsdc - ethUsdc) * 10_000 / ethUsdc` per row, integer math. | No smoothing, no outlier removal. |
| **S4 Statistics** | Median, P99, and max of `basisBps` across all rows. | P99 uses the nearest-rank method on the sorted array; the method is named in the output. |
| **S5 Hash** | SHA-256 of `data/basis_30d.json`. | Printed by `npm run replay` and recorded in `data/README.md`. |
| **S6 Claim** | Claim 3 uses the recomputed P99 and max. | If the values differ from the reference target `142`/`318`, update Claim 3, the UI, and the video. Never paste the reference hash. |

One-command regeneration: `npm run replay`. It must be reproducible: the same committed `data/basis_30d.json` produces the same SHA-256 on any machine.

---

## 7. Functional and non-functional requirements

Priority: `MUST` = a missing item blocks submission; `SHOULD` = a missing item lowers a score but does not block; `STRETCH` = only if the counted work is already green. Every acceptance refers to a test in Section 10.

### 7.1 Functional requirements

| ID | Requirement | Acceptance | Priority |
| :---: | :--- | :--- | :---: |
| **FR-01** | `openBook` rejects zero or out-of-range notional, an over-hedged book, posted margin below net IM, an inactive Aqua strategy, a docked strategy, and a short Aqua balance. | `test_OpenBookValidation` covers each revert with the exact custom error. | MUST |
| **FR-02** | The 16-scenario grid returns the exact GV-01–GV-04 values with no floating-point arithmetic. | `T-02`; all four vectors match to the base unit. | MUST |
| **FR-03** | `quoteOpen` returns the same `SpanResult` as `openBook` for the same inputs without changing state. | `test_QuoteOpenMatchesOpen`. | SHOULD |
| **FR-04** | `quoteUnwind` returns exactly the same `UnwindPreview` that `unwind` writes for the same book and shock. | `testFuzz_QuoteMatchesUnwind` with 256 runs; `T-05`. | MUST |
| **FR-05** | `unwind` executes the atomic dual-leg settlement for a downward shock and leaves the book inactive with `remainingEquity`, `badDebt`, and fee recorded. | `test_UNWIND01` asserts `28,500e6` netted, `33,750e6` LP loss, `50e6` fee, `19,700e6` equity, `0` bad debt; `T-05`. | MUST |
| **FR-06** | `unwind` reverts with `UnsupportedShockDirection` for a positive shock; the positive-shock preview remains available to the guard. | `test_PositiveShockUnwindReverts`. | MUST |
| **FR-07** | The v4 hook reverts `beforeRemoveLiquidity` when the post-withdrawal equity is below the required IM for an active book. | `test_UnsafeWithdrawalReverts` asserts `SpanMarginBreach(trader, 12,000e6, 16,500e6)`; `T-06`, `T-08`. | MUST |
| **FR-08** | The hook is callable only by the canonical v4 `PoolManager`; a random caller reverts. | `test_OnlyPoolManager` for `beforeRemoveLiquidity` and `afterSwap`. | MUST |
| **FR-09** | The hook updates the app's mark price after a swap in its pool and rejects a price outside `[$1, $1,000,000]` per WETH. | `test_AfterSwapUpdatesMark`, `test_PriceOutOfBounds`. | SHOULD |
| **FR-10** | The app performs a real Aqua `ship` at open, `push` for the short gain, and `pull` for the LP loss plus fee on a Base mainnet fork. | `AquaForkTest` asserts `Shipped`, `Pushed`, and `Pulled` events and wallet balance deltas; `T-07`. | MUST |
| **FR-11** | The adapter pays exactly the previewed short gain into Aqua and receives exactly the forwarded LP loss; its reserve accounting balances. | `test_ReserveAccounting` and `test_RealizeGainPushesToAqua`. | MUST |
| **FR-12** | The Arkiv adapter writes an entity with a `300`-second expiration and queries it by `status` and `marginRatioBps`. | `npm run arkiv:verify` prints the key, writer, expiry, and query row; `T-11`. | MUST for Arkiv |
| **FR-13** | The repo contains `arkiv/schema.md`, `friction.md`, `reach.md`, `why-arkiv.md`, and `how-you-use-arkiv.md`; the README contains the writer wallet and one runnable query. | `make check-submission` exits `0`; `T-12`. | MUST for Arkiv |
| **FR-14** | The split-screen UI shows the isolated account and the ZeroMargin book on the same shock input. | `npm run test:e2e` asserts the two equity values and the guard revert; `T-13`. | MUST |
| **FR-15** | The replay script prints the dataset SHA-256, the three crash dates, and the basis P99 and max. | `npm run replay` prints the full SHA-256, `P99 142`, `max 318`; `T-09`. | SHOULD |
| **FR-16** | The demo runs offline with a visible `CACHE` badge when Arkiv is unreachable and with a visible `LOCAL` badge when canonical Aqua is unavailable. | `make demo-offline` starts and the badge text is asserted; `T-14`. | MUST |
| **FR-17** | `unwind` is callable only by the trader or an authorized keeper; a random caller reverts. | `test_UnauthorizedUnwind`; `T-05`. | MUST |
| **FR-18** | `addMargin` increases the posted margin only after the Aqua virtual balance increases by at least the same amount. | `test_AddMarginRequiresBalance`, `test_AddMarginUpdatesBook`. | SHOULD |
| **FR-19** | `closeBook` docks the Aqua strategy and clears the book only when inactive. | `test_CloseBookDocks`, `test_CloseActiveBookReverts`. | SHOULD |
| **FR-20** | `setHook` succeeds once, then ownership is renounced; a second set reverts. | `test_HookSetOnce`, `test_OwnerRenounced`. | MUST |
| **FR-21** | The app holds no USDC after any external call. | `test_NoTokenCustody` asserts a zero balance after `openBook`, `unwind`, `addMargin`, and `closeBook`. | MUST |
| **FR-22** | The build enforces the gas budgets in Section 6. | `forge snapshot --check` against `.gas-snapshot`; `T-10`. | SHOULD |
| **FR-23** | The repo contains none of the banned strings in Section 0.6. | `make lint` exits `0`; `T-15`. | MUST |
| **FR-24** | `make ci` runs lint, build, unit tests, fork tests, Arkiv verification, replay, and snapshot. | `make ci` exits `0` on a clean checkout; `T-16`. | MUST |
| **FR-25** | Deploy scripts exist for the fork and for Base Sepolia, and both print every deployed address and constructor argument. | `forge script script/DeployFork.s.sol --fork-url $BASE_RPC_URL` prints the addresses; `T-17`. | MUST |
| **FR-26** | The README states the exact mechanism, the limitations, the demo mode, the AI disclosure, the sponsor integrations, and the contract addresses. | `docs/README_CHECKLIST.md` is fully ticked; `T-18`. | MUST |
| **FR-27** | `FEEDBACK.md` exists and the Uniswap Developer Feedback Form is submitted with its link. | The form confirmation is stored in `docs/UNISWAP_FORM.md`; `T-19`. | MUST for Uniswap |
| **FR-28** | The repo has an MIT `LICENSE` and a public GitHub URL. | `curl -s -o /dev/null -w '%{http_code}' $REPO_URL` returns `200`; `T-20`. | MUST |
| **FR-29** | The git history has at least `20` commits, the first commit after kickoff, and no single commit larger than `2,000` changed lines after the first two setup commits. | `git log --oneline \| wc -l` and `git show --stat` checks; `T-21`. | MUST |
| **FR-30** | The README discloses which files were AI-assisted and which prompts/specs were used. | `grep -n 'AI' README.md` returns the disclosure section; `T-18`. | MUST |

### 7.2 Non-functional requirements

| ID | Requirement | Target | Acceptance | Priority |
| :---: | :--- | :--- | :--- | :---: |
| **NFR-01** | Determinism | No floating-point math in Solidity or TypeScript margin code; all money is integer or `BigInt`. | `grep -rnE 'toFixed\|parseFloat\|Number\(' web/src/lib/spanMath.ts contracts/src` returns nothing in the math path; `T-15`. | MUST |
| **NFR-02** | Gas | Every contract under its Section 6 budget. | `forge snapshot --check`; `T-10`. | SHOULD |
| **NFR-03** | Latency | Local quote under `500` ms; Anvil unwind confirmation under `5` s. | `npm run bench` prints both numbers; `T-13`. | SHOULD |
| **NFR-04** | Offline continuity | The entire demo runs with no internet except the local Anvil process; Arkiv uses the cache with a visible badge. | `make demo-offline`; `T-14`. | MUST |
| **NFR-05** | Contract size | Each deployed contract under `24,576` bytes. | `forge build --sizes`; `T-01`. | MUST |
| **NFR-06** | Reproducibility | `make setup && make test` on a clean macOS or Linux machine in under `10` minutes. | Timed clean run in `docs/REPRO.md`; `T-22`. | MUST |
| **NFR-07** | Accessibility | Keyboard reachable, visible focus, `4.5:1` contrast, reduced motion respected. | `npm run test:a11y` with axe; `T-23`. | SHOULD |
| **NFR-08** | Observability | Every state-changing API call logs the tx hash, chain id, block number, and mode badge; no private key or access key in logs. | `grep -R 'PRIVATE_KEY\|ACCESS_KEY' web/.next` returns nothing; `T-24`. | MUST |
| **NFR-09** | Security | No critical or high finding in the threat model in Section 9 that is left without a mitigation or a documented limitation. | `docs/SECURITY_REVIEW.md` maps every S-ID to a test or a limitation; `T-25`. | MUST |
| **NFR-10** | Portability | macOS 14+ and Ubuntu 22.04+; Node `24.x`; Foundry `1.7.x`. | CI matrix runs both; `T-16`. | SHOULD |
| **NFR-11** | License | MIT for the repo; the dataset license is cited in `data/README.md`. | `LICENSE` and `data/README.md`; `T-20`. | MUST |
| **NFR-12** | Honesty | No banned claim; every limitation in Section 1.3 appears in the README and the video. | `make lint` and a manual read of `docs/LIMITATIONS.md`; `T-15`, `T-18`. | MUST |
| **NFR-13** | Availability | The UI shows an error state with the exact failure and a retry button; it never shows a stale success. | `test_UiErrorStates`; `T-13`. | SHOULD |
| **NFR-14** | Time | Code freeze at Fri Nov 6 2026 19:30 IST; submission by Sat Nov 7 2026 08:00 IST, one hour before the verified cutoff. | `PROGRESS.md` records both times; `T-21`. | MUST |

---

## 8. Sponsor integrations

The submission selects exactly three partner prizes: 1inch, Uniswap Foundation, and Arkiv. The cap is three. Continuity tracks are not eligible because this is a new project. The advertised pool across the three sponsors is `$37,000`; the reachable Classic pool is `$19,000` (`$5,000` + `$10,000` + `$4,000`). Every integration below has a live proof, an adapter boundary, a fallback, and a removal rule. If the live proof fails, the track is dropped and its claim is removed. A fake integration loses all three tracks, not one.

### 8.1 1inch — `Build an Aqua App`

| Item | Verified fact or decision |
| :--- | :--- |
| Prize | `$5,000` Classic: `$2,500` / `$1,500` / `$1,000`, 3 places. `$2,000` Continuity is not eligible. `[verified: ethglobal.com/events/mumbai/prizes/1inch, 2026-11-03]` |
| Requirement | Create a custom Aqua app that implements a sophisticated DeFi position; demonstrate the final position through tests, scripts, or a UI; use official Aqua/SwapVM contracts (a modified SwapVM redeployment is allowed); show onchain token transfers; local forks are acceptable; proper git history. Projects that use SwapVM are scored higher. `[verified: same]` |
| Verified contracts | Aqua registry `0x1111113ccf1426a8e30e2bff5e005d929bf6a90a` (`5,619` bytes on Base `8453`); AquaSwapVMRouter v1.0.2 `0x111111338c5091e8440b67b168bae16a668ac0de` (`20,541` bytes). Both have `0` bytes on Base Sepolia `84532`. `[verified: business.1inch.com contract-addresses; eth_getCode, 2026-11-03]` |
| What we build | `ClearingAquaApp` is the custom AquaApp. The trader ships a USDC virtual balance to the app, opens a book, and the app settles the LP loss and the short gain through `push` and `pull`. The 1inch integration is not a wrapper around a swap; the virtual balance is the margin account. |
| Live proof | On a Base mainnet fork: `AQUA.ship(app, strategy, [USDC], [25,000e6])`; `AQUA.push(trader, app, hash, USDC, 28,500e6)` from the adapter; `AQUA.pull(trader, hash, USDC, 33,800e6, app)`; then the app forwards `33,750e6` to the adapter and `50e6` to the fee collector. The test asserts the `Shipped`, `Pushed`, and `Pulled` events and the trader's wallet balance delta. |
| Verify first | `cast interface 0x1111113ccf1426a8e30e2bff5e005d929bf6a90a --chain 8453`; `cast codesize 0x1111113ccf1426a8e30e2bff5e005d929bf6a90a --chain 8453` (expect `5619`); then run `rawBalances(trader, app, strategyHash, USDC)` with the three addresses printed by `DeployFork.s.sol` and the USDC address `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`; then a minimal `ship` on the fork. Confirm whether `ship` needs a `KycNFT` or a `Controls` credential for this app; the registry is permissionless, but the canonical router's dApp strategies have a taker gate. `[to verify]` |
| Adapter | `IAqua` in `contracts/src/interfaces/IAqua.sol`; the app never calls a non-canonical registry in live mode. |
| Fallback | A local `Aqua` built from the pinned source commit, with the UI badge `LOCAL`. This is a demo-continuity fallback only; it is not eligible for the 1inch track. If the canonical registry is unavailable on the fork, drop the 1inch track and remove the 1inch claim. |
| On-stage proof | Show the canonical registry address and the fork block in the UI; show the `Pushed` and `Pulled` events; show the trader's wallet balance before and after; show `rawBalances` before and after. Do not call a local mock "Aqua". |
| Removal rule | If `ship`, `push`, and `pull` are not real canonical-registry calls on the fork, remove the 1inch logo, the 1inch claim, and the 1inch track selection. |
| Stretch | `BR6`: a custom SwapVM instruction `0xf1` on a forked `AquaSwapVMRouter` v1.0.2 with `quote == swap` parity. This is not the core integration. If it lands, the 1inch score rises; if it does not, the AquaApp still qualifies. Instruction layout (86 bytes total, defined here and nowhere else): `[0xf1:1B][0x54:1B][hedgeAdapter:20B][aquaStrategyHash:32B][lpNotionalUsdc:16B][shortNotionalUsdc:16B]`. Reference amounts on the GV-01 book: `amountIn = 28,500e6` (short gain), `amountOut = 33,800e6` (`33,750e6` LP loss + `50e6` fee). |

**Why this fits the 1inch rubric.** The app implements a sophisticated DeFi position (a cross-margined LP plus short hedge), not a token swap. It uses the official Aqua registry, ships a real virtual balance, and settles both legs with real token transfers. The custom SwapVM opcode is a bonus, not a dependency.

### 8.2 Uniswap Foundation — `Build with Uniswap`

| Item | Verified fact or decision |
| :--- | :--- |
| Prize | `$10,000` Classic: `$4,000` / `$3,000` / `$2,000` / `$1,000`, 4 places. `$5,000` Continuity is not eligible. `[verified: ethglobal.com/events/mumbai/prizes/uniswap-foundation, 2026-11-03]` |
| Requirement | Public GitHub repo with open-source code, `FEEDBACK.md`, and a completed Uniswap Developer Feedback Form (`https://developers.uniswap.org/hackathon-feedback`) that includes the `FEEDBACK.md` link. The README must point to the relevant contracts and lines of code. `[verified: same]` |
| Verified contracts | Base `PoolManager` `0x498581ff718922c3f8e6a244956af099b2652b2b` (`24,009` bytes); Base Sepolia `PoolManager` `0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408` (`24,009` bytes). `IHooks.beforeRemoveLiquidity(address,PoolKey,ModifyLiquidityParams,bytes)` and `IHooks.afterSwap(address,PoolKey,SwapParams,BalanceDelta,bytes)` are the current signatures. `[verified: eth_getCode; github.com/Uniswap/v4-core IHooks.sol; docs.uniswap.org v4 hooks, 2026-11-03]` |
| What we build | A real v4 hook at a mined address, attached to a real WETH/USDC pool on the Base fork. `beforeRemoveLiquidity` computes the removed USD value and reverts `SpanMarginBreach` when the post-withdrawal equity is below the required IM. `afterSwap` updates the app's mark price. |
| Live proof | Initialize a WETH/USDC v4 pool with `PortfolioMarginHook` as the hook; add liquidity; call `PoolManager.modifyLiquidity` directly with a removal that triggers `SpanMarginBreach(trader, 12,000e6, 16,500e6)`; then a safe removal passes. Show the hook address low bits `0x240` and the pool ID. |
| Verify first | Pin `v4-core` and `v4-periphery` tags; `forge inspect PortfolioMarginHook methods`; `HookMiner.find` with `0x240`; `PoolManager.initialize` on the fork; `StateLibrary.getSlot0`; `LiquidityAmounts` with both token orderings; `BaseHook.onlyPoolManager` behavior. `[to verify: exact tags and Hooks.Permissions field order]` |
| Adapter | `IPoolManagerMinimal`, `IHooks`, `StateLibrary`, `LiquidityAmounts`, `TickMath`. The hook never calls the pool manager except through the inherited `BaseHook` reference. |
| Fallback | Base Sepolia `PoolManager` + the hook, with a local `Aqua` because canonical Aqua is not on Sepolia; the UI badge is `SEPOLIA`. This is not eligible for the 1inch track but can keep the Uniswap proof alive if the Base fork RPC fails. A local `MockPoolManager` is not eligible for the Uniswap track. |
| On-stage proof | Show the hook address and the `0x240` low bits; show the `PoolManager` address; show the `SpanMarginBreach` revert with the exact numbers; show a safe withdrawal in the same pool; show the pool ID and the `afterSwap` mark update. |
| Removal rule | If the hook is not called by the canonical `PoolManager`, or the pool is a mock, remove the Uniswap claim and the track selection. Do not show a `MockPoolManager` call as a Uniswap integration. |

**Why this fits the Uniswap rubric.** The hook changes the behavior of a real v4 pool: it blocks an unsafe LP withdrawal that would leave a cross-venue book under-margined. It uses the real `PoolManager`, the real `IHooks` signatures, a mined hook address, and a real pool. The README points to the exact hook, engine, and pool lines.

### 8.3 Arkiv — `Build on Arkiv (from scratch)`

| Item | Verified fact or decision |
| :--- | :--- |
| Prize | `$4,000` Classic: `$3,000` / `$1,000`, 2 places. The `$15,000` headline aggregates five Arkiv sub-tracks; a project submits to one. `[verified: ethglobal.com/events/mumbai/prizes/arkiv, 2026-11-03]` |
| Requirement | Built from scratch at ETHGlobal Mumbai; writes to the current Arkiv testnet with `@arkiv-network/sdk` or JSON-RPC; at least one user-visible feature reads Arkiv; README lists the writer wallet(s) and one runnable query; `/arkiv/schema.md`, `/arkiv/friction.md`, `/arkiv/reach.md`, `/arkiv/why-arkiv.md`, `/arkiv/how-you-use-arkiv.md`; public repo with an open-source license; AI usage disclosed; one Arkiv track prize per team. `[verified: same]` |
| Verified network | Rabdi chain ID `7794095`; RPC `https://rpc.rabdi.db-chain.testnet.arkiv.network`; `2`-second blocks; `@arkiv-network/sdk` `1.0.1`. `[verified: docs.arkiv.network; arkiv_getBlockTiming and eth_chainId; registry.npmjs.org, 2026-11-03]` |
| What we build | A `300`-second risk attestation per book: `status`, `marginRatioBps`, `equityUsdc`, `netInitialMarginUsdc`, and `aquaStrategyHash`. The `/arkiv` page reads the live entity; the keeper query finds `UNWIND_ELIGIBLE` books. The onchain `unwind` recomputes the margin; Arkiv is discovery and audit, not settlement. |
| Live proof | `npm run arkiv:verify` writes an entity to Rabdi, prints the entity key, writer address, `expiresAt`, and a query result; the test asserts `expiresAt - now <= 300`. The README contains the exact runnable query. |
| Verify first | `npm view @arkiv-network/sdk version`; create a wallet and get an access key from `https://hub.arkiv.network/access-keys`; get test tokens from `https://hub.arkiv.network/faucet`; run the SDK `createEntity` and `select` examples; confirm `ExpirationTime.fromMinutes(5)` and `$expiresAt`; confirm the raw `arkiv_query` syntax. `[to verify: SDK version and faucet availability on the day]` |
| Adapter | `RiskAttestationStore` in `web/src/lib/arkiv.ts`; live mode `ARKIV_MODE=live`; cache mode `ARKIV_MODE=cache` with a visible `CACHE` badge. |
| Fallback | Cache mode with `web/src/data/arkiv-cache.json` and a visible `CACHE` badge. This is not eligible for the Arkiv track if no live write exists. If the faucet or access key is unavailable, drop the Arkiv track and remove the Arkiv claim. |
| On-stage proof | Show the entity key, the writer wallet, the `expiresAt` countdown, and the query result; show the README query; show the `/arkiv` page reading the entity. Say "Rabdi testnet, entity expires in 300 seconds" rather than "permanent storage". |
| Removal rule | If there is no live Rabdi entity written by the submission wallet, remove the Arkiv logo, the Arkiv claim, and the Arkiv track selection. A cached entity is not a live integration. |

**Why this fits the Arkiv rubric.** The five markdown files are graded at `25%` each for feedback, reach, why Arkiv, and how it is used. The schema file is required. The README has the writer wallet and a runnable query. The entity is written to the current testnet and read by a user-visible feature. The data is time-scoped, which is the point of Arkiv: a risk attestation that expires is more honest than a stale one.

### 8.4 Cross-track consistency

| Check | Rule | Acceptance |
| :--- | :--- | :--- |
| Three-sponsor cap | Exactly 1inch, Uniswap Foundation, Arkiv. No fourth partner prize. | The submission form lists three; `docs/SUBMISSION.md` records the three. |
| No continuity | The repo is new; no pre-event code. | Section 0.3 gate; `git log` first commit after kickoff. |
| Shared evidence | The same demo transaction proves Aqua `push`/`pull` and the v4 guard; the same book produces the Arkiv entity. | One end-to-end run; `T-13`. |
| No double-counted claim | The Aqua settlement is not described as a Uniswap integration; the v4 hook is not described as a 1inch integration; Arkiv is not described as a settlement authority. | `docs/LIMITATIONS.md` and the video script. |
| Removal is honest | If one track fails, the UI, README, video, and submission form all drop it in the same pass. | `grep -rin '1inch\|uniswap\|arkiv' README.md docs/` after a removal. |

---

## 9. Security and threat model

This is a hackathon prototype, not an audited protocol. The threat model is written to find the failures that would embarrass the demo or lose user funds in the tested scope. Every threat has a mitigation, a test, and a residual risk. A residual risk that cannot be removed is listed in `docs/LIMITATIONS.md`, the README, and the video.

### 9.1 Assets and trust boundaries

| Asset | Custody | Trust boundary |
| :--- | :--- | :--- |
| Trader USDC and WETH | Trader wallet; Aqua holds `0` tokens. | The trader approves the canonical Aqua registry. A compromised registry could pull approved tokens; use a limited allowance and revoke after the demo. |
| Aqua virtual balance | Accounting claim in the canonical registry. | The app can `pull` only under the maker's approval; the maker can `dock` at any time. |
| Uniswap v4 LP position | Trader wallet / position manager. | The hook sees only the `PoolManager` caller; it cannot see a position owner behind a router. |
| Short hedge reserve | `ShortHedgeAdapter` (demo counterparty). | The adapter is pre-funded and trusted for the demo; it is not a live venue. |
| Protocol fee | `FEE_COLLECTOR`. | Set at deploy; zero address rejected; paid only when there is no bad debt. |
| Arkiv attestation | Public Rabdi entity. | Untrusted for settlement; the app recomputes margin onchain. A forged entity can mislead a keeper's ordering, not the math. |
| Keeper authorization | `keepers[trader][keeper]`. | The trader chooses the keeper; the keeper can only call `unwind`. |

### 9.2 Threat table

| ID | Threat | Impact | Mitigation | Test / evidence | Residual risk |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **S-01** | Reentrancy through a malicious ERC-20, the Aqua registry, or the adapter during `unwind`. | Double pull, double settle, or stale state. | `nonReentrant` on `unwind`, `addMargin`, and `closeBook`; checks-effects-interactions; the book is marked inactive before external calls; the app holds no tokens between calls. | `test_ReentrancyBlocked` with a malicious token/adapter. | A canonical Aqua or USDC reentrancy is out of scope; the code assumes both are non-reentrant. |
| **S-02** | A random caller invokes the hook directly. | Fake guard results or a fake mark price. | `onlyPoolManager` on both hooks; `test_OnlyPoolManager`; the hook has no token transfers. | `test_OnlyPoolManager`. | A compromised `PoolManager` is out of scope. |
| **S-03** | A caller passes `hookData` that encodes another trader, aiming the guard at a safe book. | Bypass of the withdrawal guard. | The hook uses `msg.sender` as the trader; if `hookData` is non-empty it must encode `msg.sender`, otherwise `InvalidHookData`. | `test_HookDataSpoofReverts`. | None in the direct-call path. |
| **S-04** | A trader withdraws LP through a router; the hook sees the router as `sender` and does not guard. | Under-margined book after withdrawal. | Documented limitation; the product requires direct withdrawal by the book owner; the video and README say it. A production version uses a position NFT or a caller allowlist. | `test_RouterBypassDocumented` asserts the hook does not guard a router call; `docs/LIMITATIONS.md`. | Real and accepted for the hackathon. Do not claim the guard is universal. |
| **S-05** | An attacker manipulates the pool spot price before a withdrawal to change the withdrawn USD value. | A withdrawal that looks safe but leaves the book under-margined, or a griefed withdrawal. | The hook values the WETH leg at `max(spotUsdc, entryUsdc)`. A downward push cannot lower the value below entry; an upward push can only make the guard stricter. | `test_WithdrawalValueUsesMaxSpotEntry` with a `-50%` and a `+50%` spot. | A flash-loan push can temporarily block a legitimate withdrawal (griefing, no fund loss). A TWAP is out of scope. |
| **S-06** | An attacker writes a forged Arkiv entity claiming `UNWIND_ELIGIBLE`. | A keeper may inspect the wrong book first. | The keeper filters `ownedBy(writerAddress)`; the onchain `unwind` recomputes the margin and never trusts Arkiv. | `test_KeeperIgnoresForeignEntity`; the query includes `ownedBy`. | A compromised writer key can mislead ordering, not settlement. |
| **S-07** | The Arkiv writer key is compromised. | Spoofed attestations under the trusted writer. | The writer is a burner with only testnet tokens; the key is in `.env`, not the repo; rotate the key and rewrite the entity; the onchain math is unaffected. | `docs/SECURITY_REVIEW.md` key-handling checklist. | Testnet-only; no mainnet funds. |
| **S-08** | The maker grants Aqua an unlimited allowance; a compromised registry pulls all approved tokens. | Loss of the approved balance. | Use a per-demo allowance of exactly the posted margin plus a small buffer; revoke after the demo; the README warns. The app never grants an allowance on the maker's behalf. | `test_AllowanceIsLimited` in the UI script; manual `cast allowance` check before and after. | The canonical registry is trusted; a registry exploit is out of scope. |
| **S-09** | A front-run revokes the maker's allowance or docks the strategy before `unwind`. | `unwind` reverts; the book stays active. | The UI preflight checks `rawBalances` and allowance; the transaction reverts atomically; the trader can re-ship or retry. | `test_UnwindRevertsOnDock`, `test_UnwindRevertsOnAllowance`. | Denial of service until the trader acts; no fund loss. |
| **S-10** | A trader reuses one Aqua strategy hash for two books, or opens a second book while the first is active. | Shared virtual balance and double-counted margin. | `openBook` reverts `BookAlreadyActive`; a strategy hash is recorded per active book; the app checks the balance for its own address. | `test_OneBookPerTrader`, `test_StrategyHashReuseReverts`. | A trader can use a new strategy hash for a new book after closing the old one; that is intended. |
| **S-11** | The trader docks the Aqua strategy while the book is active. | The app cannot pull; the book is stuck. | `unwind` and `addMargin` check `tokensCount`; a docked strategy reverts `StrategyDocked`; the UI warns before docking; the trader can re-ship a new strategy and reopen. | `test_DockedStrategyReverts`. | The trader can always revoke their own liquidity; that is self-custody, not a protocol loss. |
| **S-12** | An over-hedged or under-margined book is opened. | The risk model is outside its tested envelope. | `shortNotional <= lpNotional`; `posted >= netInitialMargin`; `lpNotional` bounds; the fuzz test covers the envelope. | `test_OpenBookValidation`, `testFuzz_ZeroBadDebtWithinEnvelope`. | A book outside the envelope is rejected, not rescued. |
| **S-13** | A caller supplies a fake shock (for example, `-3,000` when the market is flat) to force a loss. | An authorized keeper can force an uneconomic unwind; a random caller cannot. | `unwind` requires `msg.sender == trader || keepers[trader][msg.sender]`; the shock is a scenario input, not an oracle; the trader chooses the keeper and can revoke. | `test_UnauthorizedUnwind`, `test_KeeperCanUnwind`, `test_KeeperRevoked`. | An authorized keeper can misbehave; the trader's authorization is the trust boundary. The demo uses the trader's burner. A production version needs an oracle and a dispute window. |
| **S-14** | Rounding favors the trader and creates insolvency by one base unit. | Tiny bad debt that accumulates. | Margin and fee round up; profit rounds down; `signedFloorDiv`; the golden vectors and a rounding test assert direction. | `test_RoundingDirection`, `testFuzz_ZeroBadDebtWithinEnvelope`. | At most one base unit per operation; the `500` bps haircut dominates. |
| **S-15** | Unsafe casts or overflow in `uint128`/`int256` conversions. | Wrong amounts or a revert. | Solidity `0.8.26` checked arithmetic; explicit bounds before casts; `type(int256).min` rejected; the fuzz test uses bounded inputs. | `test_CastBounds`, `testFuzz_NoOverflow`. | None found in the tested range; the max notional is `10,000,000e6`. |
| **S-16** | The book has bad debt after a shock beyond the envelope or a low margin. | The adapter or the protocol absorbs a shortfall. | Bad debt is recorded, not socialized; the fee is not paid; `BadDebtRealized` is emitted; the demo uses the safe envelope. | `test_BadDebtPath` with a post-withdrawal state. | The demo adapter reserve is finite; a loss larger than the reserve would be a demo failure, not a user loss. |
| **S-17** | The fee collector is the zero address or a contract that rejects USDC. | The fee transfer reverts and blocks `unwind`. | The constructor rejects `address(0)`; the deploy script uses an EOA the team controls; the fee is paid only when there is no bad debt; a failed transfer reverts the whole unwind. | `test_ZeroFeeCollectorReverts`, `test_FeePaidOnUnwind`. | A blacklisted USDC address could block the fee; USDC on Base is not blacklisting the demo address. |
| **S-18** | The pool's token ordering or decimals differ from the assumption. | The withdrawn USD value is wrong. | The hook reads the currencies and decimals from the `PoolKey`; two unit tests cover both orderings; the price formula has a `$3,000` sanity check. | `test_TokenOrderingWethUsdc`, `test_TokenOrderingUsdcWeth`. | A pool with non-18/6 decimals is rejected by the deploy script. |
| **S-19** | The mark price is manipulated or out of bounds. | A wrong UI mark or a blocked withdrawal. | `updateMarkPrice` is hook-only; the hook reads `StateLibrary.getSlot0`; the price is bounded to `[$1, $1,000,000]`; the guard uses `max(spot, entry)`. | `test_PriceOutOfBounds`, `test_MarkPriceOnlyHook`. | The mark is informational for the guard; it is not used in the unwind waterfall. |
| **S-20** | No keeper is available, or a keeper is malicious. | The book is not unwound, or is unwound at a chosen shock. | The trader can always call `unwind`; the keeper is optional and scoped to `unwind`; the trader can revoke. | `test_TraderCanUnwind`, `test_KeeperScope`, `test_KeeperRevoked`. | Keeper liveness is not guaranteed; the trader is the backstop. |
| **S-21** | MEV or a sandwich around the unwind. | A worse price or a stolen gain. | The unwind is one transaction; the amounts are a deterministic function of the book and the shock; the caller cannot redirect the pull; the fee is fixed. | `test_UnwindAmountsAreDeterministic`. | The authorized caller chooses the timing and the shock; that is the S-13 boundary. |
| **S-22** | The hook stores state or collides with the pool manager's storage. | Corrupted pool state. | The hook is stateless; only immutables; no `delegatecall`; no `selfdestruct`. | `forge inspect PortfolioMarginHook storage-layout` shows no mutable slots; `grep` for `delegatecall` and `selfdestruct` returns nothing. | None in the tested code. |
| **S-23** | The owner key is compromised before `setHook`. | A malicious hook is set. | Deploy, `setHook`, and `renounceOwnership` in one script; the owner is a burner; the hook address is checked in the same transaction batch. | `test_HookSetOnce`, `test_OwnerRenounced`; the deploy script prints the hook and owner. | If the key is compromised before the batch, redeploy; the app has no user funds yet. |
| **S-24** | The hook is attached to the wrong pool or a pool with a different key. | The guard never runs or runs on the wrong book. | `poolId` is immutable; `beforeRemoveLiquidity` and `afterSwap` compare `key.toId()`; a mismatch reverts or returns the selector without a state change. | `test_WrongPoolReverts`. | None in the tested deployment. |
| **S-25** | The Arkiv entity expires before the UI reads it, or the writer clock drifts. | The inspector shows no data. | TTL `300` s; the writer checks `arkiv_getBlockTiming`; if drift exceeds `30` s, TTL drops to `240` s; the UI shows the countdown and a refresh button. | `npm run arkiv:verify` asserts `expiresAt - now <= 300` and re-queries after expiry. | Rabdi block time can vary; the UI handles an empty result as `EXPIRED`, not an error. |
| **S-26** | The UI shows a stale success after a failed transaction, or connects to the wrong chain. | The demo claims a settlement that did not happen. | Every API response includes `chainId`, `blockNumber`, `txHash`, and `mode`; the UI renders the receipt only after `status == success`; the wrong chain shows a blocking `ERROR` badge. | `test_UiErrorStates`, `test_WrongChainBlocks`. | A cached browser response could show stale data; the UI disables cache for the demo routes. |
| **S-27** | A private key or access key leaks into logs, screenshots, or the repo. | Testnet key compromise. | `.env` only; `.gitignore`; no `console.log` of secrets; the deploy script redacts; `gitleaks` in `make security-lite`. | `grep -R` and `gitleaks detect`. | A screenshot of the terminal could leak; the demo uses a redacted terminal. |
| **S-28** | A dependency is compromised or a tag moves. | Malicious code in the build. | Pin exact commits for `v4-core`, `v4-periphery`, OpenZeppelin; `package-lock.json`; `npm ci`; `git submodule status` recorded in `docs/DEPENDENCIES.md`. | `T-26`. | A compromised maintainer is out of scope; the pinned commit limits the window. |
| **S-29** | A gas-heavy withdrawal or unwind exceeds the block gas limit. | The transaction cannot execute. | Gas budgets in Section 6; `forge snapshot`; the demo uses a local Anvil with a high limit; the UI estimates gas and shows the number. | `T-10`. | Mainnet gas spikes could make the demo expensive; the demo is a fork. |
| **S-30** | The product is mistaken for a live liquidation engine. | Users believe the shock is an oracle price. | The README and video say the shock is a scenario input; the mock adapter is labeled; the UI badge says `DEMO`. | `docs/LIMITATIONS.md`, `T-18`. | A judge who reads only the title could misunderstand; the first 15 seconds of the video state it. |

### 9.3 Limitations that must appear in the README and the video

1. The short hedge is a pre-funded demo adapter, not a live perp venue.
2. The crash is a deterministic `-30%` scenario input, not an oracle-verified market event.
3. The hook guards direct `modifyLiquidity` calls by the book owner; a router withdrawal is not guarded.
4. The risk grid is a simplified SPAN-style model, not CME's production SPAN algorithm.
5. The app is tested on a Base mainnet fork; the live deployment is a demo, not a production deployment.
6. The code is tested, not audited.
7. Arkiv is a discovery and audit layer, not a settlement authority.
8. The `500` bps basis haircut is calibrated on the historical dataset; a future basis spike can exceed it.
9. The protocol fee is `5` bps of LP notional; the demo fee is `$50` on `$100,000`.
10. The adapter reserve is finite; a loss larger than the reserve is a demo failure.

### 9.4 Pre-submission security checklist

| Check | Command | Pass condition |
| :--- | :--- | :--- |
| No `tx.origin` authorization | `grep -rn 'tx.origin' contracts/src` | No matches. |
| No `delegatecall` or `selfdestruct` | `grep -rnE 'delegatecall\|selfdestruct' contracts/src` | No matches. |
| Assembly is reviewed | `grep -rn 'assembly' contracts/src` | Only the hook `hookData` slice and, if built, the `0xf1` opcode; each has a test. |
| Static analysis | `slither contracts/src --config-path slither.config.json` (or `aderyn contracts/src`) | No high or critical finding without a written justification in `docs/SECURITY_REVIEW.md`. |
| Storage layout recorded | `forge inspect ClearingAquaApp storage-layout` | File in `docs/STORAGE.md`; no proxy. |
| Sizes | `forge build --sizes` | All contracts under `24,576` bytes. |
| Dependencies pinned | `git submodule status`; `npm ls @arkiv-network/sdk viem` | Exact commits/versions in `docs/DEPENDENCIES.md`. |
| Secrets | `gitleaks detect --no-git` or `grep -R` | No private key, access key, or mnemonic. |
| Node audit | `npm audit --omit=dev` | No high or critical finding. |
| Threat mapping | `docs/SECURITY_REVIEW.md` | Every S-ID has a test or a limitation. |
| Rehearsed failures | Manual | RPC down, Arkiv down, wallet rejected, wrong chain, empty book, docked strategy. |

---

## 10. Test plan

### 10.1 Layers and fixtures

| Layer | Tool | Scope | Gate |
| :--- | :--- | :--- | :--- |
| Unit | Foundry | `SpanMathLib`, app, hook, adapter | Every card |
| Fuzz | Foundry | 256 runs per fuzz test; bounded inputs | Every card |
| Invariant | Foundry | `invariant_*` with 256 runs and depth `32` | Checkpoint 2 and freeze |
| Fork | Foundry + Anvil | Base mainnet fork; canonical Aqua and v4 | Checkpoint 1 and freeze |
| Parity | Node + `tsx` | TypeScript math against Solidity golden vectors | Every math change |
| Integration | Node | Arkiv Rabdi write/query; replay | Checkpoint 3 |
| End-to-end | Playwright | UI, API, Anvil, Arkiv | Checkpoint 4 |
| Security | Foundry + scripts | Attack suite, lint, secrets, dependencies, static analysis | Freeze |
| Submission | Shell + git | Docs, form, history, license, video | Sat 08:00 IST |

**Fixtures.**

| Fixture | Path | Rule |
| :--- | :--- | :--- |
| Golden vectors | `data/golden_vectors.json` | Rebuilt during the hackathon from the formulas; exact values in Section 4.7. The test file and the TS parity file read the same JSON. |
| Basis and crash replay | `data/basis_30d.json` | Public one-minute candles for `43,200` observations; `data/README.md` cites the source, license, retrieval date, and SHA-256. The replay script recomputes the statistics; the claim uses the recomputed values. |
| Fork block | `.env.local` `FORK_BLOCK_NUMBER` | The setup script resolves `latest` to a number after both canonical contracts exist; the number is recorded in `PROGRESS.md` and shown in the UI. |
| Arkiv cache | `web/src/data/arkiv-cache.json` | Captured from a live write during the window; every record has `source: "cache"` and a visible badge. |
| Demo wallet | `.env.local` `DEMO_PRIVATE_KEY` | Burner with at most `$5` ETH and `$50` USDC on Base; never committed. |

### 10.2 Test matrix

| ID | Layer | Command | Expected | Maps to |
| :---: | :--- | :--- | :--- | :--- |
| **T-01** | Build | `make setup && forge build --sizes` | `Compiler run successful`; every contract below `24,576` bytes; the sizes are printed. | FR-25, NFR-05 |
| **T-02** | Unit + fuzz | `forge test --match-contract SpanMathTest -vv` | All tests pass; GV-01–GV-04 match to the base unit; 256 fuzz runs; `evaluateSpan16` gas within `30,000`. | FR-02, I2–I5 |
| **T-03** | Parity | `node web/src/test/spanParity.test.ts` | `4/4 golden vectors match`; no floating-point branch. | FR-02, NFR-01 |
| **T-04** | Unit | `forge test --match-contract ClearingAquaAppTest -vv` | All open, quote, add-margin, keeper, close, and custody tests pass. | FR-01, FR-17–FR-21 |
| **T-05** | Unit + fuzz | `forge test --match-test test_UNWIND01 -vvvv` and `--match-test testFuzz_QuoteMatchesUnwind` | `28,500e6` netted, `33,750e6` LP loss, `50e6` fee, `19,700e6` equity, `0` bad debt; 256 quote/swap parity runs. | FR-04, FR-05 |
| **T-06** | Unit | `forge test --match-contract PortfolioMarginHookTest -vv` | Hook flags `0x240`; only `PoolManager`; GV-04 reverts `SpanMarginBreach(12,000e6, 16,500e6)`; both token orderings value correctly. | FR-07, FR-08, S-02, S-03, S-05 |
| **T-07** | Fork | `forge test --match-contract AquaForkTest --fork-url $BASE_RPC_URL --fork-block-number $FORK_BLOCK_NUMBER -vv` | Real `Shipped`, `Pushed`, `Pulled`; wallet balance deltas exact; canonical registry address printed. | FR-10, I7 |
| **T-08** | Fork | `forge test --match-contract PortfolioMarginHookForkTest --fork-url $BASE_RPC_URL --fork-block-number $FORK_BLOCK_NUMBER -vv` | Real `PoolManager` call; `SpanMarginBreach`; safe withdrawal passes; `afterSwap` mark update. | FR-07, FR-09 |
| **T-09** | Integration | `npm run replay` | Prints the SHA-256, the three crash dates, and the recomputed P99 and max; the reference target is `142`/`318`. | FR-15, Claim 3 |
| **T-10** | Gas | `forge snapshot --check .gas-snapshot` | No budget exceeded; the snapshot is committed. | FR-22, NFR-02 |
| **T-11** | Integration | `ARKIV_MODE=live npm run arkiv:verify` | Entity key, writer address, `expiresAt`, `expiresAt - now <= 300`, and one query row. | FR-12, I6 |
| **T-12** | Submission | `make check-submission` | All five `/arkiv/*.md` files, `FEEDBACK.md`, the schema string, and the README query are present. | FR-13, FR-27 |
| **T-13** | E2E | `npm run test:e2e` | The four numbers (`147,500`, `10,000`, `-10,000`, `19,700`), the guard revert, the Arkiv row, and the mode badge are visible; quote under `500` ms; unwind under `5` s. | FR-14, NFR-03, S-26 |
| **T-14** | Offline | `make demo-offline` | The app starts with no internet; the Arkiv badge is `CACHE`; the Aqua badge is `LOCAL`; the demo completes. | FR-16, NFR-04 |
| **T-15** | Lint | `python3 scripts/lint_claims.py` | `PASS: no incomplete markers or unqualified claims`; warnings are printed but do not fail. | FR-23, NFR-01, NFR-12 |
| **T-16** | CI | `make ci` | Exit `0`; runs lint, build, unit, fork, Arkiv, replay, snapshot. | FR-24 |
| **T-17** | Deploy | `forge script script/DeployFork.s.sol --fork-url $BASE_RPC_URL --broadcast` | Prints app, hook, adapter, pool ID, hook flags, owner, fee collector, and sizes. | FR-25 |
| **T-18** | Docs | `npm run readme:check` | `docs/README_CHECKLIST.md` is fully ticked; limitations, AI disclosure, sponsor links, and line references are present. | FR-26, FR-30, NFR-12 |
| **T-19** | Sponsor | `test -s docs/UNISWAP_FORM.md` and the form confirmation | The form was submitted with the `FEEDBACK.md` link; the confirmation is saved. | FR-27 |
| **T-20** | Public | `curl -s -o /dev/null -w '%{http_code}' $REPO_URL`; `head -1 LICENSE` | `200`; `MIT`. | FR-28, NFR-11 |
| **T-21** | History | `git log --oneline \| wc -l`; `git log --reverse --format='%H %ci' \| head -1`; `git show --stat` | At least `20` commits; first commit after kickoff; no post-setup commit over `2,000` changed lines; freeze at Fri 19:30 IST. | FR-29, NFR-14 |
| **T-22** | Repro | Clean machine: `make setup && make test` | Under `10` minutes; exit `0`; the commands are in `docs/REPRO.md`. | NFR-06 |
| **T-23** | Accessibility | `npm run test:a11y` | Axe reports `0` violations; keyboard path completes the demo. | NFR-07 |
| **T-24** | Secrets | `gitleaks detect --no-git`; `grep -R 'PRIVATE_KEY\|ACCESS_KEY' web/.next` | No leaks; no key in build output or logs. | NFR-08, S-27 |
| **T-25** | Security | `npm run security:map` | Every S-ID in Section 9 is mapped to a test or a documented limitation. | NFR-09 |
| **T-26** | Supply chain | `git submodule status`; `npm ls @arkiv-network/sdk viem @uniswap/v4-core` | Exact commits/versions match `docs/DEPENDENCIES.md`; no `latest` tag. | S-28 |
| **T-27** | Attack | `forge test --match-contract AttackTest -vv` | All attack tests pass or assert the documented limitation. | S-01–S-26 |
| **T-28** | Invariant | `forge test --match-contract InvariantsTest -vv` | All `invariant_*` tests pass with 256 runs, depth `32`. | I1–I17 |
| **T-29** | Coverage | `forge coverage --report summary --no-match-coverage 'test\|script'` | At least `90%` lines for `contracts/src`. | NFR-09 |
| **T-30** | Rehearsal | `npm run demo:rehearse` | Three runs under `4:00`; the numbers match; no unhandled error. | FR-14, NFR-14 |

### 10.3 Golden-vector assertions

The test file must assert exact integers, not ranges:

| Test | Assertion |
| :--- | :--- |
| `test_GV01` | `isolated == 147_500e6`; `worstLoss == 5_250e6`; `basis == 4_750e6`; `netIM == 10_000e6`; `netMM == 7_500e6`; `savingsBps == 9_322`. |
| `test_GV02` | `isolated == 140_000e6`; `worstLoss == 9_750e6`; `basis == 4_000e6`; `netIM == 13_750e6`; `netMM == 10_312.5e6`; `savingsBps == 9_017`. |
| `test_GV03` | `isolated == 100_000e6`; `worstLoss == 33_750e6`; `basis == 0`; `netIM == 33_750e6`; `netMM == 25_312.5e6`; `savingsBps == 6_625`. |
| `test_GV04Preview` | `isolated == 67_500e6`; `worstLoss == 15_500e6`; `basis == 1_000e6`; `netIM == 16_500e6`; `netMM == 12_375e6`; `savingsBps == 7_555`. |
| `test_UNWIND01` | `lpLoss == 33_750e6`; `shortGain == 28_500e6`; `netted == 28_500e6`; `fee == 50e6`; `marginUsed == 5_300e6`; `equity == 19_700e6`; `badDebt == 0`. |
| `test_GV04UnwindPreview` | `shortGain == 3_500e6`; `netted == 3_500e6`; `marginUsed == 12_000e6`; `equity == 0`; `badDebt == 3_510e6`. This is a preview only; `unwind` reverts `UnsupportedShockDirection`. |

`10_312.5e6` is written as `10_312_500_000` in Solidity. The table uses the dollar form for readability; the test uses the integer.

### 10.4 Fork test setup

1. `anvil --fork-url $BASE_RPC_URL --fork-block-number $FORK_BLOCK_NUMBER --chain-id 31337 --code-size-limit 30000`.
2. Deploy the hook with `HookMiner`, the app, the adapter, and the demo pool.
3. Seed the pool with WETH/USDC liquidity from the demo LP.
4. Fund the adapter with `100_000e6` USDC.
5. Trader ships `25_000e6` USDC to the app and opens the GV-01 book.
6. Run `AquaForkTest` and `PortfolioMarginHookForkTest` against `http://127.0.0.1:8545`.
7. Record the block number, the deployed addresses, and the four transaction hashes in `PROGRESS.md`.

If the public Base RPC rate-limits, use a private RPC in `.env.local`; the fork block and the addresses are unchanged. If the fork cannot be reproduced, the demo falls back to `make demo-offline` with a `LOCAL` badge, and the 1inch and Uniswap tracks are dropped.

### 10.5 Attack suite

`contracts/test/Attack.t.sol` must contain at least these tests:

`test_ReentrancyBlocked`, `test_HookDataSpoofReverts`, `test_HookDataLengthReverts`, `test_HookAddressFlags`, `test_OnlyPoolManager`, `test_UnsafeWithdrawalReverts`, `test_UnauthorizedUnwind`, `test_KeeperScope`, `test_KeeperRevoked`, `test_DockedStrategyReverts`, `test_UnwindRevertsOnAllowance`, `test_ZeroFeeCollectorReverts`, `test_CastBounds`, `test_PriceOutOfBounds`, `test_WrongPoolReverts`, `test_OneBookPerTrader`, `test_StrategyHashReuseReverts`, `test_NoTokenCustody`, `test_BadDebtPath`, `test_MarkPriceOnlyHook`, `test_RouterBypassDocumented`, `test_WithdrawalValueUsesMaxSpotEntry`.

A test that asserts a limitation must say so in its name and its comment, so a reader does not mistake it for a fix. `test_RouterBypassDocumented` is the only test allowed to assert a bypass.

### 10.6 Release gates

| Gate | Condition | Owner |
| :---: | :--- | :--- |
| **G-1** | T-01–T-08 green; all golden vectors exact. | Both |
| **G-2** | T-09–T-14 green; Arkiv live or the track is dropped. | Both |
| **G-3** | T-15–T-22 green; docs and history ready. | Both |
| **G-4** | T-23–T-30 green; no open S-ID without a mitigation. | Both |
| **G-5** | Code freeze Fri Nov 6 2026 19:30 IST; only bug fixes after. | Both |
| **G-6** | Submission Sat Nov 7 2026 08:00 IST; video uploaded; form submitted. | Both |

---

## 11. Demo script

### 11.1 Format and hard constraints

| Item | Rule |
| :--- | :--- |
| Video length | `2:45` target; must be between `2:00` and `4:00`. Under `2:00` or over `4:00` is rejected at upload. |
| Resolution | `1920x1080`, `30` or `60` fps; minimum `720p`. |
| Audio | Human voice, recorded separately, no text-to-speech, no sped-up footage, no music louder than the voice. |
| Capture | Screen recorder, not a phone. Show the cursor and the terminal. |
| Claims | Every number on screen is produced by the running app, the test, or the replay script. No hardcoded result cards. |
| Limitations | The demo adapter, the fork, the scenario shock, the router limitation, and "tested, not audited" are stated in the video. |
| Upload | The final file is uploaded before Sat 08:00 IST; the submission form is saved; a local copy is kept. |

### 11.2 The `2:45` video script

| Time | Visual | Voiceover |
| :--- | :--- | :--- |
| `0:00–0:15` | Split screen: left "Isolated LP" with `$25,000` margin; right "ZeroMargin" with the same margin and a short hedge. | "A Uniswap v4 LP and a short hedge are usually two margin accounts. In a crash, the LP is liquidated with a penalty while the hedge pays out somewhere else. ZeroMargin puts them in one margin account and settles both legs in one transaction." |
| `0:15–0:35` | The 16-scenario grid animates; the numbers `$147,500` isolated and `$10,000` net appear. | "On our SPAN-style 16-scenario grid, a `$100,000` WETH/USDC LP hedged with a `$95,000` short needs `$10,000` of initial margin instead of `$147,500`. That is a `93.22%` reduction in locked collateral on this book. The grid is a simplified risk model, not CME's production algorithm." |
| `0:35–0:55` | Architecture diagram: wallet -> Aqua registry -> `ClearingAquaApp`; v4 `PoolManager` -> hook; Arkiv. | "The trader ships a USDC balance to a custom 1inch Aqua app. The app is the margin engine. A real Uniswap v4 hook guards the LP withdrawal. Arkiv stores a `300`-second risk attestation. The Aqua registry holds no tokens." |
| `0:55–1:20` | Terminal: `ship` `$25,000`; `openBook`; the book row appears; `rawBalances` before and after. | "The trader ships `$25,000`, opens the book, and the app checks the virtual balance before it accepts the position. The entry price is `$3,000` per WETH. The book is active." |
| `1:20–1:45` | UI: try to remove `$80,000` of LP; the transaction reverts; the error `SpanMarginBreach` shows `12,000` and `16,500`. | "Now the guard. Removing `$80,000` of LP would leave `$20,000` of LP against a `$95,000` short. The required margin becomes `$16,500`; the posted margin is `$12,000`. The hook reverts. The withdrawal never reaches the pool." |
| `1:45–2:15` | Terminal: `unwind(trader, -3000)`; the `Pushed` `28,500` and `Pulled` `33,800` events; the equity `19,700`; the isolated panel shows `-10,000` and `0`. | "Now the crash. A `-30%` shock. The short leg gains `$28,500`; the LP loses `$33,750`. The app pushes the gain into Aqua, pulls the net loss plus a `$50` fee, and returns `$19,700` of equity with zero bad debt. The isolated account is liquidated with a `$10,000` penalty and zero equity. The hedge adapter is a pre-funded demo counterparty, not a live venue." |
| `2:15–2:35` | `/arkiv` page: entity key, writer, `expiresAt` countdown, query row; the README query. | "Every book writes a wallet-owned Arkiv entity on Rabdi. It expires in `300` seconds. The keeper query finds books below `100%` margin. The contract recomputes the margin before it settles, so Arkiv is discovery and audit, not settlement." |
| `2:35–2:45` | End card: repo, three sponsor marks, "tested, not audited", "Base mainnet fork". | "The margin engine is the product. The hook is the guard. Aqua is the settlement rail. Arkiv is the audit trail. The code is tested, not audited; the demo runs on a Base mainnet fork." |

**Word budget.** The script is about `330` words, which fits `2:45` at a calm pace. Do not add sponsor logos that are not integrated. Do not say "first", "risk-free", or "production-ready".

### 11.3 The `4:00` live judging demo

| Time | Action | Say |
| :--- | :--- | :--- |
| `0:00–0:20` | Show the split screen and the two margin numbers. | The one-sentence pitch from `0:00–0:15` of the video. |
| `0:20–0:45` | Point at the isolated panel and the grid. | The problem and the `$147,500` vs `$10,000` comparison. |
| `0:45–1:10` | Show the architecture and the badges `LIVE-FORK`, `RABDI`. | The four components and what is live. |
| `1:10–1:40` | Click "Ship and open"; show the Aqua balance and the book. | The trader's `$25,000`; the app's checks; the entry price. |
| `1:40–2:10` | Click "Remove $80,000 LP"; show the revert; then a safe `$10,000` removal that passes. | The guard, the exact numbers, and the fact that a safe withdrawal still works. |
| `2:10–2:50` | Click "Crash -30%"; show the `Pushed`/`Pulled` events, the equity, and the isolated comparison. | The `$28,500` gain, `$33,750` loss, `$50` fee, `$19,700` equity, `$0` bad debt. |
| `2:50–3:20` | Switch to `/arkiv`; show the entity and query; switch to `/proof` and show the hook address `0x240` and the canonical addresses. | The Arkiv TTL, the writer, the query, the hook flags, and the canonical Aqua and v4 addresses. |
| `3:20–3:40` | Show `docs/LIMITATIONS.md` on screen. | The demo adapter, the scenario shock, the router limitation, the fork, and "tested, not audited". |
| `3:40–4:00` | End card. | "ZeroMargin: one margin account, two legs, one settlement." |

**Q&A.** The judge has three minutes. Use the ten answers in Section 14. If a judge asks for a claim that is not tested, say "we did not test that" and point to the limitation.

### 11.4 Failure drills

| Failure | Immediate action | What to say | Track impact |
| :--- | :--- | :--- | :--- |
| Base RPC fails | Switch to `make demo-offline`; keep the pre-recorded video ready. | "The public RPC is down; this is the local snapshot. The fork run is in the video." | Drop the 1inch and Uniswap live proof if the local mode is used on stage. |
| Arkiv write fails | Switch to `CACHE`; show the cached entity and the badge. | "The Rabdi write is down; this is the last live entity, cached." | Drop the Arkiv track if there is no live write. |
| Wallet rejects | Use the pre-signed script; retry once. | "The burner rejected; we will use the scripted transaction." | None if the script uses the same contracts. |
| Wrong chain | Stop; switch the wallet to Base; reload. | "Wrong chain; switching to Base." | None. |
| Empty book | Re-run the seed script; show the new book. | "The book was not seeded; here is the seed transaction." | None. |
| Docked strategy | Re-ship; reopen; show the new hash. | "The strategy was docked; here is the re-ship." | None. |
| Projector fails | Play the video. | "The projector is down; here is the recorded run." | None for the video; the live Q&A continues. |
| Time overrun | Skip the Arkiv beat; keep the crash and the guard. | "The Arkiv detail is in the README." | Arkiv may be under-shown; the submission materials still carry it. |

### 11.5 Demo prohibitions

- Do not record a phone screen.
- Do not speed up the footage.
- Do not show a `MockPoolManager` or a local `Aqua` as the sponsor integration.
- Do not show a hardcoded success card after a failed transaction.
- Do not say "live hedge" when the adapter is pre-funded.
- Do not say "audited" or "production-ready".
- Do not hide the fork badge or the `CACHE` badge.
- Do not show a wallet balance that the app did not produce.

---

## 12. Build order, owners, and gates

### 12.0 Pre-window prep (allowed by the rules)

ETHGlobal's Classic rule is about project-specific code, designs, and assets. Generic preparation is allowed; project code is not. Do these before kickoff:

| Allowed before kickoff | Not allowed before kickoff |
| :--- | :--- |
| Read this file and the build plan end to end. | Writing any contract, test, script, UI, or markdown for the submission repo. |
| Install Foundry `1.7.1`, Node `v24.10.0`, and verify the versions. | Cloning or forking a scaffold repo into the submission repo. |
| Run `cast interface` / `cast codesize` on the canonical addresses and record the results (Section C.6). | Deploying anything to Base, Base Sepolia, or Rabdi. |
| Read the Aqua, v4-core, v4-periphery, and Arkiv docs; pin the tags you intend to use. | Choosing the WETH/USDC pool parameters or the demo strategy hash as a committed design asset. |
| Write the list of questions for the sponsor booths. | Collecting a dataset that the submission depends on, unless the event explicitly permits it. |
| Rehearse generic skills: `HookMiner`, Anvil forking, Next.js App Router. | Recording the demo video. |
| Sleep, eat, and plan the cut order with the teammate. | Copying the reference implementation's comments or test names. |

If an organizer says a specific prep item is not allowed, drop it and record the ruling in `DECISIONS.md`.

### 12.1 How the 40 hours are counted

An **active hour** is a wall-clock hour in which at least one engineer is working. The other engineer may be sleeping, eating, or reviewing. The plan has `36` scheduled active hours and `4` unallocated buffer hours. It is **not** `72` person-hours: both engineers work in parallel during most build blocks, but during Phase 5 they stagger sleep so the video and the submission are never blocked on both people being awake.

| Block | Window (IST) | Scheduled | Buffer | Primary output | Gate |
| :--- | :--- | :---: | :---: | :--- | :---: |
| **Phase 1 — Rules, math, interfaces** | Thu Nov 5, 10:00–16:00 | `6.0 h` | `0 h` | Empty repo, toolchain, `SpanMathLib`, GV-01–GV-04, TS parity harness | **CP1** |
| *Break* | Thu 16:00–18:00 | — | — | Dinner and a real break. Do not code through it. | — |
| **Phase 2 — App, adapter, hook** | Thu 18:00–Fri 01:00 | `7.0 h` | `0 h` | `ClearingAquaApp`, `ShortHedgeAdapter`, `PortfolioMarginHook`, UNWIND-01 | **CP2** |
| *Sleep* | Fri 01:00–07:30 | — | — | At least `6.0 h` in bed. A sleep-deprived merge is slower than a clean one. | — |
| **Phase 3 — Arkiv, replay, docs** | Fri 08:00–13:30 | `5.5 h` | `0.5 h` | Live Rabdi entity, five `/arkiv/*.md`, replay, submission checker | **CP3** |
| **Phase 4 — Fork, UI, freeze** | Fri 13:30–19:30 | `6.0 h` | `1.0 h` | Fork tests, split-screen UI, deploy, README, freeze tag | **CP4** |
| **Phase 5 — Rehearsal, video, submit** | Fri 19:30–Sat 06:30 | `11.0 h` | `2.5 h` | Three rehearsals, `2:45` video, uploaded file, draft form | **CP5** |
| **Submission window** | Sat 06:30–08:00 | — | drawn from the Phase 5 buffer | Final read-back, form submit, confirmation saved | **G-6** |
| **Cutoff** | Sat 09:00 | — | — | One hour of slack. Do not plan to use it. | — |

`6.0 + 7.0 + 5.5 + 6.0 + 11.0 = 35.5` scheduled hours; the remaining `0.5 h` is the Phase 3 buffer, which counts as scheduled review time. Buffer is consumed only by a red gate; it is never reassigned to a new feature.

### 12.2 Owners

| Owner | Primary surface | Secondary surface | Must not own alone |
| :--- | :--- | :--- | :--- |
| **Engineer A — contracts and risk** | `SpanMathLib`, `ClearingAquaApp`, `ShortHedgeAdapter`, deploy scripts, Foundry unit/fuzz/fork tests, gas snapshot | README technical sections, `SECURITY_REVIEW.md` | The hook review and the video narration |
| **Engineer B — periphery and proof** | `PortfolioMarginHook`, web terminal, Arkiv adapter, replay script, video editing, submission form | Fork setup, UI e2e tests | The margin math review and the final claim read-back |
| **Both** | CP gates, `make ci`, claim lint, final read-back, submission | Incident response | Nothing that touches user funds is shipped without both |

Every contract merge requires a review by the engineer who did not write it. The review is a read of the diff plus the acceptance command, not a rubber stamp. Record the reviewer in the commit message, for example `feat(contracts): implement SpanMathLib (reviewed by B)`.

### 12.3 Work blocks

Each block ends with a commit and a one-line `PROGRESS.md` update. A block that is not green does not roll into the next block; the owner applies the named fallback or triggers a kill condition in Section 15.

#### Phase 1 — Rules, math, interfaces (Thu 10:00–16:00, `6.0 h`)

| ID | Owner | Est. | Deliverable | Acceptance | If red |
| :---: | :---: | :---: | :--- | :--- | :--- |
| **W1** | A | `1.0 h` | Empty repo created at kickoff; `README.md`, `LICENSE`, `docs/SPEC.md`, `docs/BUILD_PLAN.md` committed as planning artifacts with an AI note; `foundry.toml`, `remappings.txt`, `.env.example`, `Makefile`, `.gitignore`. | `forge --version` starts with `1.7.1`; `node --version` is `v24.10.0`; `git log --reverse --format='%ci' \| head -1` is after Thu 10:00 IST; `forge config --json` shows `solc 0.8.26`. | Reinstall Foundry with `foundryup -v 1.7.1`; if Node 24 is unavailable, install it with `nvm install 24.10.0`. Do not start with Node 22. |
| **W2** | A | `2.0 h` | `SpanMathLib.sol` with the structs and five functions in Section 6.1; `signedFloorDiv`, `ceilDiv`, `capitalSavingsBps`; rounding directions in comments. | `forge build` exits `0`; `forge inspect SpanMathLib methods` lists the five functions; `grep -nE 'float\|double' src/libraries/SpanMathLib.sol` returns nothing. | If `Stack too deep`, extract `_shockBps(uint8)` and `_netPnl(uint256,uint256,int256,uint256)` helpers before enabling `via_ir`. `via_ir = true` is the last resort and is recorded in `DECISIONS.md`. |
| **W3** | A | `1.0 h` | `data/golden_vectors.json` with GV-01–GV-04; `contracts/test/SpanMath.t.sol` with exact assertions from Section 10.3; rounding and gas tests. | `forge test --match-contract SpanMathTest -vv` passes; GV-01–GV-04 match to the base unit; `evaluateSpan16` gas `<= 30,000`. | Do not edit the vectors to match the code. Debug the formula with `-vvvv`; the three likely bugs are the `γ` scale, the basis haircut rounding, and `signedFloorDiv` on a negative numerator. |
| **W4** | B | `1.5 h` | `IAqua.sol` with `ship`, `dock`, `push`, `pull`, `rawBalances`, `safeBalances`; `IPoolManagerMinimal.sol`; pinned `IHooks.sol`; `IShortHedgeAdapter.sol`; `web/src/lib/spanMath.ts` parity harness. | `forge build` exits `0`; `node web/src/test/spanParity.test.ts` prints `4/4 golden vectors match`. | If the Aqua interface differs from the pinned package, stop and reconcile against the installed source. Do not guess a selector. |
| **W5** | Both | `0.5 h` | CP1 review: diff read, `make setup`, T-01–T-03, first `PROGRESS.md`. | All of T-01, T-02, T-03 green; `git tag cp1`; commit `chore: checkpoint 1 - rules gate, math, interfaces`. | Consume `1.0 h` of buffer. If the gate is still red at Thu 17:00, trigger **K-05**. |

#### Phase 2 — App, adapter, hook (Thu 18:00–Fri 01:00, `7.0 h`)

| ID | Owner | Est. | Deliverable | Acceptance | If red |
| :---: | :---: | :---: | :--- | :--- | :--- |
| **W6** | A | `2.5 h` | `ClearingAquaApp.sol` open path: `openBook`, `quoteOpen`, `addMargin`, `setKeeper`, `closeBook`, access matrix, events, errors; `ShortHedgeAdapter.sol` with `fundReserve`, `previewShortGainUsdc`, `receiveLpLoss`. | `forge test --match-contract ClearingAquaAppTest -vv` and `ShortHedgeAdapterTest -vv` pass; `test_NoTokenCustody` passes; `forge build --sizes` shows the app under `24,576` bytes. | Cut `addMargin` and `closeBook` to SHOULD if the open path is not green by 22:30. The open path and the unwind are the product. |
| **W7** | A | `1.5 h` | `unwind`, `quoteUnwind`, `realizeGainToAqua` integration, UNWIND-01, `testFuzz_QuoteMatchesUnwind` with 256 runs, bad-debt path, keeper authorization. | T-05 passes: `28,500e6` netted, `33,750e6` LP loss, `50e6` fee, `19,700e6` equity, `0` bad debt; quote equals execution for 256 runs. | If the adapter push/pull sequence cannot be made atomic in one transaction, stop and trigger **K-06**. Do not ship a two-transaction settlement while claiming atomic. |
| **W8** | B | `2.5 h` | `PortfolioMarginHook.sol` with real `IHooks` signatures, `BaseHook`, mined `0x240` address, `_withdrawnUsd` with `max(spot, entry)`, `beforeRemoveLiquidity` guard, `afterSwap` mark update; unit tests with `MockPoolManager`. | T-06 passes; `uint160(address(hook)) & 0x3FFF == 0x240`; GV-04 reverts `SpanMarginBreach(trader, 12_000e6, 16_500e6)`; both token orderings pass; only `PoolManager` can call. | If the pinned `Hooks.Permissions` struct differs, adapt the override and record it. If `HookMiner` cannot find a salt in `10` minutes, widen the search and keep the deployer constant. If the hook cannot be mined by 00:30, drop the Uniswap track (**K-03**) and keep the app. |
| **W9** | Both | `0.5 h` | CP2 review: full `make test`, claim lint, diff review, `PROGRESS.md`. | All unit and fuzz tests green; `python3 scripts/lint_claims.py` exits `0`; `git tag cp2`; commit `chore: checkpoint 2 - app, adapter, hook`. | Consume `1.5 h` of buffer. If the gate is still red at Fri 02:30, cut the hook fork proof and trigger **K-03** only if the fork proof is also red. |

#### Phase 3 — Arkiv, replay, docs (Fri 08:00–13:30, `5.5 h` + `0.5 h` buffer)

| ID | Owner | Est. | Deliverable | Acceptance | If red |
| :---: | :---: | :---: | :--- | :--- | :--- |
| **W10** | B | `2.0 h` | `web/src/lib/arkiv.ts` with `RiskAttestationStore`; `zeromargin.span_attestations` schema; live `createEntity` and `select`; cache fallback; `npm run arkiv:verify`. | T-11 prints the entity key, writer address, `expiresAt`, `expiresAt - now <= 300`, and one query row; the badge is `LIVE-RABDI` in live mode and `CACHE` in cache mode. | If the faucet or access key is unavailable by 10:00, switch to cache, drop the Arkiv track (**K-04**), and spend the block on the replay and README. Do not fake a live write. |
| **W11** | B | `1.0 h` | `arkiv/schema.md`, `friction.md`, `reach.md`, `why-arkiv.md`, `how-you-use-arkiv.md`; README writer wallet and one runnable query. | T-12 passes; all five files are non-empty; the schema string appears in `schema.md`, README, and the query; `make check-submission` exits `0`. | Write the five files from the actual build, not from a template. If a file would be fabricated, drop the track instead. |
| **W12** | A | `1.5 h` | `data/basis_30d.json` with `43,200` one-minute observations; `npm run replay`; SHA-256; P99 and max; the three crash dates; UI numbers. | T-09 prints the SHA-256, the three dates, and the recomputed P99 and max; `data/README.md` cites source, license, retrieval date, and hash. | If the data license is unclear, use a public source with a cited license or drop BR4 and Claim 3. Do not paste the reference hash. |
| **W13** | Both | `0.5 h` | CP3 review: `make check-submission`, `npm run replay`, `npm run arkiv:verify` (or cache), README read. | All green or the failed track is removed from UI, README, video script, and form; `git tag cp3`; commit `chore: checkpoint 3 - arkiv, replay, docs`. | Consume `1.5 h` of buffer. If Arkiv is dropped, the remaining two tracks still stand. |

#### Phase 4 — Fork, UI, freeze (Fri 13:30–19:30, `6.0 h`)

| ID | Owner | Est. | Deliverable | Acceptance | If red |
| :---: | :---: | :---: | :--- | :--- | :--- |
| **W14** | A | `2.0 h` | `DeployFork.s.sol`, `DeploySepolia.s.sol`, `AquaForkTest`, `PortfolioMarginHookForkTest`; canonical addresses; pool creation; hook mining; fork block recorded. | T-07 and T-08 pass against the Base fork; T-17 prints every address and constructor argument; the canonical Aqua registry address is printed in the test output. | If the public RPC rate-limits, use a private RPC in `.env.local`. If canonical Aqua is unreachable, drop the 1inch track (**K-02**). If the v4 `PoolManager` call cannot be made, drop the Uniswap track (**K-03**). |
| **W15** | B | `2.0 h` | Split-screen terminal, `/arkiv`, `/replay`, `/proof`, API routes, badges, error states, e2e test, screenshots. | T-13 passes: the four numbers, the guard revert, the Arkiv row, and the badge are visible; quote under `500` ms; unwind under `5` s. `npm run build` exits `0`. | Cut `/replay` and the chart first; keep the split screen, the guard, the crash, and `/arkiv`. A UI that hides a failed transaction is worse than a plain UI. |
| **W16** | A | `1.0 h` | README, `docs/LIMITATIONS.md`, `docs/SECURITY_REVIEW.md`, `docs/DEPENDENCIES.md`, `docs/STORAGE.md`, `docs/REPRO.md`, AI disclosure, `FEEDBACK.md`, submission checklist. | T-18, T-20, T-24, T-25, T-26 pass; every S-ID is mapped; the README points to the exact hook, engine, and pool lines. | If a doc is incomplete, write the limitation first. A missing limitation is a false claim; a missing architecture diagram is not. |
| **W17** | Both | `1.0 h` | Freeze review: `make ci`, `make check-submission`, `forge snapshot --check`, claim lint, gas sizes, full diff read, `PROGRESS.md`. | All of T-15–T-29 green; `git tag freeze`; commit `chore: code freeze`; the freeze time is recorded in `PROGRESS.md`. | Consume `1.0 h` of buffer. If a MUST is red at 20:30, cut the lowest-priority track and record it; do not extend the freeze. |

#### Phase 5 — Rehearsal, video, submission (Fri 19:30–Sat 06:30, `11.0 h`)

| ID | Owner | Est. | Deliverable | Acceptance | If red |
| :---: | :---: | :---: | :--- | :--- | :--- |
| **W18** | Both | `1.5 h` | Three timed rehearsals of the `4:00` live demo and the `2:45` video script; failure drills from Section 11.4. | T-30 passes: three runs under `4:00`; the numbers match; no unhandled error; one drill (RPC down or Arkiv down) is executed. | If a number is wrong, fix the app or the script before recording. Never edit the number in the voiceover to match a failed run. |
| **W19** | B | `3.0 h` | Record and edit the `2:45` video: `1080p`, human voice, cursor visible, badges visible, limitations stated. | The file is `2:00`–`4:00`, at least `720p`, audio is intelligible, no text-to-speech, no sped-up footage, no phone recording; a local copy exists. | If the recorder fails, use a second machine or the pre-recorded rehearsal. Do not record a phone screen as the primary video. |
| **W20** | A | `1.5 h` | Upload the video; draft the submission form: project name, description, repo, video URL, exactly three sponsor tracks, team, AI disclosure. | The video URL plays in an incognito window; the repo URL returns `200`; the form has exactly three tracks; the draft is saved. | If the upload fails, use an unlisted YouTube or Vimeo link and keep the local file. Do not submit a broken link. |
| **W21** | Both | `1.0 h` | Independent read-back: README claims vs evidence, banned claims, Arkiv files, license, contract addresses, AI disclosure, video length. | Every claim in Section 2 maps to a test, a tx, or a file; `python3 scripts/lint_claims.py` exits `0`; no `TBD`/`TODO`; the repo is public. | Fix the claim or remove it. A claim that cannot be shown in 30 seconds is removed. |
| **W22** | Both | `2.5 h` | Final submission at Sat 08:00 IST; save the confirmation; record the submission time in `PROGRESS.md`. | The confirmation page or email is saved; the time is before `08:00` IST; the repo and video are still reachable at `08:30`. | If the form fails, submit at `08:15` with the same content; if the deadline is `09:00`, there is one hour of slack. Do not wait for a perfect form. |
| **W23** | Both | `1.5 h` | Post-submission buffer: monitor the repo, the video, and the form; respond to organizer questions. | No broken link; no accidental commit after submission; the freeze tag is intact. | If a critical fix is needed, make it, commit it, and note it in the submission only if the form allows an edit. Do not change the video after submission unless the platform allows it. |

`1.5 + 3.0 + 1.5 + 1.0 + 2.5 + 1.5 = 11.0 h`.

### 12.4 Checkpoints

| Checkpoint | Time (IST) | Green means | If red |
| :---: | :--- | :--- | :--- |
| **CP1** | Thu 16:00 | Repo starts empty; toolchain pinned; `SpanMathLib` and GV-01–GV-04 exact; TS parity `4/4`. | Use `1.0 h` buffer. If still red at 17:00, **K-05**. |
| **CP2** | Fri 01:00 | App, adapter, and hook unit tests green; UNWIND-01 exact; quote parity `256` runs; claim lint clean. | Use `1.5 h` buffer. If still red at 02:30, cut the hook fork proof and **K-03** if needed. |
| **CP3** | Fri 13:30 | Arkiv live or the track is dropped; replay numbers or BR4 is dropped; five Arkiv docs; submission checker green. | Use `1.5 h` buffer. If still red at 15:00, drop the failed track and move to Phase 4. |
| **CP4** | Fri 19:30 | Fork tests green; UI e2e green; docs complete; `make ci` green; `freeze` tag. | Use `1.0 h` buffer. If still red at 20:30, cut the lowest-priority track and freeze what is green. |
| **CP5** | Sat 06:30 | Video uploaded; form drafted; three rehearsals; read-back complete. | Use the `1.5 h` submission buffer. Submit by `08:00` even if a SHOULD is missing. |

### 12.5 Freeze discipline

After Fri Nov 6 2026 19:30 IST, only these changes are allowed:

1. A bug fix that turns a red MUST gate green.
2. A copy edit that removes a false or unsupported claim.
3. A video, form, or submission fix.
4. A security fix for a leaked secret or a broken access control.

Not allowed after freeze: new features, new dependencies, refactors, test rewrites that weaken an assertion, contract redeploys unless the deployed contract is unusable, and “one more idea” from a teammate. A redeploy after freeze requires both engineers to agree, a `DECISIONS.md` entry, and a re-run of T-07, T-08, and T-13.

### 12.6 Cut order

Cut from the top. Never cut from the bottom.

| Priority | Item | Why it can be cut | What must be said after the cut |
| :---: | :--- | :--- | :--- |
| 1 | `BR6` custom SwapVM opcode `0xf1` | It is a stretch, not the core 1inch integration. | Nothing; it was never claimed. |
| 2 | `/replay` page and chart | The replay script and the numbers are the proof; the chart is presentation. | The video and README still show the replay output. |
| 3 | Arkiv track | It is one of three sponsors; the other two can carry the submission. | Remove the Arkiv logo, claim, and track selection everywhere in the same pass. |
| 4 | BR4 basis replay | Claim 3 depends on it; without it, Claim 3 is removed. | Remove the P99/max claim from README, UI, and video. |
| 5 | Live fork UI | The pre-recorded video still shows the fork run. | The live demo badge becomes `LOCAL`; the 1inch and Uniswap live proof is in the video, not on stage. |
| 6 | 1inch track | If canonical Aqua cannot be used, the claim is false. | Remove the 1inch logo, claim, and track selection. Keep the Uniswap and Arkiv tracks. |
| 7 | Uniswap track | If the hook is not called by a canonical `PoolManager`, the claim is false. | Remove the Uniswap logo, claim, and track selection. Keep the 1inch and Arkiv tracks. |
| — | **Never cut** | Golden vectors, margin math, the withdrawal guard unit test, the Aqua `ship/push/pull` test, the submission form, the video, the AI disclosure, the rules gate. | If one of these is red, the project is not submittable as ZeroMargin. |

### 12.7 Commit and branch discipline

| Rule | Acceptance |
| :--- | :--- |
| One branch, `main`; no long-lived feature branches. | `git branch --show-current` returns `main`. |
| One commit per work block, plus fix commits. | `git log --oneline` has at least `20` commits by submission. |
| Conventional messages with the work-block ID. | `git log --format='%s' \| grep -cE '^(feat\|fix\|test\|docs\|chore\|ci)(\(.+\))?: '` is at least `20`. |
| No single commit over `2,000` changed lines after the first two setup commits. | `git show --stat <sha>` is reviewed at CP2 and CP4. |
| Tags at every checkpoint. | `git tag` lists `cp1`, `cp2`, `cp3`, `cp4`, `freeze`, `submission`. |
| No secrets in history. | `gitleaks detect --no-git` and `git log -p \| grep -iE 'PRIVATE_KEY\|ACCESS_KEY'` return nothing. |
| No generated build output committed. | `git ls-files \| grep -E '^(out\|cache\|node_modules\|\.next)/'` returns nothing. |
| The AI disclosure is committed before the video. | `grep -n 'AI' README.md` shows the section; the section names the files and the tools. |

### 12.8 What not to do

- Do not start with the UI. The numbers are the product; a beautiful terminal over wrong math loses every track.
- Do not build the `0xf1` opcode before the Aqua app works. The stretch cannot rescue a broken core.
- Do not deploy to Base mainnet with real funds. The demo is a fork; a mainnet deployment is optional and must use a burner.
- Do not add a fourth sponsor. The cap is three, and a fourth claim dilutes the proof.
- Do not tune the golden vectors to the implementation. The vectors are the specification.
- Do not claim “atomic” if the settlement takes two transactions. The word is in Claim 2; make it true or remove it.
- Do not record the video before the freeze. A video that shows a feature you later cut is a false claim.

---

## 13. Submission checklist

The submission is a set of artifacts, not a form. Every row below has an owner, a deadline, and a command or URL that proves it. A row that is not proven is removed from the submission or disclosed as a limitation; it is never left as an optimistic claim.

### 13.1 Hard gates

| # | Gate | Evidence | Owner | Deadline |
| :---: | :--- | :--- | :---: | :--- |
| **H-01** | The repo was created empty after kickoff. | `git log --reverse --format='%ci' \| head -1` is after Thu Nov 5 2026 10:00 IST (the assumed kickoff; if check-in gives a later time, the first commit must be after that time). | A | CP1 |
| **H-02** | No pre-event code was copied. | `git log --reverse --stat` shows the first commit is `README.md` + `LICENSE`, the second is `docs/SPEC.md` + `docs/BUILD_PLAN.md`; no file from `agents/zeromargin/scaffold/` appears in the repo; a manual diff against the scaffold shows different file structure and comments. | Both | CP4 |
| **H-03** | At least `20` commits, no single-commit dump. | `git log --oneline \| wc -l` is at least `20`; `git show --stat` on every commit after the first two is under `2,000` changed lines; `git log --format='%ci'` spans at least two calendar days. | Both | CP4 |
| **H-04** | The repo is public and open source. | `curl -s -o /dev/null -w '%{http_code}' "$REPO_URL"` returns `200`; `head -1 LICENSE` contains `MIT`; GitHub shows the license. | A | CP4 |
| **H-05** | AI use is disclosed. | `README.md` has an `AI use` section naming the tools, the files or areas assisted, and what a human reviewed and changed; the spec and build plan are committed as planning artifacts with the same note. | A | CP4 |
| **H-06** | The video meets the format rules. | File is `2:00`–`4:00`, at least `720p`, human voice, not sped up, not a phone recording, cursor and terminal visible, limitations stated. | B | CP5 |
| **H-07** | The submission is before the cutoff. | The form confirmation timestamp is before Sat Nov 7 2026 09:00 IST; the internal target is `08:00` IST. | Both | G-6 |
| **H-08** | Exactly three sponsor tracks are selected. | The form lists 1inch, Uniswap Foundation, and Arkiv; no fourth partner prize; each has its own evidence block in Section 13.5. | A | CP5 |
| **H-09** | No banned claim appears in the repo or the video. | `python3 scripts/lint_claims.py` exits `0`; the video transcript is read against Section 0.6; `audited`, `production-ready`, and `risk-free` appear only in negated form. | Both | CP5 |
| **H-10** | Every number in the video is produced by the app, a test, or the replay script. | The video shows the command or the UI that produced each number; no hardcoded result card; the four key numbers match T-05 and T-13. | Both | CP5 |

### 13.2 Repository checklist

| # | Item | Required content | Proof |
| :---: | :--- | :--- | :--- |
| **R-01** | `README.md` | One-sentence product; the problem; the mechanism; the architecture diagram; quick start; demo mode; deployed addresses; the three sponsor proofs; the limitations from Section 9.3; the AI disclosure; the Arkiv writer wallet and one runnable query; the exact hook, engine, and pool lines. | `npm run readme:check` exits `0`; a human reads it in under `5` minutes. |
| **R-02** | `LICENSE` | MIT, current year, the two registered team members as copyright holders. | `head -5 LICENSE`. |
| **R-03** | `FEEDBACK.md` | What was easy, what was hard, what the team would change in the Uniswap v4 developer experience; at least `300` words; no invented API. | `wc -w FEEDBACK.md` is at least `300`; the Uniswap form confirmation is in `docs/UNISWAP_FORM.md`. |
| **R-04** | `arkiv/schema.md` | The exact schema string `zeromargin.span_attestations`, every field, type, index, TTL, and one example entity. | `grep -n 'zeromargin.span_attestations' arkiv/schema.md README.md web/src/lib/arkiv.ts` returns three matches. |
| **R-05** | `arkiv/friction.md` | What was hard about Arkiv: SDK, faucet, TTL, query syntax, docs gaps; concrete, not polite. | `wc -w` at least `200`; a specific issue is named. |
| **R-06** | `arkiv/reach.md` | Who would use the attestation: keepers, risk desks, LP managers, auditors; one concrete workflow. | A named user and a query are described. |
| **R-07** | `arkiv/why-arkiv.md` | Why a time-scoped entity is better than a database or an onchain mapping for this data. | The TTL and the discovery use case are explained. |
| **R-08** | `arkiv/how-you-use-arkiv.md` | The exact write path, read path, schema, TTL, writer wallet, and query. | Commands and code references are present. |
| **R-09** | `docs/LIMITATIONS.md` | All ten limitations from Section 9.3, each with the impact and the production fix. | Every limitation appears in the README or is linked from it. |
| **R-10** | `docs/SECURITY_REVIEW.md` | Every S-ID from Section 9.2 mapped to a test or a documented limitation. | `npm run security:map` exits `0`. |
| **R-11** | `docs/DEPENDENCIES.md` | Exact tags and commit hashes for `v4-core`, `v4-periphery`, OpenZeppelin; exact versions for `@arkiv-network/sdk`, `viem`, Next.js, React. | `git submodule status` and `npm ls` match the file. |
| **R-12** | `docs/STORAGE.md` | `forge inspect ClearingAquaApp storage-layout` and `PortfolioMarginHook storage-layout`; no proxy. | The commands are recorded with their output. |
| **R-13** | `docs/REPRO.md` | Clean-machine setup, exact versions, `make setup && make test`, expected time. | A timed run under `10` minutes is recorded. |
| **R-14** | `docs/UNISWAP_FORM.md` | The form URL, the submission timestamp, the `FEEDBACK.md` link, and the confirmation. | The confirmation is a screenshot or a text copy. |
| **R-15** | `docs/SUBMISSION.md` | The three tracks, the form fields, the video URL, the repo URL, the submission timestamp, and the confirmation. | Written before the final submit and updated after. |
| **R-16** | `.env.example` | Every variable in Section 16 with a safe default and a comment; no secret values. | `grep -E 'PRIVATE_KEY\|ACCESS_KEY\|MNEMONIC' .env.example` returns names only. |
| **R-17** | `data/README.md` | Source, license, retrieval date, row count (`43,200`), and SHA-256 of `basis_30d.json`. | The hash matches `npm run replay`. |
| **R-18** | `data/golden_vectors.json` | GV-01–GV-04 with the exact values in Section 10.3. | `node web/src/test/spanParity.test.ts` prints `4/4`. |
| **R-19** | `scripts/lint_claims.py` | The script in Section 0.6, executable, wired into `make lint`. | `python3 scripts/lint_claims.py` prints `PASS`. |
| **R-20** | `Makefile` | `setup`, `build`, `test`, `fork-test`, `arkiv-verify`, `replay`, `lint`, `demo`, `demo-offline`, `check-submission`, `snapshot`, `screenshots`, `ci`. | `make ci` and `make check-submission` exit `0`. |

### 13.3 Video checklist

| # | Item | Rule | Proof |
| :--- | :--- | :--- | :--- |
| **V-01** | Length | `2:45` target; must be `2:00`–`4:00`. | `ffprobe -v error -show_entries format=duration -of csv=p=0 video.mp4` prints a number in range. |
| **V-02** | Resolution | `1920x1080`; minimum `720p`. | `ffprobe` shows `1920` width and `1080` height. |
| **V-03** | Audio | Human voice, recorded separately; no text-to-speech; no music louder than the voice. | A human listens to the first `30` seconds and the last `30` seconds. |
| **V-04** | No speed-up | The terminal and the UI run at normal speed; long waits are cut, not sped up. | A human checks the transaction confirmation and the countdown. |
| **V-05** | Screen capture | Screen recorder, not a phone; cursor visible; terminal visible for the commands. | The first frame shows a desktop, not a phone bezel. |
| **V-06** | Claims | Every number is produced live; the limitations are stated; no banned claim. | The transcript is read against Section 0.6 and Section 9.3. |
| **V-07** | Badges | `LIVE-FORK`, `RABDI`, and `DEMO` (where applicable) are visible when the corresponding surface is shown. | A frame check at `0:55`, `1:45`, and `2:15`. |
| **V-08** | Sponsor proof | The canonical Aqua address, the v4 `PoolManager` address, the hook `0x240` flags, and the Arkiv entity are shown or explicitly referenced. | The frames at `1:45`–`2:35` show or name them. |
| **V-09** | Upload | The URL plays in an incognito window with no login. | `curl -I "$VIDEO_URL"` returns `200`; a second browser plays it. |
| **V-10** | Backup | A local copy and a second upload exist. | `ls -lh video.mp4` and the second URL are in `docs/SUBMISSION.md`. |

### 13.4 Form checklist

The exact field labels are not published in the public details page; they are confirmed on the day. The content below is fixed. `[to verify: exact form labels and character limits at submission]`

| # | Field | Content | Owner |
| :--- | :--- | :--- | :---: |
| **F-01** | Project name | `ZeroMargin` | A |
| **F-02** | One-liner | `Cross-margin a Uniswap v4 LP against a short hedge inside one 1inch Aqua balance, and settle a crash in one transaction.` | A |
| **F-03** | Description | The problem, the mechanism, the exact `$147,500` vs `$10,000` result, the three sponsor proofs, and the limitations. `150`–`300` words. | A |
| **F-04** | Repo URL | The public GitHub URL. | A |
| **F-05** | Video URL | The uploaded `2:45` video. | B |
| **F-06** | Sponsor tracks | Exactly 1inch (`Build an Aqua App`), Uniswap Foundation (`Build with Uniswap`), Arkiv (`Build on Arkiv (from scratch)`). | A |
| **F-07** | Team | The two registered team members; no extra names. | A |
| **F-08** | AI disclosure | The same text as the README section; name the tools and the assisted files. | A |
| **F-09** | Contract addresses | App, hook, adapter, `PoolManager`, Aqua registry, pool ID, chain ID, fork block. | A |
| **F-10** | Limitations | A short list: demo adapter, scenario shock, router bypass, fork, not audited. | A |
| **F-11** | Confirmation | Screenshot or email saved to `docs/SUBMISSION.md`. | Both |

### 13.5 Sponsor evidence blocks

| Track | What the judge must be able to find in `30` seconds | Where it lives |
| :--- | :--- | :--- |
| **1inch** | A custom `AquaApp`; a real `ship` of `25,000e6` USDC; a `push` of `28,500e6`; a `pull` of `33,800e6`; the canonical registry address `0x1111113ccf1426a8e30e2bff5e005d929bf6a90a`; a fork tx hash; the statement that `SwapVM` `0xf1` is a stretch, not the core. | README `1inch` section; `AquaForkTest`; `/proof` page; video `1:45`–`2:15`. |
| **Uniswap** | A real v4 hook at a mined `0x240` address; the canonical `PoolManager` `0x498581ff718922c3f8e6a244956af099b2652b2b`; a `SpanMarginBreach` revert with `12,000e6` and `16,500e6`; a safe withdrawal in the same pool; `FEEDBACK.md`; the form confirmation. | README `Uniswap` section; `PortfolioMarginHookForkTest`; `/proof` page; video `1:20`–`1:45`; `docs/UNISWAP_FORM.md`. |
| **Arkiv** | A live Rabdi entity key; the writer wallet; the `300`-second expiry; one runnable query; the five `/arkiv/*.md` files; the schema. | README `Arkiv` section; `/arkiv` page; `arkiv/`; video `2:15`–`2:35`; `npm run arkiv:verify`. |

### 13.6 Final read-back (Sat 06:30–08:00)

Read these aloud, in this order, from the submitted artifacts, not from memory:

1. The one-liner. Does it claim anything the demo does not show?
2. The `$147,500` vs `$10,000` sentence. Do the numbers match `T-02` and the video?
3. The `93.22%` sentence. Is it labeled as the GV-01 book, not a universal result?
4. The `28,500` / `33,750` / `50` / `19,700` sentence. Do the numbers match `T-05`?
5. The hook sentence. Does it say “direct `modifyLiquidity` by the book owner” and “router withdrawals are not guarded”?
6. The Aqua sentence. Does it say “Base mainnet fork” and “pre-funded demo adapter”?
7. The Arkiv sentence. Does it say “Rabdi testnet” and “expires in 300 seconds”?
8. The limitations list. Are all ten present in the README or linked?
9. The AI disclosure. Does it name the tools and the files?
10. The license and repo visibility. Are both real?

If any answer is no, fix the artifact or remove the claim. Do not fix it in the voiceover only.

### 13.7 Submission record

`docs/SUBMISSION.md` must contain:

| Field | Value |
| :--- | :--- |
| Submission time (IST) | The timestamp from the form confirmation. |
| Cutoff | Sat Nov 7 2026 09:00 IST. |
| Tracks | 1inch, Uniswap Foundation, Arkiv. |
| Repo URL | The public URL. |
| Video URL | The primary uploaded URL and the backup. |
| Contract addresses | App, hook, adapter, `PoolManager`, Aqua, pool ID. |
| Fork block | The block number used by the demo. |
| Arkiv entity | The entity key, writer wallet, and expiry. |
| Uniswap form | The timestamp and confirmation. |
| Known gaps | Any SHOULD that is not green, with the reason. |
| Confirmation | A screenshot or a text copy. |

---

## 14. Judge and VC red-team Q&A

Twelve answers. Each is under `120` words so it fits a three-minute Q&A. If a question goes beyond these answers, say “we did not test that” and point to the limitation. Do not improvise a number.

### Q1. Is the short hedge live?

**No.** The hedge is a pre-funded `ShortHedgeAdapter` with a `100,000e6` USDC reserve. It pays the short gain into Aqua and receives the LP loss. It is a demo counterparty, not a perp venue. The interface is real and a production adapter would connect to a venue with collateral and an oracle. We label the adapter in the UI, the README, and the video. Claiming that a venue is connected would be false, and the 1inch and Uniswap tracks do not depend on that claim.

### Q2. How does the margin fall from `$147,500` to `$10,000`?

On the GV-01 book — `$100,000` LP, `$95,000` short, `$25,000` posted — the isolated initial margin is `$147,500`. The 16-scenario grid finds a worst loss of `$5,250` and a `500` bps basis haircut of `$4,750`, so the net initial margin is `$10,000`. That is a `93.22%` reduction. It is not universal: the unhedged GV-03 book saves `66.25%`, and the under-hedged GV-04 book saves `75.55%`. The hedge ratio and the basis haircut drive the number.

### Q3. What if the hedge leg cannot pay?

The adapter reverts if the gain exceeds its reserve, and the book stays active. The demo reserve is `$100,000`; the GV-01 gain is `$28,500`, so the demo is covered. A production adapter needs venue collateral, a margin agreement, and an oracle. We do not claim the adapter is solvent beyond its reserve. The `unwind` is authorized to the trader or a keeper, so a random caller cannot force a settlement against a thin reserve.

### Q4. Is this CME SPAN?

**No.** It is a SPAN-style 16-scenario grid: eight price shocks from `-3,000` to `+2,000` bps and two volatility states, `0` and `150` bps. It uses a `500` bps cross-venue basis haircut and a `5,000` bps LP convexity factor. CME's production SPAN has more scenarios, more asset classes, and a different scan range. We use the words "SPAN-style" everywhere and never the exchange's name for its algorithm. The model is deterministic and tested; it is not a regulatory margin model.

### Q5. What happens if ETH pumps?

The LP gains and the short loses. The preview computes that waterfall for the withdrawal guard, but the onchain `unwind` reverts `UnsupportedShockDirection` for a positive shock. The atomic netted settlement is built for the crash direction, where the short gain can be pushed into Aqua. A production version needs a symmetric settlement path and an oracle. This is a documented limitation, not a hidden one. The guard still uses the positive-shock preview to block an unsafe withdrawal.

### Q6. Why 1inch Aqua?

Aqua gives us a virtual balance that acts as the margin account without moving tokens into the app. The trader `ship`s USDC, the adapter `push`es the hedge gain, and the app `pull`s the net loss plus fee. The canonical registry is on Base mainnet at `0x1111113ccf1426a8e30e2bff5e005d929bf6a90a`. The app is a custom `AquaApp`, not a swap wrapper. The virtual balance is the product; the `0xf1` SwapVM opcode is a stretch, not the core claim.

### Q7. Why a Uniswap v4 hook?

The hook is the enforcement point. `beforeRemoveLiquidity` computes the USD value of the removed liquidity and reverts `SpanMarginBreach` if the post-withdrawal equity is below the required initial margin. It uses the real `PoolManager`, the real `IHooks` signatures, and a mined `0x240` address. A router withdrawal bypasses the guard because the hook sees the router as `sender`; we state that. A production version would use a position NFT or a caller allowlist.

### Q8. Why Arkiv?

Arkiv is the discovery and audit layer, not the settlement authority. Each book writes a `zeromargin.span_attestations` entity on Rabdi with a `300`-second expiry: status, margin ratio, equity, net initial margin, and the Aqua strategy hash. A keeper can query `UNWIND_ELIGIBLE` books without asking us for access. The contract recomputes the margin before it settles, so a forged entity can mislead ordering, not the math. The five rubric files explain the schema, the friction, the reach, the why, and the how.

### Q9. How do you make money?

A `5` bps fee on LP notional at unwind: `$50` on `$100,000`. The fee is not charged when the book has bad debt. The model is volume-dependent and has no token. The real revenue would come from market makers and LP managers who want one margin account instead of two, plus a spread on the hedge leg when it is connected to a venue. We have not validated willingness to pay; that is a post-hackathon question, not a hackathon claim.

### Q10. What is not tested?

No oracle, no live perp venue, no router guard, no audit, no mainnet deployment. The demo is a Base mainnet fork. The risk grid covers `-30%` to `+20%` and hedge ratios of `80%`–`95%`. The adapter reserve is finite. The positive-shock unwind is unsupported. The fee and the basis haircut are calibrated, not market-tested. If a judge asks for a claim outside this list, the honest answer is “we did not test that,” followed by the limitation.

### Q11. Why should this win over a polished swap app?

Because the mechanism is the hard part. A swap app reuses a router; ZeroMargin changes the margin primitive: two legs, one virtual balance, one settlement. The reference math closes, the golden vectors are exact, and the guard is a real v4 hook. The demo is narrow on purpose: one book, one crash, one settlement. The three sponsor integrations are each load-bearing, not logos. The risk is honest: `21%` finalist probability with the counted band-raisers, not a guaranteed win.

### Q12. What would you build next?

Three things, in order: a hedge adapter connected to a live venue with collateral and an oracle; a position-NFT or caller-allowlist guard that closes the router bypass; and a symmetric unwind for positive shocks. After that, a keeper network with a dispute window and a second venue for the basis trade. The current build is the smallest version that proves the margin math and the settlement rail. We would not add a token or a fourth sponsor before those three.

---

## 15. Kill conditions

A kill condition is not a warning. It is a pre-agreed stop or cut. The owner triggers it, records the time and the evidence in `PROGRESS.md`, and takes the named action. No one “sees how it goes” past the latest time. The goal is to protect the team from a sunk-cost submission that loses every track.

### 15.1 Conditions

| ID | Trigger | Detection | Action | Owner | Latest time |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **K-01** | The rules gate cannot be satisfied: the repo cannot start empty, the spec is ruled a pre-event design asset and the organizer says stop, or a scaffold file is already in the submission. | A written organizer answer, or `git log` showing a first commit before kickoff, or a diff that matches the scaffold. | **Stop ZeroMargin.** Do not submit copied or pre-event code. Rewrite the spec in your own words only if the organizer allows it; otherwise fall back to Section 15.2. | A | Within `1` hour of the ruling |
| **K-02** | Canonical Aqua is unavailable on the Base fork, or `ship`/`push`/`pull` cannot be executed against the canonical registry. | `cast codesize 0x1111113ccf1426a8e30e2bff5e005d929bf6a90a --chain 8453` returns `0`, or the fork `ship` reverts and the cause is not the app. | Drop the 1inch track. Remove the 1inch logo, claim, and form selection. Keep Uniswap and Arkiv if their proofs are green. If no fork works at all, run the local demo with a `LOCAL` badge and drop both 1inch and Uniswap. | A | CP2 |
| **K-03** | The hook cannot be mined at `0x240`, or the canonical `PoolManager` does not call it, or the fork pool cannot be initialized. | `HookMiner` fails for `10` minutes, or `PoolManager.modifyLiquidity` does not invoke the hook, or `initialize` reverts on the fork. | Drop the Uniswap track. Remove the Uniswap logo, claim, and form selection. Keep 1inch and Arkiv. The hook unit tests can remain in the repo as a non-claimed component, but the README must say the canonical integration is not proven. | B | CP4 |
| **K-04** | The Arkiv faucet, access key, or live write is unavailable by the Phase 3 deadline. | `npm run arkiv:verify` fails after `3` retries and a funded-wallet check; the hub returns an error. | Drop the Arkiv track. Switch to cache with a visible `CACHE` badge. Remove the Arkiv logo, claim, and form selection. Keep 1inch and Uniswap. Do not submit a cached entity as a live integration. | B | Fri 10:00 IST |
| **K-05** | GV-01–GV-04 do not match after three debugging attempts, or the fuzz test finds bad debt inside the envelope. | `forge test --match-contract SpanMathTest -vv` is red; the mismatch is in a golden vector or the invariant. | Stop. Do not tune the vectors to the code. Fix the formula, the rounding, or the `γ` scale. If it is still red at CP1 + `1.0 h` buffer, **abandon ZeroMargin**; the numbers are the product. | A | Thu 17:00 IST |
| **K-06** | The atomic `unwind` cannot settle both legs in one transaction on the fork by CP4. | The fork test shows a second transaction, a stuck book, or a `pull` that cannot be funded by the `push`. | Remove the word “atomic” from Claim 2 and every derivative. If a two-step settlement is honest and tested, submit it with the lower WOW score and a clear limitation. If neither works, abandon the settlement claim and fall back to the Arkiv-only viewer. | A | CP4 |
| **K-07** | UNWIND-01 produces bad debt, or `testFuzz_ZeroBadDebtWithinEnvelope` fails. | The exact assertion `badDebt == 0` is red, or the fuzz counterexample is inside the stated envelope. | Stop. Fix the waterfall, the fee, or the rounding. If the bad debt is caused by the model rather than a bug, narrow the envelope and restate the claim; if the narrow envelope removes the product, abandon. | A | CP2 |
| **K-08** | One engineer is unavailable for more than `6` consecutive scheduled hours, or both are below `4` hours of sleep before CP4. | A human message; a missed gate; a merge with obvious errors. | Cut to the two strongest tracks and the recorded video. Do not attempt a live demo with a sleep-deprived operator. If only one engineer remains, drop the live fork proof and keep the unit tests, the video, and the submission. | Both | Any gate |
| **K-09** | An organizer states a different deadline, a different sponsor cap, a different track rule, or a video rule that conflicts with this file. | A written organizer message or the official event page changes. | Follow the organizer. Update the header, F-01, Section 13, and the plan. Drop any track that is no longer eligible. Do not argue. | A | Within `30` minutes |
| **K-10** | A private key, access key, or mnemonic is committed, logged, or shown on screen. | `gitleaks` or `grep` finds a secret; a screenshot shows a key. | Rotate the key immediately. Remove the secret from the working tree and the history if the repo is not public; if it is public, assume compromise and rotate. Re-run T-24. Do not submit the old key. | The engineer who exposed it | Immediately |
| **K-11** | The video upload or the submission form fails at `07:30` IST. | The platform returns an error; the URL does not play; the form does not save. | Use the backup upload (unlisted YouTube or Vimeo), then submit the form with the backup URL. If the form itself fails, retry every `10` minutes and save each error. Submit by `08:45` even if a SHOULD is missing. | B | Sat 08:45 IST |
| **K-12** | The team is still adding a feature after the freeze, or a SHOULD is being polished while a MUST is red. | A commit after `freeze` that is not a bug fix, a copy fix, or a security fix; a `PROGRESS.md` line that says “nice to have.” | Revert the feature. Return to the red MUST. If the MUST cannot be fixed by `20:30`, cut the lowest-priority track and freeze. | Both | CP4 + `1` hour |

### 15.2 Fallback policy

There is **no optimistic rescue**. If ZeroMargin is killed, the team does not invent a new idea at `T-6` hours and call it a submission. The only allowed fallback is a smaller, honest artifact that reuses the work already proven:

**Fallback F1 — Arkiv-only risk attestation viewer.** A public repo with the `SpanMathLib` calculator, a read-only UI that computes the 16-scenario margin for a user-entered book, and a live Arkiv attestation with the five rubric files. No Aqua, no v4 hook, no 1inch or Uniswap claim. It is eligible for the Arkiv track only if the live write and the five files are real. It requires a new `3`-hour spec, both engineers' agreement, and a `git` history that starts after kickoff. If those conditions cannot be met, the team does not submit. A missing submission is better than a disqualifying one.

**Fallback F2 — recorded demo only.** If the live environment fails after CP4 but the fork tests and the video are green, submit the repo and the video with a `LOCAL`/`RECORDED` badge. Drop the live-demo claim. The code and the tests are still the evidence. Do not claim a live run that did not happen.

### 15.3 Post-kill review

Within `24` hours after the event, write `POSTMORTEM.md`:

| Question | Answer |
| :--- | :--- |
| Which kill condition triggered, and at what time? | The ID, the timestamp, and the evidence. |
| Was the trigger detectable earlier? | The earliest signal and why it was missed or ignored. |
| What was cut, and what did the cut cost? | The track, the claim, and the score impact. |
| What would the team do differently in the first `6` hours? | One concrete change. |
| What is reusable? | The math, the adapter interface, the test suite, the video assets. |

The postmortem is not submitted to ETHGlobal. It is for the next event.

---

## 16. Environment variables and tool versions

### 16.1 Environment variables

Every variable below appears in `.env.example` with a comment. Secrets have **no default** and are never committed. A missing required variable fails `make setup` with the variable name, not a stack trace. Amounts are USDC base units (`1e6 = $1.00`) unless the name says `_BPS`, `_URL`, or `_ADDRESS`.

| Variable | Required | Default | Unit / format | Used by | Notes |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `BASE_MAINNET_RPC_URL` | Yes | `https://mainnet.base.org` | HTTPS URL | Fork, deploy | Public RPC may rate-limit; a private URL is allowed. |
| `BASE_SEPOLIA_RPC_URL` | No | `https://sepolia.base.org` | HTTPS URL | Sepolia fallback | Only used if the fork fails. |
| `BASE_CHAIN_ID` | Yes | `8453` | integer | Fork, UI | Base mainnet. |
| `BASE_SEPOLIA_CHAIN_ID` | No | `84532` | integer | Sepolia fallback | Base Sepolia. |
| `FORK_CHAIN_ID` | Yes | `31337` | integer | Anvil, UI | Local fork. |
| `FORK_BLOCK_NUMBER` | Yes | no default | block number | Anvil, tests | Resolve from `latest` after both canonical contracts exist; record in `PROGRESS.md`. |
| `AQUA_REGISTRY_ADDRESS` | Yes | `0x1111113ccf1426a8e30e2bff5e005d929bf6a90a` | address | App, adapter, tests | Canonical Aqua on Base `8453`; `5,619` bytes at retrieval. |
| `SWAP_VM_ROUTER_OFFICIAL` | No | `0x111111338c5091e8440b67b168bae16a668ac0de` | address | BR6 only | Canonical SwapVM router v1.0.2 on Base; not used by the core build. |
| `UNISWAP_V4_POOL_MANAGER_BASE` | Yes | `0x498581ff718922c3f8e6a244956af099b2652b2b` | address | Hook, fork, UI | Canonical Base `PoolManager`; `24,009` bytes. |
| `UNISWAP_V4_POOL_MANAGER_BASE_SEPOLIA` | No | `0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408` | address | Sepolia fallback | Canonical Base Sepolia `PoolManager`. |
| `BASE_USDC_ADDRESS` | Yes | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | address | App, adapter, UI | Base USDC, 6 decimals. |
| `BASE_WETH_ADDRESS` | Yes | `0x4200000000000000000000000000000000000006` | address | Pool, hook | Base WETH, 18 decimals. |
| `POOL_FEE` | Yes | `3000` | hundredths of a bip (`3000` = `0.30%`) | Pool creation | Demo WETH/USDC fee tier; use an enabled tick spacing. |
| `TICK_SPACING` | Yes | `60` | ticks | Pool creation | Must match `POOL_FEE = 3000` on the canonical `PoolManager`. |
| `INITIAL_MARK_PRICE_USDC` | Yes | `3000000000` | USDC per WETH, 6 decimals | App constructor | `3,000e6` = `$3,000` per WETH. Bounds `[1e6, 1_000_000e6]`. |
| `ARKIV_CHAIN_ID` | Yes | `7794095` | integer | Arkiv adapter | Rabdi testnet. |
| `ARKIV_RPC_URL` | Yes | `https://rpc.rabdi.db-chain.testnet.arkiv.network` | HTTPS URL | Arkiv adapter | Rabdi RPC; `2`-second blocks. |
| `ARKIV_ACCESS_KEY` | Yes for live | no default | secret string | Arkiv adapter | From `https://hub.arkiv.network/access-keys`; never commit. |
| `ARKIV_WRITER_PRIVATE_KEY` | Yes for live | no default | `0x` + 64 hex | Arkiv adapter | Burner with testnet tokens only; never commit. |
| `ARKIV_MODE` | Yes | `cache` | `live` or `cache` | Web, scripts | `cache` is the offline default; `live` requires the key and a funded writer. |
| `ARKIV_SCHEMA` | Yes | `zeromargin.span_attestations` | string | Arkiv adapter | Must match `arkiv/schema.md` and the README query exactly. |
| `DEMO_PRIVATE_KEY` | Yes for live demo | no default | `0x` + 64 hex | Deploy, UI | Burner with at most `$5` ETH and `$50` USDC on Base; never commit. |
| `DEMO_HEDGE_RESERVE_USDC` | Yes | `100000000000` | USDC base units | Adapter deploy | `100,000e6` = `$100,000`; must exceed the GV-01 short gain of `28,500e6`. |
| `PROTOCOL_FEE_BPS` | Yes | `5` | bps | App deploy | `5` bps of LP notional; `$50` on `$100,000`. |
| `FEE_COLLECTOR_ADDRESS` | Yes | no default | address | App deploy | Must not be `address(0)`; an EOA the team controls. |
| `NEXT_PUBLIC_CHAIN_ID` | Yes | `31337` | integer | Web | `31337` for the fork, `84532` for Sepolia. |
| `NEXT_PUBLIC_MODE` | Yes | `LOCAL` | `LIVE-FORK`, `SEPOLIA`, `LOCAL`, `CACHE` | Web | The badge must match the actual environment. |
| `NEXT_PUBLIC_APP_URL` | Yes | `http://localhost:3000` | URL | Web, e2e | No trailing slash. |
| `REPO_URL` | Yes at submission | no default | HTTPS URL | Docs, checklist | The public GitHub URL. |
| `VIDEO_URL` | Yes at submission | no default | HTTPS URL | Docs, form | The uploaded video; a backup URL is recorded separately. |
| `UNISWAP_FEEDBACK_FORM_URL` | Yes | `https://developers.uniswap.org/hackathon-feedback` | HTTPS URL | Docs, form | Verified reachable on 2026-11-03. |

**Validation rules.** `make setup` checks that every required variable is non-empty, every address matches `^0x[0-9a-fA-F]{40}$`, every chain ID is a positive integer, every USDC amount is a non-negative integer, and `PROTOCOL_FEE_BPS <= 100`. It prints `ENV OK` and the chain ID. It never prints a secret value; it prints `SET` or `MISSING`.

**Secret handling.** `.env` and `.env.local` are gitignored. The deploy script redacts `PRIVATE_KEY` and `ACCESS_KEY` in its output. The UI logs only the tx hash, chain ID, block number, and mode. A screenshot that shows a secret is a K-10 event.

### 16.2 Tool versions

| Tool | Required version | Check command | If wrong |
| :--- | :--- | :--- | :--- |
| macOS | `14+` or Ubuntu `22.04+` | `sw_vers -productVersion` or `lsb_release -rs` | Use a supported machine; do not debug the toolchain on an unsupported OS. |
| Foundry (`forge`, `cast`, `anvil`) | `1.7.1` | `forge --version` | `foundryup -v 1.7.1`; pin in `docs/REPRO.md`. |
| solc | `0.8.26` | `forge config --json \| grep solc` | Set `solc = "0.8.26"` in `foundry.toml`; do not let Foundry auto-detect. |
| Node.js | `v24.10.0` | `node --version` | `nvm install 24.10.0 && nvm use 24.10.0`. |
| npm | The version bundled with Node `24.10.0` | `npm --version` | Record the exact version in `docs/REPRO.md`; use `npm ci`, not `npm install`, on a clean run. |
| Next.js | `15.0.3` | `npm ls next` | Pin in `package.json` and `package-lock.json`. |
| React | `19.0.0` | `npm ls react` | Pin; do not mix React 18 and 19. |
| TypeScript | `5.6` or newer | `npx tsc --version` | Pin the exact version in `package-lock.json`. |
| `viem` | `2.21.45` | `npm ls viem` | Pin; do not use `latest`. |
| `@arkiv-network/sdk` | `1.0.1` | `npm ls @arkiv-network/sdk` | Pin; verify against `npm view @arkiv-network/sdk version` on the day. |
| OpenZeppelin Contracts | `v5.1.0` | `git submodule status lib/openzeppelin-contracts` | Pin the tag and record the commit. |
| `v4-core` | Exact tag verified at kickoff | `git submodule status lib/v4-core` | Pin the tag that compiles with solc `0.8.26`; record the commit in `docs/DEPENDENCIES.md`. `[to verify at pin time]` |
| `v4-periphery` | Exact tag verified at kickoff | `git submodule status lib/v4-periphery` | Pin the tag that matches `v4-core`; record the commit. `[to verify at pin time]` |
| Playwright | The version locked in `package-lock.json` | `npx playwright --version` | Do not upgrade during the event. |
| `ffmpeg` / `ffprobe` | Any version that reads `mp4` | `ffprobe -version` | Used only for the video length and resolution check. |
| Python | `3.11` or newer | `python3 --version` | Used by `scripts/lint_claims.py`; no third-party packages. |
| `gitleaks` | The version installed by `make security-lite` | `gitleaks version` | If unavailable, use the `grep` fallback in T-24 and record it. |

**Pinning rule.** No `latest` in `package.json`, `foundry.toml`, or a submodule. `npm ci` must reproduce the lockfile. A version change after CP2 requires both engineers' agreement and a `DECISIONS.md` entry.

### 16.3 `.env.example` acceptance

```bash
grep -c '^[A-Z_]*=' .env.example     # at least 30 variables
grep -E 'PRIVATE_KEY|ACCESS_KEY|MNEMONIC' .env.example  # names only, no values
make setup                           # prints ENV OK
```

The file must not contain a real key, a real access token, or a funded address. A comment above each secret says `required for live mode; never commit`.

---

## 17. Definition of Done

ZeroMargin is done when every row below is true and the submission confirmation is saved. A row that is not true is a known gap in `README.md`, not a hidden one. A gap that would make a claim false is a cut, not a gap.

### 17.1 Rules and repository

| # | Done when | Evidence |
| :---: | :--- | :--- |
| **D-01** | The repo was created empty after kickoff and every file was written during the window. | `git log --reverse --format='%ci' \| head -1`; a manual diff against the scaffold. |
| **D-02** | No scaffold file, test, comment, or markdown was copied. | The submission tree and the scaffold tree differ in structure and wording; no `scaffold/` path is imported. |
| **D-03** | At least `20` commits span the window, with no single-commit dump. | `git log --oneline \| wc -l`; `git show --stat`. |
| **D-04** | The repo is public, MIT-licensed, and returns `200`. | `curl -s -o /dev/null -w '%{http_code}' "$REPO_URL"`; `head -1 LICENSE`. |
| **D-05** | AI use is disclosed with tools, files, and human review. | `README.md` `AI use` section; the spec and build plan are committed as planning artifacts. |

### 17.2 Math and contracts

| # | Done when | Evidence |
| :---: | :--- | :--- |
| **D-06** | GV-01–GV-04 match to the base unit. | `forge test --match-contract SpanMathTest -vv` passes; `node web/src/test/spanParity.test.ts` prints `4/4`. |
| **D-07** | No floating-point math in the margin path. | `grep -rnE 'float\|double\|toFixed\|parseFloat' contracts/src web/src/lib/spanMath.ts` returns nothing. |
| **D-08** | Rounding is conservative: margin and fee up, profit down. | `test_RoundingDirection` passes; the comments in `SpanMathLib` state the direction. |
| **D-09** | `openBook` rejects every invalid input with the exact error. | `test_OpenBookValidation` passes. |
| **D-10** | `quoteUnwind` equals `unwind` for `256` fuzz runs. | `testFuzz_QuoteMatchesUnwind` passes. |
| **D-11** | UNWIND-01 is exact: `28,500e6` netted, `33,750e6` LP loss, `50e6` fee, `19,700e6` equity, `0` bad debt. | `test_UNWIND01` passes. |
| **D-12** | A positive-shock `unwind` reverts `UnsupportedShockDirection`; the preview remains available to the guard. | `test_PositiveShockUnwindReverts` and `test_GV04UnwindPreview` pass. |
| **D-13** | The app holds no USDC after any external call. | `test_NoTokenCustody` passes for open, unwind, add margin, and close. |
| **D-14** | Only the trader or an authorized keeper can unwind; a keeper cannot do anything else. | `test_UnauthorizedUnwind`, `test_KeeperScope`, `test_KeeperRevoked` pass. |
| **D-15** | `setHook` succeeds once and ownership is renounced. | `test_HookSetOnce`, `test_OwnerRenounced` pass. |
| **D-16** | Every contract is under `24,576` bytes. | `forge build --sizes` prints the sizes. |
| **D-17** | Every gas budget in Section 6 is met or the budget is revised with evidence. | `forge snapshot --check` passes. |

### 17.3 Uniswap and Aqua

| # | Done when | Evidence |
| :---: | :--- | :--- |
| **D-18** | The hook is at a mined address with low bits `0x240`. | `uint160(address(hook)) & 0x3FFF == 0x240`; `test_HookAddressFlags` passes. |
| **D-19** | Only the canonical `PoolManager` can call the hook. | `test_OnlyPoolManager` passes for both hooks. |
| **D-20** | An unsafe withdrawal reverts `SpanMarginBreach(12,000e6, 16,500e6)` on the fork; a safe withdrawal passes. | `PortfolioMarginHookForkTest` passes. |
| **D-21** | The hook values the WETH leg at `max(spot, entry)` and handles both token orderings. | `test_WithdrawalValueUsesMaxSpotEntry`, `test_TokenOrderingWethUsdc`, `test_TokenOrderingUsdcWeth` pass. |
| **D-22** | The Aqua app performs a real `ship`, `push`, and `pull` on the Base fork. | `AquaForkTest` passes; the `Shipped`, `Pushed`, and `Pulled` events and the wallet deltas are asserted. |
| **D-23** | The adapter pays exactly the previewed gain and receives exactly the forwarded LP loss; its reserve balances. | `test_ReserveAccounting` passes; the reserve equation in Section 6.4 holds. |
| **D-24** | The router bypass is documented and tested as a limitation, not claimed as fixed. | `test_RouterBypassDocumented`; `docs/LIMITATIONS.md`. |

### 17.4 Arkiv and UI

| # | Done when | Evidence |
| :---: | :--- | :--- |
| **D-25** | A live Rabdi entity is written, has a `300`-second expiry, and is returned by the README query. | `npm run arkiv:verify` prints the key, writer, expiry, and one row. |
| **D-26** | The five `/arkiv/*.md` files exist and are specific. | `make check-submission` passes; a human reads each file. |
| **D-27** | The README contains the writer wallet and one runnable query. | `grep -n 'arkiv_query\|select(' README.md`; the query runs. |
| **D-28** | The split-screen UI shows the isolated account and the ZeroMargin book on the same shock; the four numbers and the guard revert are visible. | `npm run test:e2e` passes; `docs/screenshots/split.png`, `guard.png`, `crash.png`, `arkiv.png`. |
| **D-29** | The UI shows `LIVE-FORK`, `SEPOLIA`, `LOCAL`, `CACHE`, or `ERROR` truthfully. | `test_UiErrorStates`, `test_WrongChainBlocks`; a manual badge check. |
| **D-30** | The offline demo runs with no internet and shows `CACHE` and `LOCAL`. | `make demo-offline` passes. |

### 17.5 Docs, video, and submission

| # | Done when | Evidence |
| :---: | :--- | :--- |
| **D-31** | The README has the one-liner, mechanism, quick start, addresses, sponsor proofs, ten limitations, AI disclosure, and Arkiv query. | `npm run readme:check`; a human reads it in under `5` minutes. |
| **D-32** | `FEEDBACK.md` exists and the Uniswap form was submitted with its link. | `wc -w FEEDBACK.md`; `docs/UNISWAP_FORM.md`. |
| **D-33** | Every S-ID in Section 9 maps to a test or a documented limitation. | `npm run security:map`; `docs/SECURITY_REVIEW.md`. |
| **D-34** | No banned claim appears in the repo or the video. | `python3 scripts/lint_claims.py` prints `PASS`; the transcript is read. |
| **D-35** | The video is `2:00`–`4:00`, at least `720p`, human-voiced, not sped up, not a phone recording, and shows the limitations. | `ffprobe`; a human listens; the upload plays in incognito. |
| **D-36** | Exactly three tracks are selected: 1inch, Uniswap, Arkiv. | The form and `docs/SUBMISSION.md`. |
| **D-37** | The submission is before Sat Nov 7 2026 09:00 IST; the internal target is `08:00`. | The confirmation timestamp. |
| **D-38** | `make ci` and `make check-submission` exit `0` on a clean checkout. | The commands and their output are recorded in `docs/REPRO.md`. |
| **D-39** | The final read-back in Section 13.6 is complete. | A signed note in `docs/SUBMISSION.md` with the date and the two engineers' initials. |
| **D-40** | The confirmation is saved and the repo and video are still reachable after submission. | `docs/SUBMISSION.md`; a `08:30` recheck. |

### 17.6 The one-line test

If a judge asks “what did you build?” and the answer takes more than `15` seconds, the README is not done. The answer is:

> “ZeroMargin cross-margins a Uniswap v4 LP and a short hedge in one 1inch Aqua balance, cuts the tested book’s initial margin from `$147,500` to `$10,000`, and settles a `-30%` crash in one transaction with `$0` bad debt.”

If that sentence is not literally true on the submitted artifacts, ZeroMargin is not done.

---

## 18. Bottom line

**ZeroMargin is worth building.** The reference math closes, the `93.22%` margin reduction is real on the GV-01 book, and each of the three sponsor integrations has a live proof path rather than a logo. **It is not a safe bet:** `21%` finalist probability with `BR1–BR5`, and the whole plan depends on the rules gate and the CP1 golden-vector gate; if either fails, stop rather than submit a disqualifying or numerically false project.

---

## Sources

All URLs were retrieved on **2026-11-03** unless a row says otherwise. A source supports only the fact named in the “Used for” column. A source that was not fetched is marked `[to verify]` and is not used as a fact.

### S.1 Event, prize, and submission rules

| ID | Source | URL | Used for |
| :---: | :--- | :--- | :--- |
| **E-01** | ETHGlobal Mumbai — event details | `https://ethglobal.com/events/mumbai/info/details` | Deadline Sat Nov 7 2026 09:00 IST; 7-minute judging (4-minute demo + 3-minute Q&A); up to 3 partner prizes; video 2–4 minutes, at least 720p, human-voiced, not sped up, not a phone recording; Classic from-scratch rule; AI disclosure; git-history warning. |
| **E-02** | ETHGlobal Mumbai — event home | `https://ethglobal.com/events/mumbai` | Event dates Thu Nov 5 – Sat Nov 7 2026; venue context. The public page did not state the opening time. |
| **E-03** | ETHGlobal Mumbai — 1inch prize | `https://ethglobal.com/events/mumbai/prizes/1inch` | `$5,000` Classic (`$2,500 / $1,500 / $1,000`, 3 places); `$2,000` Continuity; Aqua app requirements; official Aqua/SwapVM contracts; onchain token transfers; local forks acceptable; proper git history; SwapVM projects scored higher. |
| **E-04** | ETHGlobal Mumbai — Uniswap Foundation prize | `https://ethglobal.com/events/mumbai/prizes/uniswap-foundation` | `$10,000` Classic (`$4,000 / $3,000 / $2,000 / $1,000`, 4 places); `$5,000` Continuity; public open-source repo; `FEEDBACK.md`; Uniswap Developer Feedback Form with the `FEEDBACK.md` link. |
| **E-05** | ETHGlobal Mumbai — Arkiv prize | `https://ethglobal.com/events/mumbai/prizes/arkiv` | `$15,000` headline across five tracks; `Build on Arkiv (from scratch)` is `$4,000` (`$3,000 / $1,000`, 2 places); five `/arkiv/*.md` files at 25% each; `schema.md`; README writer wallet and one runnable query; open-source license; one Arkiv track prize per team. |
| **E-06** | Uniswap Developer Feedback Form | `https://developers.uniswap.org/hackathon-feedback` | The form URL used in Section 13.5 and `FEEDBACK.md`; reachable on 2026-11-03. |
| **E-07** | Arkiv access keys | `https://hub.arkiv.network/access-keys` | Where the live `ARKIV_ACCESS_KEY` is obtained. |
| **E-08** | Arkiv faucet | `https://hub.arkiv.network/faucet` | Where the Rabdi writer wallet is funded. |

**Opening-time note.** E-01 and E-02 confirm the deadline but do not publish the opening time. The `10:00 IST` kickoff in this file is an assumption and is labeled as such in the header, F-01, and Section 12. If check-in gives a different time, the first commit and every phase shift by the same amount; the deadline and the freeze do not move.

### S.2 Technical references

| ID | Source | URL | Used for |
| :---: | :--- | :--- | :--- |
| **T-01** | 1inch — contract addresses | `https://business.1inch.com/contract-addresses` | Aqua registry `0x1111113ccf1426a8e30e2bff5e005d929bf6a90a`; AquaSwapVMRouter v1.0.2 `0x111111338c5091e8440b67b168bae16a668ac0de`; Base deployment. |
| **T-02** | 1inch Aqua — source | `https://github.com/1inch/aqua` | `ship`, `dock`, `push`, `pull`, `rawBalances`, `safeBalances` semantics; the virtual-balance model. |
| **T-03** | Uniswap v4 — overview | `https://docs.uniswap.org/contracts/v4/overview` | `PoolManager`, `PoolKey`, `PoolId`, hooks, `modifyLiquidity`, `swap`. |
| **T-04** | Uniswap v4-core — `IHooks.sol` | `https://github.com/Uniswap/v4-core/blob/main/src/interfaces/IHooks.sol` | `beforeRemoveLiquidity(address,PoolKey,ModifyLiquidityParams,bytes)` and `afterSwap(address,PoolKey,SwapParams,BalanceDelta,bytes)` signatures. |
| **T-05** | Uniswap v4-core | `https://github.com/Uniswap/v4-core` | `StateLibrary.getSlot0`, `TickMath`, `LiquidityAmounts`, `PoolId`; the exact tag is pinned at kickoff. |
| **T-06** | Uniswap v4-periphery | `https://github.com/Uniswap/v4-periphery` | `BaseHook`, `Hooks.Permissions`, `HookMiner`; the exact tag is pinned at kickoff. |
| **T-07** | Arkiv — docs | `https://docs.arkiv.network/` | Rabdi chain ID `7794095`, `2`-second blocks, `createEntity`, `select`, `ExpirationTime`, `arkiv_query`, faucet and access-key flow. |
| **T-08** | Arkiv SDK — registry metadata | `https://registry.npmjs.org/@arkiv-network/sdk` | `dist-tags.latest = 1.0.1` on 2026-11-03. |
| **T-09** | OpenZeppelin Contracts v5.1.0 | `https://github.com/OpenZeppelin/openzeppelin-contracts/releases/tag/v5.1.0` | `Ownable`, `ReentrancyGuard`, `IERC20`; the pinned release. |
| **T-10** | Foundry Book | `https://book.getfoundry.sh/` | `forge`, `cast`, `anvil`, `forge snapshot`, `forge inspect`, `forge coverage`, `HookMiner` workflow. |
| **T-11** | Base mainnet RPC | `https://mainnet.base.org` | `eth_chainId = 8453`; `eth_getCode` byte lengths for Aqua, SwapVM router, and `PoolManager`. |
| **T-12** | Base Sepolia RPC | `https://sepolia.base.org` | `eth_chainId = 84532`; `eth_getCode` byte lengths for `PoolManager` and Aqua. |
| **T-13** | Arkiv Rabdi RPC | `https://rpc.rabdi.db-chain.testnet.arkiv.network` | `eth_chainId = 7794095`; `arkiv_getBlockTiming` = `2` seconds. |

### S.3 Onchain checks performed

These are `eth_getCode` results from the RPC endpoints in T-11 and T-12. The byte length is the length of the returned bytecode, excluding the `0x` prefix. The check was run on 2026-11-03.

| Contract | Chain | Address | Result | Interpretation |
| :--- | :--- | :--- | :--- | :--- |
| Aqua registry | Base `8453` | `0x1111113ccf1426a8e30e2bff5e005d929bf6a90a` | `5,619` bytes | Deployed; canonical Aqua exists on Base. |
| Aqua registry | Base Sepolia `84532` | `0x1111113ccf1426a8e30e2bff5e005d929bf6a90a` | `0` bytes | Not deployed on Base Sepolia. |
| AquaSwapVMRouter v1.0.2 | Base `8453` | `0x111111338c5091e8440b67b168bae16a668ac0de` | `20,541` bytes | Deployed; available for the `BR6` stretch only. |
| Uniswap v4 `PoolManager` | Base `8453` | `0x498581ff718922c3f8e6a244956af099b2652b2b` | `24,009` bytes | Canonical Base `PoolManager`. |
| Uniswap v4 `PoolManager` | Base Sepolia `84532` | `0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408` | `24,009` bytes | Canonical Base Sepolia `PoolManager`. |

**Why the demo is a Base fork.** Aqua is deployed on Base mainnet and not on Base Sepolia. The only environment where both canonical Aqua and canonical Uniswap v4 are available at the same time is a Base mainnet fork. That is why the primary demo is `anvil --fork-url $BASE_MAINNET_RPC_URL --chain-id 31337`.

### S.4 Local corpus and prior-art queries

| ID | Path | Used for |
| :---: | :--- | :--- |
| **L-01** | `/private/var/folders/ls/7lkdp0td2mz8jwpdnftq1lhw0000gn/T/opencode/ethglobal_2024_2026_projects.json` | `10,510` ETHGlobal projects across `30` editions; `275` finalists (`2.62%`); IRL `157/5,116` (`3.07%`); online `118/5,394` (`2.19%`); 2026 IRL `39/951` (`4.10%`); lane counts. |
| **L-02** | `agents/INDEX.md` | Cross-idea ranking and the ZeroMargin/AgentClear comparison. |
| **L-03** | `agents/agentclear_agent.md` | The GATED AgentClear spec, used only as a comparison; it is not built. |

**Lane counts from L-01.** `margin` `0/14` finalists; portfolio margin/netting `1/4`; hedge/delta-neutral `0/63`; v4 hook `5/166`; aqua/swapvm `2/84`; perp/derivatives `2/72`; LP hedging `0/8`; liquidation `0/44`; SPAN `0`; margin+Uniswap `0/2`; margin+Aqua `0/1`; hedge+Uniswap `0/3`; hedge+perp `0/5`. These are counts from the corpus, not estimates. A lane with `N < 30` is marked weak in the ranking.

**Prior-art names checked in L-01.** GammaHedge, HedgeLP, DefiSalmon, Iceberg, Galvanic, TenorFi, OddsFlow, Aqua0. No direct combination of a Uniswap v4 LP, a short hedge, a cross-margin account, and a 1inch Aqua settlement was found. This is a negative search result, not proof that no such project exists.

### S.5 Reference implementation evidence

The scaffold is **read-only evidence**, not submission code. It was used to check the expected numbers, the gas scale, and the interface shape. Section 0.3 forbids copying it.

| ID | Path | Used for |
| :---: | :--- | :--- |
| **R-01** | `agents/zeromargin/scaffold/packages/contracts/src/libraries/SpanMathLib.sol` | 16-scenario grid; constants `GAMMA_LP_BPS = 5_000`, `BASIS_HAIRCUT_BPS = 500`, `MAINT_MARGIN_RATIO_BPS = 7_500`, `ISOLATED_SHORT_IM_BPS = 5_000`, `ISOLATED_LIQ_PENALTY_BPS = 1_000`; rounding notes. |
| **R-02** | `agents/zeromargin/scaffold/packages/contracts/src/core/ClearingMarginEngine.sol` | `previewEquityAfterLpWithdrawal`, `unwindNettedBook`, `simulateIsolatedCrash`; the reference control flow. |
| **R-03** | `agents/zeromargin/scaffold/packages/contracts/test/SpanMathGolden.t.sol` | GV-01–GV-04 exact reference assertions. |
| **R-04** | `agents/zeromargin/scaffold/packages/contracts/test/ClearingFlashCrash.t.sol` | UNWIND-01; the `-30%` crash path; the `$12,000` posted / `$16,500` required withdrawal state. |
| **R-05** | `agents/zeromargin/scaffold/packages/contracts/test/ZeroMarginSwapVM.t.sol` | The `0xf1` opcode reference: `28,500e6` in, `33,800e6` out, `50e6` fee. This is the `BR6` stretch, not the core. |
| **R-06** | `agents/zeromargin/scaffold/data/golden_vectors.json` | GV-01–GV-04 input and expected values; dataset version `2026-11-03-v1`; seed `20261105`. |
| **R-07** | `agents/zeromargin/scaffold/packages/contracts/foundry.toml` | Reference `solc 0.8.26`, `evm_version = "cancun"`, optimizer `200`, fuzz `128`. |
| **R-08** | `agents/zeromargin/scaffold/packages/web/package.json` | Reference `@arkiv-network/sdk 1.0.1`, `next 15.0.3`, `react 19.0.0`, `viem 2.21.45`. |
| **R-09** | `agents/zeromargin/scaffold/.env.example` | Variable names and verified addresses. |
| **R-10** | `agents/zeromargin/scaffold/Makefile` | Reference targets and the `make ci` shape. |
| **R-11** | `agents/zeromargin/scaffold/README.md` | Reference claims and limitations; not copied. |
| **R-12** | `agents/zeromargin/scaffold/arkiv/schema.md`, `friction.md`, `reach.md`, `why-arkiv.md`, `how-you-use-arkiv.md` | The five Arkiv rubric files; read for structure, rewritten from scratch. |
| **R-13** | `agents/zeromargin/zeromargin_build_plan.md` | The card-level expansion of Section 12; this spec wins on conflict. |
| **R-14** | `agents/zeromargin/PROGRESS.md`, `RISKS.md`, `HUMAN_TASKS.md` | Execution state, risks, and human-only gates; the numbers are patched to this spec. |

### S.6 Reference measurements

These are from the reference run on **2026-11-03**, not from the submission. They are targets until the rebuilt tests produce them.

| Measurement | Reference value | Where it is used |
| :--- | :--- | :--- |
| Foundry tests | `9/9` pass | Reference baseline; the submission will have more tests. |
| TypeScript vectors | `4/4` match | Section 6.1, T-03. |
| `evaluateSpan16` gas | `22,769` | Budget `<= 30,000`. |
| `previewShockUnwind` gas | `4,116` | Budget `<= 8,000`. |
| `unwindNettedBook` gas | `151,234` | App budget `<= 220,000`. |
| `openNettedBook` gas | `148,624` | App budget `<= 180,000`. |
| `quote` gas | `7,835` | `quoteUnwind` budget `<= 20,000`. |
| `swap` gas | `132,226` | Reference only; not a core budget. |
| Basis observations | `43,200` one-minute rows | BR4 and Claim 3. |
| Basis P99 | `142` bps | Target; must be recomputed. |
| Basis max | `318` bps | Target; must be recomputed. |
| Dataset SHA-256 | `0a02606eaba0740af2dbfadeeaeb4cafc34a8b582e1a2b26fdcf21663f2b8dc3` | Reference target only; the submission records the rebuilt hash. |
| GV-01 | `$147,500` isolated vs `$10,000` net; `93.22%` | Claim 1. |
| GV-02 | `$140,000` vs `$13,750`; `90.17%` | Claim 1 range. |
| GV-03 | `$100,000` vs `$33,750`; `66.25%` | Unhedged comparison. |
| GV-04 | `$67,500` vs `$16,500`; `75.55%` | Withdrawal guard. |
| UNWIND-01 | `33,750e6` LP loss, `28,500e6` gain, `28,500e6` netted, `50e6` fee, `5,300e6` margin used, `19,700e6` equity, `0` bad debt | Claim 2. |

### S.7 Unverified items and assumptions

| ID | Item | Status | How it is handled |
| :---: | :--- | :--- | :--- |
| **U-01** | Opening time is `10:00 IST` on Thu Nov 5 2026. | `[assumption]` | Labeled in the header, F-01, and Section 12; confirm at check-in; shift phases if different. |
| **U-02** | Exact ETHGlobal submission form labels and character limits. | `[to verify]` | Section 13.4 lists the fixed content, not the labels; confirm on the day. |
| **U-03** | Exact `v4-core` and `v4-periphery` tags that compile with solc `0.8.26`. | `[to verify at pin time]` | Pin the verified tags, record the commits in `docs/DEPENDENCIES.md`, and do not use `latest`. |
| **U-04** | Arkiv SDK `1.0.1` remains the latest on the event day, and the faucet is available. | `[to verify on the day]` | `npm view @arkiv-network/sdk version`; if the faucet is down, trigger K-04 and drop the track. |
| **U-05** | The canonical Aqua registry is permissionless for this app, with no `KycNFT` gate on `ship`. | `[to verify on the fork]` | The minimal `ship` test is the first fork check; if it needs a credential the team cannot obtain, drop the 1inch track (K-02). |
| **U-06** | The Base public RPC can serve a fork at the required block without rate-limiting. | `[to verify at setup]` | Use a private RPC in `.env.local` if needed; the fork block and addresses do not change. |
| **U-07** | The exact `Hooks.Permissions` struct field order in the pinned `v4-periphery`. | `[to verify at pin time]` | Adapt the override and record it in `DECISIONS.md`; the `0x240` low-bit test is the source of truth. |
| **U-08** | The reference dataset hash and the P99/max basis reproduce after a rebuild. | `[to verify]` | The submission records its own SHA-256; if the numbers differ, update Claim 3, the UI, and the video. |

---

*End of spec. The build plan and `PROGRESS.md` must agree with this file; if they do not, this file wins.*
