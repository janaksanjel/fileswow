"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function MergePdfTool({ onProcessing, onError }: ToolUIProps) {
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

  const moveFile = (from: number, to: number) => {
    setFiles((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  };

  const handleMerge = async () => {
    if (files.length < 2) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { mergePdfs, savePdf } = await import("@/lib/engines/pdf");
      const merged = await mergePdfs(files);
      const blob = await savePdf(merged);
      setResult(blob);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to merge PDFs");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Drop zone (hidden if files already added) */}
      {files.length === 0 && (
        <DropZone
          accept=".pdf"
          multiple
          onFilesSelected={handleFiles}
          label="Drop PDF files to merge"
          description="Select 2 or more PDF files"
        />
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">
              {files.length} file{files.length !== 1 ? "s" : ""} selected
            </p>
            <button
              onClick={() => {
                setFiles([]);
                setResult(null);
              }}
              className="text-xs text-text-tertiary hover:text-danger transition-colors"
            >
              Clear all
            </button>
          </div>

          <div className="space-y-2">
            {files.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base"
              >
                <span className="text-xs text-text-tertiary w-6 text-center font-mono">
                  {i + 1}
                </span>
                <span className="w-4 h-4 rounded flex items-center justify-center text-accent-end text-[10px] font-bold bg-accent-start/10">
                  PDF
                </span>
                <span className="text-sm text-text-primary truncate flex-1">
                  {file.name}
                </span>
                <span className="text-xs text-text-tertiary">
                  {(file.size / 1024 / 1024).toFixed(1)}MB
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveFile(i, i - 1)}
                    disabled={i === 0}
                    className="p-1 text-text-tertiary hover:text-text-primary disabled:opacity-30 transition-colors"
                    aria-label="Move up"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveFile(i, i + 1)}
                    disabled={i === files.length - 1}
                    className="p-1 text-text-tertiary hover:text-text-primary disabled:opacity-30 transition-colors"
                    aria-label="Move down"
                  >
                    ▼
                  </button>
                  <button
                    onClick={() => removeFile(i)}
                    className="p-1 text-text-tertiary hover:text-danger transition-colors"
                    aria-label="Remove"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add more */}
          <DropZone
            accept=".pdf"
            multiple
            onFilesSelected={handleFiles}
            label="Add more files"
            description="Click or drop more PDFs"
          />
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
          <p className="text-sm text-success mb-3">✓ Merge complete!</p>
          <DownloadButton blob={result} filename="merged.pdf" />
        </div>
      )}

      {/* Merge button */}
      {files.length >= 2 && !result && (
        <button
          onClick={handleMerge}
          disabled={processing}
          className="btn-primary w-full py-3"
        >
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />
              Merging...
            </span>
          ) : (
            `Merge ${files.length} PDFs`
          )}
        </button>
      )}
    </div>
  );
}
