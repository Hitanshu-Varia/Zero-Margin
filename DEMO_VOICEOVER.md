# ZeroMargin — 4-Minute Demo Video Voiceover

> **One-liner (from this script):** ZeroMargin treats an LP position and its hedge as one
> account — cutting locked collateral by ~93% and settling crashes with **no liquidation penalty**.

- **Runtime:** 4:00 hard cap. Spoken word count: **~480 words** ≈ 3:25 at 140 wpm.
  The remaining ~35s is intentional silence for screens, pauses and the end card.
- **Tone:** calm, confident, declarative. No hype adjectives — let the numbers hit.
- **Music:** low, tense drone in 0:00–0:42 (problem), drops away at "That's what ZeroMargin fixes,"
  minimal pulse from 0:45 onward.
- All spoken claims below are traceable to pinned tests/contracts (see Appendix B).

---

## Timeline at a glance

| Segment | Time | On screen |
| :--- | :--- | :--- |
| 1. The problem | 0:00–0:20 | Crash chart / `/replay` |
| 2. The pitch | 0:20–0:45 | `/` landing hero |
| 3. One account | 0:45–1:30 | `/terminal` + `/proof` (GV-01) |
| 4. Uniswap guard | 1:30–2:10 | Hook demo + `/proof` (GV-04) |
| 5. Aqua settle | 2:10–3:00 | `/terminal?shock=-3000` (UNWIND-01) |
| 6. Arkiv keepers | 3:00–3:40 | `/arkiv` feed with TTL countdown |
| 7. Close | 3:40–4:00 | `/` ticker + contract addresses |

---

## Script

### 1 · The problem — 0:00–0:20

