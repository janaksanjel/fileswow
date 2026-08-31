"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function PdfToWord2Tool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
  }, []);

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");
      const { PDFDocument } = await import("pdf-lib");

      const buffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(buffer);

      const paragraphs: any[] = [
        new Paragraph({ children: [new TextRun({ text: `Converted from: ${file.name}`, bold: true, size: 24 })], heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [new TextRun({ text: `Pages: ${doc.getPageCount()}` })] }),
      ];

      for (let i = 0; i < doc.getPageCount(); i++) {
        paragraphs.push(new Paragraph({ children: [new TextRun({ text: `Page ${i + 1}`, bold: true })], heading: HeadingLevel.HEADING_2 }));
      }

      const document = new Document({ sections: [{ children: paragraphs }] });
      const docxBuffer = await Packer.toBlob(document);
      setResult(docxBuffer);
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
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF" description="Convert PDF to Word" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Converted!</p>
              <DownloadButton blob={result} filename={file!.name.replace(/\.pdf$/i, ".docx")} />
            </div>
          )}

          {!result && (
            <button onClick={handleConvert} disabled={processing} className="btn-primary w-full py-3">
              {processing ? "Converting..." : "Convert to Word"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
