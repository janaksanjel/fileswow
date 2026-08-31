"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function WordTocGeneratorTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback((files: File[]) => { setFile(files[0] || null); setResult(null); }, []);

  const handleGenerate = async () => {
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

      const headings: { level: number; text: string }[] = [];
      div.querySelectorAll("h1, h2, h3, h4").forEach(h => {
        const level = parseInt(h.tagName[1]);
        headings.push({ level, text: h.textContent?.trim() || "" });
      });

      const tocParagraphs = headings.map(h =>
        new Paragraph({ children: [new TextRun({ text: `${"  ".repeat(h.level - 1)}${h.text}`, size: 22 })] })
      );

      const contentParagraphs: any[] = [];
      Array.from(div.children).forEach(el => {
        const tag = el.tagName?.toLowerCase();
        const text = el.textContent?.trim() || "";
        if (!text) return;
        if (tag === "h1") contentParagraphs.push(new Paragraph({ children: [new TextRun({ text, bold: true, size: 28 })], heading: HeadingLevel.HEADING_1 }));
        else if (tag === "h2") contentParagraphs.push(new Paragraph({ children: [new TextRun({ text, bold: true, size: 24 })], heading: HeadingLevel.HEADING_2 }));
        else contentParagraphs.push(new Paragraph({ children: [new TextRun({ text, size: 22 })] }));
      });

      const doc = new Document({ sections: [{ children: [
        new Paragraph({ children: [new TextRun({ text: "Table of Contents", bold: true, size: 32 })], heading: HeadingLevel.HEADING_1 }),
        ...tocParagraphs,
        new Paragraph({ children: [new TextRun({ text: "" })] }),
        ...contentParagraphs,
      ] }] });
      const blob = await Packer.toBlob(doc);
      setResult(blob);
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
        <DropZone accept=".docx,.doc" onFilesSelected={handleFile} label="Drop a Word document" description="Auto-generate table of contents from headings" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">DOCX</span>
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>
          {result && <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center"><p className="text-sm text-success mb-3">✓ TOC generated!</p><DownloadButton blob={result} filename={`toc-${file!.name}`} /></div>}
          {!result && <button onClick={handleGenerate} disabled={processing} className="btn-primary w-full py-3">{processing ? "Generating..." : "Generate Table of Contents"}</button>}
        </div>
      )}
    </div>
  );
}
