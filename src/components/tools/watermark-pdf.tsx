"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function WatermarkPdfTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("CONFIDENTIAL");
  const [fontSize, setFontSize] = useState(50);
  const [opacity, setOpacity] = useState(0.3);
  const [rotation, setRotation] = useState(-45);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback((files: File[]) => {
    setFile(files[0] || null);
    setResult(null);
  }, []);

  const handleWatermark = async () => {
    if (!file || !text.trim()) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { addWatermark, savePdf } = await import("@/lib/engines/pdf");
      const doc = await addWatermark(file, text, { fontSize, opacity, rotation });
      const blob = await savePdf(doc);
      setResult(blob);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to add watermark");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF to watermark" description="Select a single PDF file" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <span className="text-sm text-text-primary truncate flex-1">{file.name}</span>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          {/* Watermark text */}
          <div>
            <label className="block text-sm text-text-secondary mb-2">Watermark text</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          {/* Font size */}
          <div>
            <label className="block text-sm text-text-secondary mb-2">Font size: {fontSize}px</label>
            <input type="range" min="20" max="100" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full accent-accent-start" />
          </div>

          {/* Opacity */}
          <div>
            <label className="block text-sm text-text-secondary mb-2">Opacity: {Math.round(opacity * 100)}%</label>
            <input type="range" min="0.05" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full accent-accent-start" />
          </div>

          {/* Rotation */}
          <div>
            <label className="block text-sm text-text-secondary mb-2">Rotation: {rotation}°</label>
            <input type="range" min="-90" max="0" value={rotation} onChange={(e) => setRotation(Number(e.target.value))} className="w-full accent-accent-start" />
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Watermark added!</p>
              <DownloadButton blob={result} filename={`watermarked-${file.name}`} />
            </div>
          )}

          {!result && (
            <button onClick={handleWatermark} disabled={processing || !text.trim()} className="btn-primary w-full py-3">
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />
                  Processing...
                </span>
              ) : "Add Watermark"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
