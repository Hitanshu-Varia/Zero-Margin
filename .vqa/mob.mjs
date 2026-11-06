import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
for (const r of ["/", "/dashboard", "/terminal?shock=-3000"]) {
  await p.goto(`http://localhost:3123${r}`, { waitUntil: "networkidle" });
  const ok = await p.evaluate(() => {
    window.scrollTo(9999, 0);
    return { sx: window.scrollX, w: document.documentElement.scrollWidth };
  });
  console.log(r, JSON.stringify(ok));
}
await p.goto("http://localhost:3123/dashboard", { waitUntil: "networkidle" });
await p.screenshot({ path: "/tmp/v4-mob.png", fullPage: true });
await b.close();
