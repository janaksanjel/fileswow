"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function PdfMetadataStripperTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [originalMeta, setOriginalMeta] = useState<{ title?: string; author?: string; subject?: string; creator?: string }>({});

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    try {
      const { loadPdf } = await import("@/lib/engines/pdf");
      const doc = await loadPdf(f);
      setPageCount(doc.getPageCount());
      setOriginalMeta({
        title: doc.getTitle() || undefined,
        author: doc.getAuthor() || undefined,
        subject: doc.getSubject() || undefined,
        creator: doc.getCreator() || undefined,
      });
    } catch {
      setPageCount(0);
    }
  }, []);

  const handleStrip = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const buffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(buffer);

      doc.setTitle("");
      doc.setAuthor("");
      doc.setSubject("");
      doc.setKeywords([]);
      doc.setCreator("");
      doc.setProducer("");

      const bytes = await doc.save();
      setResult(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }));
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to strip metadata");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  const hasMeta = originalMeta.title || originalMeta.author || originalMeta.subject || originalMeta.creator;

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF to strip metadata" description="Remove all personal data from the PDF" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <div className="flex-1">
              <p className="text-sm text-text-primary truncate">{file.name}</p>
              <p className="text-xs text-text-tertiary">{pageCount} pages</p>
            </div>
            <button onClick={() => { setFile(null); setResult(null); setOriginalMeta({}); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          {hasMeta && (
            <div className="p-3 rounded-lg bg-warning/[0.04] border border-warning/10">
              <p className="text-xs font-semibold text-warning mb-2">🔒 Metadata found:</p>
              <ul className="space-y-1">
                {originalMeta.title && <li className="text-xs text-text-secondary">Title: {originalMeta.title}</li>}
                {originalMeta.author && <li className="text-xs text-text-secondary">Author: {originalMeta.author}</li>}
                {originalMeta.subject && <li className="text-xs text-text-secondary">Subject: {originalMeta.subject}</li>}
                {originalMeta.creator && <li className="text-xs text-text-secondary">Creator: {originalMeta.creator}</li>}
              </ul>
            </div>
          )}

          {!hasMeta && (
            <div className="p-3 rounded-lg bg-success/[0.04] border border-success/10">
              <p className="text-xs text-success">✓ No metadata detected — file is already clean</p>
            </div>
          )}

          <div className="p-3 rounded-lg bg-bg-elevated border border-border-base">
            <p className="text-xs text-text-secondary">
              ℹ This removes title, author, subject, keywords, creator, and producer fields. The page content is preserved.
            </p>
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Metadata stripped!</p>
              <DownloadButton blob={result} filename={`cleaned-${file.name}`} />
            </div>
          )}

          {!result && (
            <button onClick={handleStrip} disabled={processing} className="btn-primary w-full py-3">
              {processing ? "Stripping metadata..." : "Strip All Metadata"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
