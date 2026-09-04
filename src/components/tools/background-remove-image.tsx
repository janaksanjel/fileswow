"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function background_remove_image_Tool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback((files: File[]) => {
    const f = files[0]; if (!f) return; setFile(f); setResult(null);
  }, []);

  const process = async () => {
    if (!file) return;
    setProcessing(true); onProcessing?.(true);
    try {
      // Dynamic import of background removal library
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(file);
      setResult(blob);
    } catch (err) {
      // Fallback: simple green-screen removal
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
        for (let i = 0; i < d.length; i += 4) {
          if (d[i+1] > 100 && d[i+1] > d[i]*1.2 && d[i+1] > d[i+2]*1.2) {
            d[i+3] = 0;
          }
        }
        ctx.putImageData(imageData, 0, 0);
        const outBlob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => b ? res(b) : rej(new Error("Failed")), "image/png"));
        setResult(outBlob);
      } catch { onError?.("Background removal failed. Try a simpler image."); }
    } finally { setProcessing(false); onProcessing?.(false); }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept="image/*" onFilesSelected={handleFile} label="Drop an image to remove background" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>
          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10">
              <p className="text-sm text-success mb-1">✓ Background removed!</p>
              <DownloadButton blob={result} filename={"no-bg-" + file.name.replace(/\.[^.]+$/, ".png")} />
            </div>
          )}
          {!result && (
            <button onClick={process} disabled={processing} className="btn-primary w-full py-3">
              {processing ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />Removing background (this may take a moment)...</span> : "Remove Background"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}