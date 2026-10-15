// scripts/icon-qa.mjs — one-off visual/icon QA.
// Loads pages, scans the rendered DOM for emoji text glyphs, screenshots them.
// Usage: node scripts/icon-qa.mjs [port]
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = "http://localhost:3111";
const port = 9231;
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

// Emoji audit: visible text nodes containing pictographs (excluding known data arrays
// rendered by pickers — those are user content, not UI icons).
const AUDIT = `(() => {
  const re = /[\\u{1F000}-\\u{1FAFF}\\u{FE0F}\\u{2705}\\u{274C}\\u{2713}\\u{2714}\\u{26A0}\\u{2B50}\\u{2728}\\u{2764}\\u{2B06}\\u{27A1}\\u{2B00}-\\u{2BFF}]/u;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const hits = [];
  let n;
  while ((n = walker.nextNode())) {
    const t = (n.nodeValue || "").trim();
    if (!t) continue;
    if (!re.test(t)) continue;
    const el = n.parentElement;
    if (!el || !el.getClientRects().length) continue;
    // emoji pickers/stickers: user content data
    if (el.closest('[data-emoji-content]')) continue;
    hits.push({ text: t.slice(0, 90), tag: el.tagName.toLowerCase(), cls: (el.getAttribute('class')||'').slice(0,60) });
  }
  return hits.slice(0, 30);
})()`;

const pages = [
  ["/", "home"],
  ["/pdf-tools", "pdf-tools"],
  ["/tools/merge-pdf", "tool-merge"],
  ["/transfer", "transfer"],
  ["/tools/pdf-page-counter", "page-counter"],
  ["/tools/pdf-page-transition", "transition"],
];

await getTarget();

for (const [path, name] of pages) {
  const page = await (await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(BASE + path)}`, { method: "PUT" })).json();
  const ws = await connect(page.webSocketDebuggerUrl);
  await cdp(ws, "Page.enable");
  await cdp(ws, "Runtime.enable");
  await sleep(3500);

  const hits = await evalIn(ws, AUDIT);
  console.log(`\n=== ${name} (${path})`);
  console.log(hits && hits.length ? JSON.stringify(hits, null, 1) : "no emoji text in DOM ✓");

  const svgCount = await evalIn(ws, `document.querySelectorAll('svg').length`);
  console.log(`svg elements: ${svgCount}`);

  const shot = await cdp(ws, "Page.captureScreenshot", { format: "png" });
  const out = join(process.cwd(), "shots", `${name}.png`);
  writeFileSync(out, Buffer.from(shot.data, "base64"));
  console.log(`screenshot → ${out}`);

  await cdp(ws, "Page.close").catch(() => {});
}

proc.kill();
process.exit(0);
