import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const p = await b.newPage({ viewport: { width: 1512, height: 945 } });
for (const [r, o] of [["/terminal?shock=-3000", "/tmp/v4-term.png"], ["/proof", "/tmp/v4-proof.png"], ["/replay", "/tmp/v4-replay.png"], ["/arkiv", "/tmp/v4-arkiv.png"]]) {
  await p.goto(`http://localhost:3123${r}`, { waitUntil: "networkidle" });
  await p.screenshot({ path: o, fullPage: true });
}
await b.close();
