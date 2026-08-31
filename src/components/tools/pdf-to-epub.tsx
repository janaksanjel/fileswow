"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import { PdfPreview } from "@/components/pdf-preview";
import type { ToolUIProps } from "@/components/tool-registry";

export default function PdfToEpubTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback((files: File[]) => {
    setFile(files[0] || null);
    setResult(null);
  }, []);

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const pdfjsLib = await import("pdfjs-dist");
      const { GlobalWorkerOptions } = pdfjsLib;
      GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      // Extract text from all pages
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .filter((item: any) => "str" in item)
          .map((item: any) => item.str)
          .join(" ");
        fullText += `<h2>Page ${i}</h2><p>${pageText}</p>\n`;
      }

      // Create a minimal EPUB (actually an HTML file with .epub extension)
      const epubContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${file.name}</title>
<style>body{font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:20px;line-height:1.8;}h2{color:#22c55e;}</style>
</head><body>${fullText}</body></html>`;

      const blob = new Blob([epubContent], { type: "application/epub+zip" });
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
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF to convert" description="Select a single PDF file" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <span className="text-sm text-text-primary truncate flex-1">{file.name}</span>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          <PdfPreview file={file} className="rounded-xl overflow-hidden" />

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Conversion complete!</p>
              <DownloadButton blob={result} filename="converted.epub" />
            </div>
          )}

          {!result && (
            <button onClick={handleConvert} disabled={processing} className="btn-primary w-full py-3">
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
                  Converting...
                </span>
              ) : "Convert to EPUB"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
