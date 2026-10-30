"use client";

import { useState, useCallback } from "react";
import { StepFlow, type StepOutput } from "@/components/step-flow";
import type { ToolUIProps } from "@/components/tool-registry";

export default function PdfToGrayscaleTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<"grayscale" | "bw">("grayscale");
  const [outputs, setOutputs] = useState<StepOutput[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesChanged = useCallback((next: File[]) => {
    setFiles(next);
    setOutputs([]);
  }, []);

  const handleConvert = async () => {
    if (!files.length) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { loadPdf, savePdf } = await import("@/lib/engines/pdf");
      const doc = await loadPdf(files[0]);
      const blob = await savePdf(doc);
      setOutputs([{ name: `grayscale-${files[0].name}`, blob }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to convert PDF";
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
      actionLabel={mode === "bw" ? "Convert to Black & White" : "Convert to Grayscale"}
      processingLabel="Converting PDF..."
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
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-2 font-semibold">Conversion mode</label>
            <div className="flex gap-2.5">
              {[
                { value: "grayscale", label: "Grayscale (Preserve Tones)" },
                { value: "bw", label: "High Contrast (B&W)" },
              ].map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMode(m.value as "grayscale" | "bw")}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                    mode === m.value
                      ? "bg-accent text-white shadow-sm"
                      : "bg-bg-input text-text-secondary hover:text-text-primary border border-border-strong"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    />
  );
}
