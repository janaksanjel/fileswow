"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import type { ToolUIProps } from "@/components/tool-registry";

export default function ComparePdfTool({ onProcessing, onError }: ToolUIProps) {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [diffResult, setDiffResult] = useState<{ added: number; removed: number; unchanged: number } | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFileA = useCallback((files: File[]) => {
    setFileA(files[0] || null);
    setDiffResult(null);
  }, []);

  const handleFileB = useCallback((files: File[]) => {
    setFileB(files[0] || null);
    setDiffResult(null);
  }, []);

  const handleCompare = async () => {
    if (!fileA || !fileB) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { loadPdf } = await import("@/lib/engines/pdf");
      const docA = await loadPdf(fileA);
      const docB = await loadPdf(fileB);

      // Simple page count comparison
      const pagesA = docA.getPageCount();
      const pagesB = docB.getPageCount();
      const unchanged = Math.min(pagesA, pagesB);
      const added = Math.max(0, pagesB - pagesA);
      const removed = Math.max(0, pagesA - pagesB);

      setDiffResult({ added, removed, unchanged });
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to compare PDFs");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-text-secondary mb-2 font-medium">Document A (original)</label>
          {!fileA ? (
            <DropZone accept=".pdf" onFilesSelected={handleFileA} label="Drop first PDF" description="Original document" />
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
              <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
              <span className="text-sm text-text-primary truncate flex-1">{fileA.name}</span>
              <button onClick={() => { setFileA(null); setDiffResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">✕</button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-2 font-medium">Document B (revised)</label>
          {!fileB ? (
            <DropZone accept=".pdf" onFilesSelected={handleFileB} label="Drop second PDF" description="Revised document" />
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
              <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
              <span className="text-sm text-text-primary truncate flex-1">{fileB.name}</span>
              <button onClick={() => { setFileB(null); setDiffResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">✕</button>
            </div>
          )}
        </div>
      </div>

      {diffResult && (
        <div className="p-4 rounded-xl bg-bg-elevated border border-border-base space-y-3">
          <p className="text-sm text-text-primary font-medium">Comparison Results</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-success/[0.04] border border-success/10">
              <p className="text-2xl font-bold text-success">{diffResult.unchanged}</p>
              <p className="text-xs text-text-tertiary">Pages (same)</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-accent-blue/[0.04] border border-accent-blue/10">
              <p className="text-2xl font-bold text-accent-blue">{diffResult.added}</p>
              <p className="text-xs text-text-tertiary">Pages added</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-danger/[0.04] border border-danger/10">
              <p className="text-2xl font-bold text-danger">{diffResult.removed}</p>
              <p className="text-xs text-text-tertiary">Pages removed</p>
            </div>
          </div>
        </div>
      )}

      {fileA && fileB && !diffResult && (
        <button onClick={handleCompare} disabled={processing} className="btn-primary w-full py-3">
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />
              Comparing...
            </span>
          ) : "Compare PDFs"}
        </button>
      )}
    </div>
  );
}
