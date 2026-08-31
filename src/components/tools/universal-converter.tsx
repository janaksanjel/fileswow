"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

type OutputFormat = "pdf" | "docx" | "txt";

export default function UniversalConverterTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<OutputFormat>("pdf");
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback((files: File[]) => { setFile(files[0] || null); setResult(null); }, []);

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      if (format === "txt") {
        const text = await file.text();
        setResult(new Blob([text], { type: "text/plain" }));
      } else if (format === "pdf") {
        if (ext === "jpg" || ext === "jpeg" || ext === "png") {
          const { PDFDocument } = await import("pdf-lib");
          const doc = await PDFDocument.create();
          const bytes = await file.arrayBuffer();
          const img = ext === "png" ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
          const page = doc.addPage([595.28, 841.89]);
          const scale = Math.min(595.28 / img.width, 841.89 / img.height);
          page.drawImage(img, { x: (595.28 - img.width * scale) / 2, y: (841.89 - img.height * scale) / 2, width: img.width * scale, height: img.height * scale });
          const pdfBytes = await doc.save();
          setResult(new Blob([pdfBytes] as BlobPart[], { type: "application/pdf" }));
        } else if (ext === "html" || ext === "htm") {
          const html = await file.text();
          const { jsPDF } = await import("jspdf");
          const html2canvas = (await import("html2canvas")).default;
          const div = document.createElement("div");
          div.innerHTML = html;
          div.style.cssText = "position:absolute;left:-9999px;top:0;width:800px;padding:40px;font-family:Arial,sans-serif;";
          document.body.appendChild(div);
          const canvas = await html2canvas(div, { scale: 1.5 });
          document.body.removeChild(div);
          const pdf = new jsPDF("p", "mm", "a4");
          pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, (canvas.height * 210) / canvas.width);
          setResult(pdf.output("blob"));
        } else {
          const text = await file.text();
          const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
          const doc = await PDFDocument.create();
          const font = await doc.embedFont(StandardFonts.Helvetica);
          const page = doc.addPage([595.28, 841.89]);
          text.split("\n").slice(0, 50).forEach((line, i) => {
            page.drawText(line.substring(0, 80), { x: 50, y: 790 - i * 20, size: 12, font, color: rgb(0.1, 0.1, 0.1) });
          });
          const pdfBytes = await doc.save();
          setResult(new Blob([pdfBytes] as BlobPart[], { type: "application/pdf" }));
        }
      } else if (format === "docx") {
        const { Document, Packer, Paragraph, TextRun } = await import("docx");
        const text = await file.text();
        const paragraphs = text.split("\n").map(line => new Paragraph({ children: [new TextRun({ text: line || " ", size: 22 })] }));
        const doc = new Document({ sections: [{ children: paragraphs }] });
        setResult(await Packer.toBlob(doc));
      }
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
        <DropZone accept="*/*" onFilesSelected={handleFile} label="Drop any file" description="PDF, DOCX, TXT, HTML, images — convert to any format" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">{file.name.split(".").pop()?.toUpperCase() || "?"}</span>
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p><p className="text-xs text-text-tertiary">{(file.size / 1024).toFixed(0)} KB</p></div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-2">Convert to</label>
            <div className="flex gap-2">
              {(["pdf", "docx", "txt"] as OutputFormat[]).map(f => (
                <button key={f} onClick={() => setFormat(f)} className={`flex-1 py-2 rounded-lg text-sm font-medium uppercase transition-all ${format === f ? "bg-accent-start text-white" : "bg-bg-elevated text-text-secondary border border-border-base"}`}>{f}</button>
              ))}
            </div>
          </div>
          {result && <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center"><p className="text-sm text-success mb-3">✓ Converted!</p><DownloadButton blob={result} filename={file!.name.replace(/\.[^.]+$/, `.${format === "docx" ? "docx" : format}`)} /></div>}
          {!result && <button onClick={handleConvert} disabled={processing} className="btn-primary w-full py-3">{processing ? "Converting..." : `Convert to ${format.toUpperCase()}`}</button>}
        </div>
      )}
    </div>
  );
}
