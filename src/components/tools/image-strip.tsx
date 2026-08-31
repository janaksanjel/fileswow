"use client";
import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function image_strip_Tool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [direction, setDirection] = useState<"horizontal"|"vertical">("horizontal");
  const [gap, setGap] = useState(4);

  const handleFile = useCallback((f: File[]) => { setFiles(prev => [...prev, ...f]); setResult(null); }, []);

  const process = async () => {
    if (files.length < 2) return;
    setProcessing(true); onProcessing?.(true);
    try {
      const images = await Promise.all(files.map(f => new Promise<HTMLImageElement>((res, rej) => {
        const img = new Image(); img.onload = () => res(img); img.onerror = () => rej(new Error("Failed"));
        img.src = URL.createObjectURL(f);
      })));
      const thumbSize = 200;
      const isH = direction === "horizontal";
      const totalW = isH ? images.length * thumbSize + (images.length - 1) * gap : thumbSize;
      const totalH = isH ? thumbSize : images.length * thumbSize + (images.length - 1) * gap;
      const canvas = document.createElement("canvas");
      canvas.width = totalW; canvas.height = totalH;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#1a1a2e"; ctx.fillRect(0, 0, totalW, totalH);
      images.forEach((img, i) => {
        const scale = Math.min(thumbSize / img.naturalWidth, thumbSize / img.naturalHeight);
        const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
        const x = isH ? i * (thumbSize + gap) + (thumbSize - w) / 2 : (thumbSize - w) / 2;
        const y = isH ? (thumbSize - h) / 2 : i * (thumbSize + gap) + (thumbSize - h) / 2;
        ctx.drawImage(img, x, y, w, h);
      });
      const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => b ? res(b) : rej(new Error("Failed")), "image/png"));
      setResult(blob);
    } catch (err) { onError?.(err instanceof Error ? err.message : "Failed"); }
    finally { setProcessing(false); onProcessing?.(false); }
  };

  return (
    <div className="space-y-6">
      <DropZone accept="image/*" multiple onFilesSelected={handleFile} label="Drop images for strip" description={files.length + " images selected"} />
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {(["horizontal","vertical"] as const).map(d => <button key={d} onClick={() => setDirection(d)} className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all ${direction === d ? "bg-accent-start text-white" : "bg-bg-elevated text-text-secondary border border-border-base"}`}>{d}</button>)}
          </div>
          {result && <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10"><p className="text-sm text-success mb-1">✓ Strip created!</p><DownloadButton blob={result} filename="strip.png" /></div>}
          {!result && <button onClick={process} disabled={processing || files.length < 2} className="btn-primary w-full py-3">{processing ? "Creating..." : "Create Strip"}</button>}
        </div>
      )}
    </div>
  );
}