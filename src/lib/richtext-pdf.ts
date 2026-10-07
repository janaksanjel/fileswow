// lib/richtext-pdf.ts
//
// Rich-text → PDF engine for the Text to PDF tool.
//
// Design goals:
//  1. High quality: output is REAL vector text (selectable, searchable, sharp
//     at any zoom) — never a rasterized screenshot of the editor.
//  2. Format preservation: styles are read from the editor's live DOM via
//     getComputedStyle, so whatever the user sees — bold, italic, underline,
//     strike, colors, highlights, font families, sizes, alignment, lists,
//     links, blockquote indents, headings, margins, images — typesets into
//     the PDF instead of being flattened to plain text.
//  3. Honest limits: jsPDF's standard fonts cover Latin (WinAnsi) scripts, so
//     characters outside that range are replaced with "?" and reported in
//     warnings; images that cannot be loaded locally are skipped and reported.
//
// Rendering model: the DOM is flattened into styled "blocks" (paragraphs,
// list items, headings, images, rules). Each block's inline runs are wrapped
// with measured widths (jsPDF getTextWidth per token), then drawn run-by-run
// with per-run font/color/underline/strike/highlight. Mixed-format lines,
// justify stretching, list markers, and page breaks are all handled here.

import { jsPDF } from "jspdf";

export type PdfPageSize = "a4" | "letter" | "legal";
export type PdfOrientation = "portrait" | "landscape";
export type PdfMargin = "narrow" | "normal" | "wide";
export type PdfLineSpacing = 1 | 1.15 | 1.5 | 2;
export type PageNumberPosition = "bottom-center" | "bottom-right" | "top-right";

export interface RichTextPdfOptions {
  pageSize: PdfPageSize;
  orientation: PdfOrientation;
  margin: PdfMargin;
  lineSpacing: PdfLineSpacing;
  pageNumbers: boolean;
  pageNumberPosition: PageNumberPosition;
}

export interface RichTextPdfResult {
  blob: Blob;
  pageCount: number;
  warnings: string[];
}

const MARGINS_PT: Record<PdfMargin, number> = {
  narrow: 40, // ≈ 0.55"
  normal: 72, // 1"
  wide: 100, // ≈ 1.4"
};

/** Ink color used for text that has no explicit color of its own. */
const PDF_INK: RGB = [17, 24, 39];

// ─── Internal model ──────────────────────────────────────────────────

type FontFamily = "helvetica" | "times" | "courier";
type RGB = [number, number, number];

interface TextStyle {
  family: FontFamily;
  size: number; // pt
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  color: RGB;
  bg: RGB | null; // highlight
}

interface Segment {
  text: string;
  style: TextStyle;
  url?: string;
}

interface ImageBlock {
  kind: "image";
  dataUrl: string;
  format: "PNG" | "JPEG";
  widthPt: number;
  heightPt: number;
}

interface RuleBlock {
  kind: "rule";
}

interface ParagraphBlock {
  kind: "paragraph";
  segments: Segment[];
  blank?: boolean; // explicit empty line (what the user saw in the editor)
  align: "left" | "center" | "right" | "justify";
  indentPt: number;
  marker?: string;
  spaceBeforePt: number;
  spaceAfterPt: number;
  preformatted: boolean;
}

type Block = ParagraphBlock | ImageBlock | RuleBlock;

// WinAnsi (CP1252) characters beyond Latin-1 that the standard PDF fonts map.
const WINANSI_EXTRA = new Set([
  0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030,
  0x0160, 0x2039, 0x0152, 0x017d, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022,
  0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x017e, 0x0178,
]);

const BLOCK_TAGS = new Set([
  "P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "LI",
  "BLOCKQUOTE", "PRE", "TABLE", "THEAD", "TBODY", "TFOOT", "TR", "HR",
  "ADDRESS", "SECTION", "ARTICLE", "FIGURE", "FIGCAPTION", "DL", "DT", "DD",
]);

const SKIP_TAGS = new Set([
  "SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "IFRAME", "OBJECT",
  "VIDEO", "AUDIO", "SVG", "CANVAS", "INPUT", "BUTTON", "SELECT",
]);

const DEFAULT_STYLE: TextStyle = {
  family: "helvetica",
  size: 12,
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  color: PDF_INK,
  bg: null,
};

// ─── Style extraction ────────────────────────────────────────────────

