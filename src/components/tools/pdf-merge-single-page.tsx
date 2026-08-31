"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function PdfMergeSinglePageTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [layout, setLayout] = useState<"2x1" | "2x2" | "3x1" | "3x2">("2x1");
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFiles = useCallback((newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles]);
    setResult(null);
  }, []);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const layoutConfig = {
    "2x1": { cols: 2, rows: 1, label: "2×1 (side by side)" },
    "2x2": { cols: 2, rows: 2, label: "2×2 (quad)" },
    "3x1": { cols: 3, rows: 1, label: "3×1 (triptych)" },
    "3x2": { cols: 3, rows: 2, label: "3×2 (grid)" },
  };

  const handleMerge = async () => {
    if (files.length < 2) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const newDoc = await PDFDocument.create();

      const { cols, rows } = layoutConfig[layout];
      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const cellWidth = pageWidth / cols;
      const cellHeight = pageHeight / rows;
      const perPage = cols * rows;

      for (let i = 0; i < files.length; i += perPage) {
        const outPage = newDoc.addPage([pageWidth, pageHeight]);

        for (let j = 0; j < perPage && i + j < files.length; j++) {
          const col = j % cols;
          const row = Math.floor(j / cols);

          try {
            const srcBuffer = await files[i + j].arrayBuffer();
            const srcDoc = await PDFDocument.load(srcBuffer);
            const [embeddedPage] = await newDoc.embedPdf(srcDoc, [0]);
            const { width: srcW, height: srcH } = embeddedPage;
            const scale = Math.min(cellWidth / srcW, cellHeight / srcH) * 0.9;
            const scaledW = srcW * scale;
            const scaledH = srcH * scale;
            const x = col * cellWidth + (cellWidth - scaledW) / 2;
            const y = pageHeight - (row + 1) * cellHeight + (cellHeight - scaledH) / 2;

            // Use page.draw() with the embedded page
            outPage.drawPage(embeddedPage, {
              x,
              y,
              width: scaledW,
              height: scaledH,
            });
          } catch {
            // Skip pages that fail to load
          }
        }
      }

      const bytes = await newDoc.save();
      setResult(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }));
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to merge into layout");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {files.length === 0 ? (
        <DropZone accept=".pdf" multiple onFilesSelected={handleFiles} label="Drop PDFs to combine" description="Select 2 or more PDFs for N-up layout" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">{files.length} files selected</p>
            <button onClick={() => { setFiles([]); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Clear all</button>
          </div>

          <div className="space-y-2">
            {files.map((file, i) => (
              <div key={`${file.name}-${i}`} className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
                <span className="text-xs text-text-tertiary w-6 text-center font-mono">{i + 1}</span>
                <span className="text-sm text-text-primary truncate flex-1">{file.name}</span>
                <button onClick={() => removeFile(i)} className="p-1 text-text-tertiary hover:text-danger transition-colors">✕</button>
              </div>
            ))}
          </div>

          <DropZone accept=".pdf" multiple onFilesSelected={handleFiles} label="Add more" description="Drop more PDFs" />

          <div>
            <label className="block text-sm text-text-secondary mb-2">Layout</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(layoutConfig).map(([key, config]) => (
                <button key={key} onClick={() => setLayout(key as any)} className={`py-2 rounded-lg text-sm font-medium transition-all ${layout === key ? "bg-accent-start text-white" : "bg-bg-elevated text-text-secondary hover:text-text-primary border border-border-base"}`}>{config.label}</button>
              ))}
            </div>
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Layout created!</p>
              <DownloadButton blob={result} filename="merged-layout.pdf" />
            </div>
          )}

          {!result && (
            <button onClick={handleMerge} disabled={processing || files.length < 2} className="btn-primary w-full py-3">
              {processing ? "Creating layout..." : `Create ${layoutConfig[layout].label} Layout`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
