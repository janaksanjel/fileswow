// Quick computed-style QA over light/dark themes via CDP.
// Usage: node scripts/qa.mjs <url> [port]
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const url = process.argv[2] || "http://localhost:3100/";
const port = Number(process.argv[3] || 9223);
const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getTarget() {
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
    console.error("EVAL ERROR:", JSON.stringify(res.exceptionDetails).slice(0, 800));
    return undefined;
  }
  return res.result.value;
}

await getTarget();

// Create a page target
const page = await (await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: "PUT" })).json();
const ws = await connect(page.webSocketDebuggerUrl);
await cdp(ws, "Page.enable");
await cdp(ws, "Runtime.enable");

// Wait for load + a beat for fonts
await sleep(4000);

const probe = `(() => {
  const cs = (el, prop) => getComputedStyle(el).getPropertyValue(prop);
  const body = document.body;
  const html = document.documentElement;
  const pick = (sel) => document.querySelector(sel);
  const card = pick('.card');
  const primary = pick('.btn-primary');
  const iconBtns = [...document.querySelectorAll('.icon-btn')];
  const searchPills = [...document.querySelectorAll('button')].filter(b => b.textContent.includes('Search tools'));
  const header = pick('header');
  const visible = (el) => el && el.getClientRects().length > 0;
  const cls = (el) => (el.getAttribute && el.getAttribute('class')) || '';
  const vw = document.documentElement.clientWidth;

  const overflowers = [...document.querySelectorAll('body *')]
    .filter((el) => visible(el))
    .map((el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return { tag: el.tagName.toLowerCase(), cls: cls(el).slice(0, 90), left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width), pos: s.position, ov: s.overflowX };
    })
    .filter((e) => e.right > vw + 2 || e.left < -2)
    .slice(0, 12);

  return {
    theme: html.getAttribute('data-theme'),
    scrollW: html.scrollWidth,
    clientW: vw,
    horizontalOverflow: html.scrollWidth > vw,
    overflowers,
    bodyBg: cs(body, 'background-color'),
    bodyColor: cs(body, 'color'),
    cardRadius: card ? cs(card, 'border-radius') : null,
    cardShadow: card ? cs(card, 'box-shadow') : null,
    cardBorder: card ? cs(card, 'border-top-width') : null,
    btnRadius: primary ? cs(primary, 'border-radius') : null,
    btnBg: primary ? cs(primary, 'background-color') : null,
    headerBg: header ? cs(header, 'background-color') : null,
    headerBackdrop: header ? cs(header, 'backdrop-filter') : null,
    iconBtnVisible: iconBtns.filter(visible).length,
    wideSearchVisible: searchPills.filter(visible).length,
    hardShadowCount: [...document.querySelectorAll('*')].filter((el) => {
      const s = getComputedStyle(el).boxShadow;
      return s && s.includes('px') && /\\d+px \\d+px 0/.test(s);
    }).length,
    thickBorders: [...document.querySelectorAll('*')].filter((el) => {
      const s = getComputedStyle(el);
      return parseInt(s.borderTopWidth) >= 2;
    }).length,
    radiusZero: [...document.querySelectorAll('*')].filter((el) => {
      const r = getComputedStyle(el).borderRadius;
      return r === '0px' && visible(el) && (cls(el).includes('card') || cls(el).includes('btn') || cls(el).includes('panel'));
    }).length,
  };
})()`;

const light = await evalIn(ws, probe);

// Force dark via localStorage + attribute (light run may not have set it)
const themeAttr = await evalIn(ws, `document.documentElement.getAttribute('data-theme')`);
if (themeAttr !== "dark") {
  await evalIn(ws, `localStorage.setItem('theme','dark'); document.documentElement.setAttribute('data-theme','dark');`);
  await sleep(900);
}
const dark = await evalIn(ws, probe);

console.log(JSON.stringify({ url, light, dark }, null, 2));

ws.close();
proc.kill();
process.exit(0);
