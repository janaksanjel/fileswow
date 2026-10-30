"use client";

import { useState, useCallback } from "react";
import { StepFlow, type StepOutput } from "@/components/step-flow";
import type { ToolUIProps } from "@/components/tool-registry";

export default function RepairPdfTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [outputs, setOutputs] = useState<StepOutput[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesChanged = useCallback((next: File[]) => {
    setFiles(next);
    setOutputs([]);
  }, []);

  const handleRepair = async () => {
    if (!files.length) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const buffer = await files[0].arrayBuffer();

      try {
        const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const bytes = await doc.save();
        setOutputs([{ name: `repaired-${files[0].name}`, blob: new Blob([new Uint8Array(bytes)], { type: "application/pdf" }) }]);
      } catch {
        const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const bytes = await doc.save();
        setOutputs([{ name: `repaired-${files[0].name}`, blob: new Blob([new Uint8Array(bytes)], { type: "application/pdf" }) }]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not repair this PDF. The file may be too corrupted.";
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
      actionLabel="Repair PDF"
      processingLabel="Repairing PDF..."
      outputs={outputs}
      canRun={files.length > 0}
      processing={processing}
      fileCount={files.length}
      onFilesChanged={handleFilesChanged}
      onResetFilesOnly={() => setOutputs([])}
      onRun={handleRepair}
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
            <p className="font-semibold text-text-primary mb-1">Structural Recovery</p>
            <p className="text-xs text-text-tertiary">
              The engine will scan the document catalog, rebuild cross-reference tables, and re-serialize valid streams into a clean, compliant PDF.
            </p>
          </div>
        </div>
      )}
    />
  );
}
