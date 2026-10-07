"use client";

import { useCallback, useRef, useState } from "react";
import { DownloadButton } from "@/components/download-button";
import RichTextEditor from "@/components/rich-text-editor";
import type { ToolUIProps } from "@/components/tool-registry";
import type {
  PdfPageSize,
  PdfOrientation,
  PdfMargin,
  PdfLineSpacing,
  PageNumberPosition,
  RichTextPdfResult,
} from "@/lib/richtext-pdf";

export default function TextToPdfTool({ onProcessing, onError }: ToolUIProps) {
  const editorElRef = useRef<HTMLDivElement | null>(null);
  const [keepFormatting, setKeepFormatting] = useState(true);

  const [pageSize, setPageSize] = useState<PdfPageSize>("a4");
  const [orientation, setOrientation] = useState<PdfOrientation>("portrait");
  const [margin, setMargin] = useState<PdfMargin>("normal");
  const [lineSpacing, setLineSpacing] = useState<PdfLineSpacing>(1.15);
  const [pageNumbers, setPageNumbers] = useState(false);
  const [pageNumberPosition, setPageNumberPosition] = useState<PageNumberPosition>("bottom-center");

  const [result, setResult] = useState<RichTextPdfResult | null>(null);
  const [filename, setFilename] = useState("document.pdf");
  const [processing, setProcessing] = useState(false);

  const handleEditorReady = useCallback((el: HTMLDivElement | null) => {
    editorElRef.current = el;
  }, []);

  const handleConvert = useCallback(async () => {
    const editor = editorElRef.current;
    if (!editor || processing) return;
    if (editor.innerText.trim() === "") {
      onError?.("Type or paste some text first — the document is empty.");
      return;
    }
    setProcessing(true);
    onProcessing?.(true);
    try {
      // Derive the download filename from the first heading (DOM is
      // available here; never read refs during render).
      const heading = editor.querySelector("h1, h2")?.textContent?.trim();
      const slug = (heading || "document").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
      setFilename(`${slug || "document"}.pdf`);

      const { richTextToPdf } = await import("@/lib/richtext-pdf");
      const res = await richTextToPdf(editor, {
        pageSize,
        orientation,
        margin,
        lineSpacing,
        pageNumbers,
        pageNumberPosition,
      });
      setResult(res);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to create PDF");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  }, [onProcessing, onError, processing, pageSize, orientation, margin, lineSpacing, pageNumbers, pageNumberPosition]);

  return (
    <div className="space-y-5">
      <RichTextEditor
        editorId="rte-pdf"
        keepFormatting={keepFormatting}
        onKeepFormattingChange={setKeepFormatting}
        onEditorReady={handleEditorReady}
      />

      {/* ─── Page setup ─── */}
      <details className="group bg-bg-surface border border-border-base rounded-xl px-4 sm:px-5 [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex items-center justify-between gap-3 py-3.5 cursor-pointer list-none select-none">
          <h3 className="text-[13.5px] font-semibold text-text-primary">Page setup &amp; options</h3>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary shrink-0 transition-transform duration-200 group-open:rotate-180" aria-hidden="true">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </summary>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Page size</label>
            <select className="w-full h-9 rounded-lg border border-border-strong bg-bg-input px-2 text-[13px] text-text-primary cursor-pointer" value={pageSize} onChange={(e) => setPageSize(e.target.value as PdfPageSize)}>
              <option value="a4">A4</option>
              <option value="letter">US Letter</option>
              <option value="legal">Legal</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Orientation</label>
            <select className="w-full h-9 rounded-lg border border-border-strong bg-bg-input px-2 text-[13px] text-text-primary cursor-pointer" value={orientation} onChange={(e) => setOrientation(e.target.value as PdfOrientation)}>
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Margins</label>
            <select className="w-full h-9 rounded-lg border border-border-strong bg-bg-input px-2 text-[13px] text-text-primary cursor-pointer" value={margin} onChange={(e) => setMargin(e.target.value as PdfMargin)}>
              <option value="narrow">Narrow</option>
              <option value="normal">Normal (1&quot;)</option>
              <option value="wide">Wide</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Line spacing</label>
            <select className="w-full h-9 rounded-lg border border-border-strong bg-bg-input px-2 text-[13px] text-text-primary cursor-pointer" value={lineSpacing} onChange={(e) => setLineSpacing(Number(e.target.value) as PdfLineSpacing)}>
              <option value={1}>Single</option>
              <option value={1.15}>1.15</option>
              <option value={1.5}>1.5</option>
              <option value={2}>Double</option>
            </select>
          </div>
          <div className="col-span-2 sm:col-span-4 flex flex-wrap items-center gap-3 pt-1">
            <label className="flex items-center gap-2 text-[13px] font-medium text-text-primary cursor-pointer select-none">
              <input type="checkbox" checked={pageNumbers} onChange={(e) => setPageNumbers(e.target.checked)} className="w-4 h-4 accent-[var(--accent)] cursor-pointer" />
              Add page numbers
            </label>
            {pageNumbers && (
              <select className="h-9 rounded-lg border border-border-strong bg-bg-input px-2 text-[13px] text-text-primary cursor-pointer" value={pageNumberPosition} onChange={(e) => setPageNumberPosition(e.target.value as PageNumberPosition)} aria-label="Page number position">
                <option value="bottom-center">Bottom center</option>
                <option value="bottom-right">Bottom right</option>
                <option value="top-right">Top right</option>
              </select>
            )}
          </div>
        </div>
      </details>

      {/* ─── Convert ─── */}
      {result ? (
        <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center space-y-3">
          <p className="text-sm text-success font-semibold">✓ PDF created — {result.pageCount} page{result.pageCount === 1 ? "" : "s"}, real selectable text</p>
          {result.warnings.length > 0 && (
            <div className="text-left space-y-1.5 px-1">
              {result.warnings.map((w, i) => (
                <p key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                  <span className="text-warning shrink-0">⚠</span>
                  {w}
                </p>
              ))}
            </div>
          )}
          <div className="flex items-center justify-center gap-2">
            <DownloadButton blob={result.blob} filename={filename} label="Download PDF" />
            <button type="button" className="btn-secondary" onClick={() => setResult(null)}>Edit more</button>
          </div>
        </div>
      ) : (
        <button onClick={handleConvert} disabled={processing} className="btn-primary w-full py-3">
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />
              Typesetting PDF…
            </span>
          ) : (
            "Convert to PDF"
          )}
        </button>
      )}
    </div>
  );
}
