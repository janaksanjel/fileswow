"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function PdfDuplicatePagesTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pageSelection, setPageSelection] = useState("");
  const [copies, setCopies] = useState(2);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [pageCount, setPageCount] = useState(0);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    try {
      const { loadPdf } = await import("@/lib/engines/pdf");
      const doc = await loadPdf(f);
      setPageCount(doc.getPageCount());
    } catch {
      setPageCount(0);
    }
  }, []);

  const parsePages = (input: string): number[] => {
    return input.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n >= 1 && n <= pageCount);
  };

  const handleDuplicate = async () => {
    if (!file) return;
    const pages = parsePages(pageSelection);
    if (pages.length === 0) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { loadPdf, savePdf } = await import("@/lib/engines/pdf");
      const source = await loadPdf(file);
      const newDoc = await import("pdf-lib").then(m => m.PDFDocument.create());
      const allIndices = source.getPageIndices();

      for (const idx of allIndices) {
        const pageNum = idx + 1;
        const isDuplicate = pages.includes(pageNum);
        const count = isDuplicate ? copies : 1;

        for (let c = 0; c < count; c++) {
          const [copied] = await newDoc.copyPages(source, [idx]);
          newDoc.addPage(copied);
        }
      }

      const blob = await savePdf(newDoc);
      setResult(blob);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to duplicate pages");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF" description="Select a PDF to duplicate pages" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <div className="flex-1">
              <p className="text-sm text-text-primary truncate">{file.name}</p>
              <p className="text-xs text-text-tertiary">{pageCount} pages</p>
            </div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Pages to duplicate (comma-separated)</label>
            <input type="text" value={pageSelection} onChange={(e) => setPageSelection(e.target.value)} placeholder="e.g., 1, 3, 5" className="w-full px-4 py-2.5 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm font-mono focus:border-accent focus:outline-none transition-colors" />
            <p className="mt-1 text-xs text-text-tertiary">Pages: 1–{pageCount}</p>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Number of copies per page</label>
            <input type="range" min="2" max="10" value={copies} onChange={(e) => setCopies(Number(e.target.value))} className="w-full accent-accent-start" />
            <p className="text-xs text-text-tertiary">{copies}x copies</p>
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Pages duplicated!</p>
              <DownloadButton blob={result} filename={`duplicated-${file.name}`} />
            </div>
          )}

          {!result && (
            <button onClick={handleDuplicate} disabled={processing || parsePages(pageSelection).length === 0} className="btn-primary w-full py-3">
              {processing ? "Duplicating..." : `Duplicate ${parsePages(pageSelection).length} page(s)`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
