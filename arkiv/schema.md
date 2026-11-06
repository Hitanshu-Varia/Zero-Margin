# Arkiv: schema

```
schema:   zeromargin.span_attestations
fields:   portfolioId: str, trader: addr, status: str, marginRatioBps: i32,
          lpNotionalUsdc: dec, shortNotionalUsdc: dec, postedMarginUsdc: dec,
          netInitialMarginUsdc: dec, netMaintenanceMarginUsdc: dec,
          equityUsdc: dec, aquaStrategyHash: str, updatedAt: u64
indexes:  portfolioId, trader, status, marginRatioBps, updatedAt
ttl:      ExpirationTime.fromMinutes(5) = 300 seconds = 150 Rabdi blocks
```

Runnable keeper query (raw JSON-RPC `arkiv_query`):

```text
arkiv.schema = str('zeromargin.span_attestations') AND status = str('UNWIND_ELIGIBLE')
AND marginRatioBps < i32(10000) ORDER BY $key ASC
```

SDK equivalent (argument shapes confirmed against the installed package):

```ts
RiskAttestations.select()
  .ownedBy(writer)
  .where(and(eq("status", "UNWIND_ELIGIBLE"), lt("marginRatioBps", 10_000)))
  .fetch();
```

Arkiv is a discovery and audit layer. The onchain `unwind` recomputes the
span grid; it never reads an Arkiv entity to decide.
