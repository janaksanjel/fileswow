"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

const PRESETS = [
  { label: "A4", width: 595.28, height: 841.89 },
  { label: "Letter", width: 612, height: 792 },
  { label: "Legal", width: 612, height: 1008 },
  { label: "A3", width: 841.89, height: 1190.55 },
  { label: "A5", width: 419.53, height: 595.28 },
  { label: "Custom", width: 0, height: 0 },
];

export default function ResizePdfPageTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preset, setPreset] = useState("A4");
  const [customWidth, setCustomWidth] = useState(595);
  const [customHeight, setCustomHeight] = useState(842);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback((files: File[]) => {
    setFile(files[0] || null);
    setResult(null);
  }, []);

  const handleResize = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { loadPdf, savePdf } = await import("@/lib/engines/pdf");
      const doc = await loadPdf(file);

      const selected = PRESETS.find((p) => p.label === preset);
      const w = preset === "Custom" ? customWidth : selected?.width || 595.28;
      const h = preset === "Custom" ? customHeight : selected?.height || 841.89;

      for (const page of doc.getPages()) {
        const { width, height } = page.getSize();
        const scaleX = w / width;
        const scaleY = h / height;
        const scale = Math.min(scaleX, scaleY);
        page.setSize(w, h);
      }

      const blob = await savePdf(doc);
      setResult(blob);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to resize PDF");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF to resize" description="Select a single PDF file" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <span className="text-sm text-text-primary truncate flex-1">{file.name}</span>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Page size</label>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setPreset(p.label)}
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${
                    preset === p.label
                      ? "bg-accent-start text-white"
                      : "bg-bg-elevated text-text-secondary hover:text-text-primary border border-border-base"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {preset === "Custom" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-2">Width (pt)</label>
                <input type="number" value={customWidth} onChange={(e) => setCustomWidth(Number(e.target.value))} className="w-full px-4 py-2.5 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm font-mono focus:border-accent focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">Height (pt)</label>
                <input type="number" value={customHeight} onChange={(e) => setCustomHeight(Number(e.target.value))} className="w-full px-4 py-2.5 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm font-mono focus:border-accent focus:outline-none transition-colors" />
              </div>
            </div>
          )}

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Resize complete!</p>
              <DownloadButton blob={result} filename={`resized-${file.name}`} />
            </div>
          )}

          {!result && (
            <button onClick={handleResize} disabled={processing} className="btn-primary w-full py-3">
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />
                  Resizing...
                </span>
              ) : "Resize PDF"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
