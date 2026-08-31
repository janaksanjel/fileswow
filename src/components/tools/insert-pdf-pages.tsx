"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function InsertPdfPagesTool({ onProcessing, onError }: ToolUIProps) {
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [position, setPosition] = useState(1);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleTarget = useCallback((files: File[]) => setTargetFile(files[0] || null), []);
  const handleSource = useCallback((files: File[]) => setSourceFile(files[0] || null), []);

  const handleInsert = async () => {
    if (!targetFile || !sourceFile) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { loadPdf, savePdf } = await import("@/lib/engines/pdf");
      const target = await loadPdf(targetFile);
      const source = await loadPdf(sourceFile);
      const pages = await target.copyPages(source, source.getPageIndices());
      const insertIdx = Math.min(position - 1, target.getPageCount());
      pages.forEach((page, i) => target.insertPage(insertIdx + i, page));
      const blob = await savePdf(target);
      setResult(blob);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to insert pages");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!targetFile ? (
        <DropZone accept=".pdf" onFilesSelected={handleTarget} label="Drop the target PDF" description="The PDF to insert pages into" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="text-xs text-text-tertiary font-medium w-16">Target</span>
            <span className="text-sm text-text-primary truncate flex-1">{targetFile.name}</span>
            <button onClick={() => { setTargetFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">✕</button>
          </div>

          {!sourceFile ? (
            <DropZone accept=".pdf" onFilesSelected={handleSource} label="Drop the PDF to insert" description="Pages from this file will be inserted" />
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
              <span className="text-xs text-text-tertiary font-medium w-16">Source</span>
              <span className="text-sm text-text-primary truncate flex-1">{sourceFile.name}</span>
              <button onClick={() => setSourceFile(null)} className="text-xs text-text-tertiary hover:text-danger transition-colors">✕</button>
            </div>
          )}

          <div>
            <label className="block text-sm text-text-secondary mb-2">Insert at position (1-based)</label>
            <input type="number" min="1" value={position} onChange={(e) => setPosition(Number(e.target.value))} className="w-24 px-3 py-2 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm font-mono focus:border-accent focus:outline-none transition-colors" />
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Pages inserted!</p>
              <DownloadButton blob={result} filename={`inserted-${targetFile.name}`} />
            </div>
          )}

          {!result && (
            <button onClick={handleInsert} disabled={processing || !targetFile || !sourceFile} className="btn-primary w-full py-3">
              {processing ? "Inserting..." : "Insert Pages"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
