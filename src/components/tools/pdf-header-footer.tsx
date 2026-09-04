"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function PdfHeaderFooterTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [headerText, setHeaderText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [fontSize, setFontSize] = useState(10);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback((files: File[]) => {
    setFile(files[0] || null);
    setResult(null);
  }, []);

  const handleAdd = async () => {
    if (!file || (!headerText.trim() && !footerText.trim())) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { loadPdf, savePdf } = await import("@/lib/engines/pdf");
      const { StandardFonts, rgb } = await import("pdf-lib");
      const doc = await loadPdf(file);
      const font = await doc.embedFont(StandardFonts.Helvetica);

      for (const page of doc.getPages()) {
        const { width, height } = page.getSize();

        if (headerText.trim()) {
          const textWidth = font.widthOfTextAtSize(headerText, fontSize);
          page.drawText(headerText, {
            x: width / 2 - textWidth / 2,
            y: height - 30,
            size: fontSize,
            font,
            color: rgb(0.3, 0.3, 0.3),
          });
        }

        if (footerText.trim()) {
          const textWidth = font.widthOfTextAtSize(footerText, fontSize);
          page.drawText(footerText, {
            x: width / 2 - textWidth / 2,
            y: 20,
            size: fontSize,
            font,
            color: rgb(0.3, 0.3, 0.3),
          });
        }
      }

      const blob = await savePdf(doc);
      setResult(blob);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to add header/footer");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF" description="Select a single PDF file" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <span className="text-sm text-text-primary truncate flex-1">{file.name}</span>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Header text</label>
            <input
              type="text"
              value={headerText}
              onChange={(e) => setHeaderText(e.target.value)}
              placeholder="Optional header..."
              className="w-full px-4 py-2.5 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Footer text</label>
            <input
              type="text"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder="Optional footer..."
              className="w-full px-4 py-2.5 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Font size: {fontSize}pt</label>
            <input type="range" min="6" max="24" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full accent-accent-start" />
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Header/Footer added!</p>
              <DownloadButton blob={result} filename={`headered-${file.name}`} />
            </div>
          )}

          {!result && (
            <button onClick={handleAdd} disabled={processing || (!headerText.trim() && !footerText.trim())} className="btn-primary w-full py-3">
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />
                  Processing...
                </span>
              ) : "Add Header & Footer"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
