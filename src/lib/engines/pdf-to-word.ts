// lib/engines/pdf-to-word.ts
//
// High-fidelity PDF to DOCX converter engine
// Supports all languages (Devanagari, Arabic/Persian/Urdu RTL, CJK, Cyrillic, Thai, Latin, etc.)
// Reconstructs horizontal word spacing, multi-run styling, headings, alignments, and true page breaks.

export interface ScriptInfo {
  font: string;
  isRtl?: boolean;
  scriptName?: string;
}

// Comprehensive Unicode Script Table for All World Languages
const UNICODE_SCRIPTS: Array<{ ranges: [number, number][]; font: string; isRtl?: boolean; name: string }> = [
  // Devanagari (Hindi, Nepali, Sanskrit, Marathi)
  { ranges: [[0x0900, 0x097f], [0xa8e0, 0xa8ff]], font: "Noto Sans Devanagari", name: "Devanagari" },
  // Bengali & Assamese
  { ranges: [[0x0980, 0x09ff]], font: "Noto Sans Bengali", name: "Bengali" },
  // Gurmukhi (Punjabi)
  { ranges: [[0x0a00, 0x0a7f]], font: "Noto Sans Gurmukhi", name: "Gurmukhi" },
  // Gujarati
  { ranges: [[0x0a80, 0x0aff]], font: "Noto Sans Gujarati", name: "Gujarati" },
  // Oriya / Odia
  { ranges: [[0x0b00, 0x0b7f]], font: "Noto Sans Oriya", name: "Odia" },
  // Tamil
  { ranges: [[0x0b80, 0x0bff]], font: "Noto Sans Tamil", name: "Tamil" },
  // Telugu
  { ranges: [[0x0c00, 0x0c7f]], font: "Noto Sans Telugu", name: "Telugu" },
  // Kannada
  { ranges: [[0x0c80, 0x0cff]], font: "Noto Sans Kannada", name: "Kannada" },
  // Malayalam
  { ranges: [[0x0d00, 0x0d7f]], font: "Noto Sans Malayalam", name: "Malayalam" },
  // Sinhala
  { ranges: [[0x0d80, 0x0dff]], font: "Noto Sans Sinhala", name: "Sinhala" },
  // Thai
  { ranges: [[0x0e00, 0x0e7f]], font: "Noto Sans Thai", name: "Thai" },
  // Lao
  { ranges: [[0x0e80, 0x0eff]], font: "Noto Sans Lao", name: "Lao" },
  // Tibetan
  { ranges: [[0x0f00, 0x0fff]], font: "Microsoft Himalaya", name: "Tibetan" },
  // Myanmar (Burmese)
  { ranges: [[0x1000, 0x109f], [0xa9e0, 0xa9ff]], font: "Noto Sans Myanmar", name: "Myanmar" },
  // Georgian
  { ranges: [[0x10a0, 0x10ff]], font: "Sylfaen", name: "Georgian" },
  // Ethiopic (Amharic, Tigrinya)
  { ranges: [[0x1200, 0x137f]], font: "Nyala", name: "Ethiopic" },
  // Arabic, Persian/Farsi, Urdu, Pashto, Kurdish (RTL)
  {
    ranges: [
      [0x0600, 0x06ff],
      [0x0750, 0x077f],
      [0x08a0, 0x08ff],
      [0xfb50, 0xfdff],
      [0xfe70, 0xfeff],
    ],
    font: "Arial",
    isRtl: true,
    name: "Arabic",
  },
  // Hebrew & Yiddish (RTL)
  { ranges: [[0x0590, 0x05ff], [0xfb1d, 0xfb4f]], font: "Arial", isRtl: true, name: "Hebrew" },
  // Chinese (Simplified & Traditional)
  { ranges: [[0x4e00, 0x9fff], [0x3400, 0x4dbf], [0x20000, 0x2a6df]], font: "Microsoft YaHei", name: "Chinese" },
  // Japanese (Hiragana & Katakana & Kanji)
  { ranges: [[0x3040, 0x309f], [0x30a0, 0x30ff], [0x31f0, 0x31ff]], font: "Yu Gothic", name: "Japanese" },
  // Korean (Hangul Syllables & Jamo)
  { ranges: [[0xac00, 0xd7af], [0x1100, 0x11ff], [0x3130, 0x318f]], font: "Malgun Gothic", name: "Korean" },
  // Cyrillic (Russian, Ukrainian, etc.)
  { ranges: [[0x0400, 0x04ff], [0x0500, 0x052f]], font: "Calibri", name: "Cyrillic" },
  // Greek
  { ranges: [[0x0370, 0x03ff]], font: "Calibri", name: "Greek" },
];

