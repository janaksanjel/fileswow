"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function CompressWordTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState<{ original: number; compressed: number } | null>(null);

  const handleFile = useCallback((files: File[]) => { setFile(files[0] || null); setResult(null); setStats(null); }, []);

  const handleCompress = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const JSZip = (await import("jszip")).default;
      const buffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer);
      // Re-pack with compression
      const compressed = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 9 } });
      setResult(compressed);
      setStats({ original: file.size, compressed: compressed.size });
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to compress");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  const reduction = stats ? Math.round((1 - stats.compressed / stats.original) * 100) : 0;

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".docx,.doc" onFilesSelected={handleFile} label="Drop a Word document" description="Reduce DOCX file size" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">DOCX</span>
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p><p className="text-xs text-text-tertiary">{(file.size / 1024).toFixed(0)} KB</p></div>
            <button onClick={() => { setFile(null); setResult(null); setStats(null); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>
          {stats && (
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-bg-elevated border border-border-base text-center"><p className="text-xs text-text-tertiary">Original</p><p className="text-sm font-semibold">{(stats.original / 1024).toFixed(0)} KB</p></div>
              <div className="p-3 rounded-lg bg-bg-elevated border border-border-base text-center"><p className="text-xs text-text-tertiary">Compressed</p><p className="text-sm font-semibold">{(stats.compressed / 1024).toFixed(0)} KB</p></div>
              <div className={`p-3 rounded-lg border text-center ${reduction > 0 ? "bg-success/[0.04] border-success/10" : "bg-bg-elevated border-border-base"}`}><p className="text-xs text-text-tertiary">Reduction</p><p className={`text-sm font-semibold ${reduction > 0 ? "text-success" : ""}`}>{reduction}%</p></div>
            </div>
          )}
          {result && <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center"><p className="text-sm text-success mb-3">✓ Compressed!</p><DownloadButton blob={result} filename={`compressed-${file!.name}`} /></div>}
          {!result && <button onClick={handleCompress} disabled={processing} className="btn-primary w-full py-3">{processing ? "Compressing..." : "Compress Document"}</button>}
        </div>
      )}
    </div>
  );
}
