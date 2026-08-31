"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function image_qr_generator_Tool({ onProcessing, onError }: ToolUIProps) {
  const [text, setText] = useState("https://");
  const [result, setResult] = useState<Blob | null>(null);
  const [size, setSize] = useState(256);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generate = async () => {
    if (!text) return;
    onProcessing?.(true);
    try {
      const QRCode = (await import("qrcode")).default;
      const canvas = canvasRef.current!;
      await QRCode.toCanvas(canvas, text, { width: size, margin: 1, color: { dark: "#000000", light: "#ffffff" } });
      const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => b ? res(b) : rej(new Error("Failed")), "image/png"));
      setResult(blob);
    } catch (err) { onError?.(err instanceof Error ? err.message : "Failed to generate QR"); }
    finally { onProcessing?.(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-text-secondary mb-2">URL or Text</label>
        <input value={text} onChange={(e) => { setText(e.target.value); setResult(null); }} className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm" />
      </div>
      <div><label className="block text-xs text-text-tertiary mb-1">Size: {size}px</label>
        <input type="range" min={128} max={512} step={32} value={size} onChange={(e) => { setSize(parseInt(e.target.value)); setResult(null); }} className="w-full accent-accent" /></div>
      <canvas ref={canvasRef} className="mx-auto" />
      {result && <DownloadButton blob={result} filename="qrcode.png" />}
      {!result && <button onClick={generate} disabled={!text} className="btn-primary w-full py-3">Generate QR Code</button>}
    </div>
  );
}