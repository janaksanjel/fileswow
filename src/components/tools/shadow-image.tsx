"use client";
import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function shadow_image_Tool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [offset, setOffset] = useState(10);
  const [blur, setBlur] = useState(15);
  const [shadowColor, setShadowColor] = useState("#00000080");

  const handleFile = useCallback((files: File[]) => { const f = files[0]; if (!f) return; setFile(f); setResult(null); }, []);

  const process = async () => {
    if (!file) return;
    setProcessing(true); onProcessing?.(true);
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("Failed")); img.src = url; });
      const pad = offset + blur + 10;
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth + pad * 2; canvas.height = img.naturalHeight + pad * 2;
      const ctx = canvas.getContext("2d")!;
      ctx.shadowColor = shadowColor; ctx.shadowBlur = blur; ctx.shadowOffsetX = offset; ctx.shadowOffsetY = offset;
      ctx.drawImage(img, pad, pad);
      ctx.shadowColor = "transparent";
      URL.revokeObjectURL(url);
      const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => b ? res(b) : rej(new Error("Failed")), "image/png"));
      setResult(blob);
    } catch (err) { onError?.(err instanceof Error ? err.message : "Failed"); }
    finally { setProcessing(false); onProcessing?.(false); }
  };

  return (
    <div className="space-y-6">
      {!file ? <DropZone accept="image/*" onFilesSelected={handleFile} label="Drop an image to add shadow" /> : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-text-tertiary mb-1">Offset: {offset}px</label>
              <input type="range" min={0} max={50} value={offset} onChange={(e) => setOffset(parseInt(e.target.value))} className="w-full accent-accent" /></div>
            <div><label className="block text-xs text-text-tertiary mb-1">Blur: {blur}px</label>
              <input type="range" min={0} max={50} value={blur} onChange={(e) => setBlur(parseInt(e.target.value))} className="w-full accent-accent" /></div>
          </div>
          {result && <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10"><p className="text-sm text-success mb-1">✓ Shadow added!</p><DownloadButton blob={result} filename={"shadow-" + file.name} /></div>}
          {!result && <button onClick={process} disabled={processing} className="btn-primary w-full py-3">{processing ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />Processing...</span> : "Add Shadow"}</button>}
        </div>
      )}
    </div>
  );
}