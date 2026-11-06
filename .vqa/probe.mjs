import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const p = await b.newPage({ viewport: { width: 1440, height: 800 } });
await p.goto("http://localhost:3123/", { waitUntil: "networkidle" });
await p.waitForTimeout(5200);
const info = await p.evaluate(() => {
  const h1 = document.querySelector("h1");
  const r = h1.getBoundingClientRect();
  const cs = getComputedStyle(h1);
  return { rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, opacity: cs.opacity, color: cs.color, display: cs.display, text: h1.textContent.slice(0, 40) };
});
console.log(JSON.stringify(info, null, 1));
await p.screenshot({ path: "/tmp/v6-hero.png" });
await b.close();
