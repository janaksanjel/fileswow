"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function EpubToPdfTool({ onProcessing, onError }: ToolUIProps) {
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
      const JSZip = (await import("jszip")).default;
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

      const buffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer);

      // Read the container to find the content file
      let contentPath = "OEBPS/content.opf";
      const containerFile = zip.file("META-INF/container.xml");
      if (containerFile) {
        const containerText = await containerFile.async("text");
        const match = containerText.match(/full-path="([^"]+)"/);
        if (match) contentPath = match[1];
      }

      // Extract text content from HTML/XHTML files in the EPUB
      const textParts: string[] = [];
      const files = Object.keys(zip.files);
      const htmlFiles = files.filter(f => f.endsWith(".html") || f.endsWith(".xhtml") || f.endsWith(".htm"));

      for (const htmlFile of htmlFiles) {
        const content = await zip.file(htmlFile)?.async("text");
        if (content) {
          // Strip HTML tags to get plain text
          const text = content
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/\s+/g, " ")
            .trim();
          if (text.length > 10) textParts.push(text);
        }
      }

      // Create PDF from extracted text
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const fontSize = 12;
      const lineHeight = fontSize * 1.5;
      const margin = 50;
      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const maxLinesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);

      let currentPage = doc.addPage([pageWidth, pageHeight]);
      let y = pageHeight - margin;
      let lineCount = 0;

      for (const part of textParts) {
        const lines = part.split("\n");
        for (const line of lines) {
          if (lineCount >= maxLinesPerPage) {
            currentPage = doc.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
            lineCount = 0;
          }
          currentPage.drawText(line || " ", {
            x: margin, y, size: fontSize, font,
            color: rgb(0.1, 0.1, 0.1),
            maxWidth: pageWidth - margin * 2,
          });
          y -= lineHeight;
          lineCount++;
        }
      }

      const bytes = await doc.save();
      setResult(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }));
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to convert EPUB to PDF");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".epub" onFilesSelected={handleFile} label="Drop an EPUB file" description="Convert EPUB ebook to PDF" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">EPUB</span>
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p><p className="text-xs text-text-tertiary">{(file.size / 1024).toFixed(0)} KB</p></div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Converted to PDF!</p>
              <DownloadButton blob={result} filename={file!.name.replace(/\.epub$/i, ".pdf")} />
            </div>
          )}

          {!result && (
            <button onClick={handleConvert} disabled={processing} className="btn-primary w-full py-3">
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />
                  Converting...
                </span>
              ) : "Convert to PDF"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
