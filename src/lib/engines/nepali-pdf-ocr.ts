// src/lib/engines/nepali-pdf-ocr.ts
//
// Free, 100% browser-based AI OCR (Tesseract.js LSTM) + PDF page renderer
// Designed for Nepali (Devanagari), legacy Nepali fonts (Preeti/Kantipur/etc.),
// scanned PDFs, and multilingual documents — zero server uploads, zero API keys.

import type { ExtractedLine, ExtractedRun } from "./pdf-to-word";

export type OcrMode = "auto" | "always" | "off";

export interface OcrProgress {
  page: number;
  totalPages: number;
  stage: string;
  percent: number;
}

const LEGACY_NEPALI_FONT_RE =
  /preeti|kantipur|sagarmatha|fontasy|himali|ganess|ritu|navin|ananda|kanchan|rupantar|shangrila|pcs\s*nepali/i;

/**
 * Detect whether a PDF page's extracted text layer is empty, scanned,
 * corrupted (missing ToUnicode CMap), or encoded in a legacy non-Unicode
 * Nepali font (e.g. Preeti, Kantipur, Sagarmatha).
 */
export function pageNeedsOcr(
  rawItems: Array<{ str?: string; fontName?: string }>,
  styles?: Record<string, { fontFamily?: string }>
): boolean {
  if (!rawItems || rawItems.length === 0) return true;

  let totalChars = 0;
  let brokenChars = 0;
  let legacyFontChars = 0;

  for (const item of rawItems) {
    const str = (item.str || "").trim();
    if (!str) continue;
    totalChars += str.length;

    const fontName = item.fontName || "";
    const fontFamily = (styles && fontName ? styles[fontName]?.fontFamily : "") || "";
    if (LEGACY_NEPALI_FONT_RE.test(fontName) || LEGACY_NEPALI_FONT_RE.test(fontFamily)) {
      legacyFontChars += str.length;
    }

    for (const ch of str) {
      const cp = ch.codePointAt(0) ?? 0;
      // Replacement char, Private Use Area, or control characters indicate broken CMap
      if (cp === 0xfffd || (cp >= 0xe000 && cp <= 0xf8ff) || (cp < 32 && cp !== 9 && cp !== 10 && cp !== 13)) {
        brokenChars++;
      }
    }
  }

  // Scanned / image-only / outlined page
  if (totalChars < 12) return true;
  // Legacy Nepali ASCII-mapped font (Preeti, Kantipur, etc.)
  if (legacyFontChars > totalChars * 0.25) return true;
  // Corrupted ToUnicode CMap
  if (brokenChars / totalChars > 0.12) return true;

  return false;
}

/**
 * Fix common Devanagari extraction artifacts from PDFs:
 * - Visual-order short-i matra (ि U+093F placed before consonant)
 */
export function normalizeDevanagariText(text: string): string {
  const nfc = text.normalize("NFC");
  // Move stray leading short-i matra (ि) after the following consonant/cluster if needed
  return nfc.replace(/\u093F([\u0915-\u0939\u0958-\u095F])/g, "$1\u093F");
}

/**
 * Render a PDF.js page onto an offscreen canvas at high DPI for crisp OCR.
 */
export async function renderPdfPageToCanvas(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdfPage: any,
  scale = 2.5
): Promise<{ canvas: HTMLCanvasElement; widthPt: number; heightPt: number }> {
  const baseViewport = pdfPage.getViewport({ scale: 1.0 });
  const viewport = pdfPage.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await pdfPage.render({ canvasContext: ctx, viewport }).promise;
  return {
    canvas,
    widthPt: baseViewport.width,
    heightPt: baseViewport.height,
  };
}

/**
 * Run Tesseract.js LSTM OCR on a single rendered PDF page and return
 * layout-aware ExtractedLine[] matching pdf-to-word's structure.
 */
