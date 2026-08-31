"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function WordToPdf2Tool({ onProcessing, onError }: ToolUIProps) {
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
      const mammoth = await import("mammoth");
      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const result = await mammoth.default.convertToHtml({ buffer });

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = result.value || "<p>No content</p>";
      tempDiv.style.cssText = "position:absolute;left:-9999px;top:0;width:800px;padding:40px;font-family:Arial,sans-serif;font-size:14px;color:#000;background:#fff;";
      document.body.appendChild(tempDiv);

      const canvas = await html2canvas(tempDiv, { scale: 1.5 });
      document.body.removeChild(tempDiv);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      setResult(pdf.output("blob"));
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to convert");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".docx,.doc" onFilesSelected={handleFile} label="Drop a Word file" description="Convert DOCX to PDF" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">DOCX</span>
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Converted!</p>
              <DownloadButton blob={result} filename={file!.name.replace(/\.docx?$/i, ".pdf")} />
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
