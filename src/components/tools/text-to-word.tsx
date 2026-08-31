"use client";

import { useState } from "react";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function TextToWordTool({ onProcessing, onError }: ToolUIProps) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleConvert = async () => {
    if (!text.trim()) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { Document, Packer, Paragraph, TextRun } = await import("docx");
      const paragraphs = text.split("\n").map(line =>
        new Paragraph({ children: [new TextRun({ text: line || " ", size: 24 })] })
      );
      const doc = new Document({ sections: [{ children: paragraphs }] });
      const blob = await Packer.toBlob(doc);
      setResult(blob);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to create Word document");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-text-secondary mb-2">Enter your text</label>
        <textarea value={text} onChange={(e) => { setText(e.target.value); setResult(null); }} rows={12} className="w-full px-4 py-3 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm font-mono focus:border-accent focus:outline-none resize-y" placeholder="Paste or type text here..." />
        <p className="mt-1 text-xs text-text-tertiary">{text.length} characters · {text.split("\n").length} lines</p>
      </div>
      {result && (
        <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
          <p className="text-sm text-success mb-3">✓ Word document created!</p>
          <DownloadButton blob={result} filename="document.docx" />
        </div>
      )}
      {!result && <button onClick={handleConvert} disabled={processing || !text.trim()} className="btn-primary w-full py-3">{processing ? "Creating..." : "Convert to Word"}</button>}
    </div>
  );
}
