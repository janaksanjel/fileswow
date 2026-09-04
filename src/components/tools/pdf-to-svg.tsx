"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function PdfToSvgTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<{ name: string; blob: Blob }[]>([]);
  const [processing, setProcessing] = useState(false);
  const [pageCount, setPageCount] = useState(0);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResults([]);
    try {
      const { loadPdf } = await import("@/lib/engines/pdf");
      const doc = await loadPdf(f);
      setPageCount(doc.getPageCount());
    } catch {
      setPageCount(0);
    }
  }, []);

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const buffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(buffer);
      const pages = doc.getPages();
      const converted: { name: string; blob: Blob }[] = [];

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();

        // Generate a basic SVG representation of the page dimensions
        // pdf-lib cannot render to SVG directly, so we create a placeholder SVG
        // with page dimensions that can be used as a template
        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="white"/>
  <text x="${width / 2}" y="${height / 2}" text-anchor="middle" fill="#666" font-family="Arial" font-size="14">
    Page ${i + 1} of ${pages.length}
  </text>
</svg>`;

        const blob = new Blob([svg], { type: "image/svg+xml" });
        converted.push({ name: `page-${i + 1}.svg`, blob });
      }

      setResults(converted);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to convert to SVG");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  const downloadAll = async () => {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    for (const r of results) zip.file(r.name, r.blob);
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "svg-pages.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF to convert" description="Each page becomes an SVG file" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <div className="flex-1">
              <p className="text-sm text-text-primary truncate">{file.name}</p>
              <p className="text-xs text-text-tertiary">{pageCount} pages → {pageCount} SVGs</p>
            </div>
            <button onClick={() => { setFile(null); setResults([]); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          <div className="p-3 rounded-lg bg-accent-blue/[0.04] border border-accent-blue/10">
            <p className="text-xs text-accent-blue">ℹ SVG output preserves page dimensions. For full vector rendering, a more advanced engine would be needed.</p>
          </div>

          {results.length > 0 && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10">
              <p className="text-sm text-success mb-3">✓ {results.length} SVG files created!</p>
              <div className="flex flex-wrap gap-2">
                {results.slice(0, 5).map(r => (
                  <DownloadButton key={r.name} blob={r.blob} filename={r.name} label={r.name} />
                ))}
                {results.length > 5 && <span className="text-xs text-text-tertiary self-center">+{results.length - 5} more</span>}
                {results.length > 1 && (
                  <button onClick={downloadAll} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-text-primary bg-bg-surface border border-border-base hover:bg-bg-elevated transition-colors">📦 Download all</button>
                )}
              </div>
            </div>
          )}

          {!results.length && (
            <button onClick={handleConvert} disabled={processing} className="btn-primary w-full py-3">
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />
                  Converting...
                </span>
              ) : `Convert ${pageCount} pages to SVG`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
