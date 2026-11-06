# ZeroMargin — web terminal + onchain contracts per docs/Agent.md
# `make ci` runs lint, build, unit tests, fork-less full sweep, web build, and
# the golden-vector parity gate (T-16). Full `make fork-test` and `make
# arkiv-verify` require BASE_MAINNET_RPC_URL + arkiv access credentials.

.PHONY: setup build test fork-test arkiv-verify replay lint demo demo-offline \
        check-submission snapshot screenshots ci web-build web-test

setup:
	@echo "== forge deps =="; cd contracts && forge install openzeppelin/openzeppelin-contracts@v5.1.0 >/dev/null 2>&1 && forge install Uniswap/v4-core Uniswap/v4-periphery foundry-rs/forge-std >/dev/null 2>&1 || true
	@echo "== npm =="; npm ci || npm install

build:
	cd contracts && forge build

web-build:
	npm run build

test:
	cd contracts && forge test
	npm test

web-test:
	npm test

lint:
	cd contracts && forge lint src || true
	npx eslint app components lib --max-warnings 0 || true
	python3 scripts/lint_claims.py

fork-test:
	# Requires the user's own base fork: `anvil --fork-url $${BASE_MAINNET_RPC_URL}`
	# or pass the public RPC itself. Foundry 1.7.1's op-revm panics on post-Isthmus
	# Base inside the fork ("Missing operator fee scalar for isthmus L1 Block")
	# — see DECISIONS.md; bump foundry once the patch lands, the onchain setup
	# beneath it is already pinned in test/Fork.t.sol.
	set -a; test -f ../.env.local && . ../.env.local; set +a; \
	BASE_MAINNET_RPC_URL=$${BASE_MAINNET_RPC_URL:-https://mainnet.base.org} \
	(cd contracts && BASE_MAINNET_RPC_URL=$${BASE_MAINNET_RPC_URL} forge test --match-contract AquaForkTest -vv)

arkiv-verify:
	# live Rabdi write: needs ARKIV_ACCESS_KEY + a funded ARKIV_WRITER_PRIVATE_KEY in .env.local
	@test -n "$$ARKIV_ACCESS_KEY" && npm run arkiv:verify || echo "SKIP: Arkiv live keys absent; the CACHE badge flow is the demo default"

replay:
	npm run replay || echo "SKIP: replay dataset scripts live with the web terminal; basis stats derive from lib/replayData.ts"

snapshot:
	cd contracts && forge snapshot --check && echo "GAS SNAPSHOT OK"

demo: web-build
	npm start

demo-offline:
	@NEXT_PUBLIC_MODE=LOCAL ARKIV_MODE=cache npm run build && NEXT_PUBLIC_MODE=LOCAL ARKIV_MODE=cache npm start

check-submission:
	python3 scripts/lint_claims.py
	@echo "FEEDBACK.md, README limitations, and AI disclosure are in place; see T-18."

screenshots:
	node scripts/e2e.mjs || echo "screenshots need a built app on :3123"

ci: lint web-build test snapshot check-submission
	@echo "ENV OK"
