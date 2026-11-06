# FEEDBACK.md

## Uniswap Developer Feedback

**Repository:** this public repo (ZeroMargin / ClearingHook, ETHGlobal Mumbai 2026).
**Form:** https://developers.uniswap.org/hackathon-feedback (submitted on demo day; the confirmation is stored in `docs/UNISWAP_FORM.md`).

## What we used

- **`v4-core` (main @ e50237c4)** — canonical `PoolManager`, `IHooks`, `StateLibrary`,
  `TickMath`, `FullMath`. Our hook implements `IHooks` directly
  (`contracts/src/PortfolioMarginHook.sol`), so pool-manager locking,
  ERC-6784-style reverts, and hook-call rules all stay canonical.
- **`v4-periphery` (main @ c6e4754d)** — `HookMiner` (test/shared) for the mined
  address with low 14 bits `0x240`, and `LiquidityAmounts` math reimplemented
  inline because the amount-of-liquidity direction differs between releases.
- **The feedback:** two releases of `BaseHook` changed ownership during the
  window; our hook avoids the whole class of problems by locking to the
  hook interface directly.

## What would help future hackathons

1. Ship `HookMiner` in `src/`, not `test/` — mined addresses are
   production mechanics, not test fixtures.
2. Document which `Permissions` bit pairs are legal together (e.g.
   `beforeRemoveLiquidity` + `afterSwap` = `0x240`) so address mining is
   copy-paste-safe.
3. A `PoolKey → poolId` derivation reference inside `v4-core` README — the
   keccak-of-encoded-struct rule is load-bearing and easy to get wrong.
