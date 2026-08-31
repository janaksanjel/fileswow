"use client";
import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function meme_generator_Tool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [topText, setTopText] = useState("");
  const [bottomText, setBottomText] = useState("");

  const handleFile = useCallback((files: File[]) => { const f = files[0]; if (!f) return; setFile(f); setResult(null); }, []);

  const drawMemeText = (ctx: CanvasRenderingContext2D, text: string, y: number, w: number) => {
    if (!text) return;
    const fontSize = Math.round(w / 10);
    ctx.font = `bold ${fontSize}px Impact, Arial Black, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.lineWidth = fontSize / 8;
    ctx.strokeStyle = "black";
    ctx.strokeText(text.toUpperCase(), w / 2, y);
    ctx.fillStyle = "white";
    ctx.fillText(text.toUpperCase(), w / 2, y);
  };

  const process = async () => {
    if (!file) return;
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
      drawMemeText(ctx, topText, 10, canvas.width);
      if (bottomText) drawMemeText(ctx, bottomText, canvas.height - Math.round(canvas.width / 10) - 20, canvas.width);
      const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => b ? res(b) : rej(new Error("Failed")), "image/png"));
      setResult(blob);
    } catch (err) { onError?.(err instanceof Error ? err.message : "Failed"); }
    finally { setProcessing(false); onProcessing?.(false); }
  };

  return (
    <div className="space-y-6">
      {!file ? <DropZone accept="image/*" onFilesSelected={handleFile} label="Drop an image to make a meme" /> : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>
          <div><label className="block text-sm text-text-secondary mb-1">Top Text</label>
            <input value={topText} onChange={(e) => setTopText(e.target.value)} placeholder="TOP TEXT" className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm" /></div>
          <div><label className="block text-sm text-text-secondary mb-1">Bottom Text</label>
            <input value={bottomText} onChange={(e) => setBottomText(e.target.value)} placeholder="BOTTOM TEXT" className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm" /></div>
          {result && <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10"><p className="text-sm text-success mb-1">✓ Meme created!</p><DownloadButton blob={result} filename={"meme-" + file.name} /></div>}
          {!result && <button onClick={process} disabled={processing} className="btn-primary w-full py-3">{processing ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />Processing...</span> : "Generate Meme"}</button>}
        </div>
      )}
    </div>
  );
}