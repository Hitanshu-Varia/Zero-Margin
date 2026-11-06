import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
for (const r of ["/", "/dashboard"]) {
  await p.goto(`http://localhost:3123${r}`, { waitUntil: "networkidle" });
  const ok = await p.evaluate(() => {
    window.scrollTo(9999, 0);
    return { sx: window.scrollX, w: document.documentElement.scrollWidth };
  });
  console.log(r, JSON.stringify(ok));
}
// keyboard interaction check on the sweep
await p.goto("http://localhost:3123/dashboard", { waitUntil: "networkidle" });
await p.focus("#sweep-scrub");
await p.keyboard.press("Home");
await p.keyboard.press("ArrowRight");
const val = await p.$eval("#sweep-scrub", (el) => el.value);
console.log("scrub value after 1 keystroke:", val);
await p.keyboard.press("End");
console.log("scrub end:", await p.$eval("#sweep-scrub", (el) => el.value));
await b.close();
