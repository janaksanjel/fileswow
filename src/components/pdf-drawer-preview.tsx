"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface PdfDrawerPreviewProps {
  open: boolean;
  onClose: () => void;
  fileOrBlob: File | Blob | null;
  title?: string;
  initialPage?: number;
}

export function PdfDrawerPreview({
  open,
  onClose,
  fileOrBlob,
  title = "PDF Preview",
  initialPage = 1,
}: PdfDrawerPreviewProps) {
  const [pages, setPages] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Esc closes the drawer
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Load PDF info
  useEffect(() => {
    if (!open || !fileOrBlob) return;
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const buffer = await fileOrBlob.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

        if (!isMounted) return;
        setTotalPages(pdf.numPages);
        setPages(Array.from({ length: pdf.numPages }, (_, i) => i + 1));
        setCurrentPage(Math.min(initialPage, pdf.numPages));
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load PDF preview");
        setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [open, fileOrBlob, initialPage]);

  // Jump to page
  const scrollToPage = useCallback((pageNum: number) => {
    setCurrentPage(pageNum);
    const el = document.getElementById(`drawer-page-${pageNum}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

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
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] md:w-[580px] bg-bg-surface border-l border-white/80 dark:border-white/10 shadow-[-10px_0_40px_rgba(0,0,0,0.35)] flex flex-col animate-slide-left">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-bg-elevated/70 border-b border-border-base shrink-0">
          <div className="min-w-0 pr-3">
            <h3 className="text-[14px] font-bold text-text-primary truncate">{title}</h3>
            <p className="text-[11.5px] text-text-tertiary">
              {totalPages > 0 ? `${totalPages} page${totalPages !== 1 ? "s" : ""}` : "Loading..."}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Zoom controls */}
            <div className="flex items-center rounded-lg bg-bg-input border border-border-base p-0.5">
              <button
                type="button"
                onClick={() => setScale((s) => Math.max(0.6, s - 0.2))}
                className="w-6 h-6 rounded flex items-center justify-center text-text-secondary hover:text-text-primary text-xs font-bold"
                aria-label="Zoom out"
              >
                −
              </button>
              <span className="text-[10.5px] font-mono px-1.5 text-text-tertiary tabular-nums">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}
                className="w-6 h-6 rounded flex items-center justify-center text-text-secondary hover:text-text-primary text-xs font-bold"
                aria-label="Zoom in"
              >
                +
              </button>
            </div>

            {/* Page navigation */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => scrollToPage(currentPage - 1)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-bg-surface hover:bg-bg-hover disabled:opacity-30 border border-border-base text-text-secondary transition-colors"
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

        {/* Drawer Body — Scrollable Page Canvases */}
        <div ref={containerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 bg-bg-elevated/40">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin-slow mb-3" />
              <p className="text-[12.5px] font-medium text-text-tertiary">Rendering preview pages...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-center">
              <p className="text-[13px] font-medium">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="flex flex-col items-center gap-5">
              {pages.map((pageNum) => (
                <div
                  key={pageNum}
                  id={`drawer-page-${pageNum}`}
                  className="relative flex flex-col items-center shadow-[0_8px_24px_rgba(0,0,0,0.15)] rounded-lg overflow-hidden border border-border-base bg-white"
                >
                  <DrawerPageCanvas fileOrBlob={fileOrBlob} pageNum={pageNum} scale={scale} />
                  {/* Page number badge */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/75 backdrop-blur-sm text-white text-[10.5px] font-mono font-bold shadow-md">
                    Page {pageNum}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 bg-bg-surface border-t border-border-base flex items-center justify-between text-xs text-text-tertiary shrink-0">
          <span>Processed 100% locally in your browser</span>
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

function DrawerPageCanvas({
  fileOrBlob,
  pageNum,
  scale,
}: {
  fileOrBlob: File | Blob;
  pageNum: number;
  scale: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    let active = true;
    const render = async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const buffer = await fileOrBlob.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        if (!active || !canvasRef.current) return;
        const canvas = canvasRef.current;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;

        await (page.render as any)({ canvasContext: ctx, viewport, canvas }).promise;
        if (active) setRendered(true);
      } catch {
        // Silently skip
      }
    };

    render();
    return () => {
      active = false;
    };
  }, [fileOrBlob, pageNum, scale]);

  return (
    <canvas
      ref={canvasRef}
      className={`max-w-full transition-opacity duration-200 ${rendered ? "opacity-100" : "opacity-0"}`}
      style={{ display: "block" }}
    />
  );
}

