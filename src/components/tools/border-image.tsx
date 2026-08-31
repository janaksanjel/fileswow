"use client";
import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function border_image_Tool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [borderWidth, setBorderWidth] = useState(20);
  const [borderColor, setBorderColor] = useState("#000000");

  const handleFile = useCallback((files: File[]) => { const f = files[0]; if (!f) return; setFile(f); setResult(null); }, []);

  const process = async () => {
    if (!file) return;
    setProcessing(true); onProcessing?.(true);
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("Failed")); img.src = url; });
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth + borderWidth * 2;
      canvas.height = img.naturalHeight + borderWidth * 2;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = borderColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, borderWidth, borderWidth);
      URL.revokeObjectURL(url);
      const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => b ? res(b) : rej(new Error("Failed")), "image/png"));
      setResult(blob);
    } catch (err) { onError?.(err instanceof Error ? err.message : "Failed"); }
    finally { setProcessing(false); onProcessing?.(false); }
  };

  return (
    <div className="space-y-6">
      {!file ? <DropZone accept="image/*" onFilesSelected={handleFile} label="Drop an image to add border" /> : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-text-tertiary mb-1">Width: {borderWidth}px</label>
              <input type="range" min={1} max={100} value={borderWidth} onChange={(e) => setBorderWidth(parseInt(e.target.value))} className="w-full accent-accent" /></div>
            <div><label className="block text-xs text-text-tertiary mb-1">Color</label>
              <input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" /></div>
          </div>
          {result && <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10"><p className="text-sm text-success mb-1">✓ Border added!</p><DownloadButton blob={result} filename={"bordered-" + file.name} /></div>}
          {!result && <button onClick={process} disabled={processing} className="btn-primary w-full py-3">{processing ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />Processing...</span> : "Add Border"}</button>}
        </div>
      )}
    </div>
  );
}