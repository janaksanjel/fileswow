"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface PdfPreviewProps {
  file: File;
  className?: string;
  onPagesLoaded?: (count: number) => void;
}

export function PdfPreview({ file, className = "", onPagesLoaded }: PdfPreviewProps) {
  const [pages, setPages] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedPages = useRef<Map<number, HTMLCanvasElement>>(new Map());

  // Load PDF and render pages
  const loadPdf = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const pdfjsLib = await import("pdfjs-dist");
      const { GlobalWorkerOptions } = pdfjsLib;
      GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      setTotalPages(pdf.numPages);
      setPages(Array.from({ length: pdf.numPages }, (_, i) => i + 1));
      onPagesLoaded?.(pdf.numPages);

      // Render first page immediately
      await renderPage(pdf, 1, scale);

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load PDF");
      setLoading(false);
    }
  }, [file, scale, onPagesLoaded]);

  const renderPage = async (
    pdf: any,
    pageNum: number,
    currentScale: number
  ) => {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: currentScale });

    // Check if already rendered
    const existing = renderedPages.current.get(pageNum);
    if (existing && existing.width === viewport.width) return existing;

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;

    await page.render({ canvas, viewport }).promise;
    renderedPages.current.set(pageNum, canvas);

    return canvas;
  };

  useEffect(() => {
    loadPdf();
  }, [loadPdf]);

  // Re-render visible pages when scale changes
  useEffect(() => {
    if (pages.length === 0) return;

    const rerender = async () => {
      const pdfjsLib = await import("pdfjs-dist");
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      renderedPages.current.clear();

      // Re-render current page
      await renderPage(pdf, currentPage, scale);

      // Re-render adjacent pages
      if (currentPage > 1) await renderPage(pdf, currentPage - 1, scale);
      if (currentPage < totalPages) await renderPage(pdf, currentPage + 1, scale);
    };

    rerender();
  }, [scale]);

  // Scroll to page
  const scrollToPage = (pageNum: number) => {
    const el = document.getElementById(`pdf-page-${pageNum}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setCurrentPage(pageNum);
    }
  };

  // Handle scroll to detect current page
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const children = container.children;
      for (let i = 0; i < children.length; i++) {
        const child = children[i] as HTMLElement;
        const rect = child.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        if (rect.top >= containerRect.top - 100 && rect.top <= containerRect.bottom) {
          setCurrentPage(i + 1);
          break;
        }
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [pages]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin-slow mx-auto mb-3" />
          <p className="text-xs text-text-tertiary">Loading PDF preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <p className="text-sm text-danger">{error}</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-bg-elevated border-2 border-border-strong border-b-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => scrollToPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="w-7 h-7 rounded flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-hover disabled:opacity-30 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="text-xs text-text-secondary font-mono min-w-[60px] text-center">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => scrollToPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="w-7 h-7 rounded flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-hover disabled:opacity-30 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
            className="w-7 h-7 rounded flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors text-xs font-bold"
          >
            −
          </button>
          <span className="text-[10px] text-text-tertiary font-mono min-w-[40px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(3, s + 0.2))}
            className="w-7 h-7 rounded flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors text-xs font-bold"
          >
            +
          </button>
        </div>
      </div>

      {/* Pages container */}
      <div
        ref={containerRef}
        className="max-h-[500px] overflow-y-auto border-2 border-t-0 border-border-strong bg-bg-elevated"
      >
        <div className="flex flex-col items-center gap-3 py-4">
          {pages.map((pageNum) => (
            <div
              key={pageNum}
              id={`pdf-page-${pageNum}`}
              className="relative shadow-lg"
              style={{ lineHeight: 0 }}
            >
              <PageCanvas
                file={file}
                pageNum={pageNum}
                scale={scale}
                isActive={Math.abs(pageNum - currentPage) <= 1}
              />
              {/* Page number label */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-bg-surface border-2 border-border-strong text-[9px] font-extrabold text-text-tertiary font-mono">
                {pageNum}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Individual page renderer
function PageCanvas({
  file,
  pageNum,
  scale,
  isActive,
}: {
  file: File;
  pageNum: number;
  scale: number;
  isActive: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (!isActive || rendered) return;

    const render = async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        const { GlobalWorkerOptions } = pdfjsLib;
        GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvas, viewport }).promise;
        setRendered(true);
      } catch {
        // Silently fail for non-visible pages
      }
    };

    render();
  }, [file, pageNum, scale, isActive, rendered]);

  return (
    <canvas
      ref={canvasRef}
      className="max-w-full"
      style={{ width: "100%", height: "auto" }}
    />
  );
}
