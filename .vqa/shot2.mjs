import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const p = await b.newPage({ viewport: { width: 1512, height: 945 } });
for (const [route, out] of [["/replay", "/tmp/v2-replay.png"], ["/arkiv", "/tmp/v2-arkiv.png"], ["/proof", "/tmp/v2-proof.png"]]) {
  await p.goto(`http://localhost:3123${route}`, { waitUntil: "networkidle" });
  await p.screenshot({ path: out, fullPage: true });
}
await b.close();
