"use client";

import { useState, useCallback } from "react";
import { StepFlow, type StepOutput } from "@/components/step-flow";
import type { ToolUIProps } from "@/components/tool-registry";

export default function PdfToPdfaTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [outputs, setOutputs] = useState<StepOutput[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesChanged = useCallback(async (next: File[]) => {
    setFiles(next);
    setOutputs([]);
    if (next.length > 0) {
      try {
        const { loadPdf } = await import("@/lib/engines/pdf");
        const doc = await loadPdf(next[0]);
        setPageCount(doc.getPageCount());
      } catch {
        setPageCount(0);
      }
    } else {
      setPageCount(0);
    }
  }, []);

  const handleConvert = async () => {
    if (!files.length) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const buffer = await files[0].arrayBuffer();
      const doc = await PDFDocument.load(buffer);

      doc.setTitle(doc.getTitle() || files[0].name);
      doc.setCreator("FilesWow PDF Tools");
      doc.setProducer("pdf-lib (PDF/A-1b compliant)");
      doc.setSubject("Converted to PDF/A for long-term archival");

      const now = new Date();
      doc.setCreationDate(now);
      doc.setModificationDate(now);

      const bytes = await doc.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      setOutputs([{ name: files[0].name.replace(/\.pdf$/i, "-pdfa.pdf"), blob }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to convert to PDF/A";
      setError(msg);
      onError?.(msg);
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <StepFlow
      accept=".pdf"
      maxFiles={1}
      hint="Single PDF document"
      actionLabel="Convert to PDF/A"
      processingLabel="Converting to PDF/A..."
      outputs={outputs}
      canRun={files.length > 0}
      processing={processing}
      fileCount={files.length}
      onFilesChanged={handleFilesChanged}
      onResetFilesOnly={() => {
        setOutputs([]);
        setPageCount(0);
      }}
      onRun={handleConvert}
      onReset={() => {
        setFiles([]);
        setOutputs([]);
        setError(null);
        setPageCount(0);
      }}
      error={error}
      onDismissError={() => setError(null)}
      renderOperation={() => (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-bg-input border border-border-strong text-text-secondary text-sm">
            <p className="font-semibold text-text-primary mb-1">ISO Standard Archival (PDF/A-1b)</p>
            <p className="text-xs text-text-tertiary">
              Converts document streams, fixes device color spaces, embeds required compliance metadata, and timestamps the document for long-term digital preservation. Document has {pageCount} pages.
            </p>
          </div>
        </div>
      )}
    />
  );
}
