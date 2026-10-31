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

/**
 * Extract structured, layout-aware lines from a PDF file.
 * Accurately calculates horizontal spacing and word separation.
 */
export async function extractStructuredLines(file: File): Promise<{
  lines: ExtractedLine[];
  pageCount: number;
  detectedScripts: Set<string>;
}> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  const lines: ExtractedLine[] = [];
  const detectedScripts = new Set<string>();

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const pageWidth = viewport.width;

    const textContent = await page.getTextContent();
    const rawItems = (textContent.items || []) as RawPdfItem[];
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
      const normText = (it.str || "").normalize("NFC");
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

        // Space insertion logic: if there is a visible gap between this item and the previous one
        let wordPrefix = "";
        if (prevRight !== null) {
          const gap = item.x - prevRight;
          // Typical space threshold in PDF: ~20% of font size
          if (gap > item.fontSize * 0.22 && !lineText.endsWith(" ") && !item.text.startsWith(" ")) {
            wordPrefix = " ";
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

  return {
    lines,
    pageCount: pdf.numPages,
    detectedScripts,
  };
}

export interface WordParagraphModel {
  page: number;
  runs: ExtractedRun[];
  isHeading: boolean;
  headingLevel?: 1 | 2;
  alignment: "left" | "center" | "right";
  isRtl?: boolean;
  isPageBreakBefore?: boolean;
  isListItem?: boolean;
}

/**
 * Converts a PDF file into a Microsoft Word (.docx) document.
 * Matches iLovePDF formatting quality: proper page breaks, alignment, font sizes, and scripts.
 */
export async function convertPdfToWord(file: File): Promise<Blob> {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    PageBreak,
    HeadingLevel,
    AlignmentType,
  } = await import("docx");

  const { lines } = await extractStructuredLines(file);

  if (lines.length === 0) {
    const emptyDoc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "No selectable text was found in this document. It may consist of scanned images. Please run OCR before converting to Word.",
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

  // Calculate body font size by weighted character frequency
  const sizeWeights = new Map<number, number>();
  for (const line of lines) {
    const s = Math.round(line.avgFontSize);
    sizeWeights.set(s, (sizeWeights.get(s) || 0) + line.fullText.length);
  }
  let bodyFontSize = 11;
  let maxWeight = 0;
  for (const [s, w] of sizeWeights) {
    if (w > maxWeight) {
      maxWeight = w;
      bodyFontSize = s;
    }
  }

  // Group lines into paragraphs
  const paragraphs: WordParagraphModel[] = [];
  let currentPara: WordParagraphModel | null = null;
  let lastPage = 0;
  let lastY: number | null = null;

  const flushPara = () => {
    if (currentPara && currentPara.runs.length > 0) {
      paragraphs.push(currentPara);
    }
    currentPara = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isNewPage = line.page !== lastPage;
    const isBig = line.avgFontSize >= bodyFontSize * 1.35;
    const isHeading = isBig && line.fullText.length < 160;

    const yGap = lastY !== null && !isNewPage ? lastY - line.y : 0;
    const isParagraphBreak =
      isNewPage ||
      isHeading ||
      (currentPara && currentPara.isHeading) ||
      line.alignment !== currentPara?.alignment ||
      yGap > line.avgFontSize * 1.75;

    if (isParagraphBreak) {
      flushPara();
    }

    if (!currentPara) {
      currentPara = {
        page: line.page,
        runs: [...line.runs],
        isHeading,
        headingLevel: line.avgFontSize >= bodyFontSize * 1.7 ? 1 : 2,
        alignment: line.alignment,
        isRtl: line.isRtl,
        isPageBreakBefore: isNewPage && line.page > 1,
      };
    } else {
      // Append line runs to existing paragraph with space between lines
      if (currentPara.runs.length > 0 && !currentPara.runs[currentPara.runs.length - 1].text.endsWith(" ")) {
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
  }
  flushPara();

  // Rebuild into docx Paragraphs
  const docxElements: InstanceType<typeof Paragraph>[] = [];

  for (let idx = 0; idx < paragraphs.length; idx++) {
    const p = paragraphs[idx];

    // If starting a new page from the PDF, insert an authentic Word PageBreak
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

    docxElements.push(
      new Paragraph({
        children: runs,
        alignment,
        bidirectional: p.isRtl,
        heading: p.isHeading
          ? p.headingLevel === 1
            ? HeadingLevel.HEADING_1
            : HeadingLevel.HEADING_2
          : undefined,
        spacing: {
          after: p.isHeading ? 160 : 90,
          line: 276, // 1.15 line spacing
        },
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              right: 1000,
              bottom: 1000,
              left: 1000,
            },
          },
        },
        children: docxElements,
      },
    ],
  });

  return Packer.toBlob(doc);
}
