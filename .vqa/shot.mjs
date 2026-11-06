import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const p = await b.newPage({ viewport: { width: 1512, height: 945 } });
await p.goto("http://localhost:3123/", { waitUntil: "networkidle" });
await p.screenshot({ path: "/tmp/v3-landing.png", fullPage: true });
await p.goto("http://localhost:3123/dashboard", { waitUntil: "networkidle" });
await p.screenshot({ path: "/tmp/v3-dash.png", fullPage: true });
await b.close();
