"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function images_to_grid_Tool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [gridSize, setGridSize] = useState(2);

  const handleFile = useCallback((f: File[]) => { setFiles(prev => [...prev, ...f]); setResult(null); }, []);

  const process = async () => {
    if (files.length < 2) return;
    setProcessing(true); onProcessing?.(true);
    try {
      const images = await Promise.all(files.map(f => new Promise<HTMLImageElement>((res, rej) => {
        const img = new Image(); img.onload = () => res(img); img.onerror = () => rej(new Error("Failed"));
        img.src = URL.createObjectURL(f);
      })));
      const cellSize = 300;
      const canvas = document.createElement("canvas");
      canvas.width = gridSize * cellSize; canvas.height = gridSize * cellSize;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#1a1a2e"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      images.slice(0, gridSize * gridSize).forEach((img, i) => {
        const col = i % gridSize, row = Math.floor(i / gridSize);
        const scale = Math.min(cellSize / img.naturalWidth, cellSize / img.naturalHeight);
        const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
        ctx.drawImage(img, col * cellSize + (cellSize - w) / 2, row * cellSize + (cellSize - h) / 2, w, h);
      });
      const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => b ? res(b) : rej(new Error("Failed")), "image/png"));
      setResult(blob);
    } catch (err) { onError?.(err instanceof Error ? err.message : "Failed"); }
    finally { setProcessing(false); onProcessing?.(false); }
  };

  return (
    <div className="space-y-6">
      <DropZone accept="image/*" multiple onFilesSelected={handleFile} label="Drop images for grid" description={files.length + " images selected"} />
      {files.length > 0 && (
        <div className="space-y-4">
          <div><label className="block text-xs text-text-tertiary mb-1">Grid: {gridSize}×{gridSize}</label>
            <input type="range" min={2} max={5} value={gridSize} onChange={(e) => setGridSize(parseInt(e.target.value))} className="w-full accent-accent" /></div>
          {result && <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10"><p className="text-sm text-success mb-1">✓ Grid created!</p><DownloadButton blob={result} filename="grid.png" /></div>}
          {!result && <button onClick={process} disabled={processing || files.length < 2} className="btn-primary w-full py-3">{processing ? "Creating..." : "Create Grid"}</button>}
        </div>
      )}
    </div>
  );
}