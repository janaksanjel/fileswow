"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import type { ToolUIProps } from "@/components/tool-registry";

export default function WordToHtmlTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [html, setHtml] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setHtml("");
    setProcessing(true);
    onProcessing?.(true);
    try {
      const mammoth = (await import("mammoth")).default;
      const buffer = Buffer.from(await f.arrayBuffer());
      const result = await mammoth.convertToHtml({ buffer });
      setHtml(result.value);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to convert");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  }, [onError, onProcessing]);

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".docx,.doc" onFilesSelected={handleFile} label="Drop a Word document" description="Convert DOCX to HTML" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">DOCX</span>
            <span className="text-sm text-text-primary truncate flex-1">{file.name}</span>
            <button onClick={() => { setFile(null); setHtml(""); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>
          {html && (
            <div className="space-y-3">
              <textarea value={html} readOnly rows={16} className="w-full px-4 py-3 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm font-mono resize-y" />
              <div className="flex items-center gap-2">
                <button onClick={() => navigator.clipboard.writeText(html)} className="px-4 py-2 rounded-lg text-sm font-medium text-text-primary bg-bg-surface border border-border-base hover:bg-bg-elevated">📋 Copy HTML</button>
                <button onClick={() => { const blob = new Blob([html], { type: "text/html" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = file!.name.replace(/\.docx?$/i, ".html"); a.click(); URL.revokeObjectURL(url); }} className="px-4 py-2 rounded-lg text-sm font-medium text-text-primary bg-bg-surface border border-border-base hover:bg-bg-elevated">⬇ Download HTML</button>
              </div>
              <div>
                <label className="block text-xs text-text-tertiary mb-1">Preview</label>
                <div className="p-4 rounded-lg bg-white text-black min-h-[100px] border border-border-base" dangerouslySetInnerHTML={{ __html: html }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
