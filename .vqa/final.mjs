import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
await p.goto("http://localhost:3123/", { waitUntil: "networkidle" });
await p.waitForTimeout(5200);
await p.screenshot({ path: "/tmp/v6-1280.png" });
await p.setViewportSize({ width: 390, height: 844 });
await p.goto("http://localhost:3123/", { waitUntil: "networkidle" });
const m = await p.evaluate(() => {
  window.scrollTo(9999, 0);
  return { sx: window.scrollX, w: document.documentElement.scrollWidth };
});
console.log("mobile:", JSON.stringify(m));
await p.screenshot({ path: "/tmp/v6-mob.png" });
await b.close();
