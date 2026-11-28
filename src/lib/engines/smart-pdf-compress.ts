// src/lib/engines/smart-pdf-compress.ts
//
// iLovePDF-style PDF compressor:
// 1. Pass 1 (Vector-Preserving): Keeps 100% of vector text, fonts, links, and
//    vector graphics untouched & razor-sharp while recompressing embedded
//    /DCTDecode (JPEG) AND /FlateDecode (RGB/Grayscale/PNG-predictor) images
//    in-place + enabling PDF object streams.
// 2. Pass 2 (Fallback): Only if Pass 1 cannot reach the target size or the PDF
//    uses exotic/unindexed raster streams, falls back to smart adaptive page
//    compression.

import { compressCanvasToTargetBytes } from "@/lib/target-kb-compress";

export type PdfCompressLevel = "low" | "medium" | "high" | "target";

export interface SmartPdfCompressOptions {
  level: PdfCompressLevel;
  targetKb?: number;
  onProgress?: (msg: string) => void;
}

function getTargetSettings(level: PdfCompressLevel): {
  maxDim: number;
  quality: number;
} {
  if (level === "high") return { maxDim: 900, quality: 0.44 };
  if (level === "low") return { maxDim: 1800, quality: 0.80 };
  if (level === "target") return { maxDim: 1200, quality: 0.65 };
  return { maxDim: 1250, quality: 0.60 };
}

/**
 * Pass 1: In-place PDF image recompression (both DCTDecode & FlateDecode)
 * + object-stream optimization. Preserves 100% of vector text & layout.
 */
