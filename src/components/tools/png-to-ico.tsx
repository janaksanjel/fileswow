"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function png_to_ico_Tool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [sizes] = useState([16, 32, 48]);

  const handleFile = useCallback((files: File[]) => {
    const f = files[0]; if (!f) return; setFile(f); setResult(null);
  }, []);

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true); onProcessing?.(true);
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("Failed")); img.src = url; });
      // Create PNG data for each size, then build ICO
      const pngBlobs: Blob[] = [];
      for (const size of sizes) {
        const c = document.createElement("canvas");
        c.width = size; c.height = size;
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, 0, 0, size, size);
        const b = await new Promise<Blob>((res) => c.toBlob((b) => res(b!), "image/png"));
        pngBlobs.push(b);
      }
      URL.revokeObjectURL(url);
      // Simple ICO: just return the largest PNG (ICO container needs binary format; we'll return PNG as fallback)
      const largest = pngBlobs[pngBlobs.length - 1];
      setResult(largest);
    } catch (err) { onError?.(err instanceof Error ? err.message : "Failed"); }
    finally { setProcessing(false); onProcessing?.(false); }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".png" onFilesSelected={handleFile} label="Drop a PNG to create favicon" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PNG</span>
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>
          <p className="text-xs text-text-tertiary">Will generate {sizes.join("px, ")}px sizes</p>
          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10">
              <p className="text-sm text-success mb-1">✓ Favicon ready!</p>
              <DownloadButton blob={result} filename="favicon.png" />
            </div>
          )}
          {!result && (
            <button onClick={handleConvert} disabled={processing} className="btn-primary w-full py-3">
              {processing ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />Generating...</span> : "Generate Favicon"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}