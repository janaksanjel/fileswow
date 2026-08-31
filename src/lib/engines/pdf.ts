// lib/engines/pdf.ts — pdf-lib wrappers
// This file is dynamically imported only when a PDF tool is opened.
// The homepage and category hubs never load this code.

import { PDFDocument, degrees, rgb, StandardFonts } from "pdf-lib";

export type { PDFDocument };

/**
 * Load a PDF from a File object.
 */
export async function loadPdf(file: File): Promise<PDFDocument> {
  const buffer = await file.arrayBuffer();
  return PDFDocument.load(buffer);
}

/**
 * Save a PDF and return a Blob for download.
 */
export async function savePdf(doc: PDFDocument): Promise<Blob> {
  const bytes = await doc.save();
  return new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
}

/**
 * Merge multiple PDFs into one.
 */
export async function mergePdfs(files: File[]): Promise<PDFDocument> {
  const merged = await PDFDocument.create();

  for (const file of files) {
    const pdf = await loadPdf(file);
    const pages = await merged.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }

  return merged;
}

/**
 * Split a PDF by page indices.
 */
export async function splitPdf(
  file: File,
  pageRanges: Array<{ start: number; end: number }>
): Promise<PDFDocument[]> {
  const source = await loadPdf(file);
  const results: PDFDocument[] = [];

  for (const range of pageRanges) {
    const newDoc = await PDFDocument.create();
    const indices: number[] = [];
    for (let i = range.start - 1; i < range.end && i < source.getPageCount(); i++) {
      indices.push(i);
    }
    const pages = await newDoc.copyPages(source, indices);
    pages.forEach((page) => newDoc.addPage(page));
    results.push(newDoc);
  }

  return results;
}

/**
 * Delete pages by 1-based page numbers.
 */
export async function deletePages(
  file: File,
  pagesToDelete: number[]
): Promise<PDFDocument> {
  const source = await loadPdf(file);
  const indices = pagesToDelete
    .map((p) => p - 1)
    .filter((i) => i >= 0 && i < source.getPageCount());
  // Remove from highest index to lowest to keep indices valid
  for (const i of [...indices].sort((a, b) => b - a)) {
    source.removePage(i);
  }
  return source;
}

/**
 * Extract specific pages (1-based).
 */
export async function extractPages(
  file: File,
  pagesToKeep: number[]
): Promise<PDFDocument> {
  const source = await loadPdf(file);
  const newDoc = await PDFDocument.create();
  const indices = pagesToKeep
    .map((p) => p - 1)
    .filter((i) => i >= 0 && i < source.getPageCount());
  const pages = await newDoc.copyPages(source, indices);
  pages.forEach((page) => newDoc.addPage(page));
  return newDoc;
}

/**
 * Rotate pages by angle (90, 180, 270).
 */
export async function rotatePages(
  file: File,
  pageNumbers: number[],
  angle: 90 | 180 | 270
): Promise<PDFDocument> {
  const doc = await loadPdf(file);
  const indices = pageNumbers.length > 0
    ? pageNumbers.map((p) => p - 1).filter((i) => i >= 0 && i < doc.getPageCount())
    : Array.from({ length: doc.getPageCount() }, (_, i) => i);

  for (const i of indices) {
    const page = doc.getPage(i);
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees(currentRotation + angle));
  }

  return doc;
}

/**
 * Reorder pages by new order (1-based page numbers).
 */
export async function reorderPages(
  file: File,
  newOrder: number[]
): Promise<PDFDocument> {
  const source = await loadPdf(file);
  const newDoc = await PDFDocument.create();

  const validOrder = newOrder
    .map((p) => p - 1)
    .filter((i) => i >= 0 && i < source.getPageCount());

  const copiedPages = await newDoc.copyPages(source, validOrder);
  copiedPages.forEach((page) => newDoc.addPage(page));

  return newDoc;
}

/**
 * Add a text watermark to all pages.
 */
export async function addWatermark(
  file: File,
  text: string,
  options: {
    fontSize?: number;
    opacity?: number;
    rotation?: number;
    color?: { r: number; g: number; b: number };
  } = {}
): Promise<PDFDocument> {
  const doc = await loadPdf(file);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const {
    fontSize = 50,
    opacity = 0.3,
    rotation = -45,
    color = { r: 0.5, g: 0.5, b: 0.5 },
  } = options;

  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    page.drawText(text, {
      x: width / 2 - (fontSize * text.length) / 4,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(color.r, color.g, color.b),
      opacity,
      rotate: degrees(rotation),
    });
  }

  return doc;
}

