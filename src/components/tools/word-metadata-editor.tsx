"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function WordMetadataEditorTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState({ title: "", author: "", subject: "", keywords: "" });
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback((files: File[]) => { setFile(files[0] || null); setResult(null); }, []);

  const handleSave = async () => {
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
      const plainText = div.textContent || "";
      const paragraphs = [
        new Paragraph({ children: [new TextRun({ text: `Title: ${meta.title || "Untitled"}`, bold: true, size: 28 })], heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [new TextRun({ text: `Author: ${meta.author || "Unknown"}`, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `Subject: ${meta.subject || "N/A"}`, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `Keywords: ${meta.keywords || "N/A"}`, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: "" })] }),
        ...plainText.split("\n").filter(Boolean).map(line => new Paragraph({ children: [new TextRun({ text: line.trim(), size: 22 })] })),
      ];
      const doc = new Document({ sections: [{ children: paragraphs }] });
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
        <DropZone accept=".docx,.doc" onFilesSelected={handleFile} label="Drop a Word document" description="Edit metadata in DOCX" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">DOCX</span>
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>
          {Object.entries(meta).map(([key, val]) => (
            <div key={key}><label className="block text-sm text-text-secondary mb-1 capitalize">{key}</label><input type="text" value={val} onChange={(e) => setMeta(prev => ({ ...prev, [key]: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm focus:border-accent focus:outline-none" placeholder={`Enter ${key}...`} /></div>
          ))}
          {result && <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center"><p className="text-sm text-success mb-3">✓ Metadata updated!</p><DownloadButton blob={result} filename={`meta-${file!.name}`} /></div>}
          {!result && <button onClick={handleSave} disabled={processing} className="btn-primary w-full py-3">{processing ? "Saving..." : "Save Metadata"}</button>}
        </div>
      )}
    </div>
  );
}
