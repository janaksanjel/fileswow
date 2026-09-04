"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

const STAMPS = [
  { label: "APPROVED", color: "#22c55e" },
  { label: "REJECTED", color: "#ef4444" },
  { label: "DRAFT", color: "#f59e0b" },
  { label: "CONFIDENTIAL", color: "#6366f1" },
  { label: "PAID", color: "#22c55e" },
  { label: "PENDING", color: "#f59e0b" },
];

export default function PdfStampTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [stampText, setStampText] = useState("APPROVED");
  const [stampColor, setStampColor] = useState("#22c55e");
  const [fontSize, setFontSize] = useState(60);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback((files: File[]) => {
    setFile(files[0] || null);
    setResult(null);
  }, []);

  const handleStamp = async () => {
    if (!file || !stampText.trim()) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { loadPdf, savePdf } = await import("@/lib/engines/pdf");
      const { StandardFonts, rgb, degrees } = await import("pdf-lib");
      const doc = await loadPdf(file);
      const font = await doc.embedFont(StandardFonts.HelveticaBold);

      const hex = stampColor.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;

      for (const page of doc.getPages()) {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(stampText, fontSize);
        page.drawText(stampText, {
          x: width / 2 - textWidth / 2,
          y: height / 2,
          size: fontSize,
          font,
          color: rgb(r, g, b),
          opacity: 0.4,
          rotate: degrees(-30),
        });
      }

      const blob = await savePdf(doc);
      setResult(blob);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to stamp PDF");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF to stamp" description="Select a single PDF file" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <span className="text-sm text-text-primary truncate flex-1">{file.name}</span>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          {/* Quick stamps */}
          <div>
            <label className="block text-sm text-text-secondary mb-2">Quick stamps</label>
            <div className="flex flex-wrap gap-2">
              {STAMPS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => { setStampText(s.label); setStampColor(s.color); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border-base hover:border-border-accent transition-colors"
                  style={{ color: s.color }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Stamp text</label>
            <input
              type="text"
              value={stampText}
              onChange={(e) => setStampText(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Color</label>
            <input type="color" value={stampColor} onChange={(e) => setStampColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Font size: {fontSize}px</label>
            <input type="range" min="24" max="100" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full accent-accent-start" />
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Stamp applied!</p>
              <DownloadButton blob={result} filename={`stamped-${file.name}`} />
            </div>
          )}

          {!result && (
            <button onClick={handleStamp} disabled={processing || !stampText.trim()} className="btn-primary w-full py-3">
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />
                  Stamping...
                </span>
              ) : "Apply Stamp"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