function mapFontFamily(fontFamily: string): FontFamily {
  const f = fontFamily.toLowerCase();
  if (/(courier|mono|consolas|menlo)/.test(f)) return "courier";
  if (/(times|georgia|garamond|book|serif)/.test(f) && !/sans/.test(f)) return "times";
  return "helvetica";
}

function parseColor(css: string): RGB {
  const nums = css.match(/[\d.]+/g);
  if (!nums || nums.length < 3) return [0, 0, 0];
  return [Number(nums[0]), Number(nums[1]), Number(nums[2])].map((n) =>
    Math.max(0, Math.min(255, Math.round(n)))
  ) as RGB;
}

function pxToPt(px: number): number {
  return px * 0.75;
}

function styleOf(el: Element | null, fallback: TextStyle): TextStyle {
  if (!el) return fallback;
  const cs = window.getComputedStyle(el);
  const deco = `${cs.textDecorationLine} ${cs.textDecoration}`;
  let weight = 400;
  const w = cs.fontWeight;
  if (w === "bold" || w === "bolder") weight = 700;
  else weight = parseInt(w, 10) || 400;
  const bgCss = cs.backgroundColor;
  const hasBg = bgCss !== "rgba(0, 0, 0, 0)" && bgCss !== "transparent";
  return {
    family: mapFontFamily(cs.fontFamily),
    size: Math.max(4, pxToPt(parseFloat(cs.fontSize) || 16)),
    bold: weight >= 600,
    italic: /italic|oblique/.test(cs.fontStyle),
    underline: /underline/.test(deco),
    strike: /line-through/.test(deco),
    color: parseColor(cs.color),
    bg: hasBg ? parseColor(bgCss) : null,
  };
}

/** Replace characters the standard PDF fonts cannot encode; count them. */
function sanitizeText(text: string, replaced: { count: number }): string {
  let out = "";
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    if (cp === 0x0d) continue; // drop \r from \r\n
    if (cp === 0x0a) {
      out += "\n";
    } else if (cp === 0x09) {
      out += "  ";
    } else if (cp <= 0xff || WINANSI_EXTRA.has(cp)) {
      out += ch;
    } else {
      out += "?";
      replaced.count += 1;
    }
  }
  return out;
}

function applyFont(doc: jsPDF, style: TextStyle): void {
  const weight = style.bold ? "bold" : "";
  const slope = style.italic ? "italic" : "";
  doc.setFont(style.family, `${weight}${slope}` || "normal");
  doc.setFontSize(style.size);
}

// ─── DOM collection ──────────────────────────────────────────────────

interface CollectCtx {
  baseStyle: TextStyle;
  segments: Segment[];
  blocks: Block[];
  replaced: { count: number };
  missingImages: { count: number };
  sawTable: boolean;
  olCounters: number[];
  listDepth: number;
  imageJobs: Promise<void>[];
}

function hasBlockChildren(el: HTMLElement): boolean {
  return Array.from(el.children).some((c) => BLOCK_TAGS.has(c.nodeName));
}