export function detectScriptInfo(text: string): ScriptInfo {
  let isRtl = false;
  let font: string | undefined;
  let scriptName: string | undefined;

  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (!cp) continue;
    for (const item of UNICODE_SCRIPTS) {
      for (const [lo, hi] of item.ranges) {
        if (cp >= lo && cp <= hi) {
          if (!font) {
            font = item.font;
            scriptName = item.name;
          }
          if (item.isRtl) isRtl = true;
          break;
        }
      }
    }
  }

  return {
    font: font || "Calibri",
    isRtl,
    scriptName: scriptName || "Latin",
  };
}

export interface ExtractedRun {
  text: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  font: string;
  isRtl?: boolean;
}

export interface ExtractedLine {
  page: number;
  y: number;
  minX: number;
  maxX: number;
  pageWidth: number;
  pageHeight: number;
  runs: ExtractedRun[];
  fullText: string;
  avgFontSize: number;
  hasBold: boolean;
  isRtl: boolean;
  alignment: "left" | "center" | "right";
}

interface RawPdfItem {
  str: string;
  dir?: string;
  transform: number[]; // [scaleX, skewY, skewX, scaleY, x, y]
  width: number;
  height: number;
  fontName?: string;
  hasEOL?: boolean;
}

import {
  createOcrWorker,
  detectOcrLanguageAuto,
  normalizeDevanagariText,
  ocrPdfPageToLines,
  pageNeedsOcr,
  type OcrMode,
  type OcrProgress,
} from "./nepali-pdf-ocr";

export interface ExtractOptions {
  ocrMode?: OcrMode;
  ocrLang?: string;
  onProgress?: (progress: OcrProgress) => void;
}

const DEVANAGARI_COMBINING_START_RE = /^[\u0900-\u0903\u093A-\u094F\u0951-\u0957\u0962-\u0963\u093C\u094D]/;

/**
 * Extract structured, layout-aware lines from a PDF file.
 * Automatically falls back to free browser AI OCR (Tesseract.js LSTM) on
 * scanned pages, broken ToUnicode CMaps, or legacy Nepali fonts (Preeti, Kantipur, etc.).
 */
