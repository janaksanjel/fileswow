"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function ExcelToPdfTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback((files: File[]) => {
    setFile(files[0] || null);
    setResult(null);
  }, []);

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const XLSX = await import("xlsx");
      const { jsPDF } = await import("jspdf");

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });

      const pdf = new jsPDF("p", "mm", "a4");
      let isFirst = true;

      for (const sheetName of workbook.SheetNames) {
        if (!isFirst) pdf.addPage();
        isFirst = false;

        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_csv(sheet);
        const lines = data.split("\n");

        pdf.setFontSize(16);
        pdf.text(sheetName, 15, 20);

        pdf.setFontSize(10);
        let y = 35;
        for (const line of lines.slice(0, 50)) {
          if (y > 270) {
            pdf.addPage();
            y = 20;
          }
          pdf.text(line.substring(0, 100), 15, y);
          y += 5;
        }
      }

      setResult(pdf.output("blob"));
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to convert Excel to PDF");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".xlsx,.xls,.csv" onFilesSelected={handleFile} label="Drop an Excel file" description="Convert spreadsheet to PDF" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">XLSX</span>
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p><p className="text-xs text-text-tertiary">{(file.size / 1024).toFixed(0)} KB</p></div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Converted to PDF!</p>
              <DownloadButton blob={result} filename={file!.name.replace(/\.xlsx?$/i, ".pdf")} />
            </div>
          )}

          {!result && (
            <button onClick={handleConvert} disabled={processing} className="btn-primary w-full py-3">
              {processing ? "Converting..." : "Convert to PDF"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
