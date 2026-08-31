"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function MergeWordTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFiles = useCallback((newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles]);
    setResult(null);
  }, []);

  const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const handleMerge = async () => {
    if (files.length < 2) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const mammoth = (await import("mammoth")).default;
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");
      const paragraphs: any[] = [];

      for (let i = 0; i < files.length; i++) {
        if (i > 0) paragraphs.push(new Paragraph({ children: [], pageBreakBefore: true }));
        paragraphs.push(new Paragraph({ children: [new TextRun({ text: files[i].name, bold: true, size: 28 })], heading: HeadingLevel.HEADING_1 }));
        try {
          const buffer = Buffer.from(await files[i].arrayBuffer());
          const result = await mammoth.convertToHtml({ buffer });
          const div = document.createElement("div");
          div.innerHTML = result.value;
          const text = div.textContent || div.innerText || "";
          text.split("\n").filter(Boolean).forEach(line => {
            paragraphs.push(new Paragraph({ children: [new TextRun({ text: line.trim(), size: 22 })] }));
          });
        } catch {
          paragraphs.push(new Paragraph({ children: [new TextRun({ text: `[Could not read ${files[i].name}]`, color: "999999" })] }));
        }
      }

      const doc = new Document({ sections: [{ children: paragraphs }] });
      const blob = await Packer.toBlob(doc);
      setResult(blob);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to merge Word documents");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {files.length === 0 ? (
        <DropZone accept=".docx,.doc" multiple onFilesSelected={handleFiles} label="Drop Word documents" description="Select 2 or more DOCX files" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between"><p className="text-sm text-text-secondary">{files.length} file(s)</p><button onClick={() => { setFiles([]); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger">Clear all</button></div>
          <div className="space-y-2">
            {files.map((f, i) => (
              <div key={`${f.name}-${i}`} className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
                <span className="text-xs text-text-tertiary w-6 text-center font-mono">{i + 1}</span>
                <span className="text-sm text-text-primary truncate flex-1">{f.name}</span>
                <span className="text-xs text-text-tertiary">{(f.size / 1024).toFixed(0)}KB</span>
                <button onClick={() => removeFile(i)} className="text-text-tertiary hover:text-danger text-xs">✕</button>
              </div>
            ))}
          </div>
          <DropZone accept=".docx,.doc" multiple onFilesSelected={handleFiles} label="Add more" description="Drop more DOCX files" />
          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Merged!</p>
              <DownloadButton blob={result} filename="merged.docx" />
            </div>
          )}
          {!result && <button onClick={handleMerge} disabled={processing || files.length < 2} className="btn-primary w-full py-3">{processing ? "Merging..." : `Merge ${files.length} documents`}</button>}
        </div>
      )}
    </div>
  );
}