export async function extractStructuredLines(
  file: File,
  options: ExtractOptions = {}
): Promise<{
  lines: ExtractedLine[];
  pageCount: number;
  detectedScripts: Set<string>;
  ocrPages: number;
}> {
  const { ocrMode = "auto", ocrLang, onProgress } = options;
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  const lines: ExtractedLine[] = [];
  const detectedScripts = new Set<string>();
  let ocrPages = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ocrWorker: any = null;
  let resolvedOcrLang = ocrLang || "";

  try {
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      onProgress?.({
        page: pageNum,
        totalPages: pdf.numPages,
        stage: `Reading page ${pageNum} of ${pdf.numPages}…`,
        percent: Math.round(((pageNum - 1) / pdf.numPages) * 100),
      });

      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.0 });
      const pageWidth = viewport.width;
      const pageHeight = viewport.height;

      const textContent = await page.getTextContent();
      const rawItems = (textContent.items || []) as RawPdfItem[];
      const styles = (textContent.styles || {}) as Record<string, { fontFamily?: string }>;

      const shouldRunOcr =
        ocrMode === "always" ||
        (ocrMode !== "off" && pageNeedsOcr(rawItems, styles));

      if (shouldRunOcr) {
        if (!ocrWorker) {
          if (!resolvedOcrLang) {
            onProgress?.({
              page: pageNum,
              totalPages: pdf.numPages,
              stage: "Auto-detecting document language…",
              percent: Math.round(((pageNum - 1) / pdf.numPages) * 100),
            });
            resolvedOcrLang = await detectOcrLanguageAuto(page, rawItems, styles);
          }
          onProgress?.({
            page: pageNum,
            totalPages: pdf.numPages,
            stage: `Loading AI OCR (${resolvedOcrLang})…`,
            percent: Math.round(((pageNum - 1) / pdf.numPages) * 100),
          });
          ocrWorker = await createOcrWorker(resolvedOcrLang, (p, status) => {
            onProgress?.({
              page: pageNum,
              totalPages: pdf.numPages,
              stage: `AI OCR page ${pageNum}/${pdf.numPages}: ${status}`,
              percent: Math.round(((pageNum - 1 + p) / pdf.numPages) * 100),
            });
          });
        } else {
          onProgress?.({
            page: pageNum,
            totalPages: pdf.numPages,
            stage: `AI OCR recognizing page ${pageNum} of ${pdf.numPages}…`,
            percent: Math.round(((pageNum - 0.5) / pdf.numPages) * 100),
          });
        }

        const ocrResult = await ocrPdfPageToLines(ocrWorker, page, pageNum, detectScriptInfo, 2.5);
        lines.push(...ocrResult.lines);
        for (const s of ocrResult.detectedScripts) detectedScripts.add(s);
        ocrPages++;
        continue;
      }

      if (rawItems.length === 0) continue;

    // Filter and normalize items
    interface ProcessedItem {
      text: string;
      x: number;
      y: number;
      width: number;
      height: number;
      fontSize: number;
      bold: boolean;
      italic: boolean;
      hasEOL?: boolean;
    }

    const items: ProcessedItem[] = [];

    for (const it of rawItems) {
      if (!it.str && !it.hasEOL) continue;
      const normText = normalizeDevanagariText(it.str || "");
      const x = it.transform[4];
      const y = it.transform[5];
      const fontSize = Math.hypot(it.transform[1], it.transform[3]) || it.height || 10;
      const fn = (it.fontName || "").toLowerCase();
      const bold = /bold|heavy|black|semibold|bolder/i.test(fn);
      const italic = /italic|oblique/i.test(fn);

      items.push({
        text: normText,
        x,
        y,
        width: it.width || 0,
        height: it.height || fontSize,
        fontSize,
        bold,
        italic,
        hasEOL: it.hasEOL,
      });
    }

    // Sort items vertically (top-to-bottom: higher Y in PDF coordinate space means higher on page)
    // For items on the same line (similar Y), sort horizontally (left-to-right)
    items.sort((a, b) => {
      const yDiff = b.y - a.y;
      if (Math.abs(yDiff) > Math.min(a.fontSize, b.fontSize) * 0.45) {
        return yDiff;
      }
      return a.x - b.x;
    });

    // Group items into horizontal lines
    let currentLineItems: ProcessedItem[] = [];
    let currentLineY: number | null = null;
    let currentLineFontSize = 10;

    const flushLine = () => {
      if (currentLineItems.length === 0) return;

      // Sort current line strictly left to right
      currentLineItems.sort((a, b) => a.x - b.x);

      // Reconstruct words with proper spacing
      const runs: ExtractedRun[] = [];
      let minX = Infinity;
      let maxX = -Infinity;
      let lineText = "";
      let totalFontSize = 0;
      let anyBold = false;
      let anyRtl = false;

      let prevRight: number | null = null;

      for (let i = 0; i < currentLineItems.length; i++) {
        const item = currentLineItems[i];
        if (!item.text.trim() && item.text !== " ") continue;

        minX = Math.min(minX, item.x);
        maxX = Math.max(maxX, item.x + item.width);
        totalFontSize += item.fontSize;
        if (item.bold) anyBold = true;

        const script = detectScriptInfo(item.text);
        if (script.scriptName) detectedScripts.add(script.scriptName);
        if (script.isRtl) anyRtl = true;

        // Space / Tab insertion logic: preserve wide column gaps as tabs, normal word gaps as spaces,
        // and never insert a space before Devanagari combining marks (matras/halant) or after halant.
        let wordPrefix = "";
        if (prevRight !== null) {
          const gap = item.x - prevRight;
          const isDevanagariContinuation =
            DEVANAGARI_COMBINING_START_RE.test(item.text) || lineText.endsWith("\u094D");
          if (!isDevanagariContinuation) {
            if (gap > item.fontSize * 2.4) {
              wordPrefix = "\t";
            } else if (
              gap > item.fontSize * 0.22 &&
              !lineText.endsWith(" ") &&
              !lineText.endsWith("\t") &&
              !item.text.startsWith(" ")
            ) {
              wordPrefix = " ";
            }
          }
        }

        const runText = wordPrefix + item.text;
        lineText += runText;
        prevRight = item.x + item.width;

        // Group into runs with identical formatting
        const lastRun = runs[runs.length - 1];
        if (
          lastRun &&
          lastRun.bold === item.bold &&
          lastRun.italic === item.italic &&
          Math.abs(lastRun.fontSize - item.fontSize) < 1.0 &&
          lastRun.font === script.font
        ) {
          lastRun.text += runText;
        } else {
          runs.push({
            text: runText,
            fontSize: item.fontSize,
            bold: item.bold,
            italic: item.italic,
            font: script.font,
            isRtl: script.isRtl,
          });
        }
      }

      if (runs.length > 0 && lineText.trim().length > 0) {
        const avgFontSize = totalFontSize / currentLineItems.length;
        const lineWidth = maxX - minX;
        const lineMid = (minX + maxX) / 2;
        const pageMid = pageWidth / 2;

        let alignment: "left" | "center" | "right" = "left";
        if (anyRtl) {
          alignment = "right";
        } else if (Math.abs(lineMid - pageMid) < pageWidth * 0.06 && lineWidth < pageWidth * 0.8) {
          alignment = "center";
        } else if (minX > pageWidth * 0.55 && maxX > pageWidth * 0.8) {
          alignment = "right";
        }

        lines.push({
          page: pageNum,
          y: currentLineY ?? 0,
          minX: minX === Infinity ? 0 : minX,
          maxX: maxX === -Infinity ? pageWidth : maxX,
          pageWidth,
          pageHeight,
          runs,
          fullText: lineText.trim(),
          avgFontSize,
          hasBold: anyBold,
          isRtl: anyRtl,
          alignment,
        });
      }

      currentLineItems = [];
      currentLineY = null;
    };

    for (const item of items) {
      if (currentLineY === null) {
        currentLineY = item.y;
        currentLineFontSize = item.fontSize;
        currentLineItems.push(item);
      } else {
        const yDiff = Math.abs(item.y - currentLineY);
        const yTolerance = Math.max(2.5, Math.min(currentLineFontSize, item.fontSize) * 0.45);
        if (yDiff <= yTolerance) {
          currentLineItems.push(item);
          currentLineFontSize = Math.max(currentLineFontSize, item.fontSize);
        } else {
          flushLine();
          currentLineY = item.y;
          currentLineFontSize = item.fontSize;
          currentLineItems.push(item);
        }
      }
      if (item.hasEOL) {
        flushLine();
      }
    }
    flushLine();
    }
  } finally {
    if (ocrWorker) {
      try {
        await ocrWorker.terminate();
      } catch {
        // Ignore worker termination error
      }
    }
  }

  onProgress?.({
    page: pdf.numPages,
    totalPages: pdf.numPages,
    stage: "Finalizing document…",
    percent: 100,
  });

  return {
    lines,
    pageCount: pdf.numPages,
    detectedScripts,
    ocrPages,
  };
}

