"use client";
import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function photo_grid_Tool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback((f: File[]) => { setFiles(prev => [...prev, ...f]); setResult(null); }, []);

  const process = async () => {
    if (files.length < 2) return;
    setProcessing(true); onProcessing?.(true);
    try {
      const images = await Promise.all(files.map(f => new Promise<HTMLImageElement>((res, rej) => {
        const img = new Image(); img.onload = () => res(img); img.onerror = () => rej(new Error("Failed"));
        img.src = URL.createObjectURL(f);
      })));
      // Masonry-style layout
      const colW = 250; const cols = 3;
      const colH = new Array(cols).fill(0);
      const positions: {img: HTMLImageElement; x: number; y: number; w: number; h: number}[] = [];
      images.forEach(img => {
        const shortestCol = colH.indexOf(Math.min(...colH));
        const scale = colW / img.naturalWidth;
        const h = img.naturalHeight * scale;
        positions.push({ img, x: shortestCol * colW, y: colH[shortestCol], w: colW, h });
        colH[shortestCol] += h + 8;
      });
      const canvas = document.createElement("canvas");
      canvas.width = cols * colW; canvas.height = Math.max(...colH);
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#1a1a2e"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      positions.forEach(p => ctx.drawImage(p.img, p.x, p.y, p.w, p.h));
      const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => b ? res(b) : rej(new Error("Failed")), "image/png"));
      setResult(blob);
    } catch (err) { onError?.(err instanceof Error ? err.message : "Failed"); }
    finally { setProcessing(false); onProcessing?.(false); }
  };

  return (
    <div className="space-y-6">
      <DropZone accept="image/*" multiple onFilesSelected={handleFile} label="Drop images for photo grid" description={files.length + " images selected"} />
      {files.length > 0 && (
        <div className="space-y-4">
          {result && <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10"><p className="text-sm text-success mb-1">✓ Photo grid created!</p><DownloadButton blob={result} filename="photo-grid.png" /></div>}
          {!result && <button onClick={process} disabled={processing || files.length < 2} className="btn-primary w-full py-3">{processing ? "Creating..." : "Create Photo Grid"}</button>}
        </div>
      )}
    </div>
  );
}