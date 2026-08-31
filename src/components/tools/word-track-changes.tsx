"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function WordTrackChangesTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [changes, setChanges] = useState<{ type: string; text: string }[]>([]);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<Blob | null>(null);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setChanges([]);
    setResult(null);
    setProcessing(true);
    onProcessing?.(true);
    try {
      const buffer = await f.arrayBuffer();
      // Parse the DOCX XML for tracked changes
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(buffer);
      const docXml = await zip.file("word/document.xml")?.async("text");
      if (docXml) {
        const insertions = [...docXml.matchAll(/<w:ins[^>]*>[\s\S]*?<w:t[^>]*>([^<]+)<\/w:t>[\s\S]*?<\/w:ins>/g)].map(m => ({ type: "insertion", text: m[1] }));
        const deletions = [...docXml.matchAll(/<w:del[^>]*>[\s\S]*?<w:delText[^>]*>([^<]+)<\/w:delText>[\s\S]*?<\/w:del>/g)].map(m => ({ type: "deletion", text: m[1] }));
        setChanges([...insertions, ...deletions]);
      }
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  }, [onError, onProcessing]);

  const handleAcceptAll = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const mammoth = (await import("mammoth")).default;
      const { Document, Packer, Paragraph, TextRun } = await import("docx");
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await mammoth.convertToHtml({ buffer });
      const div = document.createElement("div");
      div.innerHTML = result.value;
      const plainText = div.textContent || "";
      const paragraphs = plainText.split("\n").filter(Boolean).map(line =>
        new Paragraph({ children: [new TextRun({ text: line.trim(), size: 22 })] })
      );
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
        <DropZone accept=".docx,.doc" onFilesSelected={handleFile} label="Drop a Word document" description="View and accept/reject tracked changes" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">DOCX</span>
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p><p className="text-xs text-text-tertiary">{changes.length} change(s) found</p></div>
            <button onClick={() => { setFile(null); setChanges([]); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>
          {changes.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {changes.map((c, i) => (
                <div key={i} className={`p-2 rounded-lg text-sm border ${c.type === "insertion" ? "bg-success/[0.04] border-success/10 text-success" : "bg-danger/[0.04] border-danger/10 text-danger"}`}>
                  <span className="text-xs font-medium uppercase">{c.type}: </span>
                  <span className="text-text-primary">{c.text}</span>
                </div>
              ))}
            </div>
          )}
          {changes.length === 0 && !processing && <p className="text-sm text-text-secondary text-center py-4">No tracked changes detected</p>}
          {result && <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center"><p className="text-sm text-success mb-3">✓ Changes accepted!</p><DownloadButton blob={result} filename={`accepted-${file!.name}`} /></div>}
          {!result && changes.length > 0 && <button onClick={handleAcceptAll} disabled={processing} className="btn-primary w-full py-3">{processing ? "Processing..." : "Accept All Changes"}</button>}
        </div>
      )}
    </div>
  );
}