/** Recursively append inline content (text, <br>, <img>, spans, links…) to the pending paragraph. */
function walkInline(ctx: CollectCtx, node: Node, preserveSpaces: boolean): void {
  if (node.nodeType === Node.TEXT_NODE) {
    const raw = preserveSpaces
      ? node.textContent ?? ""
      : (node.textContent ?? "").replace(/\s+/g, " ");
    if (raw === "") return;
    ctx.segments.push({ text: sanitizeText(raw, ctx.replaced), style: styleOf(node.parentElement, ctx.baseStyle) });
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const el = node as HTMLElement;
  const tag = el.nodeName;
  if (SKIP_TAGS.has(tag)) return;

  if (tag === "BR") {
    ctx.segments.push({ text: "\n", style: styleOf(el, ctx.baseStyle) });
    return;
  }
  if (tag === "IMG") {
    // Images become their own block at the current position.
    flushParagraph(ctx, el);
    enqueueImage(ctx, el);
    return;
  }
  if (tag === "HR") {
    flushParagraph(ctx, el);
    ctx.blocks.push({ kind: "rule" });
    return;
  }
  for (const child of Array.from(el.childNodes)) {
    walkInline(ctx, child, preserveSpaces);
  }
}

/**
 * Close the pending paragraph and append it as a block.
 *
 * Blank-line semantics (matching what the editor displays):
 *  - whitespace-only text between blocks → skipped entirely
 *  - a block element that is empty or only contains <br> → one blank line
 *  - interior <br> within text → line breaks inside the paragraph
 */
function flushParagraph(ctx: CollectCtx, blockEl: Element | null, forcedBlank = false): void {
  let segments = ctx.segments;
  ctx.segments = [];

  // Drop ONE trailing explicit break — a trailing <br> is a layout artifact,
  // not a blank line the user asked for.
  const last = segments[segments.length - 1];
  if (last && last.text === "\n" && segments.some((s) => s.text.trim() !== "")) {
    segments = segments.slice(0, -1);
  }

  const hasText = segments.some((s) => s.text.trim() !== "");
  const hasBreak = segments.some((s) => s.text.includes("\n"));

  let align: ParagraphBlock["align"] = "left";
  let indentPt = 0;
  let spaceBefore = 0;
  let spaceAfter = 0;
  if (blockEl) {
    const cs = window.getComputedStyle(blockEl);
    const ta = cs.textAlign;
    align =
      ta === "center" || ta === "-webkit-center"
        ? "center"
        : ta === "right" || ta === "-webkit-right"
          ? "right"
          : ta === "justify"
            ? "justify"
            : "left";
    indentPt = Math.min(120, Math.max(0, pxToPt(parseFloat(cs.marginLeft) || 0)));
    spaceBefore = Math.min(48, Math.max(0, pxToPt(parseFloat(cs.marginTop) || 0)));
    spaceAfter = Math.min(48, Math.max(0, pxToPt(parseFloat(cs.marginBottom) || 0)));
  }

  if (!hasText) {
    // No visible text: only a real blank line if it was explicit (empty
    // element or a bare <br>), not for stray spaces between blocks.
    if (!forcedBlank && !hasBreak) return;
    ctx.blocks.push({
      kind: "paragraph",
      segments: [],
      blank: true,
      align: "left",
      indentPt: 0,
      spaceBeforePt: 0,
      spaceAfterPt: 0,
      preformatted: false,
    });
    return;
  }

  ctx.blocks.push({
    kind: "paragraph",
    segments: segments.filter((s) => s.text !== ""),
    align,
    indentPt,
    spaceBeforePt: spaceBefore,
    spaceAfterPt: spaceAfter,
    preformatted: false,
  });
}

function listMarker(ctx: CollectCtx, ordered: boolean): string {
  if (!ordered) return "\u2022";
  while (ctx.olCounters.length <= ctx.listDepth) ctx.olCounters.push(0);
  ctx.olCounters[ctx.listDepth] += 1;
  for (let i = ctx.listDepth + 1; i < ctx.olCounters.length; i++) ctx.olCounters[i] = 0;
  return `${ctx.olCounters[ctx.listDepth]}.`;
}

function walkBlocks(ctx: CollectCtx, container: Node): void {
  for (const node of Array.from(container.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const raw = node.textContent ?? "";
      if (raw.trim() === "") continue; // inter-block whitespace
      ctx.segments.push({
        text: sanitizeText(raw.replace(/\s+/g, " "), ctx.replaced),
        style: styleOf(node.parentElement, ctx.baseStyle),
      });
      continue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const el = node as HTMLElement;
    const tag = el.nodeName;

    if (SKIP_TAGS.has(tag)) continue;

    if (tag === "UL" || tag === "OL") {
      flushParagraph(ctx, null);
      walkList(ctx, el, tag === "OL");
      continue;
    }

    if (tag === "PRE") {
      flushParagraph(ctx, null);
      emitPre(ctx, el);
      continue;
    }

    if (tag === "TABLE") {
      flushParagraph(ctx, null);
      emitTable(ctx, el);
      continue;
    }

    if (tag === "HR") {
      flushParagraph(ctx, null);
      ctx.blocks.push({ kind: "rule" });
      continue;
    }

    if (tag === "IMG") {
      flushParagraph(ctx, null);
      enqueueImage(ctx, el);
      continue;
    }

    if (BLOCK_TAGS.has(tag)) {
      // A DIV that only wraps inline content is a paragraph (that's how
      // browsers store typed lines); a DIV wrapping other blocks recurses.
      if (tag === "DIV" && hasBlockChildren(el)) {
        flushParagraph(ctx, null);
        walkBlocks(ctx, el);
        continue;
      }
      flushParagraph(ctx, null);
      walkInline(ctx, el, false);
      // An element with no children at all is an explicit blank line.
      flushParagraph(ctx, el, el.childNodes.length === 0);
      continue;
    }

    // Inline element at block level: accumulate into the pending paragraph.
    walkInline(ctx, el, false);
  }
}

function walkList(ctx: CollectCtx, list: HTMLElement, ordered: boolean): void {
  ctx.listDepth += 1;
  if (ordered) {
    while (ctx.olCounters.length <= ctx.listDepth) ctx.olCounters.push(0);
    ctx.olCounters[ctx.listDepth] = 0;
  }

  for (const li of Array.from(list.children)) {
    if (li.nodeName !== "LI") continue;
    const marker = listMarker(ctx, ordered);
    flushParagraph(ctx, null);

    // The LI's own inline content first; nested lists after it.
    const nested: HTMLElement[] = [];
    for (const child of Array.from(li.childNodes)) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const name = (child as Element).nodeName;
        if (name === "UL" || name === "OL") {
          nested.push(child as HTMLElement);
          continue;
        }
      }
      walkInline(ctx, child, false);
    }
    flushParagraph(ctx, li);

    const block = ctx.blocks[ctx.blocks.length - 1];
    if (block && block.kind === "paragraph") {
      block.marker = marker;
      block.indentPt = Math.min(120, 16 * ctx.listDepth);
      block.spaceBeforePt = Math.min(block.spaceBeforePt, 3);
      block.spaceAfterPt = Math.min(block.spaceAfterPt, 3);
    }
    for (const n of nested) {
      walkList(ctx, n, n.nodeName === "OL");
    }
  }

  ctx.listDepth -= 1;
}

