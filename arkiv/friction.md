# Arkiv: friction

- **Access-key plumbing** — writing needs an access key from
  `hub.arkiv.network/access-keys` plus testnet tokens from the faucet; the
  key is a secret and cannot ship in the repo. Cache mode is the honest
  offline default with a visible badge.
- **TTL arithmetic** — `ExpirationTime.fromMinutes(5)` = 300 seconds but
  only exact in 2s-block Rabdi; clock drift on the writer's clock shows up
  as an expiry a block or two off. We publish both the TTL and the writer's
  `updatedAt` so the drift is visible.
- **JSON-RPC parity** — a raw `arkiv_query` and `@arkiv-network/sdk` select
  return the same shapes but different wrappers, so the inspector backend
  has to own one canonical shape. The schema field list is the anchor.

Nothing that blocks the demo: the cache path passes the UI badge rule and
the live path is one env pair away.
