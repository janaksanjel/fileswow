"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function scale_image_Tool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lockAspect, setLockAspect] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [originalSize, setOriginalSize] = useState(0);

  const handleFile = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setOriginalSize(f.size);
    const img = new Image();
    img.onload = () => { setWidth(img.naturalWidth); setHeight(img.naturalHeight); setAspectRatio(img.naturalWidth / img.naturalHeight); };
    img.src = URL.createObjectURL(f);
  }, []);

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (lockAspect) setHeight(Math.round(val / aspectRatio));
  };
  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (lockAspect) setWidth(Math.round(val * aspectRatio));
  };

  const handleResize = async () => {
    if (!file || !width || !height) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("Failed to load image")); img.src = url; });
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => b ? res(b) : rej(new Error("Resize failed")), "image/png"));
      setResult(blob);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Resize failed");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  const fmt = (b: number) => b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(1) + " MB";

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept="image/*" onFilesSelected={handleFile} label="Drop an image to resize" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <div className="flex-1">
              <p className="text-sm text-text-primary truncate">{file.name}</p>
              <p className="text-xs text-text-tertiary">{fmt(originalSize)}</p>
            </div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Width (px)</label>
              <input type="number" value={width} onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm" />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Height (px)</label>
              <input type="number" value={height} onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
            <input type="checkbox" checked={lockAspect} onChange={(e) => setLockAspect(e.target.checked)} className="accent-accent" />
            Lock aspect ratio
          </label>

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10">
              <p className="text-sm text-success mb-1">✓ Resize complete!</p>
              <p className="text-xs text-text-tertiary mb-3">{fmt(originalSize)} → {fmt(result.size)} | {width}×{height}px</p>
              <DownloadButton blob={result} filename={"resized-" + file.name} />
            </div>
          )}

          {!result && (
            <button onClick={handleResize} disabled={processing || !width || !height} className="btn-primary w-full py-3">
              {processing ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />Resizing...</span> : "Resize Image"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}