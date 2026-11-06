# Arkiv: why we use it

ZeroMargin writes **300-second risk attestations** to Arkiv Rabdi
(`zeromargin.span_attestations`). The point: a margin book's risk ratio is
only as good as its age. By writing `status` and `marginRatioBps` snapshots
that expire in 150 blocks (2 seconds per block), stale attestations die
instead of leaking. A keeper query for `UNWIND_ELIGIBLE` is a discovery
layer; the settle path still recomputes the entire span grid from chain
state before anything moves.

Without Arkiv, that registry has no expiry story.
With Arkiv, it is exactly "the last 150 blocks".
