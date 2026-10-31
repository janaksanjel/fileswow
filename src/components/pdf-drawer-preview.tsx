"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface PdfDrawerPreviewProps {
  open: boolean;
  onClose: () => void;
  fileOrBlob: File | Blob | null;
  title?: string;
  initialPage?: number;
  filesList?: Array<{ name: string; size?: number; type?: string } | any>;
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
  const [isPdf, setIsPdf] = useState(false);
  const [isImage, setIsImage] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pages, setPages] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(0.85);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string>("");

  // Esc closes drawer
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

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
    const sizeKb = Math.round(fileOrBlob.size / 1024);
    setFileSize(sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`);

    const type = fileOrBlob.type.toLowerCase();
    const name = (title || (fileOrBlob instanceof File ? fileOrBlob.name : "")).toLowerCase();
    const isPdfType = type === "application/pdf" || name.endsWith(".pdf");
    const isImgType = type.startsWith("image/") || /\.(png|jpe?g|webp|svg|gif|bmp|ico|avif)$/i.test(name);

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
          setPdfDoc(doc);
          setTotalPages(doc.numPages);
          setPages(Array.from({ length: doc.numPages }, (_, i) => i + 1));
          setCurrentPage(Math.min(initialPage, doc.numPages));
          setScale(0.85); // good default for drawer width
          setLoading(false);
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
      setScale(1.0);
      setLoading(false);
      setError(null);
    }

    return () => {
      isMounted = false;
    };
  }, [open, fileOrBlob, title, initialPage]);

  // Jump to specific page
  const scrollToPage = useCallback((pageNum: number) => {
    setCurrentPage(pageNum);
    const el = document.getElementById(`drawer-page-${pageNum}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  // Zoom handlers
  const handleZoomIn = () => setScale((s) => Math.min(3.0, +(s + 0.25).toFixed(2)));
  const handleZoomOut = () => setScale((s) => Math.max(0.35, +(s - 0.25).toFixed(2)));
  const handleZoomReset = () => setScale(1.0);
  const handleZoomFit = () => setScale(isPdf ? 0.75 : 0.85);

  if (!open || !fileOrBlob) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop scrim */}
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Right Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[540px] md:w-[680px] bg-bg-surface border-l border-white/80 dark:border-white/10 shadow-[-12px_0_48px_rgba(0,0,0,0.4)] flex flex-col animate-slide-left">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-bg-elevated/75 border-b border-border-base shrink-0">
          <div className="min-w-0 pr-3">
            <h3 className="text-[14px] font-bold text-text-primary truncate">{title}</h3>
            <p className="text-[11.5px] text-text-tertiary">
              {isPdf && (totalPages > 0 ? `${totalPages} page${totalPages !== 1 ? "s" : ""} · ${fileSize}` : "Loading PDF...")}
              {isImage && `Image file · ${fileSize}`}
              {!isPdf && !isImage && fileSize}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Zoom controls */}
            <div className="flex items-center rounded-lg bg-bg-input border border-border-base p-0.5">
              <button
                type="button"
                onClick={handleZoomOut}
                className="w-6 h-6 rounded flex items-center justify-center text-text-secondary hover:text-text-primary text-xs font-bold transition-colors"
                title="Zoom out"
                aria-label="Zoom out"
              >
                −
              </button>
              <button
                type="button"
                onClick={handleZoomReset}
                className="text-[10.5px] font-mono px-1.5 text-text-secondary hover:text-accent tabular-nums transition-colors font-semibold"
                title="Reset zoom to 100%"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                className="w-6 h-6 rounded flex items-center justify-center text-text-secondary hover:text-text-primary text-xs font-bold transition-colors"
                title="Zoom in"
                aria-label="Zoom in"
              >
                +
              </button>
            </div>

            {/* Quick Fit Width Button */}
            <button
              type="button"
              onClick={handleZoomFit}
              className="px-2 py-1 rounded-md text-[11px] font-semibold bg-bg-surface hover:bg-bg-hover text-text-secondary border border-border-base transition-colors"
              title="Fit to drawer width"
            >
              Fit
            </button>

            {/* Page navigation for PDF */}
            {isPdf && totalPages > 1 && (
              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => scrollToPage(currentPage - 1)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-bg-surface hover:bg-bg-hover disabled:opacity-30 border border-border-base text-text-secondary transition-colors"
                  aria-label="Previous page"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <span className="font-mono text-[11px] text-text-secondary px-1 tabular-nums">
                  {currentPage}/{totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => scrollToPage(currentPage + 1)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-bg-surface hover:bg-bg-hover disabled:opacity-30 border border-border-base text-text-secondary transition-colors"
                  aria-label="Next page"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </div>
            )}

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center bg-bg-surface hover:bg-danger/10 hover:text-danger text-text-secondary border border-border-base transition-colors"
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
          <div className="flex items-center justify-between px-4 py-2 bg-bg-surface border-b border-border-base text-xs shrink-0">
            <button
              type="button"
              disabled={currentIndex <= 0}
              onClick={() => onSelectIndex(currentIndex - 1)}
              className="flex items-center gap-1 font-semibold text-text-secondary hover:text-accent disabled:opacity-30 disabled:hover:text-text-secondary transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              <span>Prev file</span>
            </button>
            <div className="flex items-center gap-1.5 font-medium text-text-tertiary">
              <span className="font-bold text-text-primary px-2 py-0.5 rounded bg-bg-elevated border border-border-base text-[11px]">
                {currentIndex + 1} / {filesList.length}
              </span>
              <span className="truncate max-w-[140px] sm:max-w-[220px] text-text-secondary text-[11.5px] font-semibold">
                {filesList[currentIndex]?.name}
              </span>
            </div>
            <button
              type="button"
              disabled={currentIndex >= filesList.length - 1}
              onClick={() => onSelectIndex(currentIndex + 1)}
              className="flex items-center gap-1 font-semibold text-text-secondary hover:text-accent disabled:opacity-30 disabled:hover:text-text-secondary transition-colors"
            >
              <span>Next file</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        )}

        {/* Drawer Body */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-bg-elevated/40 flex flex-col items-center">
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 text-center my-auto">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin-slow mb-3" />
              <p className="text-[12.5px] font-medium text-text-tertiary">Rendering high-resolution preview...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-center my-auto">
              <p className="text-[13px] font-medium">{error}</p>
            </div>
          )}

          {/* PDF Pages Preview */}
          {!loading && !error && isPdf && pdfDoc && (
            <div className="flex flex-col items-center gap-6 my-auto">
              {pages.map((pageNum) => (
                <DrawerPageCanvas
                  key={pageNum}
                  pdfDoc={pdfDoc}
                  pageNum={pageNum}
                  scale={scale}
                />
              ))}
            </div>
          )}

          {/* Image Preview */}
          {!loading && !error && isImage && (
            <DrawerImagePreview
              fileOrBlob={fileOrBlob}
              scale={scale}
              title={title}
            />
          )}

          {/* Fallback for other file types */}
          {!loading && !error && !isPdf && !isImage && (
            <div className="flex flex-col items-center justify-center py-20 text-center my-auto">
              <span className="w-16 h-16 rounded-2xl bg-bg-elevated flex items-center justify-center text-accent mb-3 border border-border-base">
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

        {/* Drawer Footer */}
        <div className="p-4 bg-bg-surface border-t border-border-base flex items-center justify-between text-xs text-text-tertiary shrink-0">
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
            className="btn-secondary px-4 py-1.5 text-xs font-semibold"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── PDF Page Canvas ── */
function DrawerPageCanvas({
  pdfDoc,
  pageNum,
  scale,
}: {
  pdfDoc: any;
  pageNum: number;
  scale: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);
  const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    let active = true;
    const render = async () => {
      try {
        if (!pdfDoc) return;
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        if (!active || !canvasRef.current) return;
        const canvas = canvasRef.current;

        // Internal rendering buffer
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // CSS display size matches viewport directly for true zooming!
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        setPageSize({ width: viewport.width, height: viewport.height });

        const ctx = canvas.getContext("2d")!;
        await (page.render as any)({ canvasContext: ctx, viewport, canvas }).promise;
        if (active) setRendered(true);
      } catch {
        // Skip
      }
    };

    render();
    return () => {
      active = false;
    };
  }, [pdfDoc, pageNum, scale]);

  return (
    <div
      id={`drawer-page-${pageNum}`}
      className="relative flex flex-col items-center shadow-lg rounded-lg border border-border-base bg-white dark:bg-zinc-900 overflow-hidden shrink-0 transition-all"
      style={{
        width: pageSize ? `${pageSize.width}px` : "auto",
        maxWidth: "none",
      }}
    >
      <canvas
        ref={canvasRef}
        className={`transition-opacity duration-150 ${rendered ? "opacity-100" : "opacity-0"}`}
        style={{ display: "block" }}
      />
      {/* Page number badge */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/75 backdrop-blur-sm text-white text-[10.5px] font-mono font-bold shadow-md pointer-events-none select-none">
        Page {pageNum}
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
        className="relative flex flex-col items-center rounded-xl shadow-xl border border-border-base overflow-hidden bg-white dark:bg-zinc-950 transition-all shrink-0"
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
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/75 backdrop-blur-sm text-white text-[11px] font-mono font-medium shadow-md pointer-events-none select-none">
            {dimensions.width} × {dimensions.height} px
          </div>
        )}
      </div>
    </div>
  );
}
