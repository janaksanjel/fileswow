// lib/richtext-docx.ts
//
// Rich-text → DOCX engine for the Text to Word tool.
//
// Design goals:
//  1. Real Word output: paragraphs, heading styles, bold/italic/underline/
//     strike runs, colors, highlights, fonts, sizes, alignment, bullet and
//     numbered lists (real Word numbering), hyperlinks, and images — fully
//     editable in Word/Google Docs. Never flattened to plain text.
//  2. Format preservation: styles are read from the editor's live DOM via
//     getComputedStyle, mirroring the PDF engine so both tools export the
//     same document model.
//  3. DOCX is fully Unicode: no character-replacement warnings (unlike the
//     standard-font PDF path); emoji and any script survive the trip.

import {
  AlignmentType,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  Packer,
  Paragraph,
  ShadingType,
  TextRun,
  convertInchesToTwip,
} from "docx";

export interface RichTextDocxResult {
  blob: Blob;
  paragraphCount: number;
}

// ─── Shared model (mirrors richtext-pdf.ts) ──────────────────────────

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
  bg: RGB | null;
}

interface Segment {
  text: string;
  style: TextStyle;
  url?: string;
}

interface ImageBlock {
  kind: "image";
  dataUrl: string;
  mime: "image/png" | "image/jpeg";
  widthPx: number;
  heightPx: number;
}

interface RuleBlock {
  kind: "rule";
}

interface ParagraphBlock {
  kind: "paragraph";
  segments: Segment[];
  blank?: boolean;
  align: "left" | "center" | "right" | "justify";
  heading: (typeof HeadingLevel)[keyof typeof HeadingLevel] | null;
  indentLevel: number; // list nesting depth (0 = not a list)
  ordered: boolean; // valid when indentLevel > 0
  preformatted: boolean;
  spaceBeforePt: number;
  spaceAfterPt: number;
}

type Block = ParagraphBlock | ImageBlock | RuleBlock;

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
  color: [17, 24, 39],
  bg: null,
};

const WORD_FONT: Record<FontFamily, string> = {
  helvetica: "Arial",
  times: "Times New Roman",
  courier: "Courier New",
};

const HEADING_MAP: Record<string, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
  H1: HeadingLevel.HEADING_1,
  H2: HeadingLevel.HEADING_2,
  H3: HeadingLevel.HEADING_3,
  H4: HeadingLevel.HEADING_4,
  H5: HeadingLevel.HEADING_5,
  H6: HeadingLevel.HEADING_6,
};

// ─── Style extraction (same rules as richtext-pdf.ts) ────────────────

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

/** DOCX text is Unicode; only normalize line/tab whitespace. */
function normalizeText(text: string): string {
  return text.replace(/\r/g, "");
}

// ─── DOM collection (mirrors richtext-pdf.ts walk) ───────────────────

interface CollectCtx {
  baseStyle: TextStyle;
  segments: Segment[];
  blocks: Block[];
  olCounters: number[];
  listDepth: number;
  imageJobs: Promise<void>[];
}

function hasBlockChildren(el: HTMLElement): boolean {
  return Array.from(el.children).some((c) => BLOCK_TAGS.has(c.nodeName));
}

