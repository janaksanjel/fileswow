"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import { PdfPreview } from "@/components/pdf-preview";
import type { ToolUIProps } from "@/components/tool-registry";

export default function PdfToHtmlTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [htmlContent, setHtmlContent] = useState("");
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback((files: File[]) => {
    setFile(files[0] || null);
    setResult(null);
    setHtmlContent("");
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

      let html = "<!DOCTYPE html>\n<html>\n<head>\n<title>Converted PDF</title>\n<style>body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px;}p{margin:8px 0;line-height:1.6;}</style>\n</head>\n<body>\n";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        html += `<h2>Page ${i}</h2>\n`;
        let lastY = 0;
        for (const item of content.items) {
          if ("str" in item) {
            if (lastY && Math.abs(item.transform[5] - lastY) > 10) {
              html += "<br/>\n";
            }
            html += `<p>${item.str}</p>\n`;
            lastY = item.transform[5];
          }
        }
      }

      html += "</body>\n</html>";
      setHtmlContent(html);

      const blob = new Blob([html], { type: "text/html" });
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
            <button onClick={() => { setFile(null); setResult(null); setHtmlContent(""); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          <PdfPreview file={file} className="rounded-xl overflow-hidden" />

          {htmlContent && (
            <div>
              <label className="block text-sm text-text-secondary mb-2">HTML Output</label>
              <pre className="p-4 rounded-lg bg-bg-elevated border border-border-base text-xs text-text-secondary overflow-x-auto max-h-[300px] overflow-y-auto font-mono">
                {htmlContent.slice(0, 2000)}
                {htmlContent.length > 2000 && "\n\n... (truncated)"}
              </pre>
            </div>
          )}

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Conversion complete!</p>
              <DownloadButton blob={result} filename="converted.html" label="Download HTML" />
            </div>
          )}

          {!result && (
            <button onClick={handleConvert} disabled={processing} className="btn-primary w-full py-3">
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
                  Converting...
                </span>
              ) : "Convert to HTML"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
