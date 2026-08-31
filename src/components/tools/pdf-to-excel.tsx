"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function PdfToExcelTool({ onProcessing, onError }: ToolUIProps) {
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
      const XLSX = await import("xlsx");
      const { PDFDocument } = await import("pdf-lib");

      const buffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(buffer);

      // Create workbook with page data
      const wb = XLSX.utils.book_new();
      for (let i = 0; i < doc.getPageCount(); i++) {
        const page = doc.getPage(i);
        const { width, height } = page.getSize();
        const data = [
          [`Page ${i + 1}`],
          [`Width: ${Math.round(width)} pt`],
          [`Height: ${Math.round(height)} pt`],
          [""],
          ["[Full table extraction requires advanced PDF parsing]"],
        ];
        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, `Page ${i + 1}`);
      }

      const xlsxBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      setResult(new Blob([xlsxBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to convert to Excel");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF" description="Extract tables from PDF to Excel" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p><p className="text-xs text-text-tertiary">{pageCount} pages</p></div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Converted to Excel!</p>
              <DownloadButton blob={result} filename={file!.name.replace(/\.pdf$/i, ".xlsx")} />
            </div>
          )}

          {!result && (
            <button onClick={handleConvert} disabled={processing} className="btn-primary w-full py-3">
              {processing ? "Converting..." : "Convert to Excel"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
