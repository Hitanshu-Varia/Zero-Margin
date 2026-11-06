# Arkiv: how you use it

ZeroMargin's `/arkiv` inspector page is the user-visible feature: it reads
the keeper query (`status = UNWIND_ELIGIBLE AND marginRatioBps < 10000`)
from the Rabdi RPC directly (live mode) or from the bundled snapshot with a
visible `CACHE` badge (offline). Each row shows status chips, margin ratio,
LP/notional pair, net IM, equity, and the TTL countdown.

The rest of the runtime — the `ClearingAquaApp`'s `openBook`, `unwind`,
`addMargin`, `previewEquityAfterWithdrawal` — never consults Arkiv. Arkiv is
discovery for keepers and audit for humans; the contract recomputes the
grid at every action and guards everything itself.
