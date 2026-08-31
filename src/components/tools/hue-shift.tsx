"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function hue_shift_Tool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [originalSize, setOriginalSize] = useState(0);
  const [amount, setAmount] = useState(0);

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
      const d = imageData.data;
const shift = amount;
for (let i = 0; i < d.length; i += 4) {
  let r = d[i]/255, g = d[i+1]/255, b = d[i+2]/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h = 0, s = 0, l = (max+min)/2;
  if (max !== min) {
    const d2 = max-min;
    s = l > 0.5 ? d2/(2-max-min) : d2/(max+min);
    if (max === r) h = ((g-b)/d2 + (g<b?6:0))/6;
    else if (max === g) h = ((b-r)/d2+2)/6;
    else h = ((r-g)/d2+4)/6;
  }
  h = (h + shift/360 + 1) % 1;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p+(q-p)*6*t;
    if (t < 1/2) return q;
    if (t < 2/3) return p+(q-p)*(2/3-t)*6;
    return p;
  };
  const q2 = l < 0.5 ? l*(1+s) : l+s-l*s;
  const p2 = 2*l-q2;
  d[i] = Math.round(hue2rgb(p2,q2,h+1/3)*255);
  d[i+1] = Math.round(hue2rgb(p2,q2,h)*255);
  d[i+2] = Math.round(hue2rgb(p2,q2,h-1/3)*255);
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
        <DropZone accept="image/*" onFilesSelected={handleFile} label="Drop an image to shift hue" />
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
            <label className="block text-sm text-text-secondary mb-2">Hue Shift: {amount}</label>
            <input type="range" min={-180} max={180} value={amount} onChange={(e) => setAmount(parseInt(e.target.value))} className="w-full accent-accent" />
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