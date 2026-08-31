"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function AddBlankPagePdfTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [position, setPosition] = useState(1);
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
    } catch { setPageCount(0); }
  }, []);

  const handleAdd = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { addBlankPage, savePdf } = await import("@/lib/engines/pdf");
      const doc = await addBlankPage(file, position);
      const blob = await savePdf(doc);
      setResult(blob);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to add page");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF" description="Add a blank page to it" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <span className="text-sm text-text-primary truncate flex-1">{file.name}</span>
            <span className="text-xs text-text-tertiary">{pageCount} pages</span>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-2">Insert position (1-based)</label>
            <input type="number" min="1" max={pageCount + 1} value={position} onChange={(e) => setPosition(Number(e.target.value))} className="w-24 px-3 py-2 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm font-mono focus:border-accent focus:outline-none transition-colors" />
            <p className="mt-1 text-xs text-text-tertiary">1 = beginning, {pageCount + 1} = end</p>
          </div>
          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Blank page added!</p>
              <DownloadButton blob={result} filename={`modified-${file.name}`} />
            </div>
          )}
          {!result && (
            <button onClick={handleAdd} disabled={processing} className="btn-primary w-full py-3">
              {processing ? "Adding..." : "Add Blank Page"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
