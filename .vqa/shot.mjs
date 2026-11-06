import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const p = await b.newPage({ viewport: { width: 1440, height: 800 } });
await p.goto("http://localhost:3123/", { waitUntil: "networkidle" });
await p.waitForTimeout(4800);
await p.screenshot({ path: "/tmp/v6-hero.png" });
await p.waitForTimeout(800);
await p.screenshot({ path: "/tmp/v6-full.png", fullPage: true });
await b.close();
