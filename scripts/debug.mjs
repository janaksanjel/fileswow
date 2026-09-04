import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const url = process.argv[2] || "http://localhost:3101/";
const port = Number(process.argv[3] || 9225);
const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const profile = mkdtempSync(join(tmpdir(), "cdpdbg-"));
const proc = spawn(chrome, ["--headless=new", "--disable-gpu", "--remote-debugging-port=" + port, "--user-data-dir=" + profile, "--no-first-run", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitUp() {
  for (let i = 0; i < 40; i++) { try { const r = await fetch(`http://127.0.0.1:${port}/json/version`); if (r.ok) return; } catch {} await sleep(200); }
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
function cdp(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const mid = ++id;
    const onMsg = (ev) => {
      const d = JSON.parse(ev.data);
      if (d.id === mid) { ws.removeEventListener("message", onMsg); d.error ? reject(new Error(JSON.stringify(d.error))) : resolve(d.result); }
    };
    ws.addEventListener("message", onMsg);
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
}

await waitUp();
const page = await (await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: "PUT" })).json();
const ws = await connect(page.webSocketDebuggerUrl);
await cdp(ws, "DOM.enable");
await cdp(ws, "CSS.enable");
await sleep(5000);

const doc = await cdp(ws, "DOM.getDocument");
const node = await cdp(ws, "DOM.querySelector", { nodeId: doc.root.nodeId, selector: ".card" });
const styles = await cdp(ws, "CSS.getMatchedStylesForNode", { nodeId: node.nodeId });

const fmt = (r) => ({
  selector: r.rule ? r.rule.selectorList.text : null,
  origin: r.rule ? r.rule.origin : null,
  layer: r.rule && r.rule.styleSheetId ? null : null,
  css: r.rule ? r.rule.style.cssText : null,
});
const matched = (styles.matchedCSSRules || []).map(fmt).filter((r) => r.selector && (r.selector.includes("card") || r.selector.includes("a") || r.selector.includes("*")));
const inherited = (styles.inherited || []).map((i) => ({
  sel: i.matchedCSSRules ? i.matchedCSSRules.map((r) => r.rule ? r.rule.selectorList.text + " :: " + r.rule.style.cssText : null) : [],
}));

const meta = await cdp(ws, "Runtime.evaluate", {
  expression: `(() => {
    const out = [];
    let hasCard = false;
    for (const s of document.styleSheets) {
      let found = false;
      try {
        for (const r of s.cssRules) { if (r.selectorText && r.selectorText.includes('card')) found = true; }
      } catch (e) {}
      if (found) hasCard = true;
      out.push({ href: s.href ? s.href.slice(-40) : 'inline', count: s.cssRules.length });
    }
    return { sheets: out, hasCardRule: hasCard, bodyBg: getComputedStyle(document.body).backgroundColor, stylesheetCount: document.styleSheets.length };
  })()`,
  returnByValue: true,
});
console.log(JSON.stringify({ meta: meta.result.value, matched, inheritedCount: inherited.length }, null, 2));
proc.kill();
process.exit(0);
