"use client";

import { useState } from "react";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function MarkdownToWordTool({ onProcessing, onError }: ToolUIProps) {
  const [md, setMd] = useState("# Hello World\n\nThis is a **bold** and *italic* text.\n\n## Section 1\n\n- Item 1\n- Item 2\n- Item 3\n\n## Section 2\n\nSome paragraph text here.");
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleConvert = async () => {
    if (!md.trim()) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");
      const lines = md.split("\n");
      const paragraphs: any[] = [];

      for (const line of lines) {
        if (line.startsWith("# ")) paragraphs.push(new Paragraph({ children: [new TextRun({ text: line.slice(2), bold: true, size: 32 })], heading: HeadingLevel.HEADING_1 }));
        else if (line.startsWith("## ")) paragraphs.push(new Paragraph({ children: [new TextRun({ text: line.slice(3), bold: true, size: 28 })], heading: HeadingLevel.HEADING_2 }));
        else if (line.startsWith("### ")) paragraphs.push(new Paragraph({ children: [new TextRun({ text: line.slice(4), bold: true, size: 24 })], heading: HeadingLevel.HEADING_3 }));
        else if (line.startsWith("- ")) paragraphs.push(new Paragraph({ children: [new TextRun({ text: `• ${line.slice(2)}`, size: 22 })] }));
        else if (line.trim()) paragraphs.push(new Paragraph({ children: [new TextRun({ text: line, size: 22 })] }));
      }

      const doc = new Document({ sections: [{ children: paragraphs.length > 0 ? paragraphs : [new Paragraph({ children: [new TextRun({ text: " " })] })] }] });
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
      <div>
        <label className="block text-sm text-text-secondary mb-2">Markdown text</label>
        <textarea value={md} onChange={(e) => { setMd(e.target.value); setResult(null); }} rows={12} className="w-full px-4 py-3 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm font-mono focus:border-accent focus:outline-none resize-y" placeholder="Enter Markdown..." />
      </div>
      {result && (
        <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
          <p className="text-sm text-success mb-3">✓ Word document created!</p>
          <DownloadButton blob={result} filename="document.docx" />
        </div>
      )}
      {!result && <button onClick={handleConvert} disabled={processing || !md.trim()} className="btn-primary w-full py-3">{processing ? "Converting..." : "Convert to Word"}</button>}
    </div>
  );
}