function emitPre(ctx: CollectCtx, pre: HTMLElement): void {
  const style = styleOf(pre, { ...ctx.baseStyle, family: "courier" });
  const lines = (pre.textContent ?? "").replace(/\r/g, "").split("\n");
  const cs = window.getComputedStyle(pre);
  const spaceBefore = Math.min(48, Math.max(0, pxToPt(parseFloat(cs.marginTop) || 0)));
  const spaceAfter = Math.min(48, Math.max(0, pxToPt(parseFloat(cs.marginBottom) || 0)));
  for (let i = 0; i < lines.length; i++) {
    ctx.blocks.push({
      kind: "paragraph",
      segments: [{ text: sanitizeText(lines[i], ctx.replaced), style }],
      align: "left",
      indentPt: 0,
      spaceBeforePt: i === 0 ? spaceBefore : 0,
      spaceAfterPt: i === lines.length - 1 ? spaceAfter : 0,
      preformatted: true,
    });
  }
}

function emitTable(ctx: CollectCtx, table: HTMLElement): void {
  ctx.sawTable = true;
  const rows = Array.from(table.querySelectorAll("tr"));
  for (const tr of rows) {
    const segments: Segment[] = [];
    for (const cell of Array.from(tr.children)) {
      if (segments.length > 0) {
        segments.push({
          text: "   |   ",
          style: { ...ctx.baseStyle, color: [150, 150, 150] },
        });
      }
      const cellText = (cell.textContent ?? "").replace(/\s+/g, " ").trim();
      if (cellText !== "") {
        segments.push({ text: sanitizeText(cellText, ctx.replaced), style: styleOf(cell, ctx.baseStyle) });
      }
    }
    ctx.blocks.push({
      kind: "paragraph",
      segments,
      align: "left",
      indentPt: 0,
      spaceBeforePt: 0,
      spaceAfterPt: 2,
      preformatted: false,
    });
  }
}

// ─── Images ──────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    if (/^https?:/i.test(src)) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function imageToDataUrl(el: HTMLImageElement): Promise<{ dataUrl: string; format: "PNG" | "JPEG" } | null> {
  const src = el.getAttribute("src") ?? "";
  if (!src) return null;
  if (/^data:image\/png/i.test(src)) return { dataUrl: src, format: "PNG" };
  if (/^data:image\/jpe?g/i.test(src)) return { dataUrl: src, format: "JPEG" };

  const img = await loadImage(src);
  if (!img || !img.naturalWidth) return null;
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const g = canvas.getContext("2d");
  if (!g) return null;
  g.drawImage(img, 0, 0);
  try {
    return { dataUrl: canvas.toDataURL("image/png"), format: "PNG" };
  } catch {
    return null; // tainted canvas (cross-origin without CORS)
  }
}

