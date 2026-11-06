import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const p = await b.newPage({ viewport: { width: 1512, height: 945 } });
await p.goto("http://localhost:3123/terminal?shock=-3000", { waitUntil: "networkidle" });
await p.screenshot({ path: "/tmp/v3-terminal.png", fullPage: true });
await p.goto("http://localhost:3123/proof", { waitUntil: "networkidle" });
await p.screenshot({ path: "/tmp/v3-proof.png", fullPage: true });
// mobile check
await p.setViewportSize({ width: 390, height: 844 });
await p.goto("http://localhost:3123/", { waitUntil: "networkidle" });
const m = await p.evaluate(() => {
  window.scrollTo(9999, 0);
  return { sx: window.scrollX, w: document.documentElement.scrollWidth };
});
console.log("terminal+proof+mobile:", JSON.stringify(m));
await b.close();
