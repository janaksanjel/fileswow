"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function change_bg_color_Tool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [oldColor, setOldColor] = useState("#ffffff");
  const [newColor, setNewColor] = useState("#00ff00");
  const [tolerance, setTolerance] = useState(30);

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
      const or2 = parseInt(oldColor.slice(1,3),16), og = parseInt(oldColor.slice(3,5),16), ob = parseInt(oldColor.slice(5,7),16);
      const nr = parseInt(newColor.slice(1,3),16), ng = parseInt(newColor.slice(3,5),16), nb = parseInt(newColor.slice(5,7),16);
      for (let i = 0; i < d.length; i += 4) {
        const dist = Math.sqrt((d[i]-or2)**2 + (d[i+1]-og)**2 + (d[i+2]-ob)**2);
        if (dist < tolerance) {
          const t = 1 - dist / tolerance;
          d[i] = Math.round(d[i] * (1-t) + nr * t);
          d[i+1] = Math.round(d[i+1] * (1-t) + ng * t);
          d[i+2] = Math.round(d[i+2] * (1-t) + nb * t);
        }
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
        <DropZone accept="image/*" onFilesSelected={handleFile} label="Drop an image to change background color" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-text-tertiary mb-1">Replace Color</label>
              <input type="color" value={oldColor} onChange={(e) => setOldColor(e.target.value)} className="w-full h-10 rounded cursor-pointer" /></div>
            <div><label className="block text-xs text-text-tertiary mb-1">New Color</label>
              <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="w-full h-10 rounded cursor-pointer" /></div>
          </div>
          <div><label className="block text-xs text-text-tertiary mb-1">Tolerance: {tolerance}</label>
            <input type="range" min={5} max={100} value={tolerance} onChange={(e) => setTolerance(parseInt(e.target.value))} className="w-full accent-accent" /></div>
          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10">
              <p className="text-sm text-success mb-1">✓ Background color changed!</p>
              <DownloadButton blob={result} filename={"recolor-" + file.name} />
            </div>
          )}
          {!result && (
            <button onClick={process} disabled={processing} className="btn-primary w-full py-3">
              {processing ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />Processing...</span> : "Change Background Color"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}