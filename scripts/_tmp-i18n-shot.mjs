// Temporary QA script (delete after use): screenshots the footer in each locale.
// Usage: node scripts/_tmp-i18n-shot.mjs <url>
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const url = process.argv[2] || "http://localhost:3000/";
const port = Number(process.argv[3] || 9229);
const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const profile = mkdtempSync(join(tmpdir(), "cdpi18n-"));
const proc = spawn(chrome, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--remote-debugging-port=" + port,
  "--user-data-dir=" + profile,
  "--no-first-run",
  url,
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitUp() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (r.ok) {
        const list = await r.json();
        const page = list.find((t) => t.type === "page");
        if (page) return page.webSocketDebuggerUrl;
      }
    } catch {}
    await sleep(250);
  }
  throw new Error("no cdp");
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => resolve(ws);
    ws.onerror = reject;
  });
}

let id = 0;
const pending = new Map();
const ws = await connect(await waitUp());
ws.addEventListener("message", (ev) => {
  const d = JSON.parse(ev.data);
  if (d.id && pending.has(d.id)) {
    const { resolve, reject } = pending.get(d.id);
    pending.delete(d.id);
    d.error ? reject(new Error(JSON.stringify(d.error))) : resolve(d.result);
  }
});
function cdp(method, params = {}) {
  return new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
}

async function evalJs(expression) {
  const r = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
}

await cdp("Page.enable");
await sleep(2500); // initial load

await cdp("Emulation.setDeviceMetricsOverride", {
  width: 1280, height: 900, deviceScaleFactor: 1, mobile: false,
});

for (const locale of ["en", "es", "pt"]) {
  await evalJs(`localStorage.setItem("fw-locale", "${locale}"); location.reload(); "ok"`);
  await sleep(2500);
  const geo = await evalJs(`(() => {
    const f = document.querySelector("footer");
    const r = f.getBoundingClientRect();
    return { top: r.top + window.scrollY, height: r.height, doc: document.documentElement.scrollHeight };
  })()`);
  const shot = await cdp("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    clip: { x: 0, y: geo.top, width: 1280, height: Math.min(geo.height, 1100), scale: 1.5 },
  });
  writeFileSync(`shots/footer-${locale}.png`, Buffer.from(shot.data, "base64"));
  console.log(`footer-${locale}.png`, JSON.stringify(geo));
}

proc.kill();
process.exit(0);
