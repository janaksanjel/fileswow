"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function straighten_image_Tool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [angle, setAngle] = useState(0);

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
      const rad = (angle * Math.PI) / 180;
      const cos = Math.abs(Math.cos(rad)), sin = Math.abs(Math.sin(rad));
      const newW = Math.round(img.naturalWidth * cos + img.naturalHeight * sin);
      const newH = Math.round(img.naturalWidth * sin + img.naturalHeight * cos);
      const canvas = document.createElement("canvas");
      canvas.width = newW; canvas.height = newH;
      const ctx = canvas.getContext("2d")!;
      ctx.translate(newW / 2, newH / 2);
      ctx.rotate(rad);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      URL.revokeObjectURL(url);
      const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => b ? res(b) : rej(new Error("Failed")), "image/png"));
      setResult(blob);
    } catch (err) { onError?.(err instanceof Error ? err.message : "Failed"); }
    finally { setProcessing(false); onProcessing?.(false); }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept="image/*" onFilesSelected={handleFile} label="Drop an image to straighten" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-2">Angle: {angle}°</label>
            <input type="range" min={-45} max={45} step={0.5} value={angle} onChange={(e) => setAngle(parseFloat(e.target.value))} className="w-full accent-accent" />
          </div>
          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10">
              <p className="text-sm text-success mb-1">✓ Straightened!</p>
              <DownloadButton blob={result} filename={"straightened-" + file.name} />
            </div>
          )}
          {!result && (
            <button onClick={process} disabled={processing} className="btn-primary w-full py-3">
              {processing ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />Processing...</span> : "Straighten Image"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}