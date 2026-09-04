"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function CropPdfTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [top, setTop] = useState(50);
  const [bottom, setBottom] = useState(50);
  const [left, setLeft] = useState(50);
  const [right, setRight] = useState(50);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback((files: File[]) => {
    setFile(files[0] || null);
    setResult(null);
  }, []);

  const handleCrop = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { loadPdf, savePdf } = await import("@/lib/engines/pdf");
      const { PDFDocument, rgb } = await import("pdf-lib");
      const doc = await loadPdf(file);

      for (const page of doc.getPages()) {
        const { width, height } = page.getSize();
        page.setMediaBox(
          left,
          bottom,
          width - left - right,
          height - top - bottom
        );
      }

      const blob = await savePdf(doc);
      setResult(blob);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to crop PDF");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF to crop" description="Select a single PDF file" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <span className="text-sm text-text-primary truncate flex-1">{file.name}</span>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Top", value: top, set: setTop },
              { label: "Bottom", value: bottom, set: setBottom },
              { label: "Left", value: left, set: setLeft },
              { label: "Right", value: right, set: setRight },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <label className="block text-sm text-text-secondary mb-2">{label}: {value}px</label>
                <input type="range" min="0" max="200" value={value} onChange={(e) => set(Number(e.target.value))} className="w-full accent-accent-start" />
              </div>
            ))}
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Crop complete!</p>
              <DownloadButton blob={result} filename={`cropped-${file.name}`} />
            </div>
          )}

          {!result && (
            <button onClick={handleCrop} disabled={processing} className="btn-primary w-full py-3">
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />
                  Cropping...
                </span>
              ) : "Crop PDF"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
