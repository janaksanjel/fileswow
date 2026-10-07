"use client";

import { useState, useCallback } from "react";
import { StepFlow, type StepOutput } from "@/components/step-flow";
import type { ToolUIProps } from "@/components/tool-registry";

export default function ImagesToPdfTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [outputs, setOutputs] = useState<StepOutput[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesChanged = useCallback((next: File[]) => {
    setFiles(next);
    setOutputs([]);
  }, []);

  const handleConvert = useCallback(async () => {
    if (files.length === 0) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { imageToPdf, savePdf } = await import("@/lib/engines/pdf");
      const doc = await imageToPdf(files);
      const blob = await savePdf(doc);
      setOutputs([{ name: "images.pdf", blob }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to convert images";
      setError(msg);
      onError?.(msg);
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  }, [files, onProcessing, onError]);

  return (
    <StepFlow
      accept="image/*"
      multiple
      hint="JPG, PNG, WebP and more"
      actionLabel={`Convert ${files.length || ""} image${files.length === 1 ? "" : "s"}`.trim()}
      processingLabel="Converting..."
      outputs={outputs}
      canRun={files.length > 0}
      processing={processing}
      fileCount={files.length}
      onFilesChanged={handleFilesChanged}
      onResetFilesOnly={() => setOutputs([])}
      onRun={handleConvert}
      onReset={() => {
        setFiles([]);
        setOutputs([]);
        setError(null);
      }}
      error={error}
      onDismissError={() => setError(null)}
      renderOperation={() => (
        <div className="px-3.5 py-3 rounded-xl bg-bg-elevated/60 border border-border-base">
          <p className="text-[12.5px] text-text-secondary leading-relaxed">
            Each image becomes one PDF page, in the order shown in Step 1.
            Image thumbnails appear right in the file list.
          </p>
        </div>
      )}
    />
  );
}
