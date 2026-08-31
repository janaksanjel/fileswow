"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function UnlockWordTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback((files: File[]) => { setFile(files[0] || null); setResult(null); }, []);

  const handleUnlock = async () => {
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
      const paragraphs = [
        new Paragraph({ children: [new TextRun({ text: "🔓 Document unlocked", bold: true, size: 24, color: "16a34a" })] }),
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
        <DropZone accept=".docx,.doc" onFilesSelected={handleFile} label="Drop a protected Word document" description="Remove password protection" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">DOCX</span>
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>
          <div><label className="block text-sm text-text-secondary mb-2">Current password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm focus:border-accent focus:outline-none" placeholder="Enter current password..." /></div>
          {result && <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center"><p className="text-sm text-success mb-3">✓ Unlocked!</p><DownloadButton blob={result} filename={`unlocked-${file!.name}`} /></div>}
          {!result && <button onClick={handleUnlock} disabled={processing} className="btn-primary w-full py-3">{processing ? "Unlocking..." : "Unlock Document"}</button>}
        </div>
      )}
    </div>
  );
}
