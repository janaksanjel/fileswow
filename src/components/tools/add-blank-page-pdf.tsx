"use client";

import { useState, useCallback } from "react";
import { StepFlow, type StepOutput } from "@/components/step-flow";
import type { ToolUIProps } from "@/components/tool-registry";

export default function AddBlankPagePdfTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [position, setPosition] = useState(1);
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
        const count = doc.getPageCount();
        setPageCount(count);
        setPosition(count + 1);
      } catch {
        setPageCount(0);
      }
    } else {
      setPageCount(0);
    }
  }, []);

  const handleAdd = async () => {
    if (!files.length) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { addBlankPage, savePdf } = await import("@/lib/engines/pdf");
      const doc = await addBlankPage(files[0], position);
      const blob = await savePdf(doc);
      setOutputs([{ name: `blank-added-${files[0].name}`, blob }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add blank page";
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
      actionLabel="Add Blank Page"
      processingLabel="Adding blank page..."
      outputs={outputs}
      canRun={files.length > 0}
      processing={processing}
      fileCount={files.length}
      onFilesChanged={handleFilesChanged}
      onResetFilesOnly={() => {
        setOutputs([]);
        setPageCount(0);
      }}
      onRun={handleAdd}
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
          <div>
            <label className="block text-sm text-text-secondary mb-2 font-semibold">
              Insert position (1 to {pageCount + 1})
            </label>
            <input
              type="number"
              min={1}
              max={pageCount + 1}
              value={position}
              onChange={(e) => setPosition(Number(e.target.value))}
              className="w-32 px-3.5 py-2.5 rounded-xl bg-bg-input border border-border-strong text-text-primary text-sm font-mono focus:border-accent focus:outline-none transition-colors"
            />
            <p className="mt-1.5 text-xs text-text-tertiary">
              1 = beginning, {pageCount + 1} = end of document. Document has {pageCount} pages.
            </p>
          </div>
        </div>
      )}
    />
  );
}