**[ON SCREEN:** live crash chart, market bleeding red; velocity lines; two? losses appearing from one position. Show `/replay` crash window briefly. `]`
**[MUSIC:** tense drone, ticking. `]`

> Every crash in crypto ends the same way: forced liquidations, penalties, and piles of
> collateral locked up for a trade that was hedged all along. On Uniswap, a market maker
> can be long liquidity and short price at the same time — and lose twice for one position.

### 2 · The pitch — 0:20–0:45

**[ON SCREEN:** music drops out on the first sentence. Landing page `/` full-bleed. The 93% counter counts up; "no liquidation penalty" types itself. `]`

> That's what ZeroMargin fixes. We treat the liquidation position and its hedge as
> **one account**. One margin check. One settlement. Locked collateral drops by about
> **ninety-three percent** — and when the market crashes, there's **no liquidation penalty** at all.

### 3 · One account — 0:45–1:30

**[ON SCREEN:** `/terminal`. Type the book in the NotionalEditor: LP $100,000, short $95,000.
Then cut to `/proof` — GV-01 vector card. Show 147,500 → 10,000 morphing. `]`

> Here's the account. **One hundred thousand dollars** of concentrated Uniswap v4 liquidity,
> hedged with a **ninety-five thousand dollar short**. On isolated margin, the honest number
> for this book is about **a hundred and forty-seven thousand five hundred** in locked collateral.
>
> ZeroMargin nets the legs on a **sixteen-scenario stress grid** instead — and prices the
> same book at **ten thousand dollars**. Same risk envelope. **Ninety-three point two percent**
> less collateral.
>
> And these aren't marketing numbers — they're pinned test vectors, computed identically
> in Solidity and TypeScript, and shown right here in the terminal.

### 4 · The Uniswap v4 guard — 1:30–2:10

**[ON SCREEN:** mock pool UI; an LP hits "remove liquidity." Then `/proof` GV-04 card:
equity $12,000 vs required $16,500 → red `SpanMarginBreach` receipt. Two attempts: OK book passes, risky book reverts. `]`

> Now Uniswap. ZeroMargin **doesn't hold your LP position** — your liquidity never moves.
> A Uniswap v4 hook simply **watches every withdrawal**. Before liquidity leaves the pool,
> it prices what you're about to pull out, recomputes your net initial margin, and if the
> account would drop below requirement — **it reverts the transaction**.
>
> Watch: twelve thousand in equity against sixteen thousand five hundred required.
> **Blocked** — with a named reason, not a silent failure.
> No custody. No approval. Just math guarding the pool.

### 5 · 1inch Aqua — the crash settles — 2:10–3:00 *(the money shot)*

**[ON SCREEN:** `/terminal?shock=-3000`. Shock slider to −30%. Settlement waterfall animates
leg by leg: short gain lands → LP loss nets → fee → equity. Close-up on
**remaining equity $19,700**, **bad debt $0**. `]`
**[SFX:** single deep *thump* when the crash hits; everything else silent. `]`

> Your tokens live on an **1inch Aqua virtual balance** — a margin account on your own
> wallet. The clearing app **holds nothing, ever**. So when the crash comes — here, a
> **thirty percent drop** — we don't liquidate. **We unwind.**
>
> The short leg realizes its gain straight into your virtual balance, and that same money
> settles the LP loss — **in one atomic transaction**. A **fifty dollar** netting fee
> replaces the penalty.
>
> The waterfall says it plainly: **thirty-three thousand, seven-fifty** LP loss.
> **Twenty-eight thousand, five hundred** short gain. **Nineteen thousand, seven hundred**
> equity remaining. And bad debt: **zero**.

### 6 · Arkiv — keepers with fresh data — 3:00–3:40

**[ON SCREEN:** `/arkiv` feed. Attestation cards decay live — TTL bar counting down from
**5:00 → 0:00**, records expiring one by one. Cut to a keeper terminal echoing the raw
`KEEPER_QUERY`: `status = str('UNWIND_ELIGIBLE') AND marginRatioBps < i32(10000)`. `]`

> And the keepers who trigger this? Every book posts its health — margin ratio and equity —
> to **Arkiv** as a record that **expires after three hundred seconds**. Keepers scan one
> query for **UNWIND-ELIGIBLE** books and see exactly which accounts are near trouble.
> The data is always fresh because it always expires.
>
> And the engine never trusts it: the stress grid is **recomputed on-chain for every action**.
> Arkiv is for discovery — the contract stays the authority.

### 7 · Close — 3:40–4:00

**[ON SCREEN:** landing `/` with the settlement ticker cycling. End card fades in with
contract addresses (below) + repo link. Silence under the last line. `]`

> Liquidity and hedge — one account. Withdrawals — guarded at the pool.
> Crashes — settled from your own wallet, with **no liquidation penalty**.
> Keeper discovery — on data that expires.
> ZeroMargin. Deployed today on Base Sepolia.
> **Zero wasted margin. Zero penalties.**

**[END CARD (hold 4–5s):**
- PortfolioMarginHook `0xdc970ef753f106fae90e48ead027719ac476c240`
- ClearingAquaApp `0xb03a10c4a46b8c5a9f3a634cf46ca8dbc4eea8d4`
- ShortHedgeAdapter `0xf540aa3e72d8a21901465bd54278b8df77ae3f4f`
- (Base Sepolia, chain 84532) `]`

---

## 30-second cutdown (for socials / intro bumper)

> A market maker on Uniswap is long liquidity **and** short price — and stores margin for
> both. ZeroMargin treats the position and its hedge as **one account**: $147,500 of isolated
> collateral becomes **$10,000** — a **93%** cut. When the market crashes thirty percent, one
> transaction nets the loss against the gain — a **$50 fee** replaces the liquidation penalty,
> and bad debt is **zero**. Keepers find the next book to unwind from Arkiv records that
> **expire after 300 seconds**. ZeroMargin: zero wasted margin, zero penalties.

---

## Appendix A — Recording notes

- **Mode honesty:** if you record in LOCAL mode, the unwind receipt is labeled `simulated: true`
  and the header chip shows LOCAL — don't blur/crop those badges; the app is built to look
  honest, keep it that way. For a "live" settle beat, use the keeper route on Base Sepolia.
- **Best demo beats, in order of visual punch:**
  1. `/terminal?shock=-3000` settling (the waterfall + $19,700 equity + bad debt $0)
  2. `/arkiv` TTL countdown expiring records live
  3. `/proof` GV-01 (147,500 → 10,000) and GV-04 blocked-withdrawal receipt
- **Numbers spelled out in the VO** are intentional — read them slowly and exactly.

## Appendix B — Claim traceability (what backs each spoken claim)

| Spoken claim | Source of truth |
| :--- | :--- |
| $147,500 → $10,000 = **93.22%** collateral cut | GV-01 pinned test: `SpanMathTest.test_GV01_exact`, TS parity in `lib/spanParity.test.ts` |
| Isolated vs netted on a **16-scenario grid** | `SpanMathLib.evaluateSpan16` (8 shocks × 2 vol regimes, envelope [−3000, +2000] bps) |
| Hook watches **every** withdrawal, reverts below required margin | `PortfolioMarginHook.beforeRemoveLiquidity` → `SpanMarginBreach(...)` (`contracts/src/PortfolioMarginHook.sol`) |
| $12,000 equity vs $16,500 required → blocked | GV-04: `PortfolioMarginHookTest.test_GV04GuardGoldenPairOnEngine` / git `scripts/arkiv-verify.ts` |
| App **holds no tokens** | `ClearingAquaAppTest.test_AppHoldsNoTokensAfterUnwind`; tokens stay in trader's Aqua virtual balance (`ship`/`pull`) |
| −30% crash: $33,750 loss ⋈ $28,500 gain, $50 fee, **$19,700 equity**, bad debt **0** | UNWIND-01: `ClearingAquaAppTest.test_UNWIND01_settlement_moves_exact_money` |
| Arkiv records expire after **300 seconds** | `lib/arkiv-live.ts` — `TTL_MINUTES = 5`, `ExpirationTime.fromSeconds(300)` |
| Keepers scan `UNWIND_ELIGIBLE` | `KEEPER_QUERY` in `lib/attestations.ts`, served by `/api/arkiv/query` |
| Engine recomputes; Arkiv is discovery-only | `arkiv/schema.md` — contract never reads Arkiv for decisions |
| Deployed on Base Sepolia | `contracts/broadcast/DeploySepolia.s.sol/84532/run-latest.json` |

## Appendix C — Do NOT say (honesty guardrails)

These lines would fail the repo's own claim-linter (`npm run lint:claims`) or overstate the build:

- ❌ "ZeroMargin holds / manages / liquidates Uniswap positions" — the hook only **guards** withdrawals; the LP position stays with the trader. ZeroMargin currently holds **no** Uniswap position.
- ❌ "The short leg hedges live on an exchange/venue" — it settles against a **pre-funded demo adapter** (documented limitation in the README).
- ❌ "Audited" or "production-grade" — code is tested, not audited.
- ❌ "Live on-chain settlement" in LOCAL mode — receipts there are `simulated: true`.
- ❌ "93% savings" without the vector — 93.22% is specific to the 95%-hedged GV-01 book; say "about 93%" *while the GV-01 card is on screen* (an 80% hedge saves 90.17%).
