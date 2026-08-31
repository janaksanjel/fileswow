"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function image_collage_Tool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [layout, setLayout] = useState<"grid"|"horizontal"|"vertical">("grid");
  const [gap, setGap] = useState(8);

  const handleFile = useCallback((f: File[]) => { setFiles(prev => [...prev, ...f]); setResult(null); }, []);

  const process = async () => {
    if (files.length < 2) return;
    setProcessing(true); onProcessing?.(true);
    try {
      const images = await Promise.all(files.map(f => new Promise<HTMLImageElement>((res, rej) => {
        const img = new Image(); img.onload = () => res(img); img.onerror = () => rej(new Error("Failed"));
        img.src = URL.createObjectURL(f);
      })));
      const thumbSize = 300;
      let cols: number, rows: number;
      if (layout === "horizontal") { cols = images.length; rows = 1; }
      else if (layout === "vertical") { cols = 1; rows = images.length; }
      else { cols = Math.ceil(Math.sqrt(images.length)); rows = Math.ceil(images.length / cols); }

      const canvas = document.createElement("canvas");
      canvas.width = cols * thumbSize + (cols - 1) * gap;
      canvas.height = rows * thumbSize + (rows - 1) * gap;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#1a1a2e"; ctx.fillRect(0, 0, canvas.width, canvas.height);

      images.forEach((img, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        const x = col * (thumbSize + gap), y = row * (thumbSize + gap);
        const scale = Math.max(thumbSize / img.naturalWidth, thumbSize / img.naturalHeight);
        const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
        ctx.drawImage(img, x + (thumbSize - w) / 2, y + (thumbSize - h) / 2, w, h);
      });

      const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => b ? res(b) : rej(new Error("Failed")), "image/png"));
      setResult(blob);
    } catch (err) { onError?.(err instanceof Error ? err.message : "Failed"); }
    finally { setProcessing(false); onProcessing?.(false); }
  };

  return (
    <div className="space-y-6">
      <DropZone accept="image/*" multiple onFilesSelected={handleFile} label="Drop images for collage" description={files.length + " images selected"} />
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {(["grid","horizontal","vertical"] as const).map(l => (
              <button key={l} onClick={() => setLayout(l)} className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all ${layout === l ? "bg-accent-start text-white" : "bg-bg-elevated text-text-secondary border border-border-base"}`}>{l}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">{files.map((f, i) => <div key={i} className="text-xs text-text-tertiary bg-bg-elevated px-2 py-1 rounded">{f.name} <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="ml-1 hover:text-danger">✕</button></div>)}</div>
          {result && <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10"><p className="text-sm text-success mb-1">✓ Collage created!</p><DownloadButton blob={result} filename="collage.png" /></div>}
          {!result && <button onClick={process} disabled={processing || files.length < 2} className="btn-primary w-full py-3">{processing ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />Creating...</span> : "Create Collage"}</button>}
        </div>
      )}
    </div>
  );
}