function enqueueImage(ctx: CollectCtx, el: HTMLElement): void {
  const img = el as HTMLImageElement;
  const job = (async () => {
    const converted = await imageToDataUrl(img);
    if (!converted) {
      ctx.missingImages.count += 1;
      return;
    }
    ctx.blocks.push({
      kind: "image",
      dataUrl: converted.dataUrl,
      format: converted.format,
      widthPt: Math.max(1, img.naturalWidth) * 0.75,
      heightPt: Math.max(1, img.naturalHeight) * 0.75,
    });
  })();
  ctx.imageJobs.push(job);
}

// ─── Line layout ─────────────────────────────────────────────────────

interface Piece {
  seg: Segment;
  text: string;
  width: number;
  isSpace: boolean;
}

function measure(doc: jsPDF, seg: Segment, text: string): number {
  applyFont(doc, seg.style);
  return doc.getTextWidth(text);
}

/**
 * Wrap styled segments into lines of measured pieces. Collapses spaces
 * (unless preformatted), hard-splits overlong words, honors explicit \n.
 */
function layoutLines(doc: jsPDF, segments: Segment[], maxWidth: number, preformatted: boolean): Piece[][] {
  const lines: Piece[][] = [];
  let line: Piece[] = [];
  let lineWidth = 0;
  let pendingSpace: Piece | null = null;

  const endLine = () => {
    if (line.length > 0) lines.push(line);
    line = [];
    lineWidth = 0;
    pendingSpace = null;
  };

  const pushPiece = (seg: Segment, text: string, isSpace: boolean) => {
    const width = measure(doc, seg, text);
    if (isSpace) {
      if (lineWidth === 0 && !preformatted) return; // drop leading spaces
      pendingSpace = { seg, text, width, isSpace: true };
      return;
    }
    const fits = lineWidth + (pendingSpace?.width ?? 0) + width <= maxWidth;
    if (fits) {
      if (pendingSpace) {
        line.push(pendingSpace);
        lineWidth += pendingSpace.width;
        pendingSpace = null;
      }
      line.push({ seg, text, width, isSpace: false });
      lineWidth += width;
      return;
    }
    // Doesn't fit: break the line first (trailing pending space is dropped).
    if (lineWidth > 0) endLine();
    if (width <= maxWidth) {
      line.push({ seg, text, width, isSpace: false });
      lineWidth = width;
      return;
    }
    // Hard-split a single overlong word (long URLs, unbroken codes).
    let rest = text;
    while (rest.length > 0) {
      let take = rest.length;
      while (take > 1 && measure(doc, seg, rest.slice(0, take)) > maxWidth) {
        take = Math.max(1, take - Math.max(1, Math.floor(take / 4)));
      }
      let chunk = rest.slice(0, take);
      let chunkWidth = measure(doc, seg, chunk);
      while (chunkWidth > maxWidth && chunk.length > 1) {
        chunk = chunk.slice(0, -1);
        chunkWidth = measure(doc, seg, chunk);
      }
      line.push({ seg, text: chunk, width: chunkWidth, isSpace: false });
      lineWidth = chunkWidth;
      rest = rest.slice(chunk.length);
      if (rest.length > 0) endLine();
    }
  };

  for (const seg of segments) {
    const parts = seg.text.split("\n");
    for (let i = 0; i < parts.length; i++) {
      if (i > 0) endLine();
      const part = parts[i];
      if (part === "") continue;
      if (preformatted) {
        pushPiece(seg, part, false);
      } else {
        const tokens = part.split(/(\s+)/).filter((t) => t !== "");
        for (const tok of tokens) {
          if (/^\s+$/.test(tok)) pushPiece(seg, " ", true);
          else pushPiece(seg, tok, false);
        }
      }
    }
  }
  endLine();
  return lines;
}

// ─── Rendering ───────────────────────────────────────────────────────

const ASCENT_RATIO = 0.78; // baseline offset within the line box
const LINE_FACTOR = 1.22; // natural single-spacing leading

function blockMaxSize(b: ParagraphBlock): number {
  let max = 0;
  for (const s of b.segments) max = Math.max(max, s.style.size);
  return max || DEFAULT_STYLE.size;
}