function walkInline(ctx: CollectCtx, node: Node): void {
  if (node.nodeType === Node.TEXT_NODE) {
    const raw = (node.textContent ?? "").replace(/\s+/g, " ");
    if (raw === "") return;
    ctx.segments.push({
      text: normalizeText(raw),
      style: styleOf(node.parentElement, ctx.baseStyle),
      url: nearestHref(node.parentElement),
    });
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const el = node as HTMLElement;
  const tag = el.nodeName;
  if (SKIP_TAGS.has(tag)) return;

  if (tag === "BR") {
    ctx.segments.push({ text: "\n", style: styleOf(el, ctx.baseStyle), url: nearestHref(el) });
    return;
  }
  if (tag === "IMG") {
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
    walkInline(ctx, child);
  }
}

/** The nearest enclosing anchor href — a run inside <a> stays a hyperlink. */
function nearestHref(el: Element | null): string | undefined {
  let cur: Element | null = el;
  while (cur) {
    if (cur.nodeName === "A") {
      const href = cur.getAttribute("href") ?? "";
      return /^(https?:|mailto:)/i.test(href) ? href : undefined;
    }
    cur = cur.parentElement;
  }
  return undefined;
}

function flushParagraph(ctx: CollectCtx, blockEl: Element | null, forcedBlank = false): void {
  let segments = ctx.segments;
  ctx.segments = [];

  // A trailing explicit break is a layout artifact, not a blank line.
  const last = segments[segments.length - 1];
  if (last && last.text === "\n" && segments.some((s) => s.text.trim() !== "")) {
    segments = segments.slice(0, -1);
  }

  const hasText = segments.some((s) => s.text.trim() !== "");
  const hasBreak = segments.some((s) => s.text.includes("\n"));

  let align: ParagraphBlock["align"] = "left";
  let spaceBefore = 0;
  let spaceAfter = 0;
  let heading: ParagraphBlock["heading"] = null;
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
    spaceBefore = Math.min(48, Math.max(0, pxToPt(parseFloat(cs.marginTop) || 0)));
    spaceAfter = Math.min(48, Math.max(0, pxToPt(parseFloat(cs.marginBottom) || 0)));
    const tag = blockEl.nodeName;
    if (/^H[1-6]$/.test(tag)) heading = HEADING_MAP[tag] ?? null;
  }

  if (!hasText) {
    if (!forcedBlank && !hasBreak) return;
    ctx.blocks.push({
      kind: "paragraph",
      segments: [],
      blank: true,
      align: "left",
      heading: null,
      indentLevel: 0,
      ordered: false,
      preformatted: false,
      spaceBeforePt: 0,
      spaceAfterPt: 0,
    });
    return;
  }

  ctx.blocks.push({
    kind: "paragraph",
    segments: segments.filter((s) => s.text !== ""),
    align,
    heading,
    indentLevel: 0,
    ordered: false,
    preformatted: false,
    spaceBeforePt: spaceBefore,
    spaceAfterPt: spaceAfter,
  });
}

function tickListCounter(ctx: CollectCtx, ordered: boolean): void {
  while (ctx.olCounters.length <= ctx.listDepth) ctx.olCounters.push(0);
  if (ordered) {
    ctx.olCounters[ctx.listDepth] += 1;
    for (let i = ctx.listDepth + 1; i < ctx.olCounters.length; i++) ctx.olCounters[i] = 0;
  }
}

