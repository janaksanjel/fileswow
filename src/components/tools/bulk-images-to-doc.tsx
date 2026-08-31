"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

type OutputFormat = "pdf" | "docx";

export default function BulkImagesToDocTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState<OutputFormat>("pdf");
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFiles = useCallback((newFiles: File[]) => { setFiles(prev => [...prev, ...newFiles]); setResult(null); }, []);

  const handleConvert = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      if (format === "pdf") {
        const { PDFDocument } = await import("pdf-lib");
        const doc = await PDFDocument.create();
        for (const file of files) {
          const bytes = await file.arrayBuffer();
          const img = file.type === "image/png" ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
          const { width, height } = img.scale(1);
          const pageWidth = 595.28, pageHeight = 841.89;
          const scale = Math.min(pageWidth / width, pageHeight / height);
          const page = doc.addPage([pageWidth, pageHeight]);
          page.drawImage(img, { x: (pageWidth - width * scale) / 2, y: (pageHeight - height * scale) / 2, width: width * scale, height: height * scale });
        }
        const pdfBytes = await doc.save();
        setResult(new Blob([pdfBytes] as BlobPart[], { type: "application/pdf" }));
      } else {
        const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import("docx");
        const { Document: DocxDocument, ImageRun } = await import("docx");
        const paragraphs: any[] = [];
        for (const file of files) {
          const bytes = await file.arrayBuffer();
          paragraphs.push(new Paragraph({ children: [new TextRun({ text: file.name, bold: true, size: 24 })], heading: HeadingLevel.HEADING_2 }));
          paragraphs.push(new Paragraph({ children: [new ImageRun({ transformation: { width: 400, height: 300 }, data: bytes, type: file.type === "image/png" ? "png" : "jpg" })], alignment: AlignmentType.CENTER }));
          paragraphs.push(new Paragraph({ children: [new TextRun({ text: "" })] }));
        }
        const doc = new Document({ sections: [{ children: paragraphs }] });
        const blob = await Packer.toBlob(doc);
        setResult(blob);
      }
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {files.length === 0 ? (
        <DropZone accept="image/*" multiple onFilesSelected={handleFiles} label="Drop images" description="Multiple JPG, PNG images" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between"><p className="text-sm text-text-secondary">{files.length} image(s)</p><button onClick={() => { setFiles([]); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger">Clear</button></div>
          <div className="grid grid-cols-4 gap-2">{files.slice(0, 8).map((f, i) => <div key={i} className="aspect-square rounded-lg bg-bg-elevated border border-border-base flex items-center justify-center text-xs text-text-tertiary">{f.name.split(".").pop()?.toUpperCase()}</div>)}{files.length > 8 && <div className="aspect-square rounded-lg bg-bg-elevated border border-border-base flex items-center justify-center text-xs text-text-tertiary">+{files.length - 8}</div>}</div>
          <div>
            <label className="block text-sm text-text-secondary mb-2">Output format</label>
            <div className="flex gap-2">{(["pdf", "docx"] as OutputFormat[]).map(f => <button key={f} onClick={() => setFormat(f)} className={`flex-1 py-2 rounded-lg text-sm font-medium uppercase transition-all ${format === f ? "bg-accent-start text-white" : "bg-bg-elevated text-text-secondary border border-border-base"}`}>{f}</button>)}</div>
          </div>
          {result && <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center"><p className="text-sm text-success mb-3">✓ Document created!</p><DownloadButton blob={result} filename={`images.${format === "docx" ? "docx" : "pdf"}`} /></div>}
          {!result && <button onClick={handleConvert} disabled={processing} className="btn-primary w-full py-3">{processing ? "Creating..." : `Create ${format.toUpperCase()} from ${files.length} images`}</button>}
        </div>
      )}
    </div>
  );
}
