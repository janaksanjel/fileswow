#!/usr/bin/env node
// scripts/emoji-to-svg.mjs
//
// One-off codemod: swaps emoji and text-glyph icons (✓ ✕ 📋 🔒 …) for the
// colorful SVG <UiIcon /> component so every icon in the UI is clean vector art.
//
// Emoji *data* arrays (sticker picker / emoji picker, where emoji is the
// feature itself) are left untouched.
//
// Usage: node scripts/emoji-to-svg.mjs [--dry]

import fs from "node:fs";
import path from "node:path";

const DRY = process.argv.includes("--dry");
const SRC = path.resolve(process.cwd(), "src");

const IMPORT_LINE = `import { UiIcon } from "@/components/ui-icon";\n`;

const EMOJI_CLASS =
  "\\u{1F000}-\\u{1FAFF}\\u{FE0F}\\u{2705}\\u{274C}\\u{2713}\\u{2714}\\u{2715}\\u{2716}\\u{26A0}\\u{2611}\\u{2612}\\u{2728}\\u{2764}\\u{2B06}\\u{2B50}\\u{2B55}\\u{2B1B}\\u{2B1C}\\u{27A1}\\u{2708}\\u{2709}\\u{270F}\\u{274E}\\u{2753}-\\u{2755}\\u{23F8}\\u{23F9}\\u{23FA}";
const STRIP_RE = new RegExp(`[${EMOJI_CLASS}]`, "gu");
const HAS_STRIP_RE = new RegExp(`[${EMOJI_CLASS}]`, "u");

const CHECK = `<UiIcon name="check" size={14} className="inline align-[-3px] mr-1" />`;
const CLOSE = `<UiIcon name="close" size={13} />`;

// Emoji that appear directly as JSX text → icon.
const JSX_EMOJI_MAP = {
  "📋": "copy",
  "📦": "download",
  "🔒": "lock",
  "📁": "folder",
  "😊": "smile",
  "👋": "chat",
};

// Exact strings (JSX expression children) → JSX icon expressions.
const STRING_CONVERSIONS = [
  [/"⏹\uFE0F? None"/g, `<><UiIcon name="stop" size={14} className="inline align-[-2px] mr-1" />None</>`],
  [/"🔄\uFE0F? Fade"/g, `<><UiIcon name="fade" size={14} className="inline align-[-2px] mr-1" />Fade</>`],
  [/"➡\uFE0F? Slide"/g, `<><UiIcon name="slideRight" size={14} className="inline align-[-2px] mr-1" />Slide</>`],
  [/"⬆\uFE0F? Slide Up"/g, `<><UiIcon name="slideUp" size={14} className="inline align-[-2px] mr-1" />Slide Up</>`],
  [/"💧\uFE0F? Dissolve"/g, `<><UiIcon name="drop" size={14} className="inline align-[-2px] mr-1" />Dissolve</>`],
  [/"✏\uFE0F? Custom"/g, `<><UiIcon name="pencil" size={14} className="inline align-[-2px] mr-1" />Custom</>`],
  [/"🔒\uFE0F?"/g, `<UiIcon name="lock" size={18} />`],
  [/"🔓\uFE0F?"/g, `<UiIcon name="unlock" size={18} />`],
  [/"✅\uFE0F?"/g, `<UiIcon name="check" size={18} />`],
  [/"⚠\uFE0F?"/g, `<UiIcon name="warning" size={18} />`],
  [/"✓✓"/g, `<UiIcon name="checkDouble" size={15} />`],
  [/"✓"/g, `<UiIcon name="check" size={15} />`],
];

function transformCode(code) {
  let out = code;
  const hits = [];
  const note = (rule) => hits.push(rule);

  // 1. Exact strings used as JSX expression children.
  for (const [re, replacement] of STRING_CONVERSIONS) {
    out = out.replace(re, () => {
      note("string→icon");
      return replacement;
    });
  }

  // 2. Standalone glyph on its own JSX line (workflow close buttons, etc).
  out = out.replace(/^([ \t]+)✓[ \t]*$/gm, (_m, ind) => {
    note("line-check");
    return `${ind}{${CHECK}}`;
  });
  out = out.replace(/^([ \t]+)✕[ \t]*$/gm, (_m, ind) => {
    note("line-close");
    return `${ind}{${CLOSE}}`;
  });

  // 3. Glyph at the start of JSX text: <p>✓ Done!</p>
  out = out.replace(/(>)✓ /g, (_m, gt) => {
    note("jsx-check");
    return `${gt}{${CHECK}}`;
  });
  out = out.replace(/(>)✓(?=[<{])/g, (_m, gt) => {
    note("jsx-check");
    return `${gt}{${CHECK}}`;
  });
  out = out.replace(/^( *)✓ /gm, (_m, ind) => {
    note("jsx-check-indent");
    return `${ind}{${CHECK}}`;
  });

  // 4. Close glyph as JSX text: <button>✕</button>
  out = out.replace(/(>)✕(?=<)/g, (_m, gt) => {
    note("jsx-close");
    return `${gt}{${CLOSE}}`;
  });

  // 5. Emoji at the start of JSX text.
  out = out.replace(
    new RegExp(`>(${Object.keys(JSX_EMOJI_MAP).join("|")})\\uFE0F?`, "gu"),
    (_m, emoji) => {
      note("jsx-emoji");
      const name = JSX_EMOJI_MAP[emoji];
      return `>{<UiIcon name="${name}" size={14} className="inline align-[-3px] mr-1" />}`;
    }
  );

  // 6. Leading check inside a string used as a JSX child: "✓ Copied"
  out = out.replace(/"✓ ([^"\n]*)"/g, (_m, text) => {
    note("str-check");
    return `<><UiIcon name="check" size={13} className="inline align-[-3px] mr-1" />${text}</>`;
  });

  // 7. Trailing check: "Selected ✓"
  out = out.replace(/"([^"<>\n]{1,60}) ✓"/g, (_m, text) => {
    note("str-check-tail");
    return `<>${text}<UiIcon name="check" size={13} className="inline align-[-3px] ml-1" /></>`;
  });

  // 8. Strip leftover emoji from double-quoted / template-literal contents.
  out = out.replace(/"([^"\n]*)"/g, (m, body) => {
    if (!HAS_STRIP_RE.test(body)) return m;
    note("str-strip");
    let cleaned = body;
    cleaned = cleaned.replace(new RegExp(` ?[${EMOJI_CLASS}]`, "gu"), "");
    cleaned = cleaned.replace(new RegExp(`[${EMOJI_CLASS}] ?`, "gu"), "");
    cleaned = cleaned.replace(/\s{2,}/g, " ").replace(/\s+([.,;:!?])/g, "$1");
    return `"${cleaned}"`;
  });
  out = out.replace(/`([^`]*)`/g, (m, body) => {
    if (!HAS_STRIP_RE.test(body)) return m;
    note("tpl-strip");
    let cleaned = body;
    cleaned = cleaned.replace(new RegExp(` ?[${EMOJI_CLASS}]`, "gu"), "");
    cleaned = cleaned.replace(new RegExp(`[${EMOJI_CLASS}] ?`, "gu"), "");
    cleaned = cleaned.replace(/\s{2,}/g, " ").replace(/\s+([.,;:!?])/g, "$1");
    return `\`${cleaned}\``;
  });

  return { out, hits };
}

