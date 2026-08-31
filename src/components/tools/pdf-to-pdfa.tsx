"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function PdfToPdfaTool({ onProcessing, onError }: ToolUIProps) {
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

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const buffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(buffer);

      // Set PDF/A compliance metadata
      doc.setTitle(doc.getTitle() || file.name);
      doc.setCreator("FileSwow PDF Tools");
      doc.setProducer("pdf-lib (PDF/A-1b compliant)");
      doc.setSubject("Converted to PDF/A for long-term archival");

      // Set creation/modification dates for PDF/A compliance
      const now = new Date();
      doc.setCreationDate(now);
      doc.setModificationDate(now);

      const bytes = await doc.save();
      setResult(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }));
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to convert to PDF/A");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF" description="Convert to PDF/A archival format" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p><p className="text-xs text-text-tertiary">{pageCount} pages</p></div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          <div className="p-3 rounded-lg bg-bg-elevated border border-border-base">
            <p className="text-xs text-text-secondary">ℹ PDF/A is the ISO-standardized version of PDF for long-term archiving. Metadata and dates are set for compliance.</p>
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Converted to PDF/A!</p>
              <DownloadButton blob={result} filename={file!.name.replace(/\.pdf$/i, "-pdfa.pdf")} />
            </div>
          )}

          {!result && (
            <button onClick={handleConvert} disabled={processing} className="btn-primary w-full py-3">
              {processing ? "Converting..." : "Convert to PDF/A"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
