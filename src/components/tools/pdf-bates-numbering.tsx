"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function PdfBatesNumberingTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [prefix, setPrefix] = useState("DOC");
  const [startNumber, setStartNumber] = useState(1);
  const [padding, setPadding] = useState(6);
  const [position, setPosition] = useState<"bottom-center" | "bottom-left" | "bottom-right">("bottom-center");
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

  const handleAddBates = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { loadPdf, savePdf } = await import("@/lib/engines/pdf");
      const { StandardFonts, rgb } = await import("pdf-lib");
      const doc = await loadPdf(file);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const fontSize = 9;

      const pages = doc.getPages();
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        const batesNumber = String(startNumber + i).padStart(padding, "0");
        const batesText = `${prefix}-${batesNumber}`;
        const textWidth = font.widthOfTextAtSize(batesText, fontSize);

        let x: number, y: number;
        switch (position) {
          case "bottom-center":
            x = (width - textWidth) / 2;
            y = 15;
            break;
          case "bottom-left":
            x = 20;
            y = 15;
            break;
          case "bottom-right":
            x = width - textWidth - 20;
            y = 15;
            break;
        }

        page.drawText(batesText, { x, y, size: fontSize, font, color: rgb(0.2, 0.2, 0.2) });
      }

      const blob = await savePdf(doc);
      setResult(blob);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to add Bates numbers");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  const exampleNumber = String(startNumber).padStart(padding, "0");

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF" description="Select a PDF for Bates numbering" />
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-2">Prefix</label>
              <input type="text" value={prefix} onChange={(e) => setPrefix(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm font-mono focus:border-accent focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-2">Start number</label>
              <input type="number" min="0" value={startNumber} onChange={(e) => setStartNumber(Number(e.target.value))} className="w-full px-4 py-2.5 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm font-mono focus:border-accent focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Zero-padding: {padding} digits</label>
            <input type="range" min="3" max="10" value={padding} onChange={(e) => setPadding(Number(e.target.value))} className="w-full accent-accent-start" />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Position</label>
            <div className="flex gap-2">
              {[["bottom-center", "Center"], ["bottom-left", "Left"], ["bottom-right", "Right"]].map(([val, label]) => (
                <button key={val} onClick={() => setPosition(val as any)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${position === val ? "bg-accent-start text-white" : "bg-bg-elevated text-text-secondary border border-border-base"}`}>{label}</button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-bg-elevated border border-border-base">
            <p className="text-xs text-text-secondary">Preview: <code className="font-mono text-accent">{prefix}-{exampleNumber}</code>, <code className="font-mono text-accent">{prefix}-{String(startNumber + 1).padStart(padding, "0")}</code>, ...</p>
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Bates numbers added!</p>
              <DownloadButton blob={result} filename={`bates-${file.name}`} />
            </div>
          )}

          {!result && (
            <button onClick={handleAddBates} disabled={processing} className="btn-primary w-full py-3">
              {processing ? "Stamping..." : "Add Bates Numbers"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
