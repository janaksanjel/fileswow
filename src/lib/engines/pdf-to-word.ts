// lib/engines/pdf-to-word.ts
//
// Pipeline: pdf.js → extract lines with bold/size → group into paragraphs
// → build .docx using only the docx API patterns proven to work in this project.

export type PdfLine = {
  page: number;
  y: number;
  fontSize: number;
  bold: boolean;
  text: string;
};

// Script detection — returns a font name for non-Latin scripts only.
// Latin text returns undefined so Word uses its own default (no interference).
const SCRIPT_FONTS: Array<{ ranges: [number, number][]; font: string }> = [
  { ranges: [[0x0900, 0x097f]], font: "Noto Sans Devanagari" }, // Nepali/Hindi
  { ranges: [[0x0980, 0x09ff]], font: "Noto Sans Bengali" },
  { ranges: [[0x0a80, 0x0aff]], font: "Noto Sans Gujarati" },
  { ranges: [[0x0b80, 0x0bff]], font: "Noto Sans Tamil" },
  { ranges: [[0x0c00, 0x0c7f]], font: "Noto Sans Telugu" },
  { ranges: [[0x0c80, 0x0cff]], font: "Noto Sans Kannada" },
  { ranges: [[0x0d00, 0x0d7f]], font: "Noto Sans Malayalam" },
  { ranges: [[0x0e00, 0x0e7f]], font: "Noto Sans Thai" },
  { ranges: [[0x1000, 0x109f]], font: "Noto Sans Myanmar" },
  { ranges: [[0x0600, 0x06ff], [0xfb50, 0xfdff], [0xfe70, 0xfeff]], font: "Arial" },
  { ranges: [[0x0590, 0x05ff]], font: "Arial" },
  { ranges: [[0x4e00, 0x9fff], [0x3040, 0x30ff], [0xac00, 0xd7af]], font: "Microsoft YaHei" },
];

function scriptFont(text: string): string | undefined {
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    for (const { ranges, font } of SCRIPT_FONTS) {
      for (const [lo, hi] of ranges) {
        if (cp >= lo && cp <= hi) return font;
      }
    }
  }
  return undefined;
}

// ── Text extraction ─────────────────────────────────────────────────────────

export async function extractLines(file: File): Promise<PdfLine[]> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  const lines: PdfLine[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items = textContent.items as Array<{
      str: string; transform: number[]; height: number;
      hasEOL?: boolean; fontName?: string;
    }>;

    type Cur = { y: number; parts: string[]; fontSize: number; bold: boolean };
    let cur: Cur | null = null;

    const flush = () => {
      if (!cur) return;
      const text = cur.parts.join("").trim();
      if (text) lines.push({ page: pageNum, y: cur.y, fontSize: cur.fontSize, bold: cur.bold, text });
      cur = null;
    };

    for (const item of items) {
      const y = item.transform[5];
      const fontSize = Math.hypot(item.transform[1], item.transform[3]) || item.height || 10;
      const isBold = /bold|heavy|black/i.test(item.fontName ?? "");

      if (!item.str) { if (item.hasEOL) flush(); continue; }

      if (cur && Math.abs(cur.y - y) <= Math.max(2, fontSize * 0.4)) {
        cur.parts.push(item.str);
        cur.fontSize = Math.max(cur.fontSize, fontSize);
        if (isBold) cur.bold = true;
      } else {
        flush();
        cur = { y, parts: [item.str], fontSize, bold: isBold };
      }
      if (item.hasEOL) flush();
    }
    flush();
  }

  return lines.filter((l) => l.text.length > 0);
}

// ── Paragraph grouping ──────────────────────────────────────────────────────

export type WordPara = {
  text: string;
  fontSize: number;
  bold: boolean;
  isPageMarker?: boolean;
};

export function groupIntoParagraphs(lines: PdfLine[]): WordPara[] {
  const sw = new Map<number, number>();
  for (const l of lines) {
    const s = Math.round(l.fontSize * 2) / 2;
    sw.set(s, (sw.get(s) ?? 0) + l.text.length);
  }
  let bodySize = 10, bestW = 0;
  for (const [s, w] of sw) { if (w > bestW) { bestW = w; bodySize = s; } }

  const paras: WordPara[] = [];
  const multiPage = new Set(lines.map((l) => l.page)).size > 1;
  let lastPage = 0, lastY: number | null = null, cur: WordPara | null = null;

  const flush = () => {
    if (!cur) return;
    const text = cur.text.replace(/\s+/g, " ").trim();
    if (text) paras.push({ ...cur, text });
    cur = null;
  };

  for (const line of lines) {
    const text = line.text.trim();
    if (!text) continue;

    if (line.page !== lastPage) {
      flush();
      if (multiPage) paras.push({ text: `— Page ${line.page} —`, fontSize: bodySize, bold: false, isPageMarker: true });
      lastPage = line.page;
      lastY = null;
    } else if (lastY !== null && lastY - line.y > line.fontSize * 1.8) {
      flush();
    }

    if (cur && cur.bold === line.bold && Math.abs(cur.fontSize - line.fontSize) < 1.5) {
      cur.text += " " + text;
    } else {
      flush();
      cur = { text, fontSize: line.fontSize, bold: line.bold };
    }
    lastY = line.y;
  }
  flush();
  return paras;
}

// ── DOCX builder ────────────────────────────────────────────────────────────

export async function convertPdfToWord(file: File): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } =
    await import("docx");

  const lines = await extractLines(file);
  const paras = groupIntoParagraphs(lines);

  const sw = new Map<number, number>();
  for (const p of paras) { const s = Math.round(p.fontSize); sw.set(s, (sw.get(s) ?? 0) + p.text.length); }
  let bodySize = 10, bw = 0;
  for (const [s, w] of sw) { if (w > bw) { bw = w; bodySize = s; } }

  const children = paras.map((p) => {
    const isHeading = !p.isPageMarker && p.fontSize > bodySize * 1.2 && p.text.length < 150;
    const halfPts = p.isPageMarker ? 20 : Math.min(Math.round(p.fontSize * 2), 72);
    const detectedFont = scriptFont(p.text);

    // Build run options the same way working tools do — plain object, no cast
    const runOpts = {
      text: p.text,
      bold: p.bold || isHeading,
      italics: !!p.isPageMarker,
      size: halfPts,
    };

    return new Paragraph({
      children: [
        detectedFont
          ? new TextRun({ ...runOpts, font: detectedFont })
          : new TextRun(runOpts),
      ],
      heading: isHeading ? HeadingLevel.HEADING_2 : undefined,
      alignment: p.isPageMarker ? AlignmentType.CENTER : undefined,
      spacing: { after: 80 },
    });
  });

  if (children.length === 0) {
    children.push(new Paragraph({
      children: [new TextRun({
        text: "No selectable text found. This PDF may be scanned — run OCR first, then convert.",
        italics: true,
        size: 22,
      })],
    }));
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBlob(doc);
}
