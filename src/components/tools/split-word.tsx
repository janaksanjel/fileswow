"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function SplitWordTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<{ name: string; blob: Blob }[]>([]);
  const [processing, setProcessing] = useState(false);
  const [splitBy, setSplitBy] = useState<"heading" | "pages">("heading");

  const handleFile = useCallback((files: File[]) => { setFile(files[0] || null); setResults([]); }, []);

  const handleSplit = async () => {
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
      const text = div.textContent || "";

      const parts = text.split(splitBy === "heading" ? /(?=^[A-Z][^\n]{5,}$)/m : /---PAGE BREAK---/).filter(s => s.trim());
      const docs: { name: string; blob: Blob }[] = [];

      for (let i = 0; i < parts.length; i++) {
        const paras = parts[i].split("\n").filter(Boolean).map(line =>
          new Paragraph({ children: [new TextRun({ text: line.trim(), size: 22 })] })
        );
        const doc = new Document({ sections: [{ children: paras }] });
        const blob = await Packer.toBlob(doc);
        docs.push({ name: `part-${i + 1}.docx`, blob });
      }
      setResults(docs);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to split");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  const downloadAll = async () => {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    for (const r of results) zip.file(r.name, r.blob);
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a"); a.href = url; a.download = "split-parts.zip"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".docx,.doc" onFilesSelected={handleFile} label="Drop a Word document" description="Select a DOCX to split" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">DOCX</span>
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); setResults([]); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Split by</label>
            <div className="flex gap-2">
              {[["heading", "Headings"], ["pages", "Pages"]].map(([val, label]) => (
                <button key={val} onClick={() => setSplitBy(val as any)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${splitBy === val ? "bg-accent-start text-white" : "bg-bg-elevated text-text-secondary border border-border-base"}`}>{label}</button>
              ))}
            </div>
          </div>

          {results.length > 0 && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10">
              <p className="text-sm text-success mb-3">✓ Split into {results.length} parts</p>
              <div className="flex flex-wrap gap-2">
                {results.map(r => <DownloadButton key={r.name} blob={r.blob} filename={r.name} label={r.name} />)}
                {results.length > 1 && <button onClick={downloadAll} className="px-4 py-2 rounded-lg text-sm font-medium text-text-primary bg-bg-surface border border-border-base hover:bg-bg-elevated">📦 Download all</button>}
              </div>
            </div>
          )}

          {!results.length && <button onClick={handleSplit} disabled={processing} className="btn-primary w-full py-3">{processing ? "Splitting..." : "Split Document"}</button>}
        </div>
      )}
    </div>
  );
}