export interface WordParagraphModel {
  page: number;
  minX: number;
  avgFontSize: number;
  spaceBeforePt: number;
  runs: ExtractedRun[];
  isHeading: boolean;
  alignment: "left" | "center" | "right";
  isRtl?: boolean;
  isPageBreakBefore?: boolean;
}

const LIST_ITEM_START_RE = /^([•●○▪▫\-–—*]|\d+[.)]|[क-ह][.)]|[०-९]+[.)])\s+/;

/**
 * Converts a PDF file into a Microsoft Word (.docx) document.
 * Matches iLovePDF Premium formatting quality: exact page dimensions, margins,
 * indents, vertical spacing, tab columns, alignments, font sizes, scripts,
 * and automatic free AI OCR for scanned/Nepali PDFs.
 */
export async function convertPdfToWord(
  file: File,
  options: ExtractOptions = {}
): Promise<Blob> {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    PageBreak,
    AlignmentType,
  } = await import("docx");

  const { lines } = await extractStructuredLines(file, options);

  if (lines.length === 0) {
    const emptyDoc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "No selectable text was found in this document. Try switching to 'AI OCR (All Pages)' for scanned PDFs.",
                  italics: true,
                  size: 24,
                  font: "Calibri",
                }),
              ],
            }),
          ],
        },
      ],
    });
    return Packer.toBlob(emptyDoc);
  }

  // Page dimensions & document-level content bounds
  const pageWidthPt = lines[0]?.pageWidth || 595.28; // A4 default
  const pageHeightPt = lines[0]?.pageHeight || 841.89;

  // Calculate body font size by weighted character frequency
  const sizeWeights = new Map<number, number>();
  let minContentX = Infinity;
  let maxContentX = 0;

  for (const line of lines) {
    const s = Math.round(line.avgFontSize);
    sizeWeights.set(s, (sizeWeights.get(s) || 0) + line.fullText.length);
    if (line.alignment === "left" && line.minX >= 10) {
      minContentX = Math.min(minContentX, line.minX);
    }
    maxContentX = Math.max(maxContentX, line.maxX);
  }

  let bodyFontSize = 11;
  let maxWeight = 0;
  for (const [s, w] of sizeWeights) {
    if (w > maxWeight) {
      maxWeight = w;
      bodyFontSize = s;
    }
  }

  const baseLeftPt = minContentX !== Infinity ? Math.max(24, Math.min(minContentX, 110)) : 54;
  const baseRightPt =
    maxContentX > baseLeftPt + 100
      ? Math.max(24, Math.min(pageWidthPt - maxContentX, 110))
      : 54;
  const bodyWrapThresholdX = Math.max(baseLeftPt + 150, maxContentX - 42);

  // Group lines into paragraphs without destroying intentional line breaks
  const paragraphs: WordParagraphModel[] = [];
  let currentPara: WordParagraphModel | null = null;
  let lastPage = 0;
  let lastY: number | null = null;
  let prevLine: ExtractedLine | null = null;

  const flushPara = () => {
    if (currentPara && currentPara.runs.length > 0) {
      paragraphs.push(currentPara);
    }
    currentPara = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isNewPage = line.page !== lastPage;
    const isBig = line.avgFontSize >= bodyFontSize * 1.32;
    const isHeading = isBig && line.fullText.length < 160;
    const isListItem = LIST_ITEM_START_RE.test(line.fullText);

    const yGap = lastY !== null && !isNewPage ? lastY - line.y : 0;
    const prevWrappedAtMargin =
      prevLine !== null &&
      prevLine.maxX >= bodyWrapThresholdX &&
      prevLine.alignment === "left";
    const indentChanged =
      prevLine !== null && Math.abs(line.minX - prevLine.minX) > 12;

    const isParagraphBreak =
      isNewPage ||
      !currentPara ||
      isHeading ||
      isListItem ||
      currentPara.isHeading ||
      line.alignment !== currentPara.alignment ||
      indentChanged ||
      !prevWrappedAtMargin ||
      yGap > line.avgFontSize * 1.45;

    if (isParagraphBreak) {
      flushPara();
    }

    if (!currentPara) {
      const extraGapPt =
        !isNewPage && lastY !== null
          ? Math.max(0, Math.min(yGap - line.avgFontSize * 1.2, 48))
          : 0;
      currentPara = {
        page: line.page,
        minX: line.minX,
        avgFontSize: line.avgFontSize,
        spaceBeforePt: Math.round(extraGapPt),
        runs: [...line.runs],
        isHeading,
        alignment: line.alignment,
        isRtl: line.isRtl,
        isPageBreakBefore: isNewPage && line.page > 1,
      };
    } else {
      // Append wrapped line runs with a space
      if (
        currentPara.runs.length > 0 &&
        !currentPara.runs[currentPara.runs.length - 1].text.endsWith(" ")
      ) {
        currentPara.runs.push({
          text: " ",
          fontSize: line.avgFontSize,
          bold: false,
          italic: false,
          font: line.runs[0]?.font || "Calibri",
          isRtl: line.isRtl,
        });
      }
      currentPara.runs.push(...line.runs);
    }

    lastPage = line.page;
    lastY = line.y;
    prevLine = line;
  }
  flushPara();

  // Rebuild into docx Paragraphs preserving exact size, indents, and spacing
  const docxElements: InstanceType<typeof Paragraph>[] = [];

  for (let idx = 0; idx < paragraphs.length; idx++) {
    const p = paragraphs[idx];

    if (p.isPageBreakBefore) {
      docxElements.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      );
    }

    const runs = p.runs.map((r) => {
      const halfPts = Math.min(Math.max(Math.round(r.fontSize * 2), 16), 72);
      return new TextRun({
        text: r.text,
        bold: r.bold || p.isHeading,
        italics: r.italic,
        size: halfPts,
        font: r.font ? { name: r.font } : { name: "Calibri" },
        rightToLeft: r.isRtl,
      });
    });

    let alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT;
    if (p.alignment === "center") alignment = AlignmentType.CENTER;
    else if (p.alignment === "right" || p.isRtl) alignment = AlignmentType.RIGHT;

    const indentTwips =
      p.alignment === "left" && !p.isRtl
        ? Math.max(0, Math.round((p.minX - baseLeftPt) * 20))
        : 0;
    const beforeTwips = Math.max(0, Math.round(p.spaceBeforePt * 20));

    docxElements.push(
      new Paragraph({
        children: runs,
        alignment,
        bidirectional: p.isRtl,
        indent: indentTwips > 40 ? { left: indentTwips } : undefined,
        spacing: {
          before: beforeTwips > 0 ? beforeTwips : undefined,
          after: p.isHeading ? 100 : 40,
          line: 264, // 1.1x clean document spacing
        },
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: Math.round(pageWidthPt * 20),
              height: Math.round(pageHeightPt * 20),
            },
            margin: {
              top: 720,
              right: Math.round(baseRightPt * 20),
              bottom: 720,
              left: Math.round(baseLeftPt * 20),
            },
          },
        },
        children: docxElements,
      },
    ],
  });

  return Packer.toBlob(doc);
}
