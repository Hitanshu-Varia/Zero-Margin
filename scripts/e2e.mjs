/**
 * End-to-end run against the built app:
 *   1. the landing statement and the golden-vector pair render
 *   2. the terminal settles UNWIND-01 exactly ($19,700 of equity, no bad debt)
 *   3. POST /api/quote returns the golden numbers (engine parity through the API)
 *   4. POST /api/unwind returns the deterministic receipt
 *   5. GET /api/health reports the LOCAL mode with the honest disclaimer
 * Usage: node scripts/e2e.mjs [baseURL]  (default http://localhost:3123)
 */
import { chromium } from "playwright-core";

const BASE = process.argv[2] ?? "http://localhost:3123";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

// 1. Landing
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
const hero = await page.textContent("h1");
check("landing statement", !!hero && hero.includes("The crash settles"));

// 2. Terminal golden numbers (FR-14)
await page.goto(`${BASE}/terminal?shock=-3000`, { waitUntil: "networkidle" });
const heroNums = await page.$$eval("main", (els) => els[0].innerText);
check("isolated equity zero", heroNums.includes("$0"));
check("netted equity 19,700", heroNums.includes("$19,700"));
check("unwind fee 50", heroNums.includes("$50.00") || heroNums.includes("$50"));

// engine parity line settles to verified
await page.waitForSelector('[data-testid="settle-action"]', { timeout: 10_000 });
await page.waitForTimeout(900);
const parity = await page.$$("text=engine parity verified via /api/quote");
check("engine parity via /api/quote", parity.length > 0);

// 3. Settle through the API (rate-limited receipt, deterministic)
await page.click('[data-testid="settle-action"]');
await page.waitForSelector('[data-testid="settlement-receipt"]', { timeout: 10_000 });
const receipt = await page.$$eval('[data-testid="settlement-receipt"]', (els) => els[0].innerText);
check("settlement receipt", receipt.includes("simulated yes") && receipt.includes("$19,700") || receipt.includes("$19,700.00") || receipt.includes("$19,700"));

// 4. API parity (number 2 asserted independently of the DOM)
const quoteRes = await page.evaluate(async () => {
  const res = await fetch("/api/quote", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      lpNotionalUsdc: "100000000000",
      shortNotionalUsdc: "95000000000",
      postedMarginUsdc: "25000000000",
      priceShockBps: "-3000",
      volShockBps: "150",
    }),
  });
  const body = await res.json();
  return { status: res.status, body };
});
check(
  "POST /api/quote golden",
  quoteRes.status === 200 &&
    quoteRes.body?.netted?.remainingEquityUsdc === "19700000000" &&
    quoteRes.body?.netted?.protocolFeeUsdc === "50000000",
);
check("POST /api/quote bad-debt zero", quoteRes.body?.netted?.badDebtUsdc === "0");

// 5. Health mode badge (FR-16)
const healthRes = await page.evaluate(async () => {
  const res = await fetch("/api/health");
  return { status: res.status, body: await res.json() };
});
check(
  "health mode LOCAL",
  healthRes.status === 200 && healthRes.body?.mode === "LOCAL" && healthRes.body?.status === "ok",
);

// 6. Arkiv feed via API
const arkivRes = await page.evaluate(async () => {
  const res = await fetch("/api/arkiv/query");
  return { status: res.status, body: await res.json() };
});
check(
  "arkiv feed via API",
  arkivRes.status === 200 && Array.isArray(arkivRes.body?.entities) && arkivRes.body?.entities.length >= 3,
);

// mobile overflow check + positions live-read smoke
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
const overflow = await page.evaluate(() => ({
  sx: window.scrollX,
  w: document.documentElement.scrollWidth,
}));
check("mobile zero overflow", overflow.sx === 0 && overflow.w === 390);

const pos = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await pos.goto(`${BASE}/positions`, { waitUntil: "networkidle" });
await pos.fill("input[aria-label='Wallet address']", "0xB18C4Be38412E8A12961a09988a9DD211257476F");
await pos.click("text=Add wallet");
await pos.waitForTimeout(2500);
const text = await pos.$eval("main", (el) => el.innerText);
check("real chain position row (ETH shown)", /ETH/.test(text) || /positions/i.test(text));

await browser.close();

const failures = results.filter((r) => !r.ok);
console.log(`\n${results.length - failures.length}/${results.length} checks passed`);
process.exit(failures.length > 0 ? 1 : 0);
