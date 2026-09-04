"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function ImagesToPdfTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFiles = useCallback((newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    setResult(null);
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { imageToPdf, savePdf } = await import("@/lib/engines/pdf");
      const doc = await imageToPdf(files);
      const blob = await savePdf(doc);
      setResult(blob);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to convert images");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {files.length === 0 ? (
        <DropZone
          accept="image/*"
          multiple
          onFilesSelected={handleFiles}
          label="Drop images to convert"
          description="JPG, PNG, and other image formats"
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">{files.length} image{files.length !== 1 ? "s" : ""}</p>
            <button onClick={() => { setFiles([]); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Clear all</button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {files.map((file, i) => (
              <div key={`${file.name}-${i}`} className="flex items-center gap-3 p-2 rounded-lg bg-bg-elevated border border-border-base">
                <span className="text-xs text-text-tertiary w-5">{i + 1}</span>
                <span className="text-sm text-text-primary truncate flex-1">{file.name}</span>
                <span className="text-xs text-text-tertiary">{(file.size / 1024).toFixed(0)}KB</span>
                <button onClick={() => removeFile(i)} className="p-1 text-text-tertiary hover:text-danger transition-colors">✕</button>
              </div>
            ))}
          </div>

          <DropZone accept="image/*" multiple onFilesSelected={handleFiles} label="Add more images" description="Click or drop" />

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Conversion complete!</p>
              <DownloadButton blob={result} filename="images.pdf" />
            </div>
          )}

          {!result && (
            <button onClick={handleConvert} disabled={processing || files.length === 0} className="btn-primary w-full py-3">
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />
                  Converting...
                </span>
              ) : `Convert ${files.length} image${files.length !== 1 ? "s" : ""} to PDF`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
