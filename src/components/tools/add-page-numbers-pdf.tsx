"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

type Position = "bottom-center" | "bottom-left" | "bottom-right" | "top-center";

export default function AddPageNumbersPdfTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [position, setPosition] = useState<Position>("bottom-center");
  const [fontSize, setFontSize] = useState(12);
  const [startNumber, setStartNumber] = useState(1);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback((files: File[]) => {
    setFile(files[0] || null);
    setResult(null);
  }, []);

  const handleAddNumbers = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { addPageNumbers, savePdf } = await import("@/lib/engines/pdf");
      const doc = await addPageNumbers(file, { position, fontSize, startNumber });
      const blob = await savePdf(doc);
      setResult(blob);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to add page numbers");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  const positionLabels: Record<Position, string> = {
    "bottom-center": "Bottom Center",
    "bottom-left": "Bottom Left",
    "bottom-right": "Bottom Right",
    "top-center": "Top Center",
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF" description="Select a PDF to add page numbers" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <span className="text-sm text-text-primary truncate flex-1">{file.name}</span>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          {/* Position */}
          <div>
            <label className="block text-sm text-text-secondary mb-2">Position</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(positionLabels) as Position[]).map((pos) => (
                <button
                  key={pos}
                  onClick={() => setPosition(pos)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    position === pos
                      ? "bg-accent-start text-white"
                      : "bg-bg-elevated text-text-secondary hover:text-text-primary border border-border-base"
                  }`}
                >
                  {positionLabels[pos]}
                </button>
              ))}
            </div>
          </div>

          {/* Font size */}
          <div>
            <label className="block text-sm text-text-secondary mb-2">Font size: {fontSize}pt</label>
            <input type="range" min="8" max="24" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full accent-accent-start" />
          </div>

          {/* Start number */}
          <div>
            <label className="block text-sm text-text-secondary mb-2">Start number</label>
            <input
              type="number"
              min="1"
              value={startNumber}
              onChange={(e) => setStartNumber(Number(e.target.value))}
              className="w-24 px-3 py-2 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm font-mono focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Page numbers added!</p>
              <DownloadButton blob={result} filename={`numbered-${file.name}`} />
            </div>
          )}

          {!result && (
            <button onClick={handleAddNumbers} disabled={processing} className="btn-primary w-full py-3">
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
                  Processing...
                </span>
              ) : "Add Page Numbers"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
