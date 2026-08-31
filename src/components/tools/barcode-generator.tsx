"use client";

import { useState, useRef, useEffect } from "react";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function barcode_generator_Tool({ onProcessing, onError }: ToolUIProps) {
  const [text, setText] = useState("123456789");
  const [format, setFormat] = useState("CODE128");
  const [result, setResult] = useState<Blob | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generate = async () => {
    if (!text) return;
    onProcessing?.(true);
    try {
      const JsBarcode = (await import("jsbarcode")).default;
      JsBarcode(canvasRef.current!, text, { format, displayValue: true, width: 2, height: 100 });
      const blob = await new Promise<Blob>((res, rej) => canvasRef.current!.toBlob((b) => b ? res(b) : rej(new Error("Failed")), "image/png"));
      setResult(blob);
    } catch (err) { onError?.(err instanceof Error ? err.message : "Failed to generate barcode"); }
    finally { onProcessing?.(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-text-secondary mb-2">Data</label>
        <input value={text} onChange={(e) => { setText(e.target.value); setResult(null); }} className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm" />
      </div>
      <div>
        <label className="block text-sm text-text-secondary mb-2">Format</label>
        <select value={format} onChange={(e) => { setFormat(e.target.value); setResult(null); }} className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm">
          {["CODE128","CODE39","EAN13","EAN8","UPC","ITF14","MSI","pharmacode"].map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>
      <div className="text-center"><canvas ref={canvasRef} /></div>
      {result && <DownloadButton blob={result} filename="barcode.png" />}
      {!result && <button onClick={generate} disabled={!text} className="btn-primary w-full py-3">Generate Barcode</button>}
    </div>
  );
}