async function compressPdfPreserveVectors(
  buffer: ArrayBuffer,
  options: SmartPdfCompressOptions
): Promise<{ blob: Blob; recompressedImages: number }> {
  const {
    PDFArray,
    PDFDocument,
    PDFName,
    PDFNumber,
    PDFRawStream,
    decodePDFRawStream,
  } = await import("pdf-lib");

  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const { level, targetKb = 300, onProgress } = options;
  const { maxDim, quality } = getTargetSettings(level);

  const subtypeKey = PDFName.of("Subtype");
  const imageName = PDFName.of("Image");
  const filterKey = PDFName.of("Filter");
  const dctName = PDFName.of("DCTDecode");
  const flateName = PDFName.of("FlateDecode");
  const smaskKey = PDFName.of("SMask");
  const widthKey = PDFName.of("Width");
  const heightKey = PDFName.of("Height");
  const bpcKey = PDFName.of("BitsPerComponent");

  const candidates: Array<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ref: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stream: any;
    kind: "dct" | "flate";
    hasSMask: boolean;
    origW: number;
    origH: number;
    size: number;
  }> = [];

  for (const [ref, obj] of pdfDoc.context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue;
    const dict = obj.dict;
    if (dict.get(subtypeKey) !== imageName) continue;
    if (obj.contents.length < 6 * 1024) continue; // skip tiny icons

    let filter = dict.lookup(filterKey);
    if (filter instanceof PDFArray && filter.size() === 1) {
      filter = filter.lookup(0);
    }
    const kind =
      filter === dctName ? "dct" : filter === flateName ? "flate" : null;
    if (!kind) continue;

    const wObj = dict.lookup(widthKey);
    const hObj = dict.lookup(heightKey);
    const origW = wObj instanceof PDFNumber ? wObj.asNumber() : 0;
    const origH = hObj instanceof PDFNumber ? hObj.asNumber() : 0;
    if (origW < 16 || origH < 16) continue;

    if (kind === "flate") {
      const bpcObj = dict.lookup(bpcKey);
      const bpc = bpcObj instanceof PDFNumber ? bpcObj.asNumber() : 8;
      if (bpc !== 8) continue;
    }

    candidates.push({
      ref,
      stream: obj,
      kind,
      hasSMask: Boolean(dict.get(smaskKey)),
      origW,
      origH,
      size: obj.contents.length,
    });
  }

  const totalImageBytes = candidates.reduce((s, c) => s + c.size, 0);
  const nonImageBytes = Math.max(4096, buffer.byteLength - totalImageBytes);
  const targetTotalBytes = Math.max(15, targetKb) * 1024;
  const totalImageBudget = Math.max(4096, targetTotalBytes - nonImageBytes);

  let recompressedImages = 0;

  for (let i = 0; i < candidates.length; i++) {
    const { ref, stream, kind, hasSMask, origW, origH, size } = candidates[i];
    onProgress?.(
      `Optimizing embedded image ${i + 1} of ${candidates.length} (keeping text sharp)…`
    );

    try {
      let srcCanvas: HTMLCanvasElement;

      if (kind === "dct") {
        const srcBlob = new Blob([new Uint8Array(stream.contents)], {
          type: "image/jpeg",
        });
        const bmp = await createImageBitmap(srcBlob);
        srcCanvas = document.createElement("canvas");
        srcCanvas.width = bmp.width;
        srcCanvas.height = bmp.height;
        const sCtx = srcCanvas.getContext("2d", { alpha: false });
        if (sCtx) {
          sCtx.fillStyle = "#ffffff";
          sCtx.fillRect(0, 0, bmp.width, bmp.height);
          sCtx.drawImage(bmp, 0, 0);
        }
        bmp.close();
      } else {
        // Decode FlateDecode (including PNG Predictor streams) into raw RGB or Gray pixels
        const decoded = decodePDFRawStream(stream).decode();
        const pixelCount = origW * origH;
        const isRgb = decoded.length === pixelCount * 3;
        const isGray = decoded.length === pixelCount;
        if (!isRgb && !isGray) continue; // skip Indexed/CMYK/non-standard streams safely

        srcCanvas = document.createElement("canvas");
        srcCanvas.width = origW;
        srcCanvas.height = origH;
        const sCtx = srcCanvas.getContext("2d", { alpha: false });
        if (!sCtx) continue;
        const imgData = sCtx.createImageData(origW, origH);
        const rgba = imgData.data;

        if (isRgb) {
          for (let p = 0, q = 0; p < decoded.length; p += 3, q += 4) {
            rgba[q] = decoded[p];
            rgba[q + 1] = decoded[p + 1];
            rgba[q + 2] = decoded[p + 2];
            rgba[q + 3] = 255;
          }
        } else {
          for (let p = 0, q = 0; p < decoded.length; p++, q += 4) {
            const g = decoded[p];
            rgba[q] = g;
            rgba[q + 1] = g;
            rgba[q + 2] = g;
            rgba[q + 3] = 255;
          }
        }
        sCtx.putImageData(imgData, 0, 0);
      }

      // If image has an SMask alpha layer, keep exact pixel dimensions so mask stays aligned
      const scale = hasSMask
        ? 1
        : Math.min(1, maxDim / Math.max(srcCanvas.width, srcCanvas.height, 1));
      const dstW = Math.max(1, Math.round(srcCanvas.width * scale));
      const dstH = Math.max(1, Math.round(srcCanvas.height * scale));

      let workCanvas = srcCanvas;
      if (dstW !== srcCanvas.width || dstH !== srcCanvas.height) {
        workCanvas = document.createElement("canvas");
        workCanvas.width = dstW;
        workCanvas.height = dstH;
        const wCtx = workCanvas.getContext("2d", { alpha: false });
        if (wCtx) {
          wCtx.fillStyle = "#ffffff";
          wCtx.fillRect(0, 0, dstW, dstH);
          wCtx.imageSmoothingEnabled = true;
          wCtx.imageSmoothingQuality = "high";
          wCtx.drawImage(srcCanvas, 0, 0, dstW, dstH);
        }
        srcCanvas.width = 0;
        srcCanvas.height = 0;
      }

      let outBlob: Blob;
      if (level === "target" && totalImageBytes > 0) {
        const share = size / totalImageBytes;
        const imgBudget = Math.max(2048, Math.floor(totalImageBudget * share));
        outBlob = await compressCanvasToTargetBytes(workCanvas, imgBudget, "image/jpeg");
      } else {
        outBlob = await new Promise<Blob>((resolve, reject) =>
          workCanvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error("Encode failed"))),
            "image/jpeg",
            quality
          )
        );
      }

      workCanvas.width = 0;
      workCanvas.height = 0;

      if (outBlob.size < size * 0.94) {
        const newBytes = new Uint8Array(await outBlob.arrayBuffer());
        const newDict = stream.dict.clone(pdfDoc.context);
        newDict.set(widthKey, PDFNumber.of(dstW));
        newDict.set(heightKey, PDFNumber.of(dstH));
        newDict.set(PDFName.of("Length"), PDFNumber.of(newBytes.length));
        newDict.set(filterKey, dctName);
        newDict.set(PDFName.of("ColorSpace"), PDFName.of("DeviceRGB"));
        newDict.set(bpcKey, PDFNumber.of(8));
        newDict.delete(PDFName.of("DecodeParms"));

        pdfDoc.context.assign(ref, PDFRawStream.of(newDict, newBytes));
        recompressedImages++;
      }
    } catch {
      // Skip exotic image streams safely without breaking the PDF
    }
  }

  onProgress?.("Optimizing PDF structure…");
  if (level === "high" || level === "target") {
    pdfDoc.setProducer("FilesWow.com");
    pdfDoc.setCreator("FilesWow.com");
  }

  const savedBytes = await pdfDoc.save({ useObjectStreams: true });
  return {
    blob: new Blob([new Uint8Array(savedBytes)], { type: "application/pdf" }),
    recompressedImages,
  };
}

