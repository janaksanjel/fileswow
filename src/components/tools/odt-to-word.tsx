"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function OdtToWordTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback((files: File[]) => { setFile(files[0] || null); setResult(null); }, []);

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const JSZip = (await import("jszip")).default;
      const { Document, Packer, Paragraph, TextRun } = await import("docx");
      const buffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer);
      const contentFile = zip.file("content.xml");
      if (!contentFile) throw new Error("Invalid ODT file");
      const xml = await contentFile.async("text");
      const text = xml.replace(/<[^>]+>/g, " ").replace(/&[^;]+;/g, " ").replace(/\s+/g, " ").trim();
      const paragraphs = text.split(/[.!?]+/).filter(s => s.trim()).map(s =>
        new Paragraph({ children: [new TextRun({ text: s.trim(), size: 22 })] })
      );
      const doc = new Document({ sections: [{ children: paragraphs.length > 0 ? paragraphs : [new Paragraph({ children: [new TextRun(" ")] })] }] });
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
        <DropZone accept=".odt" onFilesSelected={handleFile} label="Drop an ODT file" description="Convert OpenDocument to Word" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">ODT</span>
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>
          {result && <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center"><p className="text-sm text-success mb-3">✓ Word document created!</p><DownloadButton blob={result} filename={file!.name.replace(/\.odt$/i, ".docx")} /></div>}
          {!result && <button onClick={handleConvert} disabled={processing} className="btn-primary w-full py-3">{processing ? "Converting..." : "Convert to Word"}</button>}
        </div>
      )}
    </div>
  );
}
