# DECISIONS.md

Every deviation from `agent/Agent.md` is recorded with a timestamp,
component, decision, and reason. Newest first.

| When | Component | Decision | Reason |
| :--- | :--- | :--- | :--- |
| 2026-11-06 | `PortfolioMarginHook` | implemented `IHooks` directly instead of inheriting `BaseHook` | the installed `v4-periphery` `main` branch no longer ships `BaseHook` in `src/`; implementing `IHooks` keeps rule fidelity (onlyPoolManager via immutable check) and avoids depending on a moving base class |
| 2026-11-06 | `PortfolioMarginHook` | `poolId` constructor argument instead of deriving from a `PoolKey` | the pool is initialized after the hook is mined (`DEMO_POOL_ID` comes from env); mining with a struct ctor arg whose `hooks` field is the unknown mined address would be circular |
| 2026-11-06 | `PortfolioMarginHook` | inline `_removedAmounts` using `FullMath` and the canonical formulas | the installed periphery's `LiquidityAmounts` lacks the `getAmountNForLiquidity` direction on this branch; the formulas match the canonical release |
| 2026-11-06 | `ClearingAquaApp` | hand-rolled `owner` + `onlyOwner` instead of OZ `Ownable` | the spec wants a specific `OwnershipRenounced(previousOwner)` event and post-renounce zero-admin semantics |
| 2026-11-06 | web | `lib/demoStore.ts` in-memory settlement store | single-instance honest demo; durable sink is one file away on horizontal deployment (README says so) |
| 2026-11-06 | web | `knockout` of inline `useMemo` around engine figures | React Compiler lint rule `preserve-manual-memoization`; the computes are microseconds — the memoization wasn't load-bearing |
