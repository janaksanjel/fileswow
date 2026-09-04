"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function watermark_image_Tool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [text, setText] = useState("WATERMARK");
  const [opacity, setOpacity] = useState(0.3);
  const [fontSize, setFontSize] = useState(48);

  const handleFile = useCallback((files: File[]) => {
    const f = files[0]; if (!f) return; setFile(f); setResult(null);
  }, []);

  const process = async () => {
    if (!file || !text) return;
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
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 6);
      ctx.fillText(text, 0, 0);
      ctx.restore();
      const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => b ? res(b) : rej(new Error("Failed")), "image/png"));
      setResult(blob);
    } catch (err) { onError?.(err instanceof Error ? err.message : "Failed"); }
    finally { setProcessing(false); onProcessing?.(false); }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept="image/*" onFilesSelected={handleFile} label="Drop an image to watermark" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Watermark Text</label>
            <input value={text} onChange={(e) => setText(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-text-tertiary mb-1">Opacity: {Math.round(opacity*100)}%</label>
              <input type="range" min={0.05} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} className="w-full accent-accent" /></div>
            <div><label className="block text-xs text-text-tertiary mb-1">Size: {fontSize}px</label>
              <input type="range" min={12} max={200} value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full accent-accent" /></div>
          </div>
          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10">
              <p className="text-sm text-success mb-1">✓ Watermarked!</p>
              <DownloadButton blob={result} filename={"watermarked-" + file.name} />
            </div>
          )}
          {!result && (
            <button onClick={process} disabled={processing || !text} className="btn-primary w-full py-3">
              {processing ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />Processing...</span> : "Add Watermark"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}