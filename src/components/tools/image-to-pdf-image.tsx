"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function ImageToPdfImageTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback((f: File[]) => {
    setFiles(prev => [...prev, ...f]);
    setResult(null);
  }, []);

  const handleConvert = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      for (let i = 0; i < files.length; i++) {
        const img = new Image();
        const url = URL.createObjectURL(files[i]);
        await new Promise<void>((res, rej) => {
          img.onload = () => res();
          img.onerror = () => rej(new Error("Failed to load image"));
          img.src = url;
        });

        if (i > 0) doc.addPage();
        const ratio = Math.min(190 / img.naturalWidth, 270 / img.naturalHeight);
        const w = img.naturalWidth * ratio;
        const h = img.naturalHeight * ratio;
        doc.addImage(img, "JPEG", (210 - w) / 2, (297 - h) / 2, w, h);
        URL.revokeObjectURL(url);
      }

      const blob = doc.output("blob");
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
      <DropZone accept="image/*" multiple onFilesSelected={handleFile} label="Drop images to convert to PDF" description={`${files.length} images selected`} />
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-elevated border border-border-base text-xs">
                <span className="text-text-primary truncate max-w-[120px]">{f.name}</span>
                <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-text-tertiary hover:text-danger">✕</button>
              </div>
            ))}
          </div>
          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10">
              <p className="text-sm text-success mb-1">✓ Converted to PDF!</p>
              <DownloadButton blob={result} filename="images.pdf" />
            </div>
          )}
          {!result && (
            <button onClick={handleConvert} disabled={processing} className="btn-primary w-full py-3">
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
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
