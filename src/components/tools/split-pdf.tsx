"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { StepFlow, type StepOutput } from "@/components/step-flow";
import type { ToolUIProps } from "@/components/tool-registry";
import { PdfDrawerPreview } from "@/components/pdf-drawer-preview";

/* ── Page thumbnail tile ── */
function PageThumbnailCard({
  file,
  pageNum,
  isSelected,
  onToggle,
  onOpenPreview,
}: {
  file: File;
  pageNum: number;
  isSelected: boolean;
  onToggle: (page: number) => void;
  onOpenPreview: (page: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const renderPage = async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        if (isCancelled) return;
        const page = await pdf.getPage(pageNum);
        if (isCancelled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const viewport = page.getViewport({ scale: 0.32 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        await (page.render as any)({ canvasContext: ctx, viewport, canvas }).promise;
        if (!isCancelled) setRendered(true);
      } catch {
        // Fallback to stylized page placeholder
      }
    };
    renderPage();
    return () => {
      isCancelled = true;
    };
  }, [file, pageNum]);

  return (
    <div
      onClick={() => onToggle(pageNum)}
      className={`group relative flex flex-col items-center p-2 rounded-xl border-2 transition-all cursor-pointer ${
        isSelected
          ? "border-accent bg-accent/[0.04] shadow-sm"
          : "border-border-base bg-bg-elevated hover:border-border-strong hover:bg-bg-surface"
      }`}
    >
      {/* Page preview canvas */}
      <div className="relative w-full aspect-[3/4] bg-bg-surface rounded-lg overflow-hidden flex items-center justify-center border border-border-base/60">
        <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
        {!rendered && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-text-tertiary">
            <span className="text-[11px] font-mono font-semibold">#{pageNum}</span>
          </div>
        )}

        {/* Selection badge */}
        <span
          className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold transition-transform ${
            isSelected
              ? "bg-accent text-white scale-100"
              : "bg-black/40 text-white/80 group-hover:bg-accent group-hover:text-white"
          }`}
        >
          {isSelected ? "✓" : pageNum}
        </span>

        {/* Hover preview button that opens right drawer */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenPreview(pageNum);
          }}
          className="absolute bottom-1.5 right-1.5 px-2 py-1 rounded-md bg-black/75 hover:bg-black text-white text-[10.5px] font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
          title="Preview this page in right drawer"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>Zoom</span>
        </button>
      </div>

      {/* Page label */}
      <div className="flex items-center justify-between w-full mt-2 px-1">
        <span className="text-[11.5px] font-semibold text-text-secondary">
          Page {pageNum}
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? "text-accent" : "text-text-tertiary"}`}>
          {isSelected ? "Split" : "Skip"}
        </span>
      </div>
    </div>
  );
}

