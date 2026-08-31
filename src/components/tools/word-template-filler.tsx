"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

interface Placeholder { key: string; value: string; }

export default function WordTemplateFillerTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    try {
      const mammoth = (await import("mammoth")).default;
      const buffer = Buffer.from(await f.arrayBuffer());
      const result = await mammoth.extractRawText({ buffer });
      const matches = [...result.value.matchAll(/\{\{(\w+)\}\}/g)];
      const unique = [...new Set(matches.map(m => m[1]))];
      setPlaceholders(unique.map(key => ({ key, value: "" })));
    } catch { setPlaceholders([]); }
  }, []);

  const updateValue = (idx: number, value: string) => {
    setPlaceholders(prev => prev.map((p, i) => i === idx ? { ...p, value } : p));
  };

  const handleFill = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const mammoth = (await import("mammoth")).default;
      const { Document, Packer, Paragraph, TextRun } = await import("docx");
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await mammoth.convertToHtml({ buffer });
      let html = result.value;
      for (const p of placeholders) {
        html = html.split(`{{${p.key}}}`).join(p.value || `[${p.key}]`);
      }
      const div = document.createElement("div");
      div.innerHTML = html;
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
        <DropZone accept=".docx,.doc" onFilesSelected={handleFile} label="Drop a Word template" description="Fill {{placeholder}} tags with values" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">DOCX</span>
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p><p className="text-xs text-text-tertiary">{placeholders.length} placeholder(s) found</p></div>
            <button onClick={() => { setFile(null); setResult(null); setPlaceholders([]); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>
          {placeholders.map((p, i) => (
            <div key={i}><label className="block text-xs text-text-secondary mb-1">{`{{${p.key}}}`}</label><input type="text" value={p.value} onChange={(e) => updateValue(i, e.target.value)} className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm focus:border-accent focus:outline-none" placeholder={`Value for ${p.key}...`} /></div>
          ))}
          {result && <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center"><p className="text-sm text-success mb-3">✓ Template filled!</p><DownloadButton blob={result} filename={`filled-${file!.name}`} /></div>}
          {!result && <button onClick={handleFill} disabled={processing} className="btn-primary w-full py-3">{processing ? "Filling..." : "Fill Template"}</button>}
        </div>
      )}
    </div>
  );
}
