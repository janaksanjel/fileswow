"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function PdfPageCropMarksTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [markLength, setMarkLength] = useState(20);
  const [markOffset, setMarkOffset] = useState(9);
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

  const handleAddMarks = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { loadPdf, savePdf } = await import("@/lib/engines/pdf");
      const { rgb } = await import("pdf-lib");
      const doc = await loadPdf(file);

      for (const page of doc.getPages()) {
        const { width, height } = page.getSize();
        const lineColor = rgb(0, 0, 0);
        const lineWidth = 0.5;
        const o = markOffset;
        const l = markLength;

        // Bottom-left corner
        page.drawLine({ start: { x: 0, y: o }, end: { x: l, y: o }, color: lineColor, thickness: lineWidth });
        page.drawLine({ start: { x: o, y: 0 }, end: { x: o, y: l }, color: lineColor, thickness: lineWidth });

        // Bottom-right corner
        page.drawLine({ start: { x: width - l, y: o }, end: { x: width, y: o }, color: lineColor, thickness: lineWidth });
        page.drawLine({ start: { x: width - o, y: 0 }, end: { x: width - o, y: l }, color: lineColor, thickness: lineWidth });

        // Top-left corner
        page.drawLine({ start: { x: 0, y: height - o }, end: { x: l, y: height - o }, color: lineColor, thickness: lineWidth });
        page.drawLine({ start: { x: o, y: height - l }, end: { x: o, y: height }, color: lineColor, thickness: lineWidth });

        // Top-right corner
        page.drawLine({ start: { x: width - l, y: height - o }, end: { x: width, y: height - o }, color: lineColor, thickness: lineWidth });
        page.drawLine({ start: { x: width - o, y: height - l }, end: { x: width - o, y: height }, color: lineColor, thickness: lineWidth });
      }

      const blob = await savePdf(doc);
      setResult(blob);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to add crop marks");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF" description="Select a PDF to add crop marks" />
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
            <label className="block text-sm text-text-secondary mb-2">Mark length: {markLength}pt</label>
            <input type="range" min="5" max="40" value={markLength} onChange={(e) => setMarkLength(Number(e.target.value))} className="w-full accent-accent-start" />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Offset from edge: {markOffset}pt</label>
            <input type="range" min="3" max="20" value={markOffset} onChange={(e) => setMarkOffset(Number(e.target.value))} className="w-full accent-accent-start" />
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Crop marks added!</p>
              <DownloadButton blob={result} filename={`cropmarks-${file.name}`} />
            </div>
          )}

          {!result && (
            <button onClick={handleAddMarks} disabled={processing} className="btn-primary w-full py-3">
              {processing ? "Adding marks..." : "Add Crop Marks"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