export async function ocrPdfPageToLines(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  worker: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdfPage: any,
  pageNum: number,
  detectScriptFn: (text: string) => { font: string; isRtl?: boolean; scriptName?: string },
  scale = 2.5
): Promise<{
  lines: ExtractedLine[];
  rawText: string;
  detectedScripts: string[];
}> {
  const { canvas, widthPt, heightPt } = await renderPdfPageToCanvas(pdfPage, scale);
  const result = await worker.recognize(canvas, {}, { blocks: true, text: true });
  const data = result?.data as {
    text?: string;
    blocks?: Array<{
      paragraphs?: Array<{
        lines?: Array<{
          text?: string;
          bbox?: { x0: number; y0: number; x1: number; y1: number };
        }>;
      }>;
    }>;
  };

  const lines: ExtractedLine[] = [];
  const scripts: string[] = [];

  const blocks = data?.blocks || [];
  for (const block of blocks) {
    for (const para of block.paragraphs || []) {
      for (const ln of para.lines || []) {
        const cleanText = (ln.text || "").replace(/\s+/g, " ").trim();
        if (!cleanText) continue;

        const bbox = ln.bbox || { x0: 0, y0: 0, x1: canvas.width * 0.8, y1: 24 };
        const minX = bbox.x0 / scale;
        const maxX = bbox.x1 / scale;
        const lineHeightPt = Math.max(8, (bbox.y1 - bbox.y0) / scale);
        const estFontSize = Math.min(Math.max(Math.round(lineHeightPt * 0.78), 9), 36);
        // Convert top-down canvas Y to PDF bottom-up Y so spacing heuristics match
        const y = Math.max(0, heightPt - bbox.y1 / scale);

        const script = detectScriptFn(cleanText);
        if (script.scriptName) scripts.push(script.scriptName);

        const leftMargin = minX;
        const rightMargin = Math.max(0, widthPt - maxX);
        const lineSpan = maxX - minX;
        let alignment: "left" | "center" | "right" = "left";
        if (lineSpan < widthPt * 0.72) {
          if (Math.abs(leftMargin - rightMargin) < 28 && leftMargin > 45) {
            alignment = "center";
          } else if (leftMargin > widthPt * 0.5 && rightMargin < 95) {
            alignment = "right";
          }
        }

        const run: ExtractedRun = {
          text: cleanText,
          fontSize: estFontSize,
          bold: estFontSize >= 15,
          italic: false,
          font: script.font,
          isRtl: script.isRtl,
        };

        lines.push({
          page: pageNum,
          y,
          minX,
          maxX,
          pageWidth: widthPt,
          pageHeight: heightPt,
          runs: [run],
          fullText: cleanText,
          avgFontSize: estFontSize,
          hasBold: run.bold,
          isRtl: Boolean(script.isRtl),
          alignment,
        });
      }
    }
  }

  // Fallback if blocks weren't populated but plain text was
  const rawText = (data?.text || "").trim();
  if (lines.length === 0 && rawText) {
    const rawLines = rawText.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    rawLines.forEach((cleanText, idx) => {
      const script = detectScriptFn(cleanText);
      if (script.scriptName) scripts.push(script.scriptName);
      lines.push({
        page: pageNum,
        y: Math.max(0, heightPt - (idx + 1) * 18),
        minX: 48,
        maxX: widthPt - 48,
        pageWidth: widthPt,
        pageHeight: heightPt,
        runs: [
          {
            text: cleanText,
            fontSize: 11,
            bold: false,
            italic: false,
            font: script.font,
            isRtl: script.isRtl,
          },
        ],
        fullText: cleanText,
        avgFontSize: 11,
        hasBold: false,
        isRtl: Boolean(script.isRtl),
        alignment: "left",
      });
    });
  }

  // Free canvas memory
  canvas.width = 0;
  canvas.height = 0;

  return { lines, rawText, detectedScripts: scripts };
}

/**
 * Create a reusable Tesseract.js worker for the requested language(s)
 * (e.g. "nep+eng", "eng", "hin+eng").
 */
export async function createOcrWorker(
  lang = "nep+eng",
  onLogger?: (progress: number, status: string) => void
) {
  const Tesseract = await import("tesseract.js");
  const worker = await Tesseract.createWorker(lang, 1, {
    logger: (m: { status?: string; progress?: number }) => {
      if (onLogger && typeof m.progress === "number") {
        onLogger(m.progress, m.status || "Recognizing text");
      }
    },
  });
  return worker;
}