export default function SplitPdfTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [ranges, setRanges] = useState("1");
  const [outputs, setOutputs] = useState<StepOutput[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);

  // Drawer preview state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPage, setDrawerPage] = useState(1);
  const [showAllThumbs, setShowAllThumbs] = useState(false);

  const handleFilesChanged = useCallback(async (next: File[]) => {
    setFiles(next);
    setOutputs([]);
    if (next.length > 0) {
      try {
        const { loadPdf } = await import("@/lib/engines/pdf");
        const doc = await loadPdf(next[0]);
        const count = doc.getPageCount();
        setPageCount(count);
        // Default range to first page or all pages
        if (count > 1) {
          setRanges(`1-${Math.min(count, 3)}`);
        } else {
          setRanges("1");
        }
      } catch {
        setPageCount(0);
      }
    } else {
      setPageCount(0);
    }
  }, []);

  const parseRanges = (input: string): Array<{ start: number; end: number }> => {
    const parsed: Array<{ start: number; end: number }> = [];
    const parts = input.split(",").map((s) => s.trim());
    for (const part of parts) {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map(Number);
        if (!isNaN(start) && !isNaN(end) && start <= end && start >= 1) {
          parsed.push({ start, end: pageCount > 0 ? Math.min(end, pageCount) : end });
        }
      } else {
        const num = parseInt(part, 10);
        if (!isNaN(num) && num >= 1 && (pageCount === 0 || num <= pageCount)) {
          parsed.push({ start: num, end: num });
        }
      }
    }
    return parsed;
  };

  // Check if a page number is currently included in ranges
  const isPageIncluded = (pageNum: number): boolean => {
    const parsed = parseRanges(ranges);
    return parsed.some((r) => pageNum >= r.start && pageNum <= r.end);
  };

  // Toggle page in range
  const togglePage = (pageNum: number) => {
    const included = isPageIncluded(pageNum);
    const parsed = parseRanges(ranges);

    // Expand ranges to individual pages
    const pageSet = new Set<number>();
    for (const r of parsed) {
      for (let p = r.start; p <= r.end; p++) {
        pageSet.add(p);
      }
    }

    if (included) {
      pageSet.delete(pageNum);
    } else {
      pageSet.add(pageNum);
    }

    const sortedPages = Array.from(pageSet).sort((a, b) => a - b);
    if (sortedPages.length === 0) {
      setRanges("");
      return;
    }

    // Compress consecutive pages into ranges (e.g. 1, 2, 3 -> 1-3)
    const compressed: string[] = [];
    let start = sortedPages[0];
    let end = sortedPages[0];

    for (let i = 1; i < sortedPages.length; i++) {
      if (sortedPages[i] === end + 1) {
        end = sortedPages[i];
      } else {
        compressed.push(start === end ? `${start}` : `${start}-${end}`);
        start = sortedPages[i];
        end = sortedPages[i];
      }
    }
    compressed.push(start === end ? `${start}` : `${start}-${end}`);
    setRanges(compressed.join(", "));
  };

  const handleSplit = useCallback(async () => {
    if (!files.length) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { splitPdf, savePdf } = await import("@/lib/engines/pdf");
      const parsed = parseRanges(ranges);
      if (parsed.length === 0) {
        throw new Error("Please specify at least one valid page range (e.g. 1-3, 5).");
      }
      const docs = await splitPdf(files[0], parsed);
      const res: StepOutput[] = await Promise.all(
        docs.map(async (doc, i) => {
          const r = parsed[i];
          const rangeLabel = r ? (r.start === r.end ? `page-${r.start}` : `pages-${r.start}-${r.end}`) : `part-${i + 1}`;
          return {
            name: `${files[0].name.replace(/\.pdf$/i, "")}-${rangeLabel}.pdf`,
            blob: await savePdf(doc),
          };
        })
      );
      setOutputs(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to split PDF";
      setError(msg);
      onError?.(msg);
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  }, [files, ranges, onProcessing, onError]);

  const handleDownloadAll = useCallback(async () => {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    for (const o of outputs) zip.file(o.name, o.blob);
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${files[0]?.name.replace(/\.pdf$/i, "") || "split"}-pages.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }, [outputs, files]);

  // Max thumbnails shown before requiring "show more"
  const MAX_THUMBS = 24;
  const visibleCount = showAllThumbs || pageCount <= MAX_THUMBS ? pageCount : MAX_THUMBS;

  return (
    <>
      <StepFlow
        accept=".pdf"
        maxFiles={1}
        hint="Single PDF document"
        actionLabel="Split PDF"
        processingLabel="Splitting PDF..."
        outputs={outputs}
        canRun={files.length > 0 && parseRanges(ranges).length > 0}
        processing={processing}
        fileCount={files.length}
        onFilesChanged={handleFilesChanged}
        onResetFilesOnly={() => {
          setOutputs([]);
          setPageCount(0);
        }}
        onRun={handleSplit}
        onReset={() => {
          setFiles([]);
          setOutputs([]);
          setError(null);
          setPageCount(0);
        }}
        onDownloadAll={handleDownloadAll}
        error={error}
        onDismissError={() => setError(null)}
        renderOperation={() => (
          <div className="space-y-4">
            {/* Top drawer preview callout */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-accent/[0.06] border border-accent/20">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </span>
                <div>
                  <p className="text-[13px] font-bold text-text-primary">
                    Document has {pageCount} page{pageCount !== 1 ? "s" : ""}
                  </p>
                  <p className="text-[11.5px] text-text-secondary">
                    Inspect high-res pages and zoom before splitting
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDrawerPage(1);
                  setDrawerOpen(true);
                }}
                className="btn-primary py-2 px-4 text-[12.5px] shrink-0 flex items-center justify-center gap-1.5 shadow-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span>Preview in Right Drawer</span>
              </button>
            </div>

            {/* Quick preset chips */}
            <div>
              <label className="block text-[12px] font-semibold text-text-secondary mb-1.5">
                Quick split presets:
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const all = Array.from({ length: pageCount }, (_, i) => i + 1).join(", ");
                    setRanges(all);
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11.5px] font-semibold bg-bg-elevated border border-border-base hover:border-accent hover:text-accent transition-colors"
                >
                  All pages individually
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const odds = Array.from({ length: pageCount }, (_, i) => i + 1)
                      .filter((n) => n % 2 !== 0)
                      .join(", ");
                    setRanges(odds);
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11.5px] font-semibold bg-bg-elevated border border-border-base hover:border-accent hover:text-accent transition-colors"
                >
                  Odd pages only
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const evens = Array.from({ length: pageCount }, (_, i) => i + 1)
                      .filter((n) => n % 2 === 0)
                      .join(", ");
                    setRanges(evens);
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11.5px] font-semibold bg-bg-elevated border border-border-base hover:border-accent hover:text-accent transition-colors"
                >
                  Even pages only
                </button>
                {pageCount > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const mid = Math.ceil(pageCount / 2);
                      setRanges(`1-${mid}, ${mid + 1}-${pageCount}`);
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11.5px] font-semibold bg-bg-elevated border border-border-base hover:border-accent hover:text-accent transition-colors"
                  >
                    Split in two halves
                  </button>
                )}
              </div>
            </div>

            {/* Range input */}
            <div className="space-y-1.5">
              <label className="block text-[12.5px] font-semibold text-text-secondary">
                Page ranges to split (comma-separated)
              </label>
              <input
                type="text"
                value={ranges}
                onChange={(e) => setRanges(e.target.value)}
                placeholder="e.g. 1-3, 5, 8-10"
                className="w-full px-3.5 py-2.5 rounded-xl bg-bg-input border border-border-strong text-text-primary text-sm font-mono focus:border-accent focus:outline-none transition-colors"
              />
              <p className="text-[11px] text-text-tertiary">
                Enter ranges like <code className="text-accent font-semibold">1-3</code>, single pages like <code className="text-accent font-semibold">5</code>, or click thumbnails below to select/skip.
              </p>
            </div>

            {/* Visual thumbnail grid */}
            {pageCount > 0 && files[0] && (
              <div className="space-y-2 pt-2 border-t border-border-base">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-text-secondary">
                    Click pages to select/unselect ({parseRanges(ranges).length} ranges configured)
                  </span>
                  {pageCount > MAX_THUMBS && (
                    <button
                      type="button"
                      onClick={() => setShowAllThumbs(!showAllThumbs)}
                      className="text-[11.5px] font-semibold text-accent hover:underline"
                    >
                      {showAllThumbs ? "Show fewer" : `Show all ${pageCount} pages`}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[360px] overflow-y-auto p-1 rounded-xl bg-bg-surface/50 border border-border-base/70">
                  {Array.from({ length: visibleCount }, (_, i) => i + 1).map((num) => (
                    <PageThumbnailCard
                      key={num}
                      file={files[0]}
                      pageNum={num}
                      isSelected={isPageIncluded(num)}
                      onToggle={togglePage}
                      onOpenPreview={(p) => {
                        setDrawerPage(p);
                        setDrawerOpen(true);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      />

      {/* Slide-over Right Drawer Preview for uploaded PDF */}
      <PdfDrawerPreview
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        fileOrBlob={files[0] ?? null}
        title={files[0]?.name ? `Preview: ${files[0].name}` : "PDF Document Preview"}
        initialPage={drawerPage}
      />
    </>
  );
}
