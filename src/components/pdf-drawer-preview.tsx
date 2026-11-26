"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

interface PdfDrawerPreviewProps {
  open: boolean;
  onClose: () => void;
  fileOrBlob: File | Blob | null;
  title?: string;
  initialPage?: number;
  filesList?: Array<{ name: string; size?: number; type?: string }>;
  currentIndex?: number;
  onSelectIndex?: (index: number) => void;
}

export function PdfDrawerPreview({
  open,
  onClose,
  fileOrBlob,
  title = "File Preview",
  initialPage = 1,
  filesList,
  currentIndex,
  onSelectIndex,
}: PdfDrawerPreviewProps) {
  const [mounted, setMounted] = useState(false);
  const [isPdf, setIsPdf] = useState(false);
  const [isImage, setIsImage] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pages, setPages] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageInput, setPageInput] = useState(String(initialPage));
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState<number>(1);
  const [fitScale, setFitScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string>("");

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  // Jump to specific page
  const scrollToPage = useCallback((pageNum: number) => {
    const clamped = Math.max(1, Math.min(pageNum, totalPages || 1));
    setCurrentPage(clamped);
    const el = document.getElementById(`drawer-page-${clamped}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [totalPages]);

  // Keyboard shortcuts: Esc, Left/Right page nav, +/- zoom
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        if (e.key === "Escape") target.blur();
        return;
      }
      if (e.key === "Escape") onClose();
      else if (isPdf && totalPages > 1 && (e.key === "ArrowRight" || e.key === "PageDown")) {
        e.preventDefault();
        scrollToPage(currentPage + 1);
      } else if (isPdf && totalPages > 1 && (e.key === "ArrowLeft" || e.key === "PageUp")) {
        e.preventDefault();
        scrollToPage(currentPage - 1);
      } else if (e.key === "=" || e.key === "+") {
        setScale((s) => Math.min(3.0, +(s + 0.2).toFixed(2)));
      } else if (e.key === "-") {
        setScale((s) => Math.max(0.35, +(s - 0.2).toFixed(2)));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, isPdf, totalPages, currentPage, scrollToPage]);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Determine file type and load info
  useEffect(() => {
    if (!open || !fileOrBlob) {
      setPdfDoc(null);
      setPages([]);
      return;
    }

    let isMounted = true;
    setRotation(0);
    const sizeKb = Math.round(fileOrBlob.size / 1024);
    setFileSize(sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`);

    const type = fileOrBlob.type.toLowerCase();
    const name = (title || (fileOrBlob instanceof File ? fileOrBlob.name : "")).toLowerCase();
    const isPdfType = type === "application/pdf" || name.endsWith(".pdf");
    const isImgType =
      type.startsWith("image/") || /\.(png|jpe?g|webp|svg|gif|bmp|ico|avif)$/i.test(name);

    setIsPdf(isPdfType);
    setIsImage(isImgType);

    if (isPdfType) {
      setLoading(true);
      setError(null);
      const loadPdf = async () => {
        try {
          const pdfjsLib = await import("pdfjs-dist");
          pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

          const buffer = await fileOrBlob.arrayBuffer();
          const doc = await pdfjsLib.getDocument({ data: buffer }).promise;

          if (!isMounted) return;

          // Compute fit-to-width scale from page 1 and drawer width
          let computedFit = 0.85;
          try {
            const firstPage = await doc.getPage(1);
            const baseViewport = firstPage.getViewport({ scale: 1 });
            const containerWidth = scrollContainerRef.current?.clientWidth
              ? scrollContainerRef.current.clientWidth - 48
              : Math.min(window.innerWidth - 48, 660);
            if (baseViewport.width > 0 && containerWidth > 0) {
              computedFit = Math.min(1.35, Math.max(0.45, +(containerWidth / baseViewport.width).toFixed(2)));
            }
          } catch {
            // Keep default
          }

          if (!isMounted) return;
          setPdfDoc(doc);
          setTotalPages(doc.numPages);
          setPages(Array.from({ length: doc.numPages }, (_, i) => i + 1));
          setCurrentPage(Math.min(initialPage, doc.numPages));
          setFitScale(computedFit);
          setScale(computedFit);
          setLoading(false);

          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
          }
        } catch (err) {
          if (!isMounted) return;
          setError(err instanceof Error ? err.message : "Failed to load PDF preview");
          setLoading(false);
        }
      };
      loadPdf();
    } else {
      setPdfDoc(null);
      setTotalPages(0);
      setPages([]);
      setFitScale(1.0);
      setScale(1.0);
      setLoading(false);
      setError(null);
    }

    return () => {
      isMounted = false;
    };
  }, [open, fileOrBlob, title, initialPage]);

  // Zoom & Rotate handlers
  const handleZoomIn = () => setScale((s) => Math.min(3.0, +(s + 0.2).toFixed(2)));
  const handleZoomOut = () => setScale((s) => Math.max(0.35, +(s - 0.2).toFixed(2)));
  const handleZoomReset = () => setScale(1.0);
  const handleZoomFit = () => setScale(isPdf ? fitScale : 1.0);
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(pageInput, 10);
    if (!Number.isNaN(num)) {
      scrollToPage(num);
    } else {
      setPageInput(String(currentPage));
    }
  };

  if (!mounted || !open || !fileOrBlob) return null;

  const drawerContent = (
    <div className="fixed inset-0 z-[100] overflow-hidden select-none">
      {/* Backdrop scrim */}
      <div
        className="fixed inset-0 bg-black/55 dark:bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Right Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`fixed inset-y-0 right-0 z-[101] w-full ${
          showThumbnails && isPdf && totalPages > 1
            ? "sm:w-[640px] md:w-[820px]"
            : "sm:w-[580px] md:w-[720px]"
        } bg-bg-surface border-l border-border-base shadow-[-12px_0_48px_rgba(0,0,0,0.32)] flex flex-col animate-slide-left transition-[width] duration-200`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between gap-2 px-3.5 sm:px-5 py-3 bg-bg-surface/95 backdrop-blur-xl border-b border-border-base shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {isPdf && totalPages > 1 && (
              <button
                type="button"
                onClick={() => setShowThumbnails((v) => !v)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors shrink-0 cursor-pointer ${
                  showThumbnails
                    ? "bg-accent text-text-on-accent border-accent"
                    : "bg-bg-elevated hover:bg-bg-hover text-text-secondary border-border-base"
                }`}
                title="Toggle page thumbnails"
                aria-label="Toggle page thumbnails"
                aria-pressed={showThumbnails}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </button>
            )}
            <div className="min-w-0">
              <h3 className="text-[13.5px] sm:text-[14.5px] font-semibold text-text-primary truncate">
                {title}
              </h3>
              <p className="text-[11px] sm:text-[11.5px] text-text-tertiary">
                {isPdf &&
                  (totalPages > 0
                    ? `${totalPages} page${totalPages !== 1 ? "s" : ""} · ${fileSize}`
                    : "Loading PDF...")}
                {isImage && `Image file · ${fileSize}`}
                {!isPdf && !isImage && fileSize}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Zoom controls */}
            <div className="flex items-center rounded-lg bg-bg-input border border-border-base p-0.5">
              <button
                type="button"
                onClick={handleZoomOut}
                className="w-6.5 h-6.5 rounded flex items-center justify-center text-text-secondary hover:text-text-primary text-xs font-bold transition-colors cursor-pointer"
                title="Zoom out (-)"
                aria-label="Zoom out"
              >
                −
              </button>
              <button
                type="button"
                onClick={handleZoomReset}
                className="text-[10.5px] font-mono px-1.5 text-text-secondary hover:text-accent tabular-nums transition-colors font-semibold hidden xs:inline cursor-pointer"
                title="Reset zoom to 100%"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                className="w-6.5 h-6.5 rounded flex items-center justify-center text-text-secondary hover:text-text-primary text-xs font-bold transition-colors cursor-pointer"
                title="Zoom in (+)"
                aria-label="Zoom in"
              >
                +
              </button>
            </div>

            {/* Quick Fit Width Button */}
            <button
              type="button"
              onClick={handleZoomFit}
              className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-bg-elevated hover:bg-bg-hover text-text-secondary border border-border-base transition-colors hidden sm:inline-flex cursor-pointer"
              title="Fit to drawer width"
            >
              Fit
            </button>

            {/* Rotate 90 deg */}
            {isPdf && totalPages > 0 && (
              <button
                type="button"
                onClick={handleRotate}
                className="w-7.5 h-7.5 rounded-lg hidden sm:flex items-center justify-center bg-bg-elevated hover:bg-bg-hover text-text-secondary border border-border-base transition-colors cursor-pointer"
                title="Rotate view 90°"
                aria-label="Rotate view 90 degrees"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                </svg>
              </button>
            )}

            {/* Page navigation + jump input for PDF */}
            {isPdf && totalPages > 1 && (
              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => scrollToPage(currentPage - 1)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-bg-elevated hover:bg-bg-hover disabled:opacity-30 border border-border-base text-text-secondary transition-colors cursor-pointer"
                  aria-label="Previous page"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value.replace(/[^0-9]/g, ""))}
                    onBlur={handlePageInputSubmit}
                    aria-label="Jump to page number"
                    className="w-9 h-7 text-center font-mono text-[11px] text-text-primary bg-bg-input border border-border-base rounded-md focus:outline-none focus:border-accent tabular-nums"
                  />
                  <span className="font-mono text-[11px] text-text-tertiary tabular-nums">
                    /{totalPages}
                  </span>
                </form>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => scrollToPage(currentPage + 1)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-bg-elevated hover:bg-bg-hover disabled:opacity-30 border border-border-base text-text-secondary transition-colors cursor-pointer"
                  aria-label="Next page"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            )}

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="w-7.5 h-7.5 rounded-lg flex items-center justify-center bg-bg-elevated hover:bg-danger/10 hover:text-danger text-text-secondary border border-border-base transition-colors shrink-0 cursor-pointer"
              aria-label="Close preview"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Multi-file switcher if a list of files is provided */}
        {filesList && filesList.length > 1 && typeof currentIndex === "number" && onSelectIndex && (
          <div className="flex items-center justify-between px-4 py-2 bg-bg-warm border-b border-border-base text-xs shrink-0">
            <button
              type="button"
              disabled={currentIndex <= 0}
              onClick={() => onSelectIndex(currentIndex - 1)}
              className="flex items-center gap-1 font-semibold text-text-secondary hover:text-accent disabled:opacity-30 disabled:hover:text-text-secondary transition-colors cursor-pointer"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>Prev file</span>
            </button>

            <div className="flex items-center gap-2 font-medium text-text-tertiary min-w-0">
              <span className="font-bold text-text-primary px-2 py-0.5 rounded-md bg-bg-surface border border-border-base text-[11px] shrink-0">
                File {currentIndex + 1} / {filesList.length}
              </span>
              <span className="truncate max-w-[140px] sm:max-w-[260px] text-text-secondary text-[11.5px] font-semibold">
                {filesList[currentIndex]?.name}
              </span>
            </div>

            <button
              type="button"
              disabled={currentIndex >= filesList.length - 1}
              onClick={() => onSelectIndex(currentIndex + 1)}
              className="flex items-center gap-1 font-semibold text-text-secondary hover:text-accent disabled:opacity-30 disabled:hover:text-text-secondary transition-colors cursor-pointer"
            >
              <span>Next file</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}

        {/* Drawer Body (with optional Thumbnail Rail) */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {showThumbnails && !loading && !error && isPdf && pdfDoc && totalPages > 1 && (
            <aside className="w-28 sm:w-32 border-r border-border-base bg-bg-warm/80 overflow-y-auto p-2.5 space-y-2.5 shrink-0">
              {pages.map((pageNum) => (
                <button
                  key={`thumb-${pageNum}`}
                  type="button"
                  onClick={() => scrollToPage(pageNum)}
                  className={`w-full rounded-lg p-1.5 border text-center transition-all cursor-pointer ${
                    currentPage === pageNum
                      ? "border-accent bg-accent-subtle ring-1 ring-accent"
                      : "border-border-base bg-bg-surface hover:border-border-strong"
                  }`}
                >
                  <ThumbnailCanvas pdfDoc={pdfDoc} pageNum={pageNum} />
                  <span className="mt-1 block text-[10px] font-mono font-semibold text-text-secondary">
                    {pageNum}
                  </span>
                </button>
              ))}
            </aside>
          )}

          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-auto p-4 sm:p-6 bg-bg-elevated/45 flex flex-col items-center"
          >
            {loading && (
              <div className="flex flex-col items-center justify-center py-24 text-center my-auto">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin-slow mb-3" />
                <p className="text-[12.5px] font-medium text-text-tertiary">
                  Loading preview...
                </p>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-center my-auto">
                <p className="text-[13px] font-medium">{error}</p>
              </div>
            )}

            {/* PDF Pages Preview — lazy/virtualized so PDFs with hundreds of pages stay fast & never hit canvas limits */}
            {!loading && !error && isPdf && pdfDoc && (
              <div className="w-full flex flex-col items-center gap-5 py-1">
                {pages.map((pageNum) => (
                  <DrawerPageCanvas
                    key={`${title}-${pageNum}`}
                    pdfDoc={pdfDoc}
                    pageNum={pageNum}
                    totalPages={totalPages}
                    scale={scale}
                    rotation={rotation}
                    scrollRootRef={scrollContainerRef}
                    onVisible={setCurrentPage}
                  />
                ))}
              </div>
            )}

            {/* Image Preview */}
            {!loading && !error && isImage && (
              <DrawerImagePreview fileOrBlob={fileOrBlob} scale={scale} title={title} />
            )}

            {/* Fallback for other file types */}
            {!loading && !error && !isPdf && !isImage && (
              <div className="flex flex-col items-center justify-center py-20 text-center my-auto">
                <span className="w-16 h-16 rounded-2xl bg-bg-surface flex items-center justify-center text-accent mb-3 border border-border-base">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </span>
                <p className="text-sm font-bold text-text-primary">{title}</p>
                <p className="text-xs text-text-tertiary mt-1">Ready to process or download</p>
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="px-4 py-3 bg-bg-surface border-t border-border-base flex items-center justify-between text-xs text-text-tertiary shrink-0">
          <span className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
            Processed 100% locally on your device
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary px-4 py-1.5 text-xs font-semibold cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}

/* ── Lightweight Thumbnail Canvas ── */
function ThumbnailCanvas({ pdfDoc, pageNum }: { pdfDoc: any; pageNum: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    let active = true;
    let renderTask: any = null;

    const renderThumb = async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 0.22 });
        if (!active || !ref.current) return;
        const canvas = ref.current;
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext("2d")!;
        renderTask = (page.render as any)({ canvasContext: ctx, viewport, canvas });
        await renderTask.promise;
        if (active) setRendered(true);
      } catch {
        // Skip
      }
    };
    renderThumb();
    return () => {
      active = false;
      try {
        renderTask?.cancel?.();
      } catch {
        // Ignore
      }
    };
  }, [pdfDoc, pageNum]);

  return (
    <div className="w-full aspect-[3/4] rounded bg-white border border-border-base overflow-hidden flex items-center justify-center">
      <canvas
        ref={ref}
        className={`max-w-full max-h-full object-contain transition-opacity ${
          rendered ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

/* ── PDF Page Canvas (viewport-aware lazy rendering for unlimited pages) ── */
function DrawerPageCanvas({
  pdfDoc,
  pageNum,
  totalPages,
  scale,
  rotation,
  scrollRootRef,
  onVisible,
}: {
  pdfDoc: any;
  pageNum: number;
  totalPages: number;
  scale: number;
  rotation: number;
  scrollRootRef: React.RefObject<HTMLDivElement | null>;
  onVisible: (pageNum: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shouldRender, setShouldRender] = useState(pageNum <= 3);
  const [rendered, setRendered] = useState(false);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>(() => ({
    width: Math.round(595 * scale),
    height: Math.round(842 * scale),
  }));

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShouldRender(true);
            if (entry.intersectionRatio >= 0.35) {
              onVisible(pageNum);
            }
          } else if (totalPages > 24) {
            setShouldRender(false);
            setRendered(false);
          }
        }
      },
      {
        root: scrollRootRef.current,
        rootMargin: "500px 0px",
        threshold: [0, 0.35],
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [pageNum, totalPages, scrollRootRef, onVisible]);

  useEffect(() => {
    if (!shouldRender) return;
    let active = true;
    let renderTask: any = null;

    const render = async () => {
      try {
        if (!pdfDoc) return;
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale, rotation });
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        if (!active || !canvasRef.current) return;
        const canvas = canvasRef.current;

        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        setPageSize({
          width: Math.floor(viewport.width),
          height: Math.floor(viewport.height),
        });

        const ctx = canvas.getContext("2d")!;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        renderTask = (page.render as any)({ canvasContext: ctx, viewport, canvas });
        await renderTask.promise;
        if (active) setRendered(true);
      } catch {
        // Cancelled or skipped
      }
    };

    render();
    return () => {
      active = false;
      try {
        renderTask?.cancel?.();
      } catch {
        // Ignore cancel errors
      }
    };
  }, [pdfDoc, pageNum, scale, rotation, shouldRender]);

  return (
    <div
      id={`drawer-page-${pageNum}`}
      ref={containerRef}
      className="relative flex flex-col items-center shadow-[0_4px_20px_rgba(0,0,0,0.08)] rounded-xl border border-border-base bg-white overflow-hidden shrink-0 transition-all"
      style={{
        width: `${pageSize.width}px`,
        minHeight: `${pageSize.height}px`,
        maxWidth: "none",
      }}
    >
      {shouldRender ? (
        <canvas
          ref={canvasRef}
          className={`transition-opacity duration-150 ${rendered ? "opacity-100" : "opacity-0"}`}
          style={{ display: "block" }}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center bg-bg-surface/40 text-text-tertiary text-xs font-medium"
          style={{ height: `${pageSize.height}px` }}
        >
          Page {pageNum}
        </div>
      )}

      {/* Clean page number pill */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/75 backdrop-blur-sm text-white text-[10.5px] font-mono font-semibold shadow-sm pointer-events-none select-none">
        Page {pageNum} of {totalPages}
      </div>
    </div>
  );
}

/* ── Image Preview ── */
function DrawerImagePreview({
  fileOrBlob,
  scale,
  title,
}: {
  fileOrBlob: File | Blob;
  scale: number;
  title: string;
}) {
  const [url, setUrl] = useState<string>("");
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(fileOrBlob);
    setUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [fileOrBlob]);

  return (
    <div className="flex flex-col items-center justify-center p-2 my-auto">
      <div
        className="relative flex flex-col items-center rounded-xl shadow-lg border border-border-base overflow-hidden bg-white dark:bg-zinc-950 transition-all shrink-0"
        style={{
          width: dimensions ? `${Math.round(dimensions.width * scale)}px` : "auto",
          maxWidth: "none",
        }}
      >
        <img
          src={url}
          alt={title}
          className="block w-full h-auto select-none pointer-events-none"
          onLoad={(e) => {
            const img = e.currentTarget;
            setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
          }}
        />
        {dimensions && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/75 backdrop-blur-sm text-white text-[11px] font-mono font-medium shadow-sm pointer-events-none select-none">
            {dimensions.width} × {dimensions.height} px
          </div>
        )}
      </div>
    </div>
  );
}
