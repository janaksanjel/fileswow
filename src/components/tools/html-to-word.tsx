"use client";

import { useState } from "react";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function HtmlToWordTool({ onProcessing, onError }: ToolUIProps) {
  const [html, setHtml] = useState("<h1>Hello World</h1>\n<p>This is a paragraph.</p>\n<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>");
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleConvert = async () => {
    if (!html.trim()) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");
      const div = document.createElement("div");
      div.innerHTML = html;

      const paragraphs: any[] = [];
      const processNode = (node: ChildNode) => {
        if (node.nodeType === 3) {
          const text = node.textContent?.trim();
          if (text) paragraphs.push(new Paragraph({ children: [new TextRun({ text, size: 24 })] }));
        } else if (node.nodeType === 1) {
          const el = node as HTMLElement;
          const tag = el.tagName.toLowerCase();
          if (tag === "h1") paragraphs.push(new Paragraph({ children: [new TextRun({ text: el.textContent || "", bold: true, size: 32 })], heading: HeadingLevel.HEADING_1 }));
          else if (tag === "h2") paragraphs.push(new Paragraph({ children: [new TextRun({ text: el.textContent || "", bold: true, size: 28 })], heading: HeadingLevel.HEADING_2 }));
          else if (tag === "p") paragraphs.push(new Paragraph({ children: [new TextRun({ text: el.textContent || "", size: 24 })] }));
          else if (tag === "li") paragraphs.push(new Paragraph({ children: [new TextRun({ text: `• ${el.textContent || ""}`, size: 24 })] }));
          else el.childNodes.forEach(processNode);
        }
      };
      div.childNodes.forEach(processNode);
      if (paragraphs.length === 0) paragraphs.push(new Paragraph({ children: [new TextRun({ text: div.textContent || "", size: 24 })] }));

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
      <div>
        <label className="block text-sm text-text-secondary mb-2">HTML code</label>
        <textarea value={html} onChange={(e) => { setHtml(e.target.value); setResult(null); }} rows={10} className="w-full px-4 py-3 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm font-mono focus:border-accent focus:outline-none resize-y" placeholder="Enter HTML..." />
      </div>
      <div>
        <label className="block text-sm text-text-secondary mb-2">Preview</label>
        <div className="p-6 rounded-lg bg-white text-black min-h-[100px] border border-border-base" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
      {result && (
        <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
          <p className="text-sm text-success mb-3">✓ Word document created!</p>
          <DownloadButton blob={result} filename="document.docx" />
        </div>
      )}
      {!result && <button onClick={handleConvert} disabled={processing || !html.trim()} className="btn-primary w-full py-3">{processing ? "Converting..." : "Convert to Word"}</button>}
    </div>
  );
}
