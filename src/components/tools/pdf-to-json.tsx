"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function PdfToJsonTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [jsonPreview, setJsonPreview] = useState("");
  const [processing, setProcessing] = useState(false);
  const [pageCount, setPageCount] = useState(0);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setJsonPreview("");
    try {
      const { loadPdf } = await import("@/lib/engines/pdf");
      const doc = await loadPdf(f);
      setPageCount(doc.getPageCount());
    } catch {
      setPageCount(0);
    }
  }, []);

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const buffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(buffer);

      const jsonData = {
        fileName: file.name,
        fileSize: file.size,
        metadata: {
          title: doc.getTitle() || null,
          author: doc.getAuthor() || null,
          subject: doc.getSubject() || null,
          creator: doc.getCreator() || null,
          producer: doc.getProducer() || null,
          keywords: doc.getKeywords() || [],
          creationDate: doc.getCreationDate()?.toISOString() || null,
          modificationDate: doc.getModificationDate()?.toISOString() || null,
        },
        pages: doc.getPages().map((page, i) => {
          const { width, height } = page.getSize();
          return {
            index: i + 1,
            width: Math.round(width * 100) / 100,
            height: Math.round(height * 100) / 100,
            rotation: page.getRotation().angle,
          };
        }),
        summary: {
          totalPages: doc.getPageCount(),
          pageSizes: [...new Set(doc.getPages().map(p => {
            const s = p.getSize();
            return `${Math.round(s.width)}x${Math.round(s.height)}`;
          }))],
        },
      };

      const jsonString = JSON.stringify(jsonData, null, 2);
      setJsonPreview(jsonString.substring(0, 1000) + (jsonString.length > 1000 ? "\n..." : ""));

      const blob = new Blob([jsonString], { type: "application/json" });
      setResult(blob);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to convert to JSON");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF" description="Extract PDF structure as JSON" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <div className="flex-1">
              <p className="text-sm text-text-primary truncate">{file.name}</p>
              <p className="text-xs text-text-tertiary">{pageCount} pages</p>
            </div>
            <button onClick={() => { setFile(null); setResult(null); setJsonPreview(""); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          {jsonPreview && (
            <div>
              <label className="block text-sm text-text-secondary mb-2">JSON Preview</label>
              <pre className="p-4 rounded-lg bg-bg-elevated border border-border-base text-xs text-text-primary font-mono overflow-x-auto max-h-60 overflow-y-auto">{jsonPreview}</pre>
            </div>
          )}

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Converted to JSON!</p>
              <DownloadButton blob={result} filename={file!.name.replace(/\.pdf$/i, ".json")} />
            </div>
          )}

          {!result && (
            <button onClick={handleConvert} disabled={processing} className="btn-primary w-full py-3">
              {processing ? "Converting..." : "Convert to JSON"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
