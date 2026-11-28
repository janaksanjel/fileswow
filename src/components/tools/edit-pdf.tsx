"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import { FilePreviewButton } from "@/components/file-preview-button";
import RichTextEditor from "@/components/rich-text-editor";
import type { ToolUIProps } from "@/components/tool-registry";
import { extractStructuredLines, type ExtractedLine } from "@/lib/engines/pdf-to-word";
import type {
  PdfPageSize,
  PdfOrientation,
  PdfMargin,
  RichTextPdfResult,
} from "@/lib/richtext-pdf";

type EditorMode = "visual" | "reflow";
type VisualTool = "edit" | "add-text" | "whiteout";

type FontKind = "sans" | "serif" | "mono";

interface PdfTextBlock {
  id: string;
  page: number;
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  originalText: string;
  text: string;
  fontSizePt: number;
  color: string;
  bold: boolean;
  fontKind: FontKind;
  edited: boolean;
}

interface AddedTextBox {
  id: string;
  page: number;
  xPct: number;
  yPct: number;
  text: string;
  fontSizePt: number;
  color: string;
  bold: boolean;
}

interface WhiteoutBox {
  id: string;
  page: number;
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
}

interface AddedImageBox {
  id: string;
  page: number;
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  dataUrl: string;
  mime: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function extractedLinesToHtml(lines: ExtractedLine[]): string {
  if (lines.length === 0) return "<p></p>";
  const weights = new Map<number, number>();
  for (const l of lines) {
    const s = Math.round(l.avgFontSize);
    weights.set(s, (weights.get(s) || 0) + l.fullText.length);
  }
  let bodySize = 11;
  let bestW = 0;
  for (const [s, w] of weights) {
    if (w > bestW) {
      bestW = w;
      bodySize = s;
    }
  }
  const chunks: string[] = [];
  let lastPage = 1;
  for (const line of lines) {
    if (line.page > lastPage) {
      chunks.push("<hr />");
      lastPage = line.page;
    }
    const inner = line.runs
      .map((r) => {
        let html = escapeHtml(r.text);
        if (r.bold) html = `<strong>${html}</strong>`;
        if (r.italic) html = `<em>${html}</em>`;
        return html;
      })
      .join("");
    const alignAttr =
      line.alignment === "center"
        ? ' style="text-align: center;"'
        : line.alignment === "right"
          ? ' style="text-align: right;"'
          : "";
    if (line.avgFontSize >= bodySize * 1.6 && line.fullText.length < 140) {
      chunks.push(`<h1${alignAttr}>${inner}</h1>`);
    } else if (line.avgFontSize >= bodySize * 1.28 && line.fullText.length < 140) {
      chunks.push(`<h2${alignAttr}>${inner}</h2>`);
    } else {
      chunks.push(`<p${alignAttr}>${inner}</p>`);
    }
  }
  return chunks.join("");
}

/**
 * Render non-Latin/Unicode text (e.g. Nepali/Devanagari, Arabic, CJK) into a
 * crisp transparent PNG so pdf-lib can embed it without WinAnsi encoding errors.
 */
async function renderUnicodeTextPng(
  text: string,
  fontSizePt: number,
  colorHex: string,
  bold: boolean
): Promise<{ bytes: Uint8Array; widthPt: number; heightPt: number }> {
  const scale = 3;
  const pxSize = Math.max(10, fontSizePt) * (96 / 72);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const fontStack = `${bold ? "bold " : ""}${pxSize}px 'Noto Sans Devanagari', 'Nirmala UI', system-ui, sans-serif`;
  ctx.font = fontStack;
  const metrics = ctx.measureText(text);
  const wPx = Math.max(8, Math.ceil(metrics.width + 6));
  const hPx = Math.max(12, Math.ceil(pxSize * 1.35));

  canvas.width = wPx * scale;
  canvas.height = hPx * scale;
  const g = canvas.getContext("2d")!;
  g.scale(scale, scale);
  g.font = fontStack;
  g.fillStyle = colorHex;
  g.textBaseline = "top";
  g.fillText(text, 1, pxSize * 0.12);

  const blob = await new Promise<Blob>((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("Text render failed"))), "image/png")
  );
  canvas.width = 0;
  canvas.height = 0;
  return {
    bytes: new Uint8Array(await blob.arrayBuffer()),
    widthPt: wPx * (72 / 96),
    heightPt: hPx * (72 / 96),
  };
}

