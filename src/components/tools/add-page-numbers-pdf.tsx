"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export type NumberPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type NumberFormat =
  | "page-x-of-y"
  | "x-of-y"
  | "simple"
  | "page-x"
  | "brackets"
  | "dashes"
  | "roman-upper"
  | "roman-lower"
  | "custom";

export type FontFamily = "helvetica" | "times" | "courier";
export type FontStyle = "normal" | "bold" | "italic";
export type ProStyleType = "plain" | "badge" | "divider";

const PRESET_COLORS = [
  { label: "Dark Gray", hex: "#334155" },
  { label: "Black", hex: "#000000" },
  { label: "Navy", hex: "#1e3a8a" },
  { label: "Royal Blue", hex: "#2563eb" },
  { label: "Crimson", hex: "#dc2626" },
  { label: "Emerald", hex: "#059669" },
];

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  if (isNaN(bigint)) return { r: 0.2, g: 0.2, b: 0.2 };
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;
  return { r, g, b };
}

function toRoman(num: number, lowercase = false): string {
  if (num < 1 || num > 3999) return String(num);
  const lookup: Record<string, number> = {
    M: 1000,
    CM: 900,
    D: 500,
    CD: 400,
    C: 100,
    XC: 90,
    L: 50,
    XL: 40,
    X: 10,
    IX: 9,
    V: 5,
    IV: 4,
    I: 1,
  };
  let roman = "";
  for (const i in lookup) {
    while (num >= lookup[i]) {
      roman += i;
      num -= lookup[i];
    }
  }
  return lowercase ? roman.toLowerCase() : roman;
}

