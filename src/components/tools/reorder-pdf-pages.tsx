"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function ReorderPdfPagesTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [order, setOrder] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    try {
      const { loadPdf } = await import("@/lib/engines/pdf");
      const doc = await loadPdf(f);
      setPageCount(doc.getPageCount());
      setOrder(Array.from({ length: doc.getPageCount() }, (_, i) => i + 1).join(", "));
    } catch { setPageCount(0); }
  }, []);

  const handleReorder = async () => {
    if (!file) return;
    const newOrder = order.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (newOrder.length === 0) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { reorderPages, savePdf } = await import("@/lib/engines/pdf");
      const doc = await reorderPages(file, newOrder);
      const blob = await savePdf(doc);
      setResult(blob);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to reorder pages");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF" description="Reorder pages by specifying new order" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <span className="text-sm text-text-primary truncate flex-1">{file.name}</span>
            <span className="text-xs text-text-tertiary">{pageCount} pages</span>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-2">Page order (new order of pages)</label>
            <input type="text" value={order} onChange={(e) => setOrder(e.target.value)} placeholder="e.g., 3, 1, 2, 5, 4" className="w-full px-4 py-2.5 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm font-mono focus:border-accent focus:outline-none transition-colors" />
            <p className="mt-1 text-xs text-text-tertiary">Comma-separated page numbers in desired order</p>
          </div>
          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Pages reordered!</p>
              <DownloadButton blob={result} filename={`reordered-${file.name}`} />
            </div>
          )}
          {!result && (
            <button onClick={handleReorder} disabled={processing} className="btn-primary w-full py-3">
              {processing ? "Reordering..." : "Reorder Pages"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
