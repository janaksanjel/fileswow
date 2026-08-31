"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function PowerPointToPdfTool({ onProcessing, onError }: ToolUIProps) {
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
      const JSZip = await import("jszip");
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

      const buffer = await file.arrayBuffer();
      const zip = await JSZip.default.loadAsync(buffer);

      // Extract slide content from PPTX (XML files)
      const slideFiles = Object.keys(zip.files).filter(f => f.match(/ppt\/slides\/slide\d+\.xml$/));
      slideFiles.sort();

      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);

      for (const slideFile of slideFiles) {
        const slideXml = await zip.files[slideFile].async("text");
        // Extract text from XML
        const texts = [...slideXml.matchAll(/<a:t>([^<]+)<\/a:t>/g)].map(m => m[1]);
        const page = doc.addPage([612, 792]); // Letter size
        let y = 700;

        for (const text of texts.slice(0, 20)) {
          page.drawText(text, {
            x: 50, y, size: 14, font, color: rgb(0.1, 0.1, 0.1),
          });
          y -= 22;
          if (y < 50) break;
        }
      }

      if (doc.getPageCount() === 0) {
        doc.addPage([612, 792]);
      }

      const bytes = await doc.save();
      setResult(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }));
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to convert PowerPoint to PDF");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pptx,.ppt" onFilesSelected={handleFile} label="Drop a PowerPoint" description="Convert PPTX to PDF" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PPTX</span>
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p><p className="text-xs text-text-tertiary">{(file.size / 1024).toFixed(0)} KB</p></div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Converted to PDF!</p>
              <DownloadButton blob={result} filename={file!.name.replace(/\.pptx?$/i, ".pdf")} />
            </div>
          )}

          {!result && (
            <button onClick={handleConvert} disabled={processing} className="btn-primary w-full py-3">
              {processing ? "Converting..." : "Convert to PDF"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
