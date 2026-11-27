// src/lib/engines/nepali-pdf-ocr.ts
//
// Free, 100% browser-based AI OCR (Tesseract.js LSTM) + PDF page renderer
// Designed for Nepali (Devanagari), legacy Nepali fonts (Preeti/Kantipur/etc.),
// scanned PDFs, and multilingual documents — zero server uploads, zero API keys.

import type { ExtractedLine, ExtractedRun } from "./pdf-to-word";

export type OcrMode = "auto" | "always" | "off";

export interface OcrLanguageOption {
  code: string;
  label: string;
  group: "Popular" | "South Asian" | "East & SE Asian" | "European" | "Middle East & Africa";
}

export const OCR_LANGUAGES: OcrLanguageOption[] = [
  { code: "eng", label: "English", group: "Popular" },
  { code: "nep+eng", label: "Nepali + English", group: "Popular" },
  { code: "hin+eng", label: "Hindi + English", group: "Popular" },
  { code: "spa+eng", label: "Spanish + English", group: "Popular" },
  { code: "fra+eng", label: "French + English", group: "Popular" },
  { code: "deu+eng", label: "German + English", group: "Popular" },
  { code: "ara+eng", label: "Arabic + English", group: "Popular" },
  { code: "chi_sim+eng", label: "Chinese (Simplified) + English", group: "Popular" },

  { code: "nep", label: "Nepali (नेपाली)", group: "South Asian" },
  { code: "hin", label: "Hindi (हिन्दी)", group: "South Asian" },
  { code: "ben+eng", label: "Bengali + English", group: "South Asian" },
  { code: "mar+eng", label: "Marathi + English", group: "South Asian" },
  { code: "guj+eng", label: "Gujarati + English", group: "South Asian" },
  { code: "pan+eng", label: "Punjabi + English", group: "South Asian" },
  { code: "tam+eng", label: "Tamil + English", group: "South Asian" },
  { code: "tel+eng", label: "Telugu + English", group: "South Asian" },
  { code: "kan+eng", label: "Kannada + English", group: "South Asian" },
  { code: "mal+eng", label: "Malayalam + English", group: "South Asian" },
  { code: "sin+eng", label: "Sinhala + English", group: "South Asian" },
  { code: "urd+eng", label: "Urdu + English", group: "South Asian" },

  { code: "chi_tra+eng", label: "Chinese (Traditional) + English", group: "East & SE Asian" },
  { code: "jpn+eng", label: "Japanese + English", group: "East & SE Asian" },
  { code: "kor+eng", label: "Korean + English", group: "East & SE Asian" },
  { code: "tha+eng", label: "Thai + English", group: "East & SE Asian" },
  { code: "vie+eng", label: "Vietnamese + English", group: "East & SE Asian" },
  { code: "ind+eng", label: "Indonesian + English", group: "East & SE Asian" },
  { code: "msa+eng", label: "Malay + English", group: "East & SE Asian" },
  { code: "mya+eng", label: "Myanmar (Burmese) + English", group: "East & SE Asian" },

  { code: "por+eng", label: "Portuguese + English", group: "European" },
  { code: "ita+eng", label: "Italian + English", group: "European" },
  { code: "nld+eng", label: "Dutch + English", group: "European" },
  { code: "pol+eng", label: "Polish + English", group: "European" },
  { code: "rus+eng", label: "Russian + English", group: "European" },
  { code: "ukr+eng", label: "Ukrainian + English", group: "European" },
  { code: "tur+eng", label: "Turkish + English", group: "European" },
  { code: "ell+eng", label: "Greek + English", group: "European" },
  { code: "swe+eng", label: "Swedish + English", group: "European" },
  { code: "ron+eng", label: "Romanian + English", group: "European" },
  { code: "ces+eng", label: "Czech + English", group: "European" },

  { code: "fas+eng", label: "Persian / Farsi + English", group: "Middle East & Africa" },
  { code: "heb+eng", label: "Hebrew + English", group: "Middle East & Africa" },
  { code: "amh+eng", label: "Amharic + English", group: "Middle East & Africa" },
  { code: "swa+eng", label: "Swahili + English", group: "Middle East & Africa" },
];

