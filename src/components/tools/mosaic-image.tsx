"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function mosaic_image_Tool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [originalSize, setOriginalSize] = useState(0);
  const [amount, setAmount] = useState(10);

  const handleFile = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f); setResult(null); setOriginalSize(f.size);
  }, []);

  const process = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("Failed to load")); img.src = url; });

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data; const w = imageData.width; const h = imageData.height;
const tileSize = Math.max(3, Math.round(amount / 2));
for (let y = 0; y < h; y += tileSize) {
  for (let x = 0; x < w; x += tileSize) {
    const idx = (y*w+x)*4;
    const r = d[idx], g = d[idx+1], b = d[idx+2];
    for (let dy = 0; dy < tileSize && y+dy < h; dy++) {
      for (let dx = 0; dx < tileSize && x+dx < w; dx++) {
        const i = ((y+dy)*w+(x+dx))*4;
        d[i] = r; d[i+1] = g; d[i+2] = b;
      }
    }
  }
}
      ctx.putImageData(imageData, 0, 0);

      const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => b ? res(b) : rej(new Error("Failed")), "image/png"));
      setResult(blob);
    } catch (err) { onError?.(err instanceof Error ? err.message : "Failed"); }
    finally { setProcessing(false); onProcessing?.(false); }
  };

  const fmt = (b: number) => b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(1) + " MB";

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept="image/*" onFilesSelected={handleFile} label="Drop an image for mosaic effect" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <div className="flex-1">
              <p className="text-sm text-text-primary truncate">{file.name}</p>
              <p className="text-xs text-text-tertiary">{fmt(originalSize)}</p>
            </div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Tile Size: {amount}</label>
            <input type="range" min={3} max={50} value={amount} onChange={(e) => setAmount(parseInt(e.target.value))} className="w-full accent-accent" />
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10">
              <p className="text-sm text-success mb-1">✓ Done!</p>
              <p className="text-xs text-text-tertiary mb-3">{fmt(originalSize)} → {fmt(result.size)}</p>
              <DownloadButton blob={result} filename={"adjusted-" + file.name} />
            </div>
          )}

          {!result && (
            <button onClick={process} disabled={processing} className="btn-primary w-full py-3">
              {processing ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />Processing...</span> : "Apply Adjustment"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}