function ensureImport(code) {
  if (!code.includes("<UiIcon")) return code;
  if (code.includes('from "@/components/ui-icon"')) return code;

  // Insert after the last top-level import statement.
  const importRe = /^import[\s\S]*?from\s+"[^"]+";\s*$/gm;
  let last = null;
  let m;
  while ((m = importRe.exec(code)) !== null) last = m;
  if (last) {
    const idx = last.index + last[0].length;
    return code.slice(0, idx) + "\n" + IMPORT_LINE.trimEnd() + code.slice(idx);
  }
  if (code.startsWith('"use client";\n')) {
    return `"use client";\n\n${IMPORT_LINE}` + code.slice('"use client";\n'.length);
  }
  return IMPORT_LINE + code;
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, files);
    else if (/\.tsx?$/.test(entry.name)) files.push(p);
  }
  return files;
}

// catalog.ts — the `icon` field is dead data that used to hold emoji; point it
// at the SVG icon key (the tool slug, rendered by <ToolIcon name={tool.slug}>).
function fixCatalog(code) {
  let lastSlug = null;
  let changed = 0;
  const out = code
    .split("\n")
    .map((line) => {
      const slugs = [...line.matchAll(/\bslug:\s*'([^']+)'/g)];
      if (slugs.length) lastSlug = slugs[slugs.length - 1][1];
      if (lastSlug && /\bicon:\s*'[^']*'/.test(line)) {
        changed++;
        return line.replace(/\bicon:\s*'[^']*'/, `icon: '${lastSlug}'`);
      }
      return line;
    })
    .join("\n")
    .replace(
      "icon: string; // emoji fallback — replace with SVG icons in components",
      "icon: string; // SVG icon key (mirrors slug) — rendered by <ToolIcon name={tool.slug}>"
    );
  return { out, changed };
}

// Split a file into transformable chunks, protecting `const EMOJIS = [...]`
// data arrays (sticker picker / emoji picker) where emoji IS the feature.
function splitProtected(code) {
  const lines = code.split("\n");
  const chunks = [];
  let buf = [];
  let protecting = false;
  let anyProtected = false;

  const flush = () => {
    if (buf.length) chunks.push({ prot: false, text: buf.join("\n") });
    buf = [];
  };

  for (const line of lines) {
    if (protecting) {
      buf.push(line);
      if (/\];\s*$/.test(line)) {
        protecting = false;
        chunks.push({ prot: true, text: buf.join("\n") });
        buf = [];
      }
      continue;
    }
    if (/const EMOJIS\b/.test(line)) {
      if (/\];\s*$/.test(line)) {
        // one-liner data array
        flush();
        chunks.push({ prot: true, text: line });
        anyProtected = true;
      } else {
        protecting = true;
        buf.push(line);
        anyProtected = true;
      }
      continue;
    }
    buf.push(line);
  }
  flush();
  if (protecting) {
    // unterminated — treat remainder as protected
    chunks.push({ prot: true, text: buf.join("\n") });
  }
  return { chunks, anyProtected };
}

const files = walk(SRC).sort();
const summary = [];

for (const file of files) {
  const rel = path.relative(process.cwd(), file);
  const original = fs.readFileSync(file, "utf8");
  let code = original;
  let hits = [];

  if (rel.replace(/\\/g, "/").endsWith("src/lib/catalog.ts")) {
    const r = fixCatalog(code);
    code = r.out;
    hits.push(`catalog-icons:${r.changed}`);
  }

  const { chunks } = splitProtected(code);
  const rebuilt = chunks
    .map((chunk) => {
      if (chunk.prot) return chunk.text;
      const t = transformCode(chunk.text);
      hits.push(...t.hits);
      return t.out;
    })
    .join("\n");

  code = ensureImport(rebuilt);

  if (code !== original) {
    summary.push(`${rel} — ${hits.length ? hits.join(", ") : "import-only"}`);
    if (!DRY) fs.writeFileSync(file, code, "utf8");
  }
}

console.log(DRY ? "[dry run] files that would change:" : "updated files:");
console.log(summary.join("\n"));
console.log(`\n${summary.length} file(s) ${DRY ? "would change" : "updated"}.`);
