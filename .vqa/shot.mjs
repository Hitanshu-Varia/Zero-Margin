import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const p = await b.newPage({ viewport: { width: 1512, height: 945 } });
for (const [route, out] of [["/", "/tmp/v2-dashboard.png"], ["/terminal", "/tmp/v2-terminal.png"]]) {
  await p.goto(`http://localhost:3123${route}`, { waitUntil: "networkidle" });
  await p.screenshot({ path: out, fullPage: out.includes("dashboard") });
}
await b.close();