export default function EditPdfTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<EditorMode>("visual");

  // Visual editor state
  const [numPages, setNumPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSizePt, setPageSizePt] = useState<{ w: number; h: number }>({ w: 595, h: 842 });
  const [visualTool, setVisualTool] = useState<VisualTool>("edit");
  const [textBlocks, setTextBlocks] = useState<PdfTextBlock[]>([]);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [addedTexts, setAddedTexts] = useState<AddedTextBox[]>([]);
  const [activeAddedId, setActiveAddedId] = useState<string | null>(null);
  const [whiteouts, setWhiteouts] = useState<WhiteoutBox[]>([]);
  const [addedImages, setAddedImages] = useState<AddedImageBox[]>([]);
  const [activeColor, setActiveColor] = useState("#111827");
  const [activeFontSize, setActiveFontSize] = useState(13);
  const [activeBold, setActiveBold] = useState(false);
  const [renderingPage, setRenderingPage] = useState(false);

  const pageCanvasRef = useRef<HTMLCanvasElement>(null);
  const pageStageRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfDocRef = useRef<any>(null);

  // Reflow RichTextEditor mode state
  const editorElRef = useRef<HTMLDivElement | null>(null);
  const [loadedHtml, setLoadedHtml] = useState("");
  const [loadingReflow, setLoadingReflow] = useState(false);
  const [keepFormatting, setKeepFormatting] = useState(true);
  const [reflowSize, setReflowSize] = useState<PdfPageSize>("a4");
  const [reflowOrient, setReflowOrient] = useState<PdfOrientation>("portrait");
  const [reflowMargin, setReflowMargin] = useState<PdfMargin>("normal");
  const [reflowPageNums, setReflowPageNums] = useState(false);

  const [result, setResult] = useState<RichTextPdfResult | { blob: Blob } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleEditorReady = useCallback((el: HTMLDivElement | null) => {
    editorElRef.current = el;
  }, []);

  const renderPageToCanvas = useCallback(async (pageNum: number) => {
    const pdf = pdfDocRef.current;
    const canvas = pageCanvasRef.current;
    if (!pdf || !canvas) return;
    setRenderingPage(true);
    try {
      const page = await pdf.getPage(pageNum);
      const baseVp = page.getViewport({ scale: 1.0 });
      const vp = page.getViewport({ scale: 1.6 });
      setPageSizePt({ w: baseVp.width, h: baseVp.height });

      canvas.width = Math.round(vp.width);
      canvas.height = Math.round(vp.height);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvas, canvasContext: ctx, viewport: vp }).promise;
      }

      // Extract clickable text blocks for this page if not already cached
      setTextBlocks((prev) => {
        if (prev.some((b) => b.page === pageNum)) return prev;
        void (async () => {
          const content = await page.getTextContent();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const raw = (content.items || []) as Array<any>;
          const styles = (content.styles || {}) as Record<string, { fontFamily?: string }>;
          const newBlocks: PdfTextBlock[] = [];
          raw.forEach((it, idx) => {
            const str = (it.str || "").trim();
            if (!str) return;
            const fontSizePt = Math.max(7, Math.round(Math.hypot(it.transform[1], it.transform[3]) || it.height || 11));
            const xPt = it.transform[4];
            const yBaselinePt = it.transform[5];
            const wPt = Math.max(12, it.width || str.length * fontSizePt * 0.5);
            const hPt = Math.max(fontSizePt * 1.25, it.height || fontSizePt * 1.25);
            const topPt = baseVp.height - yBaselinePt - hPt * 0.85;
            const fn = (it.fontName || "").toLowerCase();
            const ff = (styles[it.fontName || ""]?.fontFamily || "").toLowerCase();
            const fontMeta = `${fn} ${ff}`;
            const isBold = /bold|heavy|black|semibold|demi|700|800|900/i.test(fontMeta);
            const fontKind: FontKind = /courier|mono|consolas|code/i.test(fontMeta)
              ? "mono"
              : /times|serif|georgia|garamond|cambria|palatino/i.test(fontMeta)
                ? "serif"
                : "sans";

            newBlocks.push({
              id: `p${pageNum}-${idx}`,
              page: pageNum,
              xPct: Math.max(0, (xPt / baseVp.width) * 100),
              yPct: Math.max(0, (topPt / baseVp.height) * 100),
              wPct: Math.min(98, (wPt / baseVp.width) * 100),
              hPct: Math.min(30, (hPt / baseVp.height) * 100),
              originalText: it.str,
              text: it.str,
              fontSizePt,
              color: "#111827",
              bold: isBold,
              fontKind,
              edited: false,
            });
          });
          setTextBlocks((curr) =>
            curr.some((b) => b.page === pageNum) ? curr : [...curr, ...newBlocks]
          );
        })();
        return prev;
      });
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to render PDF page");
    } finally {
      setRenderingPage(false);
    }
  }, [onError]);

  const handleFile = useCallback(
    async (files: File[]) => {
      const f = files[0];
      if (!f) return;
      setFile(f);
      setResult(null);
      setTextBlocks([]);
      setAddedTexts([]);
      setWhiteouts([]);
      setAddedImages([]);
      setActiveBlockId(null);
      setActiveAddedId(null);
      setLoadedHtml("");

      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const buf = await f.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);
        setCurrentPage(1);
        requestAnimationFrame(() => {
          void renderPageToCanvas(1);
        });
      } catch (err) {
        onError?.(err instanceof Error ? err.message : "Failed to open PDF");
      }
    },
    [onError, renderPageToCanvas]
  );

  useEffect(() => {
    if (file && mode === "visual" && pdfDocRef.current) {
      void renderPageToCanvas(currentPage);
    }
  }, [currentPage, file, mode, renderPageToCanvas]);

  const switchToReflow = useCallback(async () => {
    setMode("reflow");
    if (!file || loadedHtml) return;
    setLoadingReflow(true);
    try {
      const extracted = await extractStructuredLines(file, { ocrMode: "auto" });
      setLoadedHtml(extractedLinesToHtml(extracted.lines));
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to extract text");
    } finally {
      setLoadingReflow(false);
    }
  }, [file, loadedHtml, onError]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (visualTool === "edit") {
      setActiveBlockId(null);
      setActiveAddedId(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = Math.max(0, Math.min(92, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(0, Math.min(94, ((e.clientY - rect.top) / rect.height) * 100));

    if (visualTool === "add-text") {
      const id = `add-${Date.now()}`;
      setAddedTexts((prev) => [
        ...prev,
        {
          id,
          page: currentPage,
          xPct,
          yPct,
          text: "New text",
          fontSizePt: activeFontSize,
          color: activeColor,
          bold: activeBold,
        },
      ]);
      setActiveAddedId(id);
      setVisualTool("edit");
    } else if (visualTool === "whiteout") {
      setWhiteouts((prev) => [
        ...prev,
        {
          id: `wo-${Date.now()}`,
          page: currentPage,
          xPct,
          yPct,
          wPct: 16,
          hPct: 4,
        },
      ]);
      setVisualTool("edit");
    }
  };

  const startDragOverlay = useCallback(
    (
      e: React.PointerEvent,
      kind: "image-move" | "image-resize" | "added-move" | "whiteout-move",
      id: string,
      initial: { xPct: number; yPct: number; wPct?: number; hPct?: number }
    ) => {
      e.stopPropagation();
      e.preventDefault();
      const stage = pageStageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const startX = e.clientX;
      const startY = e.clientY;

      const onMove = (ev: PointerEvent) => {
        const dxPct = ((ev.clientX - startX) / rect.width) * 100;
        const dyPct = ((ev.clientY - startY) / rect.height) * 100;

        if (kind === "image-move") {
          setAddedImages((prev) =>
            prev.map((im) =>
              im.id === id
                ? {
                    ...im,
                    xPct: Math.max(0, Math.min(96 - im.wPct, initial.xPct + dxPct)),
                    yPct: Math.max(0, Math.min(96 - im.hPct, initial.yPct + dyPct)),
                  }
                : im
            )
          );
        } else if (kind === "image-resize") {
          setAddedImages((prev) =>
            prev.map((im) =>
              im.id === id
                ? {
                    ...im,
                    wPct: Math.max(4, Math.min(96 - im.xPct, (initial.wPct ?? 20) + dxPct)),
                    hPct: Math.max(4, Math.min(96 - im.yPct, (initial.hPct ?? 14) + dyPct)),
                  }
                : im
            )
          );
        } else if (kind === "added-move") {
          setAddedTexts((prev) =>
            prev.map((a) =>
              a.id === id
                ? {
                    ...a,
                    xPct: Math.max(0, Math.min(94, initial.xPct + dxPct)),
                    yPct: Math.max(0, Math.min(95, initial.yPct + dyPct)),
                  }
                : a
            )
          );
        } else if (kind === "whiteout-move") {
          setWhiteouts((prev) =>
            prev.map((w) =>
              w.id === id
                ? {
                    ...w,
                    xPct: Math.max(0, Math.min(96 - w.wPct, initial.xPct + dxPct)),
                    yPct: Math.max(0, Math.min(96 - w.hPct, initial.yPct + dyPct)),
                  }
                : w
            )
          );
        }
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    []
  );

  const handleAddImageFile = (imgFile: File) => {
    if (!imgFile.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) return;
      const probe = new Image();
      probe.onload = () => {
        const aspect = probe.naturalWidth / Math.max(1, probe.naturalHeight);
        const wPct = 24;
        const hPct = Math.max(6, Math.min(45, wPct / Math.max(0.25, aspect) * (pageSizePt.w / pageSizePt.h)));
        setAddedImages((prev) => [
          ...prev,
          {
            id: `img-${Date.now()}`,
            page: currentPage,
            xPct: 15,
            yPct: 15,
            wPct,
            hPct,
            dataUrl,
            mime: imgFile.type,
          },
        ]);
      };
      probe.src = dataUrl;
    };
    reader.readAsDataURL(imgFile);
  };

  const handleSave = useCallback(async () => {
    if (!file || saving) return;
    setSaving(true);
    onProcessing?.(true);

    try {
      if (mode === "reflow") {
        const editor = editorElRef.current;
        if (!editor) throw new Error("Editor not ready");
        const { richTextToPdf } = await import("@/lib/richtext-pdf");
        const res = await richTextToPdf(editor, {
          pageSize: reflowSize,
          orientation: reflowOrient,
          margin: reflowMargin,
          lineSpacing: 1.5,
          pageNumbers: reflowPageNums,
          pageNumberPosition: "bottom-center",
        });
        setResult(res);
        return;
      }

      // Visual Exact-Layout Mode: modify the original PDF directly with pdf-lib
      // so 100% of original images, logos, tables, and formatting stay intact!
      const { loadPdf, savePdf } = await import("@/lib/engines/pdf");
      const { StandardFonts, rgb } = await import("pdf-lib");
      const doc = await loadPdf(file);
      const helvetica = await doc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
      const times = await doc.embedFont(StandardFonts.TimesRoman);
      const timesBold = await doc.embedFont(StandardFonts.TimesRomanBold);
      const courier = await doc.embedFont(StandardFonts.Courier);
      const courierBold = await doc.embedFont(StandardFonts.CourierBold);

      const pickFont = (kind: FontKind, isBold: boolean) => {
        if (kind === "serif") return isBold ? timesBold : times;
        if (kind === "mono") return isBold ? courierBold : courier;
        return isBold ? helveticaBold : helvetica;
      };

      const parseHexRgb = (hex: string) => {
        const clean = hex.replace("#", "");
        return rgb(
          parseInt(clean.substring(0, 2) || "11", 16) / 255,
          parseInt(clean.substring(2, 4) || "18", 16) / 255,
          parseInt(clean.substring(4, 6) || "27", 16) / 255
        );
      };

      const drawSmartText = async (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        page: any,
        text: string,
        xPt: number,
        topPt: number,
        sizePt: number,
        colorHex: string,
        bold: boolean,
        fontKind: FontKind = "sans"
      ) => {
        const isWinAnsi = /^[\x20-\x7E\u00A0-\u00FF]*$/.test(text);
        const { height } = page.getSize();
        if (isWinAnsi) {
          page.drawText(text, {
            x: xPt,
            y: Math.max(4, height - topPt - sizePt * 0.9),
            size: sizePt,
            font: pickFont(fontKind, bold),
            color: parseHexRgb(colorHex),
          });
        } else {
          const rendered = await renderUnicodeTextPng(text, sizePt, colorHex, bold);
          const png = await doc.embedPng(rendered.bytes);
          page.drawImage(png, {
            x: xPt,
            y: Math.max(4, height - topPt - rendered.heightPt),
            width: rendered.widthPt,
            height: rendered.heightPt,
          });
        }
      };

      // 1. Whiteouts
      for (const wo of whiteouts) {
        const page = doc.getPage(wo.page - 1);
        if (!page) continue;
        const { width, height } = page.getSize();
        const x = (wo.xPct / 100) * width;
        const w = (wo.wPct / 100) * width;
        const h = (wo.hPct / 100) * height;
        const y = height - (wo.yPct / 100) * height - h;
        page.drawRectangle({ x, y, width: w, height: h, color: rgb(1, 1, 1) });
      }

      // 2. Edited existing text blocks (cover original text with white patch, draw new text)
      for (const blk of textBlocks.filter((b) => b.edited)) {
        const page = doc.getPage(blk.page - 1);
        if (!page) continue;
        const { width, height } = page.getSize();
        const x = (blk.xPct / 100) * width;
        const topPt = (blk.yPct / 100) * height;
        const w = Math.max(20, (blk.wPct / 100) * width + 6);
        const h = Math.max(blk.fontSizePt * 1.25, (blk.hPct / 100) * height + 3);
        page.drawRectangle({
          x: Math.max(0, x - 2),
          y: Math.max(0, height - topPt - h),
          width: w,
          height: h,
          color: rgb(1, 1, 1),
        });
        if (blk.text.trim()) {
          await drawSmartText(page, blk.text, x, topPt, blk.fontSizePt, blk.color, blk.bold, blk.fontKind);
        }
      }

      // 3. Added text boxes
      for (const add of addedTexts) {
        if (!add.text.trim()) continue;
        const page = doc.getPage(add.page - 1);
        if (!page) continue;
        const { width, height } = page.getSize();
        await drawSmartText(
          page,
          add.text,
          (add.xPct / 100) * width,
          (add.yPct / 100) * height,
          add.fontSizePt,
          add.color,
          add.bold,
          "sans"
        );
      }

      // 4. Added images
      for (const im of addedImages) {
        const page = doc.getPage(im.page - 1);
        if (!page) continue;
        const { width, height } = page.getSize();
        const res = await fetch(im.dataUrl);
        const imgBytes = new Uint8Array(await res.arrayBuffer());
        const embedded = im.mime.includes("png")
          ? await doc.embedPng(imgBytes)
          : await doc.embedJpg(imgBytes);
        const w = (im.wPct / 100) * width;
        const h = (im.hPct / 100) * height;
        const x = (im.xPct / 100) * width;
        const y = height - (im.yPct / 100) * height - h;
        page.drawImage(embedded, { x, y, width: w, height: h });
      }

      const blob = await savePdf(doc);
      setResult({ blob });
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to save edited PDF");
    } finally {
      setSaving(false);
      onProcessing?.(false);
    }
  }, [
    addedImages,
    addedTexts,
    file,
    mode,
    onError,
    onProcessing,
    reflowMargin,
    reflowOrient,
    reflowPageNums,
    reflowSize,
    saving,
    textBlocks,
    whiteouts,
  ]);

  const pageBlocks = textBlocks.filter((b) => b.page === currentPage);
  const pageAdded = addedTexts.filter((a) => a.page === currentPage);
  const pageWhiteouts = whiteouts.filter((w) => w.page === currentPage);
  const pageImages = addedImages.filter((im) => im.page === currentPage);

  return (
    <div className="space-y-4">
      {!file ? (
        <DropZone
          accept=".pdf"
          onFilesSelected={handleFile}
          label="Drop a PDF to edit"
          description="Edit text directly on the PDF page while keeping 100% of original images, logos & layout intact"
        />
      ) : (
        <div className="space-y-3">
          {/* Top file & mode bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-bg-elevated border border-border-base">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold bg-accent-subtle text-accent shrink-0">
                PDF
              </span>
              <span className="text-xs sm:text-sm font-medium text-text-primary truncate max-w-[200px] sm:max-w-[280px]">
                {file.name}
              </span>
              <FilePreviewButton file={file} />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setMode("visual")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                  mode === "visual"
                    ? "bg-accent text-white border-accent"
                    : "bg-bg-input text-text-secondary border-border-base hover:text-text-primary"
                }`}
              >
                Visual PDF (Exact Layout)
              </button>
              <button
                type="button"
                onClick={switchToReflow}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                  mode === "reflow"
                    ? "bg-accent text-white border-accent"
                    : "bg-bg-input text-text-secondary border-border-base hover:text-text-primary"
                }`}
              >
                Document Text Mode
              </button>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setResult(null);
                }}
                className="text-xs font-semibold text-text-tertiary hover:text-danger ml-1 cursor-pointer"
              >
                Change
              </button>
            </div>
          </div>

          {mode === "visual" ? (
            <>
              {/* Visual Editor Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-bg-elevated border border-border-base text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setVisualTool("edit")}
                    className={`px-2.5 py-1.5 rounded-lg font-semibold border cursor-pointer ${
                      visualTool === "edit"
                        ? "bg-accent-subtle text-accent border-accent/40"
                        : "bg-bg-input text-text-secondary border-border-base"
                    }`}
                  >
                    Edit Existing Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisualTool("add-text")}
                    className={`px-2.5 py-1.5 rounded-lg font-semibold border cursor-pointer ${
                      visualTool === "add-text"
                        ? "bg-accent-subtle text-accent border-accent/40"
                        : "bg-bg-input text-text-secondary border-border-base"
                    }`}
                  >
                    + Add Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisualTool("whiteout")}
                    className={`px-2.5 py-1.5 rounded-lg font-semibold border cursor-pointer ${
                      visualTool === "whiteout"
                        ? "bg-accent-subtle text-accent border-accent/40"
                        : "bg-bg-input text-text-secondary border-border-base"
                    }`}
                  >
                    Whiteout
                  </button>
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-lg font-semibold border bg-bg-input text-text-secondary border-border-base hover:text-text-primary cursor-pointer"
                  >
                    + Image
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const im = e.target.files?.[0];
                      if (im) handleAddImageFile(im);
                      e.target.value = "";
                    }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      const nextBold = !activeBold;
                      setActiveBold(nextBold);
                      if (activeBlockId) {
                        setTextBlocks((prev) =>
                          prev.map((b) =>
                            b.id === activeBlockId ? { ...b, bold: nextBold, edited: true } : b
                          )
                        );
                      } else if (activeAddedId) {
                        setAddedTexts((prev) =>
                          prev.map((a) =>
                            a.id === activeAddedId ? { ...a, bold: nextBold } : a
                          )
                        );
                      }
                    }}
                    title="Toggle Bold"
                    aria-label="Toggle Bold"
                    className={`w-7 h-7 rounded border font-bold cursor-pointer ${
                      activeBold
                        ? "bg-accent text-white border-accent"
                        : "bg-bg-input text-text-secondary border-border-strong"
                    }`}
                  >
                    B
                  </button>
                  <label className="inline-flex items-center gap-1 text-text-secondary">
                    Size
                    <input
                      type="number"
                      min={8}
                      max={48}
                      value={activeFontSize}
                      onChange={(e) => {
                        const sz = Math.max(8, Number(e.target.value) || 12);
                        setActiveFontSize(sz);
                        if (activeBlockId) {
                          setTextBlocks((prev) =>
                            prev.map((b) =>
                              b.id === activeBlockId ? { ...b, fontSizePt: sz, edited: true } : b
                            )
                          );
                        } else if (activeAddedId) {
                          setAddedTexts((prev) =>
                            prev.map((a) =>
                              a.id === activeAddedId ? { ...a, fontSizePt: sz } : a
                            )
                          );
                        }
                      }}
                      className="w-12 h-7 px-1.5 rounded border border-border-strong bg-bg-input text-text-primary text-center"
                    />
                  </label>
                  <input
                    type="color"
                    value={activeColor}
                    onChange={(e) => {
                      const col = e.target.value;
                      setActiveColor(col);
                      if (activeBlockId) {
                        setTextBlocks((prev) =>
                          prev.map((b) =>
                            b.id === activeBlockId ? { ...b, color: col, edited: true } : b
                          )
                        );
                      } else if (activeAddedId) {
                        setAddedTexts((prev) =>
                          prev.map((a) =>
                            a.id === activeAddedId ? { ...a, color: col } : a
                          )
                        );
                      }
                    }}
                    title="Text color"
                    className="w-7 h-7 rounded border border-border-strong bg-bg-input cursor-pointer"
                  />
                  {numPages > 1 && (
                    <div className="flex items-center gap-1 pl-2 border-l border-border-base">
                      <button
                        type="button"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="px-2 py-1 rounded border border-border-base bg-bg-input disabled:opacity-40 cursor-pointer"
                      >
                        ‹
                      </button>
                      <span className="px-1.5 font-semibold text-text-secondary tabular-nums">
                        {currentPage} / {numPages}
                      </span>
                      <button
                        type="button"
                        disabled={currentPage >= numPages}
                        onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                        className="px-2 py-1 rounded border border-border-base bg-bg-input disabled:opacity-40 cursor-pointer"
                      >
                        ›
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Interactive PDF Page Canvas with Click-to-Edit Overlays */}
              <div className="rounded-xl border border-border-strong bg-[#eef1f6] dark:bg-[#0f172a]/70 p-3 sm:p-4 overflow-auto max-h-[clamp(260px,46dvh,520px)]">
                <div
                  ref={pageStageRef}
                  onClick={handleCanvasClick}
                  style={{ aspectRatio: `${pageSizePt.w} / ${pageSizePt.h}` }}
                  className={`relative w-full max-w-[740px] mx-auto bg-white shadow-md select-none ${
                    visualTool !== "edit" ? "cursor-crosshair" : ""
                  }`}
                >
                  <canvas ref={pageCanvasRef} className="w-full h-full block" />

                  {renderingPage && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center text-xs font-semibold text-text-secondary">
                      Rendering page…
                    </div>
                  )}

                  {/* Whiteouts (draggable) */}
                  {pageWhiteouts.map((wo) => (
                    <div
                      key={wo.id}
                      onPointerDown={(e) =>
                        startDragOverlay(e, "whiteout-move", wo.id, {
                          xPct: wo.xPct,
                          yPct: wo.yPct,
                        })
                      }
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        left: `${wo.xPct}%`,
                        top: `${wo.yPct}%`,
                        width: `${wo.wPct}%`,
                        height: `${wo.hPct}%`,
                      }}
                      className="group absolute bg-white border border-dashed border-accent/60 cursor-move"
                    >
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => setWhiteouts((prev) => prev.filter((w) => w.id !== wo.id))}
                        className="hidden group-hover:flex absolute -top-2 -right-2 w-4 h-4 rounded-full bg-danger text-white text-[10px] items-center justify-center cursor-pointer"
                        aria-label="Remove whiteout"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {/* Clickable Existing PDF Text Blocks */}
                  {pageBlocks.map((blk) => {
                    const isEditing = activeBlockId === blk.id;
                    return (
                      <div
                        key={blk.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (visualTool === "edit") {
                            setActiveBlockId(blk.id);
                            setActiveAddedId(null);
                            setActiveBold(blk.bold);
                            setActiveFontSize(blk.fontSizePt);
                            setActiveColor(blk.color);
                          }
                        }}
                        style={{
                          left: `${blk.xPct}%`,
                          top: `${blk.yPct}%`,
                          minWidth: `${blk.wPct}%`,
                          minHeight: `${blk.hPct}%`,
                        }}
                        className={`absolute transition-colors ${
                          isEditing
                            ? "z-20 bg-white ring-2 ring-accent px-0.5 rounded-xs"
                            : blk.edited
                              ? "z-10 bg-white border border-accent/40 px-0.5"
                              : "hover:bg-accent/15 hover:outline hover:outline-1 hover:outline-accent/50 cursor-text"
                        }`}
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            autoFocus
                            value={blk.text}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTextBlocks((prev) =>
                                prev.map((b) =>
                                  b.id === blk.id ? { ...b, text: val, edited: true } : b
                                )
                              );
                            }}
                            onBlur={() => setActiveBlockId(null)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === "Escape") {
                                setActiveBlockId(null);
                              }
                            }}
                            style={{
                              fontSize: `${Math.max(10, blk.fontSizePt)}px`,
                              color: blk.color,
                              fontWeight: blk.bold ? 700 : 400,
                            }}
                            className="w-full min-w-[80px] bg-white outline-none leading-tight"
                          />
                        ) : blk.edited ? (
                          <span
                            style={{
                              fontSize: `${Math.max(10, blk.fontSizePt)}px`,
                              color: blk.color,
                              fontWeight: blk.bold ? 700 : 400,
                            }}
                            className="whitespace-nowrap leading-tight block"
                          >
                            {blk.text}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}

                  {/* Added Text Boxes (draggable + editable + bold) */}
                  {pageAdded.map((add) => {
                    const isEditing = activeAddedId === add.id;
                    return (
                      <div
                        key={add.id}
                        onPointerDown={(e) => {
                          if (!isEditing) {
                            startDragOverlay(e, "added-move", add.id, {
                              xPct: add.xPct,
                              yPct: add.yPct,
                            });
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveAddedId(add.id);
                          setActiveBlockId(null);
                          setActiveBold(add.bold);
                          setActiveFontSize(add.fontSizePt);
                          setActiveColor(add.color);
                        }}
                        style={{ left: `${add.xPct}%`, top: `${add.yPct}%` }}
                        className="group absolute z-20 bg-white/90 border border-accent/60 rounded px-1 cursor-move"
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            autoFocus
                            value={add.text}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAddedTexts((prev) =>
                                prev.map((a) => (a.id === add.id ? { ...a, text: val } : a))
                              );
                            }}
                            onBlur={() => setActiveAddedId(null)}
                            style={{
                              fontSize: `${add.fontSizePt}px`,
                              color: add.color,
                              fontWeight: add.bold ? 700 : 400,
                            }}
                            className="min-w-[90px] bg-transparent outline-none"
                          />
                        ) : (
                          <span
                            style={{
                              fontSize: `${add.fontSizePt}px`,
                              color: add.color,
                              fontWeight: add.bold ? 700 : 400,
                            }}
                          >
                            {add.text}
                          </span>
                        )}
                        <button
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            setAddedTexts((prev) => prev.filter((a) => a.id !== add.id));
                          }}
                          className="hidden group-hover:flex absolute -top-2 -right-2 w-4 h-4 rounded-full bg-danger text-white text-[10px] items-center justify-center cursor-pointer"
                          aria-label="Remove text"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}

                  {/* Added Images (drag to move + bottom-right handle to resize) */}
                  {pageImages.map((im) => (
                    <div
                      key={im.id}
                      onPointerDown={(e) =>
                        startDragOverlay(e, "image-move", im.id, {
                          xPct: im.xPct,
                          yPct: im.yPct,
                        })
                      }
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        left: `${im.xPct}%`,
                        top: `${im.yPct}%`,
                        width: `${im.wPct}%`,
                        height: `${im.hPct}%`,
                      }}
                      className="group absolute z-20 border-2 border-dashed border-accent/70 cursor-move"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- local uploaded image data URL */}
                      <img src={im.dataUrl} alt="" className="w-full h-full object-contain pointer-events-none" />
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => setAddedImages((prev) => prev.filter((x) => x.id !== im.id))}
                        className="hidden group-hover:flex absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-danger text-white text-[11px] items-center justify-center shadow-sm cursor-pointer"
                        aria-label="Remove image"
                      >
                        ×
                      </button>
                      {/* Corner resize handle */}
                      <div
                        onPointerDown={(e) =>
                          startDragOverlay(e, "image-resize", im.id, {
                            xPct: im.xPct,
                            yPct: im.yPct,
                            wPct: im.wPct,
                            hPct: im.hPct,
                          })
                        }
                        title="Drag to resize image"
                        className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 rounded-sm bg-accent border-2 border-white shadow-sm cursor-nwse-resize"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[11.5px] text-text-tertiary text-center">
                {visualTool === "edit"
                  ? "Click any text on the PDF page to edit it directly — original images & layout stay 100% intact."
                  : visualTool === "add-text"
                    ? "Click anywhere on the PDF page to place new text."
                    : "Click on the PDF page to place a whiteout patch."}
              </p>
            </>
          ) : loadingReflow ? (
            <div className="py-10 text-center text-sm text-text-secondary">
              Extracting full document into rich text editor…
            </div>
          ) : (
            <>
              <RichTextEditor
                editorId="rte-edit-pdf"
                keepFormatting={keepFormatting}
                onKeepFormattingChange={setKeepFormatting}
                onEditorReady={handleEditorReady}
                initialHtml={loadedHtml}
              />
              <div className="flex flex-wrap items-center gap-3 px-3 py-2 rounded-xl bg-bg-elevated border border-border-base text-xs">
                <select
                  value={reflowSize}
                  onChange={(e) => setReflowSize(e.target.value as PdfPageSize)}
                  className="h-7 rounded-lg border border-border-strong bg-bg-input px-2 text-text-primary"
                >
                  <option value="a4">A4</option>
                  <option value="letter">US Letter</option>
                </select>
                <select
                  value={reflowOrient}
                  onChange={(e) => setReflowOrient(e.target.value as PdfOrientation)}
                  className="h-7 rounded-lg border border-border-strong bg-bg-input px-2 text-text-primary"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
                <select
                  value={reflowMargin}
                  onChange={(e) => setReflowMargin(e.target.value as PdfMargin)}
                  className="h-7 rounded-lg border border-border-strong bg-bg-input px-2 text-text-primary"
                >
                  <option value="narrow">Narrow</option>
                  <option value="normal">Normal</option>
                  <option value="wide">Wide</option>
                </select>
                <label className="flex items-center gap-1.5 text-text-secondary cursor-pointer ml-auto">
                  <input
                    type="checkbox"
                    checked={reflowPageNums}
                    onChange={(e) => setReflowPageNums(e.target.checked)}
                    className="accent-[var(--accent)]"
                  />
                  Page numbers
                </label>
              </div>
            </>
          )}

          {result && (
            <div className="hidden" aria-hidden="true">
              <DownloadButton
                blob={result.blob}
                filename={`edited-${file.name}`}
                label="Download Edited PDF"
              />
            </div>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full py-3 cursor-pointer"
          >
            {saving ? "Saving Edited PDF…" : "Save Edited PDF"}
          </button>
        </div>
      )}
    </div>
  );
}
