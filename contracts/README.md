# ZeroMargin — ClearingHook

A non-custodial margin engine: root Makefile drives both halves
(`contracts/` Foundry + web terminal). See README.md for the whole story,
`contracts/DEPENDENCIES.md` for the pinned Foundry refs, `DECISIONS.md`
for every spec deviation, and `arkiv/*.md` for the sponsor docs.

## Make targets (T-16)

- `make setup` — forge deps + npm ci
- `make build` — forge build
- `make test` — forge test suite + web parity tests
- `make lint` — forge lint, eslint, claims lint
- `make fork-test` — canonical Base fork test (needs BASE_MAINNET_RPC_URL)
- `make arkiv-verify` — live Rabdi write (needs ARKIV_ACCESS_KEY)
- `make ci` — lint + web build + full test sweep + submission checks
- `make demo` / `make demo-offline` — LOCAL mode demo boot

## Paper/cash

- Makefile targets are wrappers around forge and npm — same commands work
  directly.
- `contracts/j-deploy` license: MIT (LICENSE).
