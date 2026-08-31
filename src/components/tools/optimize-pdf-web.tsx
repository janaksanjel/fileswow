"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function OptimizePdfWebTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState<{ original: number; optimized: number } | null>(null);

  const handleFile = useCallback((files: File[]) => {
    setFile(files[0] || null);
    setResult(null);
    setStats(null);
  }, []);

  const handleOptimize = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const buffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(buffer);

      // Optimize by re-saving with compression settings
      const bytes = await doc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });

      const optimizedBlob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      setResult(optimizedBlob);
      setStats({ original: file.size, optimized: optimizedBlob.size });
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to optimize PDF");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  const reduction = stats ? Math.round((1 - stats.optimized / stats.original) * 100) : 0;

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF" description="Optimize for fast web viewing" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p><p className="text-xs text-text-tertiary">{(file.size / 1024).toFixed(0)} KB</p></div>
            <button onClick={() => { setFile(null); setResult(null); setStats(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          {stats && (
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-bg-elevated border border-border-base text-center">
                <p className="text-xs text-text-tertiary">Original</p>
                <p className="text-sm font-semibold text-text-primary">{(stats.original / 1024).toFixed(0)} KB</p>
              </div>
              <div className="p-3 rounded-lg bg-bg-elevated border border-border-base text-center">
                <p className="text-xs text-text-tertiary">Optimized</p>
                <p className="text-sm font-semibold text-text-primary">{(stats.optimized / 1024).toFixed(0)} KB</p>
              </div>
              <div className={`p-3 rounded-lg border text-center ${reduction > 0 ? "bg-success/[0.04] border-success/10" : "bg-bg-elevated border-border-base"}`}>
                <p className="text-xs text-text-tertiary">Reduction</p>
                <p className={`text-sm font-semibold ${reduction > 0 ? "text-success" : "text-text-primary"}`}>{reduction}%</p>
              </div>
            </div>
          )}

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Optimized for web!</p>
              <DownloadButton blob={result} filename={`optimized-${file!.name}`} />
            </div>
          )}

          {!result && (
            <button onClick={handleOptimize} disabled={processing} className="btn-primary w-full py-3">
              {processing ? "Optimizing..." : "Optimize for Web"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
