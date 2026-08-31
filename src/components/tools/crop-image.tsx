"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function crop_image_Tool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [crop, setCrop] = useState({ x: 10, y: 10, w: 80, h: 80 });
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgDims, setImgDims] = useState({ w: 0, h: 0 });

  const handleFile = useCallback((files: File[]) => {
    const f = files[0]; if (!f) return;
    setFile(f); setResult(null);
    const img = new Image();
    img.onload = () => { setImgDims({ w: img.naturalWidth, h: img.naturalHeight }); imgRef.current = img; };
    img.src = URL.createObjectURL(f);
  }, []);

  const handleCrop = async () => {
    if (!file || !imgRef.current) return;
    setProcessing(true); onProcessing?.(true);
    try {
      const img = imgRef.current;
      const sx = Math.round(crop.x / 100 * img.naturalWidth);
      const sy = Math.round(crop.y / 100 * img.naturalHeight);
      const sw = Math.round(crop.w / 100 * img.naturalWidth);
      const sh = Math.round(crop.h / 100 * img.naturalHeight);
      const canvas = document.createElement("canvas");
      canvas.width = sw; canvas.height = sh;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => b ? res(b) : rej(new Error("Failed")), "image/png"));
      setResult(blob);
    } catch (err) { onError?.(err instanceof Error ? err.message : "Failed"); }
    finally { setProcessing(false); onProcessing?.(false); }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept="image/*" onFilesSelected={handleFile} label="Drop an image to crop" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-text-tertiary mb-1">X: {crop.x}%</label>
              <input type="range" min={0} max={100 - crop.w} value={crop.x} onChange={(e) => setCrop(p => ({ ...p, x: parseInt(e.target.value) }))} className="w-full accent-accent" /></div>
            <div><label className="block text-xs text-text-tertiary mb-1">Y: {crop.y}%</label>
              <input type="range" min={0} max={100 - crop.h} value={crop.y} onChange={(e) => setCrop(p => ({ ...p, y: parseInt(e.target.value) }))} className="w-full accent-accent" /></div>
            <div><label className="block text-xs text-text-tertiary mb-1">Width: {crop.w}%</label>
              <input type="range" min={5} max={100 - crop.x} value={crop.w} onChange={(e) => setCrop(p => ({ ...p, w: parseInt(e.target.value) }))} className="w-full accent-accent" /></div>
            <div><label className="block text-xs text-text-tertiary mb-1">Height: {crop.h}%</label>
              <input type="range" min={5} max={100 - crop.y} value={crop.h} onChange={(e) => setCrop(p => ({ ...p, h: parseInt(e.target.value) }))} className="w-full accent-accent" /></div>
          </div>
          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10">
              <p className="text-sm text-success mb-1">✓ Cropped!</p>
              <DownloadButton blob={result} filename={"cropped-" + file.name} />
            </div>
          )}
          {!result && (
            <button onClick={handleCrop} disabled={processing} className="btn-primary w-full py-3">
              {processing ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />Cropping...</span> : "Crop Image"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}