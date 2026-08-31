"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function duotone_image_Tool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [color1, setColor1] = useState("#1a0533");
  const [color2, setColor2] = useState("#ff6b35");

  const handleFile = useCallback((files: File[]) => {
    const f = files[0]; if (!f) return; setFile(f); setResult(null);
  }, []);

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
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;
      const r1 = parseInt(color1.slice(1,3),16), g1 = parseInt(color1.slice(3,5),16), b1 = parseInt(color1.slice(5,7),16);
      const r2 = parseInt(color2.slice(1,3),16), g2 = parseInt(color2.slice(3,5),16), b2 = parseInt(color2.slice(5,7),16);
      for (let i = 0; i < d.length; i += 4) {
        const t = (d[i]*0.299 + d[i+1]*0.587 + d[i+2]*0.114) / 255;
        d[i] = Math.round(r1 + (r2-r1)*t);
        d[i+1] = Math.round(g1 + (g2-g1)*t);
        d[i+2] = Math.round(b1 + (b2-b1)*t);
      }
      ctx.putImageData(imageData, 0, 0);
      const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => b ? res(b) : rej(new Error("Failed")), "image/png"));
      setResult(blob);
    } catch (err) { onError?.(err instanceof Error ? err.message : "Failed"); }
    finally { setProcessing(false); onProcessing?.(false); }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept="image/*" onFilesSelected={handleFile} label="Drop an image for duotone effect" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-text-tertiary mb-1">Shadow Color</label>
              <input type="color" value={color1} onChange={(e) => setColor1(e.target.value)} className="w-full h-10 rounded cursor-pointer" /></div>
            <div><label className="block text-xs text-text-tertiary mb-1">Highlight Color</label>
              <input type="color" value={color2} onChange={(e) => setColor2(e.target.value)} className="w-full h-10 rounded cursor-pointer" /></div>
          </div>
          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10">
              <p className="text-sm text-success mb-1">✓ Duotone applied!</p>
              <DownloadButton blob={result} filename={"duotone-" + file.name} />
            </div>
          )}
          {!result && (
            <button onClick={process} disabled={processing} className="btn-primary w-full py-3">
              {processing ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />Processing...</span> : "Apply Duotone"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}