// scripts/icon-qa3.mjs — result-state icon QA (file upload via CDP).
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = "http://localhost:3111";
const port = 9233;
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
    hits.push({ text: t.slice(0, 90), tag: el.tagName.toLowerCase() });
  }
  // also check select options + title/aria attributes
  document.querySelectorAll('option').forEach(o => { if (re.test(o.textContent)) hits.push({ text: 'OPTION: '+o.textContent, tag: 'option' }); });
  return hits.slice(0, 30);
})()`;

await getTarget();

async function open(path) {
  const page = await (await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(BASE + path)}`, { method: "PUT" })).json();
  const ws = await connect(page.webSocketDebuggerUrl);
  await cdp(ws, "Page.enable");
  await cdp(ws, "Runtime.enable");
  await cdp(ws, "Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await sleep(3200);
  await evalIn(ws, `(() => { const b = [...document.querySelectorAll('button')].find(b => /accept all/i.test(b.textContent)); if (b) b.click(); return !!b; })()`);
  await sleep(500);
  return ws;
}
async function shot(ws, name) {
  const s = await cdp(ws, "Page.captureScreenshot", { format: "png" });
  const out = join(process.cwd(), "shots", `${name}.png`);
  writeFileSync(out, Buffer.from(s.data, "base64"));
  console.log(`screenshot → ${out}`);
}

// 1. Page counter — upload PDF, verify stats icons
{
  const ws = await open("/tools/pdf-page-counter");
  const pdfPath = join(process.cwd(), "shots", "test.pdf");
  if (existsSync(pdfPath)) {
    const doc = await cdp(ws, "DOM.getDocument", { depth: -1 });
    const node = await cdp(ws, "DOM.querySelector", { nodeId: doc.root.nodeId, selector: 'input[type="file"]' });
    if (node.nodeId) {
      await cdp(ws, "DOM.setFileInputFiles", { nodeId: node.nodeId, files: [pdfPath] });
      await sleep(2500);
    } else console.log("no file input found");
  }
  console.log("page-counter result emoji:", JSON.stringify(await evalIn(ws, AUDIT)));
  await shot(ws, "page-counter-result");
  await cdp(ws, "Page.close").catch(() => {});
}

// 2. Transition page — select options
{
  const ws = await open("/tools/pdf-page-transition");
  const opts = await evalIn(ws, `[...document.querySelectorAll('option')].map(o => o.textContent)`);
  console.log("transition options:", JSON.stringify(opts));
  const audit = await evalIn(ws, AUDIT);
  console.log("transition emoji:", JSON.stringify(audit));
  await cdp(ws, "Page.close").catch(() => {});
}

// 3. Support bot with links (click "PDF tools" chip)
{
  const ws = await open("/");
  await evalIn(ws, `(() => { const b = document.querySelector('button[title*="Chat with"]'); if (b) b.click(); return !!b; })()`);
  await sleep(900);
  await evalIn(ws, `(() => { const chips = [...document.querySelectorAll('button')]; const c = chips.find(b => b.textContent.trim() === 'PDF tools'); if (c) c.click(); return !!c; })()`);
  await sleep(1400);
  console.log("bot-links emoji:", JSON.stringify(await evalIn(ws, AUDIT)));
  await shot(ws, "support-bot-links");
  await cdp(ws, "Page.close").catch(() => {});
}

// 4. Word tools page + text tools page sweep
{
  const ws = await open("/word-tools");
  console.log("word-tools emoji:", JSON.stringify(await evalIn(ws, AUDIT)));
  await shot(ws, "word-tools");
  await cdp(ws, "Page.close").catch(() => {});
}

proc.kill();
process.exit(0);