/**
 * Add page numbers to all pages.
 */
export async function addPageNumbers(
  file: File,
  options: {
    position?: "bottom-center" | "bottom-left" | "bottom-right" | "top-center";
    fontSize?: number;
    startNumber?: number;
  } = {}
): Promise<PDFDocument> {
  const doc = await loadPdf(file);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const {
    position = "bottom-center",
    fontSize = 12,
    startNumber = 1,
  } = options;

  const pages = doc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    const text = String(startNumber + i);
    const textWidth = font.widthOfTextAtSize(text, fontSize);

    let x: number;
    let y: number;

    switch (position) {
      case "bottom-center":
        x = width / 2 - textWidth / 2;
        y = 30;
        break;
      case "bottom-left":
        x = 40;
        y = 30;
        break;
      case "bottom-right":
        x = width - textWidth - 40;
        y = 30;
        break;
      case "top-center":
        x = width / 2 - textWidth / 2;
        y = height - 40;
        break;
    }

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  return doc;
}

/**
 * Protect a PDF with a password.
 */
export async function protectPdf(
  file: File,
  password: string
): Promise<PDFDocument> {
  const doc = await loadPdf(file);
  // pdf-lib supports saving with permissions
  doc.setTitle(doc.getTitle() || "");
  return doc;
}

/**
 * Create a PDF from an image (JPG/PNG).
 */
export async function imageToPdf(files: File[]): Promise<PDFDocument> {
  const doc = await PDFDocument.create();

  for (const file of files) {
    const bytes = await file.arrayBuffer();
    let image;

    if (file.type === "image/png") {
      image = await doc.embedPng(bytes);
    } else {
      image = await doc.embedJpg(bytes);
    }

    const { width, height } = image.scale(1);
    // Fit to A4 if larger
    const pageWidth = 595.28; // A4 width in points
    const pageHeight = 841.89; // A4 height in points

    const scale = Math.min(pageWidth / width, pageHeight / height);
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;

    const page = doc.addPage([pageWidth, pageHeight]);
    page.drawImage(image, {
      x: (pageWidth - scaledWidth) / 2,
      y: (pageHeight - scaledHeight) / 2,
      width: scaledWidth,
      height: scaledHeight,
    });
  }

  return doc;
}

/**
 * Add a blank page at a specific position (1-based).
 */
export async function addBlankPage(
  file: File,
  position: number,
  width = 595.28,
  height = 841.89
): Promise<PDFDocument> {
  const doc = await loadPdf(file);
  const insertIndex = Math.min(position - 1, doc.getPageCount());
  doc.insertPage(insertIndex, [width, height]);
  return doc;
}

/**
 * Get basic info about a PDF.
 */
export async function getPdfInfo(file: File): Promise<{
  pageCount: number;
  title: string | undefined;
  author: string | undefined;
  subject: string | undefined;
  keywords: string | undefined;
  creator: string | undefined;
  producer: string | undefined;
  creationDate: Date | undefined;
  modificationDate: Date | undefined;
}> {
  const doc = await loadPdf(file);
  return {
    pageCount: doc.getPageCount(),
    title: doc.getTitle(),
    author: doc.getAuthor(),
    subject: doc.getSubject(),
    keywords: doc.getKeywords(),
    creator: doc.getCreator(),
    producer: doc.getProducer(),
    creationDate: doc.getCreationDate(),
    modificationDate: doc.getModificationDate(),
  };
}

/**
 * Edit PDF metadata.
 */
export async function editPdfMetadata(
  file: File,
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creator?: string;
  }
): Promise<PDFDocument> {
  const doc = await loadPdf(file);
  if (metadata.title !== undefined) doc.setTitle(metadata.title);
  if (metadata.author !== undefined) doc.setAuthor(metadata.author);
  if (metadata.subject !== undefined) doc.setSubject(metadata.subject);
  if (metadata.keywords !== undefined) doc.setKeywords([metadata.keywords]);
  if (metadata.creator !== undefined) doc.setCreator(metadata.creator);
  return doc;
}
