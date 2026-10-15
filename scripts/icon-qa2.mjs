// scripts/icon-qa2.mjs — second-pass visual/icon QA (dismissible overlays closed).
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = "http://localhost:3111";
const port = 9232;
const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const profile = mkdtempSync(join(tmpdir(), "cdp-"));
const proc = spawn(chrome, [
  "--headless=new",
  "--disable-gpu",
  "--remote-debugging-port=" + port,
  "--user-data-dir=" + profile,
  "--no-first-run",
  "--no-default-browser-check",
  "about:blank",
], { stdio: "ignore" });

async function getTarget() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return;
    } catch {}
    await sleep(250);
  }
  throw new Error("CDP not up");
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => resolve(ws);
    ws.onerror = reject;
  });
}

let msgId = 0;
function cdp(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    const onMsg = (ev) => {
      const data = JSON.parse(ev.data);
      if (data.id === id) {
        ws.removeEventListener("message", onMsg);
        if (data.error) reject(new Error(JSON.stringify(data.error)));
        else resolve(data.result);
      }
    };
    ws.addEventListener("message", onMsg);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evalIn(ws, expr) {
  const res = await cdp(ws, "Runtime.evaluate", { expression: expr, returnByValue: true });
  if (res.exceptionDetails) {
    console.error("EVAL ERROR:", JSON.stringify(res.exceptionDetails).slice(0, 500));
    return undefined;
  }
  return res.result.value;
}

const AUDIT = `(() => {
  const re = /[\\u{1F000}-\\u{1FAFF}\\u{FE0F}\\u{2705}\\u{274C}\\u{2713}\\u{2714}\\u{26A0}\\u{2B50}\\u{2728}\\u{2764}\\u{2B06}\\u{27A1}\\u{2B00}-\\u{2BFF}]/u;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const hits = [];
  let n;
  while ((n = walker.nextNode())) {
    const t = (n.nodeValue || "").trim();
    if (!t || !re.test(t)) continue;
    const el = n.parentElement;
    if (!el || !el.getClientRects().length) continue;
    hits.push({ text: t.slice(0, 90), tag: el.tagName.toLowerCase(), cls: (el.getAttribute('class')||'').slice(0,60) });
  }
  return hits.slice(0, 30);
})()`;

await getTarget();

async function open(path) {
  const page = await (await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(BASE + path)}`, { method: "PUT" })).json();
  const ws = await connect(page.webSocketDebuggerUrl);
  await cdp(ws, "Page.enable");
  await cdp(ws, "Runtime.enable");
  await cdp(ws, "Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await sleep(3500);
  // dismiss cookie banner
  await evalIn(ws, `(() => {
    const btns = [...document.querySelectorAll('button')];
    const accept = btns.find(b => /accept all/i.test(b.textContent));
    if (accept) accept.click();
    return !!accept;
  })()`);
  await sleep(600);
  return ws;
}

async function shot(ws, name) {
  const shot = await cdp(ws, "Page.captureScreenshot", { format: "png" });
  const out = join(process.cwd(), "shots", `${name}.png`);
  writeFileSync(out, Buffer.from(shot.data, "base64"));
  console.log(`screenshot → ${out}`);
}

// 1. Home — popular tools grid
{
  const ws = await open("/");
  console.log("home emoji:", JSON.stringify(await evalIn(ws, AUDIT)));
  await evalIn(ws, `window.scrollTo(0, document.body.scrollHeight)`);
  await sleep(800);
  console.log("home footer emoji:", JSON.stringify(await evalIn(ws, AUDIT)));
  await shot(ws, "home-footer");
  // open support bot
  await evalIn(ws, `(() => { const b = document.querySelector('button[title*="Chat with"], button[aria-label*="support chat"]'); if (b) b.click(); return !!b; })()`);
  await sleep(900);
  await shot(ws, "support-bot");
  console.log("support bot emoji:", JSON.stringify(await evalIn(ws, AUDIT)));
  await cdp(ws, "Page.close").catch(() => {});
}

// 2. PDF tools — tool cards grid
{
  const ws = await open("/pdf-tools");
  await evalIn(ws, `window.scrollTo(0, 900)`);
  await sleep(700);
  console.log("pdf-tools emoji:", JSON.stringify(await evalIn(ws, AUDIT)));
  await shot(ws, "pdf-tools-grid");
  await cdp(ws, "Page.close").catch(() => {});
}

// 3. Transfer — file queue icons (add nothing; just verify UI chrome)
{
  const ws = await open("/transfer");
  console.log("transfer emoji:", JSON.stringify(await evalIn(ws, AUDIT)));
  await shot(ws, "transfer");
  await cdp(ws, "Page.close").catch(() => {});
}

// 4. Workflow / operation selector (has "Selected ✓")
{
  const ws = await open("/tools/pdf-page-transition");
  console.log("transition emoji:", JSON.stringify(await evalIn(ws, AUDIT)));
  await shot(ws, "transition");
  await cdp(ws, "Page.close").catch(() => {});
}

proc.kill();
process.exit(0);
