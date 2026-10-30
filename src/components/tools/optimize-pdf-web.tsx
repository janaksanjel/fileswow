"use client";

import { useState, useCallback } from "react";
import { StepFlow, type StepOutput } from "@/components/step-flow";
import type { ToolUIProps } from "@/components/tool-registry";

export default function OptimizePdfWebTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [outputs, setOutputs] = useState<StepOutput[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesChanged = useCallback((next: File[]) => {
    setFiles(next);
    setOutputs([]);
  }, []);

  const handleOptimize = async () => {
    if (!files.length) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const buffer = await files[0].arrayBuffer();
      const doc = await PDFDocument.load(buffer);

      const bytes = await doc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });

      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      setOutputs([{ name: `web-optimized-${files[0].name}`, blob }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to optimize PDF";
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
      actionLabel="Optimize for Web"
      processingLabel="Optimizing PDF..."
      outputs={outputs}
      canRun={files.length > 0}
      processing={processing}
      fileCount={files.length}
      onFilesChanged={handleFilesChanged}
      onResetFilesOnly={() => setOutputs([])}
      onRun={handleOptimize}
      onReset={() => {
        setFiles([]);
        setOutputs([]);
        setError(null);
      }}
      error={error}
      onDismissError={() => setError(null)}
      renderOperation={() => (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-bg-input border border-border-strong text-text-secondary text-sm">
            <p className="font-semibold text-text-primary mb-1">Linearization & Object Streams</p>
            <p className="text-xs text-text-tertiary">
              Enables object streams and removes duplicate resources so web browsers can stream and render pages progressively without downloading the entire document.
            </p>
          </div>
        </div>
      )}
    />
  );
}