/**
 * Pass 2 (Fallback): Page-level adaptive compression for scanned PDFs or when
 * Pass 1 could not reach a strict Target KB limit.
 */
async function compressPdfPageFallback(
  buffer: ArrayBuffer,
  options: SmartPdfCompressOptions
): Promise<Blob> {
  const { GlobalWorkerOptions, getDocument } = await import("pdfjs-dist");
  const { PDFDocument } = await import("pdf-lib");
  GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const { level, targetKb = 300, onProgress } = options;
  const pdf = await getDocument({ data: buffer.slice(0) }).promise;
  const totalPages = pdf.numPages;

  let scale = 1.05;
  let quality = 0.50;
  const targetBytes = Math.max(15, targetKb) * 1024;
  let remainingBudget = Math.max(4096 * totalPages, targetBytes - 4096);
  const avgPerPageBudget = remainingBudget / Math.max(1, totalPages);

  if (level === "high") {
    scale = 0.85;
    quality = 0.36;
  } else if (level === "low") {
    scale = 1.5;
    quality = 0.78;
  } else if (level === "target") {
    scale = avgPerPageBudget < 28 * 1024 ? 1.15 : 1.45;
  }

  const newDoc = await PDFDocument.create();

  for (let i = 1; i <= totalPages; i++) {
    onProgress?.(`Compressing page ${i} of ${totalPages}…`);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const origViewport = page.getViewport({ scale: 1.0 });

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(viewport.width));
    canvas.height = Math.max(1, Math.round(viewport.height));
    const ctx = canvas.getContext("2d", { alpha: false });
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (page.render as any)({
      canvasContext: ctx,
      canvas,
      viewport,
    }).promise;

    const pagesLeft = Math.max(1, totalPages - i + 1);
    const currentPageBudget = Math.max(3072, Math.floor(remainingBudget / pagesLeft));

    const blob =
      level === "target"
        ? await compressCanvasToTargetBytes(canvas, currentPageBudget, "image/jpeg")
        : await new Promise<Blob>((resolve) =>
            canvas.toBlob((b) => resolve(b!), "image/jpeg", quality)
          );

    if (level === "target") {
      remainingBudget = Math.max(
        3072 * Math.max(1, pagesLeft - 1),
        remainingBudget - blob.size
      );
    }

    const imgBytes = await blob.arrayBuffer();
    const embeddedImg = await newDoc.embedJpg(imgBytes);
    const newPage = newDoc.addPage([origViewport.width, origViewport.height]);
    newPage.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: origViewport.width,
      height: origViewport.height,
    });

    canvas.width = 0;
    canvas.height = 0;
  }

  newDoc.setProducer("FilesWow.com");
  newDoc.setCreator("FilesWow.com");
  const bytes = await newDoc.save({ useObjectStreams: true });
  return new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
}

/**
 * Compress a PDF using iLovePDF-style vector-preserving image compression first,
 * automatically falling back to page-level compression only if needed to meet
 * the target size or reduce scanned pages.
 */
export async function smartCompressPdf(
  file: File,
  options: SmartPdfCompressOptions
): Promise<Blob> {
  const buffer = await file.arrayBuffer();
  const targetBytes = Math.max(15, options.targetKb ?? 300) * 1024;

  // Pass 1: Fast vector-preserving compression (keeps text 100% sharp!)
  const pass1 = await compressPdfPreserveVectors(buffer, options);

  const pass1SatisfiesTarget =
    options.level === "target"
      ? pass1.blob.size <= targetBytes * 1.05
      : options.level === "high"
        ? pass1.blob.size <= file.size * 0.42
        : options.level === "medium"
          ? pass1.blob.size <= file.size * 0.58
          : pass1.blob.size < file.size;

  if (pass1SatisfiesTarget && pass1.blob.size < file.size) {
    return pass1.blob;
  }

  // Pass 2: Fallback for exotic streams or ultra-strict target KB
  if (options.level !== "low") {
    const pass2Blob = await compressPdfPageFallback(buffer, options);
    if (pass2Blob.size < pass1.blob.size) {
      return pass2Blob;
    }
  }

  return pass1.blob.size <= file.size
    ? pass1.blob
    : new Blob([buffer], { type: "application/pdf" });
}
