"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function SvgToPdfImageTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
  }, []);

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { jsPDF } = await import("jspdf");
      const text = await file.text();
      const blob = new Blob([text], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error("Failed to load SVG"));
        img.src = url;
      });

      const doc = new jsPDF({
        orientation: img.naturalWidth > img.naturalHeight ? "landscape" : "portrait",
        unit: "px",
        format: [img.naturalWidth, img.naturalHeight],
      });
      doc.addImage(img, "PNG", 0, 0, img.naturalWidth, img.naturalHeight);
      URL.revokeObjectURL(url);

      const pdfBlob = doc.output("blob");
      setResult(pdfBlob);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to convert SVG");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".svg" onFilesSelected={handleFile} label="Drop an SVG to convert to PDF" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">SVG</span>
            <div className="flex-1">
              <p className="text-sm text-text-primary truncate">{file.name}</p>
            </div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>
          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10">
              <p className="text-sm text-success mb-1">✓ Converted to PDF!</p>
              <DownloadButton blob={result} filename={file.name.replace(/\.svg$/, ".pdf")} />
            </div>
          )}
          {!result && (
            <button onClick={handleConvert} disabled={processing} className="btn-primary w-full py-3">
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />
                  Converting...
                </span>
              ) : "Convert to PDF"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
