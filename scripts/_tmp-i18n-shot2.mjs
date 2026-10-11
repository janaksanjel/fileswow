// Temporary QA script (delete after use): dropdown open state + full-page ES shot.
// Usage: node scripts/_tmp-i18n-shot2.mjs <url>
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const url = process.argv[2] || "http://localhost:3000/";
const port = Number(process.argv[3] || 9231);
const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const profile = mkdtempSync(join(tmpdir(), "cdpi18n2-"));
const proc = spawn(chrome, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars",
  "--remote-debugging-port=" + port, "--user-data-dir=" + profile,
  "--no-first-run", url,
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
const cdp = (method, params = {}) => new Promise((resolve, reject) => {
  const mid = ++id;
  pending.set(mid, { resolve, reject });
  ws.send(JSON.stringify({ id: mid, method, params }));
});
const evalJs = async (expression) => {
  const r = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
};

await cdp("Page.enable");
await cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await sleep(2500);

// Switch to ES and open the language dropdown
await evalJs(`localStorage.setItem("fw-locale", "es"); location.reload(); "ok"`);
await sleep(2500);
await evalJs(`(() => { const b = document.querySelector('[aria-haspopup="listbox"]'); b.scrollIntoView({block:"center"}); b.click(); return "clicked"; })()`);
await sleep(800);
const geo = await evalJs(`(() => {
  const b = document.querySelector('[aria-haspopup="listbox"]');
  const r = b.getBoundingClientRect();
  return { x: Math.max(0, r.left - 40), y: Math.max(0, r.top + window.scrollY - 260), w: 360, h: 400 };
})()`);
let shot = await cdp("Page.captureScreenshot", {
  format: "png",
  captureBeyondViewport: true,
  clip: { x: geo.x, y: geo.y, width: geo.w, height: geo.h, scale: 1.5 },
});
writeFileSync("shots/lang-dropdown-es.png", Buffer.from(shot.data, "base64"));
console.log("lang-dropdown-es.png", JSON.stringify(geo));

// Full-page homepage in ES
await evalJs(`(() => { const b = document.querySelector('[aria-haspopup="listbox"]'); if (b && b.getAttribute("aria-expanded")==="true") b.click(); return "closed"; })()`);
await cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
const full = await evalJs(`(() => ({ h: document.documentElement.scrollHeight }))()`);
shot = await cdp("Page.captureScreenshot", {
  format: "png",
  captureBeyondViewport: true,
  clip: { x: 0, y: 0, width: 1280, height: Math.min(full.h, 5400), scale: 1 },
});
writeFileSync("shots/home-es-full.png", Buffer.from(shot.data, "base64"));
console.log("home-es-full.png", JSON.stringify(full));

// Mobile footer check (390px, EN)
await evalJs(`localStorage.setItem("fw-locale", "en"); location.reload(); "ok"`);
await sleep(2500);
await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await sleep(600);
const mgeo = await evalJs(`(() => {
  const f = document.querySelector("footer");
  const r = f.getBoundingClientRect();
  return { top: r.top + window.scrollY, height: r.height };
})()`);
shot = await cdp("Page.captureScreenshot", {
  format: "png",
  captureBeyondViewport: true,
  clip: { x: 0, y: mgeo.top, width: 390, height: Math.min(mgeo.height, 1400), scale: 2 },
});
writeFileSync("shots/footer-mobile-en.png", Buffer.from(shot.data, "base64"));
console.log("footer-mobile-en.png", JSON.stringify(mgeo));

proc.kill();
process.exit(0);
