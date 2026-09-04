"use client";
import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

const EMOJIS = ["😀","😂","❤️","🔥","⭐","👍","🎉","💯","🚀","😎","🌟","💪","✅","🎵","👀","🙏","💎","🏆","🌈","🍕"];

export default function sticker_image_Tool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [emoji, setEmoji] = useState("😀");
  const [size, setSize] = useState(64);
  const [xPos, setXPos] = useState(50);
  const [yPos, setYPos] = useState(50);

  const handleFile = useCallback((files: File[]) => { const f = files[0]; if (!f) return; setFile(f); setResult(null); }, []);

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
      const fontSize = size * (canvas.width / 800);
      ctx.font = `${fontSize}px serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(emoji, (xPos/100)*canvas.width, (yPos/100)*canvas.height);
      const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => b ? res(b) : rej(new Error("Failed")), "image/png"));
      setResult(blob);
    } catch (err) { onError?.(err instanceof Error ? err.message : "Failed"); }
    finally { setProcessing(false); onProcessing?.(false); }
  };

  return (
    <div className="space-y-6">
      {!file ? <DropZone accept="image/*" onFilesSelected={handleFile} label="Drop an image to add stickers" /> : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>
          <div className="flex flex-wrap gap-2">{EMOJIS.map(e => <button key={e} onClick={() => setEmoji(e)} className={`text-2xl p-2 rounded-lg transition-all ${emoji === e ? "bg-accent-start/20 ring-2 ring-accent" : "bg-bg-elevated hover:bg-bg-hover"}`}>{e}</button>)}</div>
          <div><label className="block text-xs text-text-tertiary mb-1">Size: {size}px</label>
            <input type="range" min={24} max={200} value={size} onChange={(e) => setSize(parseInt(e.target.value))} className="w-full accent-accent" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-text-tertiary mb-1">X: {xPos}%</label>
              <input type="range" min={0} max={100} value={xPos} onChange={(e) => setXPos(parseInt(e.target.value))} className="w-full accent-accent" /></div>
            <div><label className="block text-xs text-text-tertiary mb-1">Y: {yPos}%</label>
              <input type="range" min={0} max={100} value={yPos} onChange={(e) => setYPos(parseInt(e.target.value))} className="w-full accent-accent" /></div>
          </div>
          {result && <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10"><p className="text-sm text-success mb-1">✓ Sticker added!</p><DownloadButton blob={result} filename={"sticker-" + file.name} /></div>}
          {!result && <button onClick={process} disabled={processing} className="btn-primary w-full py-3">{processing ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />Processing...</span> : "Add Sticker"}</button>}
        </div>
      )}
    </div>
  );
}