function formatPageString(
  num: number,
  total: number,
  actualPage: number,
  format: NumberFormat,
  customPattern: string
): string {
  switch (format) {
    case "page-x-of-y":
      return `Page ${num} of ${total}`;
    case "x-of-y":
      return `${num} of ${total}`;
    case "page-x":
      return `Page ${num}`;
    case "brackets":
      return `[ ${num} ]`;
    case "dashes":
      return `- ${num} -`;
    case "roman-upper":
      return toRoman(num, false);
    case "roman-lower":
      return toRoman(num, true);
    case "custom":
      return (customPattern || "{n}")
        .replace(/\{n\}/g, String(num))
        .replace(/\{total\}/g, String(total))
        .replace(/\{page\}/g, String(actualPage));
    case "simple":
    default:
      return String(num);
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function AddPageNumbersPdfTool({ onProcessing, onError }: ToolUIProps) {
  // Document state
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 595, height: 842 });
  const [previewPage, setPreviewPage] = useState<number>(1);
  const [previewScale, setPreviewScale] = useState<number>(1);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Pro Configuration state
  const [position, setPosition] = useState<NumberPosition>("bottom-center");
  const [format, setFormat] = useState<NumberFormat>("page-x-of-y");
  const [customPattern, setCustomPattern] = useState<string>("Page {n} of {total}");
  const [startNumber, setStartNumber] = useState<number>(1);
  const [skipCoverPage, setSkipCoverPage] = useState<boolean>(false);

  // Set of included 0-indexed page numbers
  const [includedPages, setIncludedPages] = useState<Set<number>>(new Set());

  // Pro Typography & Style
  const [fontFamily, setFontFamily] = useState<FontFamily>("helvetica");
  const [fontStyle, setFontStyle] = useState<FontStyle>("normal");
  const [fontSize, setFontSize] = useState<number>(11);
  const [color, setColor] = useState<string>("#334155");
  const [verticalMargin, setVerticalMargin] = useState<number>(28);
  const [horizontalMargin, setHorizontalMargin] = useState<number>(36);
  const [proStyle, setProStyle] = useState<ProStyleType>("plain");

  // Output result
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);

  // Tab view on side controls: 'layout' | 'typography' | 'pages-table'
  const [activeTab, setActiveTab] = useState<"layout" | "style" | "table">("layout");

  // Load and inspect PDF file
  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setPreviewPage(1);

    try {
      const { PDFDocument } = await import("pdf-lib");
      const buffer = await f.arrayBuffer();
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const count = doc.getPageCount();
      setTotalPages(count);

      if (count > 0) {
        const first = doc.getPages()[0];
        const { width, height } = first.getSize();
        setPageSize({ width, height });

        // Default: include all pages
        const all = new Set<number>();
        for (let i = 0; i < count; i++) all.add(i);
        setIncludedPages(all);
      }
    } catch {
      onError?.("Could not load PDF document metadata");
    }
  }, [onError]);

  // Adjust cover page skipping
  const handleToggleSkipCover = (skip: boolean) => {
    setSkipCoverPage(skip);
    setIncludedPages((prev) => {
      const next = new Set(prev);
      if (skip) {
        next.delete(0);
      } else {
        next.add(0);
      }
      return next;
    });
  };

  // Quick range helpers
  const handleSelectAllPages = () => {
    setSkipCoverPage(false);
    const all = new Set<number>();
    for (let i = 0; i < totalPages; i++) all.add(i);
    setIncludedPages(all);
  };

  const handleSelectSkipFirstAndLast = () => {
    setSkipCoverPage(true);
    const next = new Set<number>();
    for (let i = 1; i < totalPages - 1; i++) next.add(i);
    setIncludedPages(next);
  };

  const handleToggleSinglePage = (pageIndex: number) => {
    setIncludedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageIndex)) {
        next.delete(pageIndex);
        if (pageIndex === 0) setSkipCoverPage(true);
      } else {
        next.add(pageIndex);
        if (pageIndex === 0) setSkipCoverPage(false);
      }
      return next;
    });
  };

  // Compute total numbered pages count
  const totalNumberedCount = useMemo(() => {
    return includedPages.size;
  }, [includedPages]);

  // Compute text for any 0-based page index
  const getPageLabel = useCallback(
    (pageIndex: number): string | null => {
      if (!includedPages.has(pageIndex)) return null;

      // Count how many numbered pages are at or before this page
      let countBefore = 0;
      for (let i = 0; i <= pageIndex; i++) {
        if (includedPages.has(i)) countBefore++;
      }
      const currentNumber = startNumber + countBefore - 1;
      return formatPageString(currentNumber, totalNumberedCount, pageIndex + 1, format, customPattern);
    },
    [includedPages, startNumber, totalNumberedCount, format, customPattern]
  );

  // Render preview canvas using pdfjs-dist
  useEffect(() => {
    if (!file || totalPages === 0) return;
    let cancelled = false;

    const renderCanvasPage = async () => {
      setPreviewLoading(true);
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        const page = await pdf.getPage(previewPage);

        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Scale to fit preview container cleanly
        const baseViewport = page.getViewport({ scale: 1 });
        const targetWidth = 380 * previewScale;
        const scaleFactor = targetWidth / baseViewport.width;
        const viewport = page.getViewport({ scale: scaleFactor });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
        }
      } catch {
        // Fallback: clear canvas and let HTML skeleton preview display
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    };

    renderCanvasPage();

    return () => {
      cancelled = true;
    };
  }, [file, previewPage, totalPages, previewScale]);

  // Execute PDF numbering using pdf-lib
  const handleApplyPageNumbers = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);

    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const buffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });

      // Embed selected typography
      let font;
      if (fontFamily === "times") {
        font = await doc.embedFont(
          fontStyle === "bold"
            ? StandardFonts.TimesRomanBold
            : fontStyle === "italic"
            ? StandardFonts.TimesRomanItalic
            : StandardFonts.TimesRoman
        );
      } else if (fontFamily === "courier") {
        font = await doc.embedFont(
          fontStyle === "bold"
            ? StandardFonts.CourierBold
            : fontStyle === "italic"
            ? StandardFonts.CourierOblique
            : StandardFonts.Courier
        );
      } else {
        font = await doc.embedFont(
          fontStyle === "bold"
            ? StandardFonts.HelveticaBold
            : fontStyle === "italic"
            ? StandardFonts.HelveticaOblique
            : StandardFonts.Helvetica
        );
      }

      const pages = doc.getPages();
      const rgbColor = hexToRgb(color);

      for (let i = 0; i < pages.length; i++) {
        if (!includedPages.has(i)) continue;

        const page = pages[i];
        const { width, height } = page.getSize();
        const text = getPageLabel(i);
        if (!text) continue;

        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const textHeight = fontSize;

        let x = 0;
        let y = 0;

        switch (position) {
          case "top-left":
            x = horizontalMargin;
            y = height - verticalMargin - textHeight;
            break;
          case "top-center":
            x = (width - textWidth) / 2;
            y = height - verticalMargin - textHeight;
            break;
          case "top-right":
            x = width - textWidth - horizontalMargin;
            y = height - verticalMargin - textHeight;
            break;
          case "bottom-left":
            x = horizontalMargin;
            y = verticalMargin;
            break;
          case "bottom-center":
            x = (width - textWidth) / 2;
            y = verticalMargin;
            break;
          case "bottom-right":
            x = width - textWidth - horizontalMargin;
            y = verticalMargin;
            break;
        }

        // Draw pill badge if selected
        if (proStyle === "badge") {
          const padX = 7;
          const padY = 3.5;
          page.drawRectangle({
            x: x - padX,
            y: y - padY + 1,
            width: textWidth + padX * 2,
            height: textHeight + padY * 2,
            color: rgb(0.96, 0.97, 0.99),
            borderColor: rgb(0.82, 0.86, 0.92),
            borderWidth: 0.75,
          });
        }

        // Draw divider rule line if selected
        if (proStyle === "divider") {
          const isTop = position.startsWith("top");
          const lineY = isTop ? height - verticalMargin - textHeight - 7 : verticalMargin + textHeight + 7;
          page.drawLine({
            start: { x: horizontalMargin, y: lineY },
            end: { x: width - horizontalMargin, y: lineY },
            color: rgb(0.86, 0.89, 0.94),
            thickness: 0.75,
          });
        }

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(rgbColor.r, rgbColor.g, rgbColor.b),
        });
      }

      const bytes = await doc.save();
      const outputBlob = new Blob([bytes as any], { type: "application/pdf" });
      setResult(outputBlob);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to add page numbers to PDF");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  const currentPreviewText = getPageLabel(previewPage - 1);
  const isPreviewPageNumbered = includedPages.has(previewPage - 1);

  // Position descriptions for UI
  const POSITIONS: Array<{ id: NumberPosition; label: string; iconPos: string }> = [
    { id: "top-left", label: "Top Left", iconPos: "items-start justify-start" },
    { id: "top-center", label: "Top Center", iconPos: "items-start justify-center" },
    { id: "top-right", label: "Top Right", iconPos: "items-start justify-end" },
    { id: "bottom-left", label: "Bottom Left", iconPos: "items-end justify-start" },
    { id: "bottom-center", label: "Bottom Center", iconPos: "items-end justify-center" },
    { id: "bottom-right", label: "Bottom Right", iconPos: "items-end justify-end" },
  ];

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone
          accept=".pdf"
          onFilesSelected={handleFile}
          label="Drop your PDF document here"
          description="Add professional page numbers, headers, footers & custom ranges"
        />
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Top Document Summary Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-bg-surface border border-border-base shadow-xs">
            <div className="flex items-center gap-3.5 min-w-0">
              <span className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center font-extrabold text-xs shrink-0">
                PDF
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-text-primary truncate" title={file.name}>
                  {file.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-text-tertiary font-medium">
                  <span>{formatBytes(file.size)}</span>
                  <span>•</span>
                  <span>{totalPages} {totalPages === 1 ? "page" : "pages"}</span>
                  <span>•</span>
                  <span className="text-success font-semibold">{totalNumberedCount} to be numbered</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setFile(null);
                setResult(null);
                setTotalPages(0);
              }}
              className="btn-secondary px-3.5 py-1.5 rounded-xl text-xs font-bold text-text-secondary hover:text-danger self-start sm:self-auto cursor-pointer transition-colors"
            >
              Replace Document
            </button>
          </div>

          {/* 2-Column Studio: Left Preview & Table, Right Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ─── LEFT COLUMN: REAL-TIME LIVE PREVIEW & PAGE TABLE ─── */}
            <div className="lg:col-span-7 space-y-5">
              {/* Live Preview Card */}
              <div className="rounded-3xl bg-bg-surface border border-border-base shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border-base pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-accent bg-accent/10 px-2.5 py-0.5 rounded-full border border-accent/20">
                      Live Real-Time Preview
                    </span>
                    <span className="text-xs text-text-tertiary">
                      Page {previewPage} of {totalPages}
                    </span>
                  </div>

                  {/* Page Switcher */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={previewPage <= 1}
                      onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                      className="w-8 h-8 rounded-lg bg-bg-elevated border border-border-base flex items-center justify-center text-xs font-bold text-text-secondary hover:text-text-primary disabled:opacity-40 cursor-pointer"
                      title="Previous page"
                    >
                      ←
                    </button>
                    <span className="text-xs font-mono font-bold px-2 text-text-primary">
                      {previewPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={previewPage >= totalPages}
                      onClick={() => setPreviewPage((p) => Math.min(totalPages, p + 1))}
                      className="w-8 h-8 rounded-lg bg-bg-elevated border border-border-base flex items-center justify-center text-xs font-bold text-text-secondary hover:text-text-primary disabled:opacity-40 cursor-pointer"
                      title="Next page"
                    >
                      →
                    </button>
                  </div>
                </div>

                {/* Status indicator on the active preview page */}
                <div className="flex items-center justify-between text-xs px-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isPreviewPageNumbered ? "bg-success animate-pulse" : "bg-warning"
                      }`}
                    />
                    <span className="font-semibold text-text-secondary">
                      {isPreviewPageNumbered
                        ? `Numbered format: "${currentPreviewText}"`
                        : "Skipped (No number on this page)"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-text-tertiary">
                    <button
                      type="button"
                      onClick={() => setPreviewPage(1)}
                      className="hover:text-accent font-medium cursor-pointer"
                    >
                      First
                    </button>
                    <span>|</span>
                    <button
                      type="button"
                      onClick={() => setPreviewPage(totalPages)}
                      className="hover:text-accent font-medium cursor-pointer"
                    >
                      Last
                    </button>
                  </div>
                </div>

                {/* Document Canvas Sheet with Interactive Overlay */}
                <div className="relative min-h-[380px] bg-bg-elevated/70 border border-border-base rounded-2xl p-4 sm:p-6 flex items-center justify-center overflow-hidden">
                  {previewLoading && (
                    <div className="absolute inset-0 bg-bg-surface/60 backdrop-blur-xs flex items-center justify-center z-20">
                      <div className="flex items-center gap-2 text-xs font-bold text-accent">
                        <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                        Rendering page...
                      </div>
                    </div>
                  )}

                  {/* Sheet Container matching aspect ratio */}
                  <div
                    className="relative bg-white shadow-xl rounded-lg border border-border-strong/40 overflow-hidden transition-all duration-200 select-none"
                    style={{
                      width: "320px",
                      height: "440px",
                    }}
                  >
                    {/* Rendered Canvas from PDF */}
                    <canvas
                      ref={canvasRef}
                      className="w-full h-full object-contain pointer-events-none opacity-90"
                    />

                    {/* Interactive Clickable 6-Position Hotspots */}
                    <div className="absolute inset-0 p-3 grid grid-cols-3 grid-rows-2 gap-1 pointer-events-auto">
                      {POSITIONS.map((pos) => {
                        const isCurrentPos = position === pos.id;
                        return (
                          <div
                            key={pos.id}
                            onClick={() => setPosition(pos.id)}
                            className={`flex ${pos.iconPos} p-1 cursor-pointer group`}
                            title={`Click to place number at ${pos.label}`}
                          >
                            <span
                              className={`transition-all duration-150 rounded px-1.5 py-0.5 text-[9px] font-bold ${
                                isCurrentPos
                                  ? "bg-accent/15 text-accent ring-1 ring-accent opacity-100"
                                  : "opacity-0 group-hover:opacity-60 bg-text-tertiary/20 text-text-primary"
                              }`}
                            >
                              {pos.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Active Live Page Number Overlay */}
                    {isPreviewPageNumbered && currentPreviewText && (
                      <div
                        className="absolute pointer-events-none transition-all duration-200 flex items-center"
                        style={{
                          left:
                            position === "top-left" || position === "bottom-left"
                              ? `${Math.max(6, Math.min(25, (horizontalMargin / 595) * 100))}%`
                              : position === "top-center" || position === "bottom-center"
                              ? "50%"
                              : "auto",
                          right:
                            position === "top-right" || position === "bottom-right"
                              ? `${Math.max(6, Math.min(25, (horizontalMargin / 595) * 100))}%`
                              : "auto",
                          top: position.startsWith("top")
                            ? `${Math.max(4, Math.min(20, (verticalMargin / 842) * 100))}%`
                            : "auto",
                          bottom: position.startsWith("bottom")
                            ? `${Math.max(4, Math.min(20, (verticalMargin / 842) * 100))}%`
                            : "auto",
                          transform:
                            position === "top-center" || position === "bottom-center"
                              ? "translateX(-50%)"
                              : "none",
                        }}
                      >
                        {/* Pro Divider Line Mock */}
                        {proStyle === "divider" && (
                          <div
                            className="absolute left-[-200px] right-[-200px] h-[1px] bg-slate-300 pointer-events-none"
                            style={{
                              top: position.startsWith("top") ? "100%" : "auto",
                              bottom: position.startsWith("bottom") ? "100%" : "auto",
                              marginTop: position.startsWith("top") ? "4px" : "0",
                              marginBottom: position.startsWith("bottom") ? "4px" : "0",
                            }}
                          />
                        )}

                        <span
                          className={`inline-block px-1.5 py-0.5 rounded transition-all duration-150 ${
                            proStyle === "badge"
                              ? "bg-slate-100 border border-slate-300 shadow-xs"
                              : ""
                          }`}
                          style={{
                            color: color,
                            fontSize: `${Math.max(9, Math.min(18, fontSize * 0.95))}px`,
                            fontWeight: fontStyle === "bold" ? 700 : 400,
                            fontStyle: fontStyle === "italic" ? "italic" : "normal",
                            fontFamily:
                              fontFamily === "times"
                                ? "serif"
                                : fontFamily === "courier"
                                ? "monospace"
                                : "sans-serif",
                          }}
                        >
                          {currentPreviewText}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-text-tertiary pt-1">
                  <span>💡 Tip: Click directly on any corner or center of the preview to reposition.</span>
                  <span>Dimensions: {Math.round(pageSize.width)} × {Math.round(pageSize.height)} pt</span>
                </div>
              </div>

              {/* ─── ALL PAGES INTERACTIVE TABLE ("all table") ─── */}
              <div className="rounded-3xl bg-bg-surface border border-border-base shadow-sm p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-base pb-3">
                  <div>
                    <h3 className="heading-sm text-text-primary flex items-center gap-2">
                      <span>Pages Mapping Table</span>
                      <span className="text-[11px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                        {totalNumberedCount} of {totalPages} Selected
                      </span>
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Review and toggle individual page numbers across the entire document.
                    </p>
                  </div>

                  {/* Batch Selection Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleSelectAllPages}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-bg-elevated hover:bg-bg-hover text-text-secondary hover:text-text-primary border border-border-base cursor-pointer"
                    >
                      All Pages
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleSkipCover(true)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-bg-elevated hover:bg-bg-hover text-text-secondary hover:text-text-primary border border-border-base cursor-pointer"
                    >
                      Skip Cover (Page 1)
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectSkipFirstAndLast}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-bg-elevated hover:bg-bg-hover text-text-secondary hover:text-text-primary border border-border-base cursor-pointer"
                    >
                      Skip 1 & Last
                    </button>
                  </div>
                </div>

                {/* Table Content with scrollbar */}
                <div className="max-h-64 overflow-y-auto border border-border-base rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-bg-elevated border-b border-border-base text-text-tertiary uppercase text-[10px] font-bold sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-16 text-center">Include</th>
                        <th className="py-2.5 px-3">Page #</th>
                        <th className="py-2.5 px-3">Applied Number</th>
                        <th className="py-2.5 px-3 text-center">Position</th>
                        <th className="py-2.5 px-3 text-right">Preview</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-base">
                      {Array.from({ length: totalPages }, (_, idx) => {
                        const pageNum = idx + 1;
                        const isIncluded = includedPages.has(idx);
                        const label = getPageLabel(idx);
                        const isCurrentActivePreview = previewPage === pageNum;

                        return (
                          <tr
                            key={pageNum}
                            className={`transition-colors ${
                              isCurrentActivePreview
                                ? "bg-accent/10 font-medium"
                                : "hover:bg-bg-hover/60"
                            }`}
                          >
                            <td className="py-2 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={isIncluded}
                                onChange={() => handleToggleSinglePage(idx)}
                                className="w-4 h-4 rounded text-accent accent-accent cursor-pointer"
                              />
                            </td>
                            <td className="py-2 px-3 font-semibold text-text-primary">
                              Page {pageNum}
                              {pageNum === 1 && (
                                <span className="ml-1.5 text-[9px] uppercase font-bold text-text-tertiary bg-bg-elevated px-1.5 py-0.5 rounded">
                                  Cover
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              {isIncluded && label ? (
                                <span className="font-mono font-bold text-text-primary">
                                  {label}
                                </span>
                              ) : (
                                <span className="text-text-tertiary italic">
                                  — Skipped
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center text-text-secondary capitalize">
                              {position.replace("-", " ")}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => setPreviewPage(pageNum)}
                                className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                                  isCurrentActivePreview
                                    ? "bg-accent text-white"
                                    : "text-accent hover:underline"
                                }`}
                              >
                                {isCurrentActivePreview ? "Viewing" : "View"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ─── RIGHT COLUMN: PRO CONTROLS & STYLING ─── */}
            <div className="lg:col-span-5 space-y-5">
              {/* Controls Card */}
              <div className="rounded-3xl bg-bg-surface border border-border-base shadow-sm p-5 space-y-6">
                {/* Tabs switcher for Controls: Layout vs Typography */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-bg-elevated border border-border-base">
                  <button
                    type="button"
                    onClick={() => setActiveTab("layout")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === "layout"
                        ? "bg-bg-surface text-text-primary shadow-xs ring-1 ring-border-base"
                        : "text-text-tertiary hover:text-text-primary"
                    }`}
                  >
                    1. Position & Format
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("style")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === "style"
                        ? "bg-bg-surface text-text-primary shadow-xs ring-1 ring-border-base"
                        : "text-text-tertiary hover:text-text-primary"
                    }`}
                  >
                    2. Pro Style & Font
                  </button>
                </div>

                {/* ── TAB 1: POSITION & FORMAT ── */}
                {activeTab === "layout" && (
                  <div className="space-y-5 animate-fade-in">
                    {/* Position: 3x2 Grid */}
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <label className="text-xs font-extrabold uppercase tracking-wider text-text-secondary">
                          Page Number Position
                        </label>
                        <span className="text-[11px] font-semibold text-accent capitalize">
                          {position.replace("-", " ")}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {POSITIONS.map((pos) => {
                          const isSelected = position === pos.id;
                          return (
                            <button
                              key={pos.id}
                              type="button"
                              onClick={() => setPosition(pos.id)}
                              className={`p-2.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between h-16 cursor-pointer ${
                                isSelected
                                  ? "border-accent bg-accent/10 ring-2 ring-accent/20"
                                  : "border-border-base bg-bg-surface hover:border-accent/40 hover:bg-bg-hover"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-accent" : "bg-border-strong"}`} />
                                <span className="text-[9px] font-bold text-text-tertiary uppercase">
                                  {pos.id.startsWith("top") ? "Header" : "Footer"}
                                </span>
                              </div>
                              <span className={`text-[11.5px] font-bold leading-tight ${isSelected ? "text-accent" : "text-text-primary"}`}>
                                {pos.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Numbering Format Selector */}
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-text-secondary mb-2">
                        Numbering Format
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: "page-x-of-y", label: "Page 1 of 10" },
                          { id: "x-of-y", label: "1 of 10" },
                          { id: "simple", label: "1 (Number only)" },
                          { id: "page-x", label: "Page 1" },
                          { id: "dashes", label: "- 1 -" },
                          { id: "brackets", label: "[ 1 ]" },
                          { id: "roman-upper", label: "I, II, III (Roman)" },
                          { id: "custom", label: "Custom Format..." },
                        ].map((fmt) => (
                          <button
                            key={fmt.id}
                            type="button"
                            onClick={() => setFormat(fmt.id as NumberFormat)}
                            className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                              format === fmt.id
                                ? "border-accent bg-accent/10 text-accent ring-1 ring-accent/25"
                                : "border-border-base bg-bg-surface text-text-secondary hover:text-text-primary hover:border-accent/40"
                            }`}
                          >
                            {fmt.label}
                          </button>
                        ))}
                      </div>

                      {/* Custom Format Input if selected */}
                      {format === "custom" && (
                        <div className="mt-3 p-3 rounded-xl bg-bg-elevated border border-border-base space-y-1.5 animate-fade-in">
                          <label className="text-[11px] font-bold text-text-secondary">
                            Custom Template String
                          </label>
                          <input
                            type="text"
                            value={customPattern}
                            onChange={(e) => setCustomPattern(e.target.value)}
                            placeholder="e.g. Doc #{n} | Page {n} of {total}"
                            className="w-full px-3 py-1.5 rounded-lg bg-bg-surface border border-border-strong text-xs font-mono text-text-primary outline-none focus:border-accent"
                          />
                          <p className="text-[10px] text-text-tertiary">
                            Use tokens: <code className="text-accent">&#123;n&#125;</code> (number), <code className="text-accent">&#123;total&#125;</code> (total pages).
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Start Number & Cover Page */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-extrabold uppercase tracking-wider text-text-secondary mb-1.5">
                          Start Counting At
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="9999"
                          value={startNumber}
                          onChange={(e) => setStartNumber(Math.max(1, Number(e.target.value)))}
                          className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-base text-sm font-mono text-text-primary focus:border-accent outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold uppercase tracking-wider text-text-secondary mb-1.5">
                          Cover Page
                        </label>
                        <button
                          type="button"
                          onClick={() => handleToggleSkipCover(!skipCoverPage)}
                          className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                            skipCoverPage
                              ? "border-accent bg-accent/10 text-accent"
                              : "border-border-base bg-bg-elevated text-text-secondary"
                          }`}
                        >
                          <span>Skip Cover (Page 1)</span>
                          <span>{skipCoverPage ? "✓" : "—"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 2: PRO STYLES & TYPOGRAPHY ── */}
                {activeTab === "style" && (
                  <div className="space-y-5 animate-fade-in">
                    {/* Pro Decoration Styles */}
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-text-secondary mb-2">
                        Decoration Style
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "plain", label: "Clean Text" },
                          { id: "badge", label: "Pill Badge" },
                          { id: "divider", label: "Divider Line" },
                        ].map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setProStyle(st.id as ProStyleType)}
                            className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                              proStyle === st.id
                                ? "border-accent bg-accent/10 text-accent ring-1 ring-accent/20"
                                : "border-border-base bg-bg-surface text-text-secondary hover:text-text-primary"
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font Family & Style */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-extrabold uppercase tracking-wider text-text-secondary mb-1.5">
                          Font Family
                        </label>
                        <select
                          value={fontFamily}
                          onChange={(e) => setFontFamily(e.target.value as FontFamily)}
                          className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-base text-xs font-semibold text-text-primary outline-none focus:border-accent cursor-pointer"
                        >
                          <option value="helvetica">Helvetica (Sans)</option>
                          <option value="times">Times Roman (Serif)</option>
                          <option value="courier">Courier (Mono)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold uppercase tracking-wider text-text-secondary mb-1.5">
                          Font Weight
                        </label>
                        <select
                          value={fontStyle}
                          onChange={(e) => setFontStyle(e.target.value as FontStyle)}
                          className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-base text-xs font-semibold text-text-primary outline-none focus:border-accent cursor-pointer"
                        >
                          <option value="normal">Regular</option>
                          <option value="bold">Bold</option>
                          <option value="italic">Italic</option>
                        </select>
                      </div>
                    </div>

                    {/* Font Size with presets */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-extrabold uppercase tracking-wider text-text-secondary">
                          Font Size
                        </label>
                        <span className="font-mono text-xs font-bold text-accent">{fontSize} pt</span>
                      </div>
                      <input
                        type="range"
                        min="8"
                        max="24"
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-full accent-accent cursor-pointer"
                      />
                      <div className="flex items-center gap-1.5 mt-2">
                        {[9, 10, 11, 12, 14, 16].map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setFontSize(sz)}
                            className={`flex-1 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                              fontSize === sz
                                ? "bg-accent text-white border-accent"
                                : "bg-bg-elevated border-border-base text-text-secondary hover:text-text-primary"
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Text Color Picker & Swatches */}
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-text-secondary mb-2">
                        Text Color
                      </label>
                      <div className="flex items-center gap-2">
                        {PRESET_COLORS.map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => setColor(c.hex)}
                            className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                              color.toLowerCase() === c.hex.toLowerCase()
                                ? "scale-110 ring-2 ring-accent border-white"
                                : "border-border-strong hover:scale-105"
                            }`}
                            style={{ backgroundColor: c.hex }}
                            title={c.label}
                          />
                        ))}
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0 ml-auto"
                          title="Custom Color"
                        />
                      </div>
                    </div>

                    {/* Margins */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-text-secondary mb-1">
                          <span>Edge Margin (V)</span>
                          <span className="font-mono text-accent">{verticalMargin} pt</span>
                        </div>
                        <input
                          type="range"
                          min="15"
                          max="60"
                          value={verticalMargin}
                          onChange={(e) => setVerticalMargin(Number(e.target.value))}
                          className="w-full accent-accent cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-text-secondary mb-1">
                          <span>Side Margin (H)</span>
                          <span className="font-mono text-accent">{horizontalMargin} pt</span>
                        </div>
                        <input
                          type="range"
                          min="15"
                          max="70"
                          value={horizontalMargin}
                          onChange={(e) => setHorizontalMargin(Number(e.target.value))}
                          className="w-full accent-accent cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Primary Action Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleApplyPageNumbers}
                    disabled={processing || totalNumberedCount === 0}
                    className="btn-primary w-full py-3.5 rounded-2xl text-sm font-bold shadow-md hover:shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {processing ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Applying Page Numbers to {totalNumberedCount} Pages...</span>
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="12" y1="18" x2="12" y2="12" />
                          <line x1="9" y1="15" x2="15" y2="15" />
                        </svg>
                        <span>Add Page Numbers to PDF</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Success Result Card */}
              {result && (
                <div className="p-5 rounded-3xl bg-success/10 border border-success/30 shadow-sm text-center space-y-3 animate-fade-in-up">
                  <div className="w-12 h-12 rounded-full bg-success/20 text-success flex items-center justify-center mx-auto">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-text-primary">
                      Page Numbers Added Successfully!
                    </h4>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {totalNumberedCount} of {totalPages} pages numbered with {position.replace("-", " ")} placement.
                    </p>
                  </div>
                  <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-2">
                    <DownloadButton
                      blob={result}
                      filename={`numbered-${file.name}`}
                      label="Download Numbered PDF"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