export const OCR_LANGUAGE_GROUPS = [
  "Popular",
  "South Asian",
  "East & SE Asian",
  "European",
  "Middle East & Africa",
] as const;

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

const SCRIPT_TO_OCR_LANG: Record<string, string> = {
  Devanagari: "nep+eng",
  Arabic: "ara+eng",
  Han: "chi_sim+eng",
  HanS: "chi_sim+eng",
  HanT: "chi_tra+eng",
  Japanese: "jpn+eng",
  Hangul: "kor+eng",
  Cyrillic: "rus+eng",
  Bengali: "ben+eng",
  Tamil: "tam+eng",
  Telugu: "tel+eng",
  Gujarati: "guj+eng",
  Gurmukhi: "pan+eng",
  Kannada: "kan+eng",
  Malayalam: "mal+eng",
  Sinhala: "sin+eng",
  Thai: "tha+eng",
  Hebrew: "heb+eng",
  Greek: "ell+eng",
  Latin: "eng",
};

/**
 * Automatically detect the best Tesseract OCR language pack for a PDF page
 * using font metadata, partial text scripts, and Tesseract OSD script detection.
 */
export async function detectOcrLanguageAuto(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdfPage: any,
  rawItems?: Array<{ str?: string; fontName?: string }>,
  styles?: Record<string, { fontFamily?: string }>
): Promise<string> {
  // 1. Check font names & any partial text items first (instant, zero download)
  if (rawItems && rawItems.length > 0) {
    let combinedText = "";
    for (const item of rawItems) {
      const fn = item.fontName || "";
      const ff = (styles && fn ? styles[fn]?.fontFamily : "") || "";
      if (LEGACY_NEPALI_FONT_RE.test(fn) || LEGACY_NEPALI_FONT_RE.test(ff)) {
        return "nep+eng";
      }
      if (item.str) combinedText += item.str;
    }
    if (/[\u0900-\u097F]/.test(combinedText)) return "nep+eng";
    if (/[\u0600-\u06FF]/.test(combinedText)) return "ara+eng";
    if (/[\u4E00-\u9FFF]/.test(combinedText)) return "chi_sim+eng";
    if (/[\u3040-\u30FF]/.test(combinedText)) return "jpn+eng";
    if (/[\uAC00-\uD7AF]/.test(combinedText)) return "kor+eng";
    if (/[\u0400-\u04FF]/.test(combinedText)) return "rus+eng";
    if (/[\u0980-\u09FF]/.test(combinedText)) return "ben+eng";
    if (/[\u0B80-\u0BFF]/.test(combinedText)) return "tam+eng";
    if (/[\u0E00-\u0E7F]/.test(combinedText)) return "tha+eng";
    if (/[\u0590-\u05FF]/.test(combinedText)) return "heb+eng";
  }

  // 2. For pure scanned pages, run Tesseract OSD (Orientation & Script Detection)
  // OSD requires OEM.TESSERACT_ONLY (0) + legacyCore/legacyLang since it is a legacy model, not LSTM.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let osdWorker: any = null;
  try {
    const { canvas } = await renderPdfPageToCanvas(pdfPage, 1.5);
    const Tesseract = await import("tesseract.js");
    osdWorker = await Tesseract.createWorker("osd", Tesseract.OEM.TESSERACT_ONLY, {
      legacyCore: true,
      legacyLang: true,
    });
    const detected = await osdWorker.detect(canvas);
    canvas.width = 0;
    canvas.height = 0;

    const script = detected?.data?.script as string | undefined;
    if (script && SCRIPT_TO_OCR_LANG[script]) {
      return SCRIPT_TO_OCR_LANG[script];
    }
  } catch {
    // Fall back gracefully if OSD cannot run
  } finally {
    if (osdWorker) {
      try {
        await osdWorker.terminate();
      } catch {
        // Ignore
      }
    }
  }

  return "eng";
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
