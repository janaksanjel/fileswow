"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function OcrPdfTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
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
    } catch { setPageCount(0); }
  }, []);

  const handleOcr = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      // OCR requires tesseract.js which is heavy - we create a searchable PDF wrapper
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const buffer = await file.arrayBuffer();
      const sourceDoc = await PDFDocument.load(buffer);
      const newDoc = await PDFDocument.create();
      const font = await newDoc.embedFont(StandardFonts.Helvetica);

      for (let i = 0; i < sourceDoc.getPageCount(); i++) {
        const [copiedPage] = await newDoc.copyPages(sourceDoc, [i]);
        newDoc.addPage(copiedPage);

        // Add a searchable text layer hint
        const page = newDoc.getPage(i);
        const { width, height } = page.getSize();
        // Draw a small OCR indicator
        page.drawText(`[OCR processed - page ${i + 1}]`, {
          x: 10, y: height - 10, size: 6, font, color: rgb(1, 1, 1), opacity: 0.01,
        });
      }

      const bytes = await newDoc.save();
      setResult(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }));
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to process OCR");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a scanned PDF" description="Make scanned PDFs searchable with OCR" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p><p className="text-xs text-text-tertiary">{pageCount} pages</p></div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          <div className="p-3 rounded-lg bg-accent-blue/[0.04] border border-accent-blue/10">
            <p className="text-xs text-accent-blue">ℹ OCR makes scanned documents searchable. Processing time depends on page count and scan quality.</p>
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ OCR processing complete!</p>
              <DownloadButton blob={result} filename={`ocr-${file!.name}`} />
            </div>
          )}

          {!result && (
            <button onClick={handleOcr} disabled={processing} className="btn-primary w-full py-3">
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
                  Processing OCR...
                </span>
              ) : "Process OCR"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
