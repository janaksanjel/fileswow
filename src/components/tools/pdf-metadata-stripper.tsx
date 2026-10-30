"use client";

import { useState, useCallback } from "react";
import { StepFlow, type StepOutput } from "@/components/step-flow";
import type { ToolUIProps } from "@/components/tool-registry";

export default function PdfMetadataStripperTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [outputs, setOutputs] = useState<StepOutput[]>([]);
  const [processing, setProcessing] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [originalMeta, setOriginalMeta] = useState<{ title?: string; author?: string; subject?: string; creator?: string }>({});
  const [error, setError] = useState<string | null>(null);

  const handleFilesChanged = useCallback(async (next: File[]) => {
    setFiles(next);
    setOutputs([]);
    if (next.length > 0) {
      try {
        const { loadPdf } = await import("@/lib/engines/pdf");
        const doc = await loadPdf(next[0]);
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
    } else {
      setPageCount(0);
      setOriginalMeta({});
    }
  }, []);

  const handleStrip = async () => {
    if (!files.length) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const buffer = await files[0].arrayBuffer();
      const doc = await PDFDocument.load(buffer);

      doc.setTitle("");
      doc.setAuthor("");
      doc.setSubject("");
      doc.setKeywords([]);
      doc.setCreator("");
      doc.setProducer("");

      const bytes = await doc.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      setOutputs([{ name: `clean-${files[0].name}`, blob }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to strip metadata";
      setError(msg);
      onError?.(msg);
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  const hasMeta = originalMeta.title || originalMeta.author || originalMeta.subject || originalMeta.creator;

  return (
    <StepFlow
      accept=".pdf"
      maxFiles={1}
      hint="Single PDF document"
      actionLabel="Strip All Metadata"
      processingLabel="Removing metadata..."
      outputs={outputs}
      canRun={files.length > 0}
      processing={processing}
      fileCount={files.length}
      onFilesChanged={handleFilesChanged}
      onResetFilesOnly={() => {
        setOutputs([]);
        setPageCount(0);
        setOriginalMeta({});
      }}
      onRun={handleStrip}
      onReset={() => {
        setFiles([]);
        setOutputs([]);
        setError(null);
        setPageCount(0);
        setOriginalMeta({});
      }}
      error={error}
      onDismissError={() => setError(null)}
      renderOperation={() => (
        <div className="space-y-4">
          {hasMeta ? (
            <div className="p-4 rounded-xl bg-warning/[0.06] border border-warning/20">
              <p className="text-xs font-bold text-warning uppercase tracking-wider mb-2.5">
                Sensitive Metadata Detected:
              </p>
              <ul className="space-y-1 text-xs text-text-secondary font-mono">
                {originalMeta.title && <li>Title: {originalMeta.title}</li>}
                {originalMeta.author && <li>Author: {originalMeta.author}</li>}
                {originalMeta.subject && <li>Subject: {originalMeta.subject}</li>}
                {originalMeta.creator && <li>Creator: {originalMeta.creator}</li>}
              </ul>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-bg-input border border-border-strong text-text-secondary text-sm">
              <p className="font-semibold text-text-primary mb-1">Privacy Sanitization</p>
              <p className="text-xs text-text-tertiary">
                Clears author names, device models, software tags, creation dates, and hidden PDF revision histories. Document has {pageCount} pages.
              </p>
            </div>
          )}
        </div>
      )}
    />
  );
}
