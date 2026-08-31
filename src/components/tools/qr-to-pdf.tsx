"use client";

import { useState } from "react";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function QrToPdfTool({ onProcessing, onError }: ToolUIProps) {
  const [text, setText] = useState("https://example.com");
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const QRCode = (await import("qrcode")).default;
      const { PDFDocument } = await import("pdf-lib");
      const dataUrl = await QRCode.toDataURL(text, { width: 400, margin: 2 });
      const doc = await PDFDocument.create();
      const page = doc.addPage([595.28, 841.89]);

      // Embed QR code image
      const response = await fetch(dataUrl);
      const imgBytes = await response.arrayBuffer();
      const img = await doc.embedPng(imgBytes);
      const size = 300;
      page.drawImage(img, {
        x: (595.28 - size) / 2,
        y: (841.89 - size) / 2 + 50,
        width: size,
        height: size,
      });

      const { StandardFonts, rgb } = await import("pdf-lib");
      const font = await doc.embedFont(StandardFonts.Helvetica);
      page.drawText(text.substring(0, 60), {
        x: 50, y: 250, size: 12, font, color: rgb(0.3, 0.3, 0.3),
      });

      const pdfBytes = await doc.save();
      setResult(new Blob([pdfBytes] as BlobPart[], { type: "application/pdf" }));
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to generate QR code");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-text-secondary mb-2">URL or text</label>
        <input type="text" value={text} onChange={(e) => { setText(e.target.value); setResult(null); }} className="w-full px-4 py-2.5 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm focus:border-accent focus:outline-none" placeholder="Enter URL or text..." />
      </div>
      {result && <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center"><p className="text-sm text-success mb-3">✓ QR code PDF created!</p><DownloadButton blob={result} filename="qrcode.pdf" /></div>}
      {!result && <button onClick={handleGenerate} disabled={processing || !text.trim()} className="btn-primary w-full py-3">{processing ? "Generating..." : "Generate QR Code PDF"}</button>}
    </div>
  );
}
