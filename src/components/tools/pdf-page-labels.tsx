"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function PdfPageLabelsTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [labelText, setLabelText] = useState("Page");
  const [position, setPosition] = useState<"bottom-center" | "top-center" | "bottom-right" | "top-right">("bottom-center");
  const [fontSize, setFontSize] = useState(10);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [pageCount, setPageCount] = useState(0);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    try {
      const { loadPdf } = await import("@/lib/engines/pdf");
      const doc = await loadPdf(f);
      setPageCount(doc.getPageCount());
    } catch {
      setPageCount(0);
    }
  }, []);

  const handleAddLabels = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { loadPdf, savePdf } = await import("@/lib/engines/pdf");
      const { StandardFonts, rgb } = await import("pdf-lib");
      const doc = await loadPdf(file);
      const font = await doc.embedFont(StandardFonts.Helvetica);

      const pages = doc.getPages();
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        const label = `${labelText} ${i + 1}`;
        const textWidth = font.widthOfTextAtSize(label, fontSize);

        let x: number, y: number;
        switch (position) {
          case "bottom-center":
            x = (width - textWidth) / 2;
            y = 25;
            break;
          case "top-center":
            x = (width - textWidth) / 2;
            y = height - 20;
            break;
          case "bottom-right":
            x = width - textWidth - 30;
            y = 25;
            break;
          case "top-right":
            x = width - textWidth - 30;
            y = height - 20;
            break;
        }

        page.drawText(label, { x, y, size: fontSize, font, color: rgb(0.4, 0.4, 0.4) });
      }

      const blob = await savePdf(doc);
      setResult(blob);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to add labels");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF" description="Select a PDF to add page labels" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <div className="flex-1">
              <p className="text-sm text-text-primary truncate">{file.name}</p>
              <p className="text-xs text-text-tertiary">{pageCount} pages</p>
            </div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Label prefix</label>
            <input type="text" value={labelText} onChange={(e) => setLabelText(e.target.value)} placeholder="Page" className="w-full px-4 py-2.5 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm focus:border-accent focus:outline-none transition-colors" />
            <p className="mt-1 text-xs text-text-tertiary">Preview: "{labelText} 1", "{labelText} 2", ...</p>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Position</label>
            <div className="grid grid-cols-2 gap-2">
              {[["bottom-center", "Bottom Center"], ["top-center", "Top Center"], ["bottom-right", "Bottom Right"], ["top-right", "Top Right"]].map(([val, label]) => (
                <button key={val} onClick={() => setPosition(val as any)} className={`py-2 rounded-lg text-sm font-medium transition-all ${position === val ? "bg-accent-start text-white" : "bg-bg-elevated text-text-secondary hover:text-text-primary border border-border-base"}`}>{label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Font size: {fontSize}pt</label>
            <input type="range" min="6" max="24" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full accent-accent-start" />
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Labels added!</p>
              <DownloadButton blob={result} filename={`labeled-${file.name}`} />
            </div>
          )}

          {!result && (
            <button onClick={handleAddLabels} disabled={processing || !labelText.trim()} className="btn-primary w-full py-3">
              {processing ? "Adding labels..." : "Add Page Labels"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
