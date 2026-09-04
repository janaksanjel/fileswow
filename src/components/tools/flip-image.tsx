"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function flip_image_Tool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [mode, setMode] = useState("rotate-90");
  const [originalSize, setOriginalSize] = useState(0);

  const handleFile = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f); setResult(null); setOriginalSize(f.size);
  }, []);

  const process = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("Failed to load")); img.src = url; });

      let w = img.naturalWidth, h = img.naturalHeight;
      let drawW = w, drawH = h;

      if (mode === "rotate-90" || mode === "rotate-270") { drawW = h; drawH = w; }
      if (mode === "rotate-180") { /* same */ }
      if (mode === "flip-h" || mode === "flip-v") { /* same */ }

      const canvas = document.createElement("canvas");
      canvas.width = drawW;
      canvas.height = drawH;
      const ctx = canvas.getContext("2d")!;

      ctx.save();
      if (mode === "rotate-90") { ctx.translate(drawW, 0); ctx.rotate(Math.PI / 2); }
      else if (mode === "rotate-180") { ctx.translate(drawW, drawH); ctx.rotate(Math.PI); }
      else if (mode === "rotate-270") { ctx.translate(0, drawH); ctx.rotate(-Math.PI / 2); }
      else if (mode === "flip-h") { ctx.translate(drawW, 0); ctx.scale(-1, 1); }
      else if (mode === "flip-v") { ctx.translate(0, drawH); ctx.scale(1, -1); }
      ctx.drawImage(img, 0, 0);
      ctx.restore();

      URL.revokeObjectURL(url);
      const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => b ? res(b) : rej(new Error("Failed")), "image/png"));
      setResult(blob);
    } catch (err) { onError?.(err instanceof Error ? err.message : "Failed"); }
    finally { setProcessing(false); onProcessing?.(false); }
  };

  const fmt = (b: number) => b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(1) + " MB";
  const modes = [{"v":"flip-h","l":"↔ Horizontal"},{"v":"flip-v","l":"↕ Vertical"}];

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept="image/*" onFilesSelected={handleFile} label="Flip Image" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <div className="flex-1">
              <p className="text-sm text-text-primary truncate">{file.name}</p>
              <p className="text-xs text-text-tertiary">{fmt(originalSize)}</p>
            </div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          <div className="flex flex-wrap gap-2">
            {modes.map((m: any) => (
              <button key={m.v} onClick={() => setMode(m.v)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === m.v ? "bg-accent-start text-white" : "bg-bg-elevated text-text-secondary border border-border-base"
                }`}>{m.l}</button>
            ))}
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10">
              <p className="text-sm text-success mb-1">✓ Done!</p>
              <DownloadButton blob={result} filename={"modified-" + file.name} />
            </div>
          )}

          {!result && (
            <button onClick={process} disabled={processing} className="btn-primary w-full py-3">
              {processing ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />Processing...</span> : "Flip Image"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}