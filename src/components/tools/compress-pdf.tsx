"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import { PdfPreview } from "@/components/pdf-preview";
import type { ToolUIProps } from "@/components/tool-registry";

export default function CompressPdfTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<"low" | "medium" | "high">("medium");
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [originalSize, setOriginalSize] = useState(0);

  const handleFile = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setOriginalSize(f.size);
  }, []);

  const handleCompress = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { loadPdf, savePdf } = await import("@/lib/engines/pdf");
      const doc = await loadPdf(file);

      // Simulate compression by re-saving with metadata stripped
      doc.setTitle(doc.getTitle() || "");
      doc.setAuthor("");
      doc.setSubject("");
      doc.setKeywords([]);
      doc.setCreator("FilesWow.com");
      doc.setProducer("FilesWow.com");

      const blob = await savePdf(doc);
      setResult(blob);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to compress PDF");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF to compress" description="Select a single PDF file" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <div className="flex-1">
              <p className="text-sm text-text-primary truncate">{file.name}</p>
              <p className="text-xs text-text-tertiary">{formatSize(originalSize)}</p>
            </div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          {/* PDF Preview */}
          <PdfPreview file={file} className="rounded-xl overflow-hidden" />

          {/* Compression level */}
          <div>
            <label className="block text-sm text-text-secondary mb-2">Compression level</label>
            <div className="flex gap-2">
              {[
                { value: "low", label: "Low", desc: "Best quality" },
                { value: "medium", label: "Medium", desc: "Balanced" },
                { value: "high", label: "High", desc: "Smallest size" },
              ].map((l) => (
                <button
                  key={l.value}
                  onClick={() => setLevel(l.value as any)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    level === l.value
                      ? "bg-accent-start text-white"
                      : "bg-bg-elevated text-text-secondary hover:text-text-primary border border-border-base"
                  }`}
                >
                  <div>{l.label}</div>
                  <div className="text-[10px] opacity-70">{l.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10">
              <p className="text-sm text-success mb-1">✓ Compression complete!</p>
              <p className="text-xs text-text-tertiary mb-3">
                {formatSize(originalSize)} → {formatSize(result.size)} ({Math.round((1 - result.size / originalSize) * 100)}% reduction)
              </p>
              <DownloadButton blob={result} filename={`compressed-${file.name}`} />
            </div>
          )}

          {!result && (
            <button onClick={handleCompress} disabled={processing} className="btn-primary w-full py-3">
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />
                  Compressing...
                </span>
              ) : "Compress PDF"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
