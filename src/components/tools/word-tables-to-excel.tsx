"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function WordTablesToExcelTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback((files: File[]) => { setFile(files[0] || null); setResult(null); }, []);

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const mammoth = (await import("mammoth")).default;
      const XLSX = await import("xlsx");
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await mammoth.convertToHtml({ buffer });
      const div = document.createElement("div");
      div.innerHTML = result.value;
      const tables = div.querySelectorAll("table");
      const wb = XLSX.utils.book_new();

      if (tables.length > 0) {
        tables.forEach((table, i) => {
          const data = Array.from(table.rows).map(row =>
            Array.from(row.cells).map(cell => cell.textContent || "")
          );
          const ws = XLSX.utils.aoa_to_sheet(data);
          XLSX.utils.book_append_sheet(wb, ws, `Table ${i + 1}`);
        });
      } else {
        const plainText = div.textContent || "";
        const lines = plainText.split("\n").filter(Boolean).map(l => [l.trim()]);
        const ws = XLSX.utils.aoa_to_sheet(lines);
        XLSX.utils.book_append_sheet(wb, ws, "Content");
      }

      const xlsxBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      setResult(new Blob([xlsxBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".docx,.doc" onFilesSelected={handleFile} label="Drop a Word document" description="Extract tables from DOCX to Excel" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">DOCX</span>
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>
          {result && <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center"><p className="text-sm text-success mb-3">✓ Tables extracted!</p><DownloadButton blob={result} filename={file!.name.replace(/\.docx?$/i, ".xlsx")} /></div>}
          {!result && <button onClick={handleConvert} disabled={processing} className="btn-primary w-full py-3">{processing ? "Extracting..." : "Extract Tables to Excel"}</button>}
        </div>
      )}
    </div>
  );
}