function walkBlocks(ctx: CollectCtx, container: Node): void {
  for (const node of Array.from(container.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const raw = node.textContent ?? "";
      if (raw.trim() === "") continue;
      ctx.segments.push({
        text: normalizeText(raw.replace(/\s+/g, " ")),
        style: styleOf(node.parentElement, ctx.baseStyle),
        url: nearestHref(node.parentElement),
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
      if (tag === "DIV" && hasBlockChildren(el)) {
        flushParagraph(ctx, null);
        walkBlocks(ctx, el);
        continue;
      }
      flushParagraph(ctx, null);
      walkInline(ctx, el);
      flushParagraph(ctx, el, el.childNodes.length === 0);
      continue;
    }

    walkInline(ctx, el);
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
    tickListCounter(ctx, ordered);
    flushParagraph(ctx, null);

    const nested: HTMLElement[] = [];
    for (const child of Array.from(li.childNodes)) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const name = (child as Element).nodeName;
        if (name === "UL" || name === "OL") {
          nested.push(child as HTMLElement);
          continue;
        }
      }
      walkInline(ctx, child);
    }
    flushParagraph(ctx, li);

    const block = ctx.blocks[ctx.blocks.length - 1];
    if (block && block.kind === "paragraph") {
      block.indentLevel = ctx.listDepth;
      block.ordered = ordered;
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
  for (const line of lines) {
    ctx.blocks.push({
      kind: "paragraph",
      segments: [{ text: normalizeText(line), style }],
      align: "left",
      heading: null,
      indentLevel: 0,
      ordered: false,
      preformatted: true,
      spaceBeforePt: 0,
      spaceAfterPt: 0,
    });
  }
}

function emitTable(ctx: CollectCtx, table: HTMLElement): void {
  const rows = Array.from(table.querySelectorAll("tr"));
  for (const tr of rows) {
    const segments: Segment[] = [];
    for (const cell of Array.from(tr.children)) {
      if (segments.length > 0) {
        segments.push({ text: "   |   ", style: { ...ctx.baseStyle, color: [150, 150, 150] } });
      }
      const cellText = (cell.textContent ?? "").replace(/\s+/g, " ").trim();
      if (cellText !== "") {
        segments.push({ text: normalizeText(cellText), style: styleOf(cell, ctx.baseStyle) });
      }
    }
    ctx.blocks.push({
      kind: "paragraph",
      segments,
      align: "left",
      heading: null,
      indentLevel: 0,
      ordered: false,
      preformatted: false,
      spaceBeforePt: 0,
      spaceAfterPt: 2,
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

async function imageToDataUrl(
  el: HTMLImageElement
): Promise<{ dataUrl: string; mime: "image/png" | "image/jpeg"; width: number; height: number } | null> {
  const src = el.getAttribute("src") ?? "";
  if (!src) return null;
  if (/^data:image\/png/i.test(src)) {
    const img = await loadImage(src);
    return img && img.naturalWidth
      ? { dataUrl: src, mime: "image/png", width: img.naturalWidth, height: img.naturalHeight }
      : null;
  }
  if (/^data:image\/jpe?g/i.test(src)) {
    const img = await loadImage(src);
    return img && img.naturalWidth
      ? { dataUrl: src, mime: "image/jpeg", width: img.naturalWidth, height: img.naturalHeight }
      : null;
  }
  const img = await loadImage(src);
  if (!img || !img.naturalWidth) return null;
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const g = canvas.getContext("2d");
  if (!g) return null;
  g.drawImage(img, 0, 0);
  try {
    return { dataUrl: canvas.toDataURL("image/png"), mime: "image/png", width: img.naturalWidth, height: img.naturalHeight };
  } catch {
    return null; // tainted canvas (cross-origin without CORS)
  }
}

function dataUrlToUint8(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] ?? "";
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function enqueueImage(ctx: CollectCtx, el: HTMLElement): void {
  const img = el as HTMLImageElement;
  const job = (async () => {
    const converted = await imageToDataUrl(img);
    if (!converted) return; // broken/cross-origin images are skipped
    ctx.blocks.push({
      kind: "image",
      dataUrl: converted.dataUrl,
      mime: converted.mime,
      widthPx: converted.width,
      heightPx: converted.height,
    });
  })();
  ctx.imageJobs.push(job);
}

// ─── DOCX assembly ───────────────────────────────────────────────────

const PT_TO_HALFWPT = 2; // docx run sizes are half-points
const PT_TO_TWIP = 20; // 1pt = 20 twips

function hexColor(rgb: RGB): string {
  return rgb.map((n) => n.toString(16).padStart(2, "0")).join("").toUpperCase();
}

function runChildFor(seg: Segment): TextRun | ExternalHyperlink {
  const s = seg.style;
  const styleOptions = {
    bold: s.bold || undefined,
    italics: s.italic || undefined,
    underline: s.underline ? {} : undefined,
    strike: s.strike || undefined,
    color: hexColor(s.color),
    size: Math.round(s.size * PT_TO_HALFWPT),
    font: WORD_FONT[s.family],
    shading: s.bg
      ? { type: ShadingType.CLEAR, fill: hexColor(s.bg), color: "auto" }
      : undefined,
  };

  if (seg.url) {
    return new ExternalHyperlink({
      link: seg.url,
      children: [new TextRun({ text: seg.text, style: "Hyperlink", ...styleOptions })],
    });
  }
  return new TextRun({ text: seg.text, ...styleOptions });
}

function blocksToDocxChildren(blocks: Block[]): Paragraph[] {
  const children: Paragraph[] = [];

  for (const block of blocks) {
    if (block.kind === "rule") {
      children.push(
        new Paragraph({
          border: { bottom: { style: "single" as const, size: 6, color: "A0A0A0" } },
          spacing: { before: 120, after: 120 },
          children: [],
        })
      );
      continue;
    }

    if (block.kind === "image") {
      // Fit within a 6.0" × 6.75" content box at 96 DPI.
      const maxW = 576;
      const maxH = 648;
      let w = block.widthPx;
      let h = block.heightPx;
      if (w > maxW) {
        h = Math.round(h * (maxW / w));
        w = maxW;
      }
      if (h > maxH) {
        w = Math.round(w * (maxH / h));
        h = maxH;
      }
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
          children: [
            new ImageRun({
              type: block.mime === "image/png" ? ("png" as const) : ("jpg" as const),
              data: dataUrlToUint8(block.dataUrl),
              transformation: { width: w, height: h },
            }),
          ],
        })
      );
      continue;
    }

    if (block.blank) {
      children.push(new Paragraph({ children: [] }));
      continue;
    }

    const isHeading = block.heading !== null;

    children.push(
      new Paragraph({
        heading: block.heading ?? undefined,
        alignment:
          block.align === "center"
            ? AlignmentType.CENTER
            : block.align === "right"
              ? AlignmentType.RIGHT
              : block.align === "justify"
                ? AlignmentType.JUSTIFIED
                : undefined,
        numbering:
          block.indentLevel > 0
            ? {
                reference: block.ordered ? "rte-ordered" : "rte-bullets",
                level: Math.min(2, block.indentLevel - 1),
              }
            : undefined,
        spacing: isHeading
          ? undefined
          : {
              before: Math.round(block.spaceBeforePt * PT_TO_TWIP),
              after: Math.round(block.spaceAfterPt * PT_TO_TWIP),
            },
        children: block.segments.map(runChildFor),
      })
    );
  }

  return children;
}

function docTitleFor(root: HTMLElement): string {
  const heading = root.querySelector("h1, h2");
  if (heading?.textContent?.trim()) return heading.textContent.trim().slice(0, 120);
  return ((root.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 80)) || "Document";
}

export async function richTextToDocx(root: HTMLElement): Promise<RichTextDocxResult> {
  if (typeof window === "undefined") throw new Error("Rich text export requires a browser");

  const ctx: CollectCtx = {
    baseStyle: { ...DEFAULT_STYLE },
    segments: [],
    blocks: [],
    olCounters: [],
    listDepth: 0,
    imageJobs: [],
  };

  // The editor may render in dark theme; pin root color to dark ink so
  // inherited runs export as near-black instead of light gray on white.
  const prevColor = root.style.color;
  root.style.color = "rgb(17, 24, 39)";
  try {
    walkBlocks(ctx, root);
    flushParagraph(ctx, null);
  } finally {
    root.style.color = prevColor;
  }
  await Promise.all(ctx.imageJobs);

  const blocks = ctx.blocks.filter(
    (b) => b.kind !== "paragraph" || b.blank || b.segments.length > 0
  );
  if (blocks.length === 0) {
    throw new Error("Nothing to convert — the document is empty.");
  }

  const children = blocksToDocxChildren(blocks);

  const doc = new Document({
    creator: "FilesWow.com — Text to Word",
    title: docTitleFor(root),
    numbering: {
      config: [
        {
          reference: "rte-bullets",
          levels: [0, 1, 2].map((lvl) => ({
            level: lvl,
            format: LevelFormat.BULLET,
            text: ["\u2022", "\u25E6", "\u25AA"][lvl],
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 360 * (lvl + 1), hanging: 260 } } },
          })),
        },
        {
          reference: "rte-ordered",
          levels: [0, 1, 2].map((lvl) => ({
            level: lvl,
            format: LevelFormat.DECIMAL,
            text: `%${lvl + 1}.`,
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 360 * (lvl + 1), hanging: 260 } } },
          })),
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);

  const paragraphCount = blocks.filter((b) => b.kind === "paragraph" && !b.blank).length;
  return { blob, paragraphCount };
}
