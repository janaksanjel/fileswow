// Visual QA: screenshot pages via headless Chrome CDP.
// Usage: node scripts/shots.mjs <baseUrl> <outDir> <path...>
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const base = process.argv[2] || "http://localhost:4321";
const outDir = resolve(process.argv[3] || "shots/qa");
const paths = process.argv.slice(4);
const port = Number(process.env.CDP_PORT || 9333);
const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
mkdirSync(outDir, { recursive: true });

const profile = mkdtempSync(join(tmpdir(), "cdp-"));
const proc = spawn(
  chrome,
  [
    "--headless=new",
    "--disable-gpu",
    "--remote-debugging-port=" + port,
    "--user-data-dir=" + profile,
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank",
  ],
  { stdio: "ignore" }
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitCdp() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return;
    } catch {}
    await sleep(250);
  }
  throw new Error("CDP not up");
}

function connect(wsUrl) {
  return new Promise((res, rej) => {
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => res(ws);
    ws.onerror = rej;
  });
}

let msgId = 0;
function cdp(ws, method, params = {}) {
  return new Promise((res, rej) => {
    const id = ++msgId;
    const onMsg = (ev) => {
      const data = JSON.parse(ev.data);
      if (data.id === id) {
        ws.removeEventListener("message", onMsg);
        if (data.error) rej(new Error(JSON.stringify(data.error)));
        else res(data.result);
      }
    };
    ws.addEventListener("message", onMsg);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

const width = Number(process.env.SHOT_W || 1366);
const height = Number(process.env.SHOT_H || 900);
const full = process.env.SHOT_FULL !== "0";

await waitCdp();

for (const p of paths) {
  const name = p.replace(/^\//, "").replace(/[^\w-]+/g, "-") || "home";
  const page = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = await connect(page.webSocketDebuggerUrl);
  await cdp(ws, "Page.enable");
  await cdp(ws, "Runtime.enable");
  await cdp(ws, "Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: process.env.SHOT_MOBILE === "1",
  });
  const target = new URL(p, base).href;
  console.log(`→ ${target}`);
  await cdp(ws, "Page.navigate", { url: target });
  await sleep(3500);
  // Dismiss cookie banner if present so shots are comparable
  await cdp(ws, "Runtime.evaluate", {
    expression: `(() => { const b=[...document.querySelectorAll('button')].find(x=>/accept all/i.test(x.textContent||'')); if(b) b.click(); })()`,
  }).catch(() => {});
  await sleep(400);
  const { data } = await cdp(ws, "Page.captureScreenshot", { format: "png", captureBeyondViewport: full });
  writeFileSync(join(outDir, `${name}.png`), Buffer.from(data, "base64"));
  console.log(`saved ${name}.png`);
  ws.close();
}

proc.kill();
process.exit(0);
