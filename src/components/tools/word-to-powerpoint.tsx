"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function WordToPowerpointTool({ onProcessing, onError }: ToolUIProps) {
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
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await mammoth.convertToHtml({ buffer });
      const div = document.createElement("div");
      div.innerHTML = result.value;

      const paragraphs: any[] = [];
      const nodes = div.querySelectorAll("h1, h2, h3, p, li");
      nodes.forEach((node) => {
        const tag = node.tagName.toLowerCase();
        const text = node.textContent?.trim() || "";
        if (!text) return;
        if (tag === "h1" || tag === "h2") {
          paragraphs.push(new Paragraph({ children: [new TextRun({ text, bold: true, size: 28 })], heading: HeadingLevel.HEADING_1, pageBreakBefore: paragraphs.length > 0 }));
        } else {
          paragraphs.push(new Paragraph({ children: [new TextRun({ text, size: 22 })] }));
        }
      });

      if (paragraphs.length === 0) paragraphs.push(new Paragraph({ children: [new TextRun({ text: div.textContent || "", size: 22 })] }));
      const doc = new Document({ sections: [{ children: paragraphs }] });
      const blob = await Packer.toBlob(doc);
      setResult(blob);
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
        <DropZone accept=".docx,.doc" onFilesSelected={handleFile} label="Drop a Word document" description="Convert DOCX to presentation format" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">DOCX</span>
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>
          {result && <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center"><p className="text-sm text-success mb-3">✓ Presentation created!</p><DownloadButton blob={result} filename={file!.name.replace(/\.docx?$/i, ".docx")} /></div>}
          {!result && <button onClick={handleConvert} disabled={processing} className="btn-primary w-full py-3">{processing ? "Converting..." : "Convert to Presentation"}</button>}
        </div>
      )}
    </div>
  );
}