function docTitleFor(root: HTMLElement): string {
  const heading = root.querySelector("h1, h2");
  if (heading?.textContent?.trim()) return heading.textContent.trim().slice(0, 120);
  return ((root.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 80)) || "Document";
}

function drawRun(doc: jsPDF, seg: Segment, text: string, x: number, baseline: number, size: number): void {
  applyFont(doc, seg.style);
  doc.setTextColor(seg.style.color[0], seg.style.color[1], seg.style.color[2]);
  if (seg.url) {
    doc.textWithLink(text, x, baseline, { url: seg.url });
  } else {
    doc.text(text, x, baseline);
  }
  if (seg.style.underline || seg.style.strike) {
    const w = doc.getTextWidth(text);
    doc.setDrawColor(seg.style.color[0], seg.style.color[1], seg.style.color[2]);
    doc.setLineWidth(Math.max(0.4, size / 16));
    if (seg.style.underline) doc.line(x, baseline + size * 0.14, x + w, baseline + size * 0.14);
    if (seg.style.strike) doc.line(x, baseline - size * 0.26, x + w, baseline - size * 0.26);
  }
}

export async function richTextToPdf(root: HTMLElement, options: RichTextPdfOptions): Promise<RichTextPdfResult> {
  if (typeof window === "undefined") throw new Error("Rich text export requires a browser");

  const warnings: string[] = [];
  const replaced = { count: 0 };
  const missingImages = { count: 0 };

  const doc = new jsPDF({
    unit: "pt",
    format: options.pageSize,
    orientation: options.orientation,
    compress: true,
  });

  const marginPt = MARGINS_PT[options.margin];
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentW = pageW - marginPt * 2;

  // The editor renders with theme colors (light text in dark mode). The PDF
  // page is always white, so temporarily pin the root's color to the ink
  // color: inherited text goes dark, explicitly-colored runs keep their own.
  const prevColor = root.style.color;
  root.style.color = `rgb(${PDF_INK[0]}, ${PDF_INK[1]}, ${PDF_INK[2]})`;

  const ctx: CollectCtx = {
    baseStyle: { ...DEFAULT_STYLE },
    segments: [],
    blocks: [],
    replaced,
    missingImages,
    sawTable: false,
    olCounters: [],
    listDepth: 0,
    imageJobs: [],
  };

  try {
    walkBlocks(ctx, root);
    flushParagraph(ctx, null);
  } finally {
    root.style.color = prevColor;
  }
  await Promise.all(ctx.imageJobs);

  if (ctx.blocks.length === 0) {
    throw new Error("Nothing to convert — the document is empty.");
  }

  const blocks = ctx.blocks.filter(
    (b) => b.kind !== "paragraph" || b.blank || b.segments.length > 0 || b.marker
  );
  const baseLeading = DEFAULT_STYLE.size * LINE_FACTOR * options.lineSpacing;

  let y = marginPt; // top of the current line box
  let lastBlank = false;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - marginPt) {
      doc.addPage([pageW, pageH], options.orientation);
      y = marginPt;
    }
  };

  for (const block of blocks) {
    if (block.kind === "rule") {
      ensureSpace(18);
      y += 8;
      doc.setDrawColor(160, 160, 160);
      doc.setLineWidth(0.7);
      doc.line(marginPt, y, pageW - marginPt, y);
      y += 10;
      lastBlank = false;
      continue;
    }

    if (block.kind === "image") {
      let w = block.widthPt;
      let h = block.heightPt;
      if (w > contentW) {
        h = h * (contentW / w);
        w = contentW;
      }
      const maxH = pageH - marginPt * 2;
      if (h > maxH) {
        w = w * (maxH / h);
        h = maxH;
      }
      ensureSpace(h);
      doc.addImage(block.dataUrl, block.format, marginPt + (contentW - w) / 2, y, w, h);
      y += h + 8;
      lastBlank = false;
      continue;
    }

    // Paragraph
    if (block.blank) {
      if (lastBlank) continue; // collapse doubled blank lines
      ensureSpace(baseLeading);
      y += baseLeading;
      lastBlank = true;
      continue;
    }
    lastBlank = false;

    const maxSize = blockMaxSize(block);
    const isHeadingLike = maxSize >= DEFAULT_STYLE.size * 1.35;
    const lineH = block.preformatted
      ? maxSize * LINE_FACTOR * options.lineSpacing
      : maxSize * (isHeadingLike ? 1.25 : LINE_FACTOR) * (isHeadingLike ? Math.min(options.lineSpacing, 1.15) : options.lineSpacing);
    const spaceBefore = Math.min(block.spaceBeforePt, maxSize * 1.2);
    const spaceAfter = Math.min(block.spaceAfterPt, maxSize * 1.2);

    if (spaceBefore > 0) ensureSpace(spaceBefore + lineH);
    y += spaceBefore;

    let markerWidth = 0;
    if (block.marker) {
      const markerStyle: TextStyle = { ...ctx.baseStyle, size: Math.min(maxSize, 12) };
      markerWidth = measure(doc, { text: block.marker, style: markerStyle }, block.marker) + 5;
    }

    const availW = Math.max(24, contentW - block.indentPt - markerWidth);
    const lines = layoutLines(doc, block.segments, availW, block.preformatted);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.length === 0) {
        // Interior blank line (explicit \n\n inside a paragraph).
        ensureSpace(lineH);
        y += lineH;
        continue;
      }
      ensureSpace(lineH);
      const lineTop = y;
      const baseline = lineTop + lineH * ASCENT_RATIO;
      const lineWidth = line.reduce((sum, p) => sum + p.width, 0);
      const lineMaxSize = line.reduce((m, p) => Math.max(m, p.seg.style.size), 4);

      let x = marginPt + block.indentPt + (i === 0 ? 0 : markerWidth);
      if (block.align === "center") x += (availW - lineWidth) / 2;
      else if (block.align === "right") x += availW - lineWidth;

      const isLastLine = i === lines.length - 1;
      const spacePieces = line.filter((p) => p.isSpace);
      const justify = block.align === "justify" && !isLastLine && spacePieces.length > 0;
      const spaceExtra = justify ? (availW - lineWidth) / spacePieces.length : 0;

      let cursorX = x;
      for (const piece of line) {
        const pieceWidth = piece.isSpace ? piece.width + spaceExtra : piece.width;
        if (piece.seg.style.bg) {
          applyFont(doc, piece.seg.style);
          doc.setFillColor(piece.seg.style.bg[0], piece.seg.style.bg[1], piece.seg.style.bg[2]);
          doc.rect(cursorX, lineTop + (lineH - lineMaxSize * 1.05) / 2, pieceWidth, lineMaxSize * 1.05, "F");
        }
        drawRun(doc, piece.seg, piece.text, cursorX, baseline, piece.seg.style.size);
        cursorX += pieceWidth;
      }

      if (i === 0 && block.marker) {
        const markerStyle: TextStyle = { ...ctx.baseStyle, size: Math.min(lineMaxSize, 12) };
        applyFont(doc, markerStyle);
        doc.setTextColor(110, 110, 110);
        doc.text(block.marker, marginPt + block.indentPt, baseline);
      }

      y += lineH;
    }

    y += spaceAfter;
  }

  // Page numbers
  if (options.pageNumbers) {
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      applyFont(doc, { ...DEFAULT_STYLE, size: 9 });
      doc.setTextColor(130, 130, 130);
      const label = `Page ${i} of ${total}`;
      const py = options.pageNumberPosition === "top-right" ? marginPt * 0.45 : pageH - marginPt * 0.5;
      if (options.pageNumberPosition === "bottom-center") {
        doc.text(label, pageW / 2, py, { align: "center" });
      } else {
        doc.text(label, pageW - marginPt, py, { align: "right" });
      }
    }
  }

  doc.setProperties({
    title: docTitleFor(root),
    creator: "FilesWow.com — Text to PDF",
  });

  if (replaced.count > 0) {
    warnings.push(
      `${replaced.count} character${replaced.count === 1 ? " was" : "s were"} replaced with "?" — emoji and non-Latin scripts aren't supported by the standard PDF fonts. For full Unicode, use Word to PDF.`
    );
  }
  if (missingImages.count > 0) {
    warnings.push(
      `${missingImages.count} image${missingImages.count === 1 ? "" : "s"} could not be embedded (cross-origin or broken source) and ${missingImages.count === 1 ? "was" : "were"} skipped.`
    );
  }
  if (ctx.sawTable) {
    warnings.push("Tables were flattened to text rows — cell layout is approximated.");
  }

  return {
    blob: doc.output("blob"),
    pageCount: doc.getNumberOfPages(),
    warnings,
  };
}
