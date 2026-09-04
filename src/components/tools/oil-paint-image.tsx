"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function oil_paint_image_Tool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [originalSize, setOriginalSize] = useState(0);

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
const copy = new Uint8ClampedArray(d);
const radius = 3;
for (let y = radius; y < h - radius; y++) {
  for (let x = radius; x < w - radius; x++) {
    const idx = (y*w+x)*4;
    let maxCount = 0, maxR = 0, maxG = 0, maxB = 0;
    const buckets: Record<string, {r:number,g:number,b:number,c:number}> = {};
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const ci = ((y+dy)*w+(x+dx))*4;
        const br = Math.round(copy[ci]/32), bg = Math.round(copy[ci+1]/32), bb = Math.round(copy[ci+2]/32);
        const key = br+','+bg+','+bb;
        if (!buckets[key]) buckets[key] = {r:0,g:0,b:0,c:0};
        buckets[key].r += copy[ci]; buckets[key].g += copy[ci+1]; buckets[key].b += copy[ci+2]; buckets[key].c++;
        if (buckets[key].c > maxCount) { maxCount = buckets[key].c; maxR = buckets[key].r/buckets[key].c; maxG = buckets[key].g/buckets[key].c; maxB = buckets[key].b/buckets[key].c; }
      }
    }
    d[idx] = maxR; d[idx+1] = maxG; d[idx+2] = maxB;
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
        <DropZone accept="image/*" onFilesSelected={handleFile} label="Drop an image for oil painting effect" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <div className="flex-1">
              <p className="text-sm text-text-primary truncate">{file.name}</p>
              <p className="text-xs text-text-tertiary">{fmt(originalSize)}</p>
            </div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10">
              <p className="text-sm text-success mb-1">✓ Done!</p>
              <DownloadButton blob={result} filename={"processed-" + file.name} />
            </div>
          )}

          {!result && (
            <button onClick={process} disabled={processing} className="btn-primary w-full py-3">
              {processing ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />Processing...</span> : "Apply Effect"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}