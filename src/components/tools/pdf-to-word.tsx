"use client";

import { useState, useCallback } from "react";
import { StepFlow, type StepOutput } from "@/components/step-flow";
import type { ToolUIProps } from "@/components/tool-registry";
import { convertPdfToWord } from "@/lib/engines/pdf-to-word";

export default function PdfToWordTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [outputs, setOutputs] = useState<StepOutput[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesChanged = useCallback((next: File[]) => {
    setFiles(next);
    setOutputs([]);
  }, []);

  const handleConvert = useCallback(async () => {
    if (!files.length) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const blob = await convertPdfToWord(files[0]);
      setOutputs([
        {
          name: files[0].name.replace(/\.pdf$/i, ".docx"),
          blob,
        },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to convert to Word";
      setError(msg);
      onError?.(msg);
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  }, [files, onProcessing, onError]);

  return (
    <StepFlow
      accept=".pdf"
      maxFiles={1}
      hint="Single PDF file"
      actionLabel="Convert to Word"
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
            Text and layout are extracted and rebuilt as an editable{" "}
            <span className="font-semibold text-text-primary">.docx</span> document.
            Complex tables and multi-column layouts may shift slightly.
          </p>
        </div>
      )}
    />
  );
}
