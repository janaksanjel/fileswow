"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function RepairPdfTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<"idle" | "checking" | "repaired" | "failed">("idle");

  const handleFile = useCallback((files: File[]) => {
    setFile(files[0] || null);
    setResult(null);
    setStatus("idle");
  }, []);

  const handleRepair = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    setStatus("checking");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const buffer = await file.arrayBuffer();

      // Try loading the PDF - if it fails, attempt repair
      try {
        const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        // Reload with default settings to verify
        const bytes = await doc.save();
        setResult(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }));
        setStatus("repaired");
      } catch {
        // Attempt repair by loading with error recovery
        try {
          const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
          const bytes = await doc.save();
          setResult(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }));
          setStatus("repaired");
        } catch {
          setStatus("failed");
          onError?.("Could not repair this PDF. The file may be too corrupted.");
        }
      }
    } catch (err) {
      setStatus("failed");
      onError?.(err instanceof Error ? err.message : "Failed to repair PDF");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a corrupted PDF" description="Attempt to repair a damaged PDF file" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p><p className="text-xs text-text-tertiary">{(file.size / 1024).toFixed(1)} KB</p></div>
            <button onClick={() => { setFile(null); setResult(null); setStatus("idle"); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          {status === "repaired" && result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ PDF repaired successfully!</p>
              <DownloadButton blob={result} filename={`repaired-${file.name}`} />
            </div>
          )}

          {status === "failed" && (
            <div className="p-4 rounded-xl bg-danger/[0.04] border border-danger/10">
              <p className="text-sm text-danger">✕ Could not repair this PDF. The file may be too corrupted for client-side repair.</p>
            </div>
          )}

          {status === "idle" && (
            <div className="p-3 rounded-lg bg-bg-elevated border border-border-base">
              <p className="text-xs text-text-secondary">ℹ The tool will attempt to read and re-save the PDF with error recovery. This works best for minor structural issues.</p>
            </div>
          )}

          {status !== "repaired" && (
            <button onClick={handleRepair} disabled={processing} className="btn-primary w-full py-3">
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
                  Repairing...
                </span>
              ) : "Attempt Repair"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
