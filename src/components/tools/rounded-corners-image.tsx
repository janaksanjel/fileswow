"use client";
import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function rounded_corners_image_Tool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [radius, setRadius] = useState(20);

  const handleFile = useCallback((files: File[]) => { const f = files[0]; if (!f) return; setFile(f); setResult(null); }, []);

  const process = async () => {
    if (!file) return;
    setProcessing(true); onProcessing?.(true);
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("Failed")); img.src = url; });
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.beginPath();
      const r = radius * Math.min(canvas.width, canvas.height) / 100;
      ctx.moveTo(r, 0);
      ctx.lineTo(canvas.width - r, 0); ctx.quadraticCurveTo(canvas.width, 0, canvas.width, r);
      ctx.lineTo(canvas.width, canvas.height - r); ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - r, canvas.height);
      ctx.lineTo(r, canvas.height); ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - r);
      ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath(); ctx.clip();
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => b ? res(b) : rej(new Error("Failed")), "image/png"));
      setResult(blob);
    } catch (err) { onError?.(err instanceof Error ? err.message : "Failed"); }
    finally { setProcessing(false); onProcessing?.(false); }
  };

  return (
    <div className="space-y-6">
      {!file ? <DropZone accept="image/*" onFilesSelected={handleFile} label="Drop an image for rounded corners" /> : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>
          <div><label className="block text-xs text-text-tertiary mb-1">Corner Radius: {radius}%</label>
            <input type="range" min={0} max={50} value={radius} onChange={(e) => setRadius(parseInt(e.target.value))} className="w-full accent-accent" /></div>
          {result && <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10"><p className="text-sm text-success mb-1">✓ Rounded!</p><DownloadButton blob={result} filename={"rounded-" + file.name} /></div>}
          {!result && <button onClick={process} disabled={processing} className="btn-primary w-full py-3">{processing ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />Processing...</span> : "Apply Rounded Corners"}</button>}
        </div>
      )}
    </div>
  );
}