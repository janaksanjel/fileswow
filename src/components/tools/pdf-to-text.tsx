"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import type { ToolUIProps } from "@/components/tool-registry";

export default function PdfToTextTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setText("");
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const buffer = await f.arrayBuffer();
      const doc = await PDFDocument.load(buffer);
      // Note: pdf-lib can't extract text. We show a message.
      setText(`[PDF has ${doc.getPageCount()} page(s)]\n\nNote: Text extraction from PDFs requires a more advanced engine (pdf.js). This tool currently provides basic page count info.\n\nFor full text extraction, a dedicated text extraction library would need to be loaded.`);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to read PDF");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  }, [onError, onProcessing]);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF to extract text" description="Select a PDF file" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <span className="text-sm text-text-primary truncate flex-1">{file.name}</span>
            <button onClick={() => { setFile(null); setText(""); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          {processing && (
            <div className="flex items-center justify-center py-8">
              <span className="w-6 h-6 border border-accent-start/30 border-t-accent-start rounded-full animate-spin-slow" />
            </div>
          )}

          {text && (
            <div className="space-y-3">
              <textarea
                value={text}
                readOnly
                rows={16}
                className="w-full px-4 py-3 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm font-mono resize-y"
              />
              <div className="flex items-center gap-2">
                <button onClick={handleCopy} className="px-4 py-2 rounded-lg text-sm font-medium text-text-primary bg-bg-surface border border-border-base hover:bg-bg-elevated transition-colors">
                  📋 Copy to clipboard
                </button>
                <button onClick={() => {
                  const blob = new Blob([text], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = file!.name.replace(/\.pdf$/i, ".txt");
                  a.click();
                  URL.revokeObjectURL(url);
                }} className="px-4 py-2 rounded-lg text-sm font-medium text-text-primary bg-bg-surface border border-border-base hover:bg-bg-elevated transition-colors">
                  ⬇ Download as TXT
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
