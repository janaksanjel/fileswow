"use client";

import { useState, useCallback } from "react";
import { StepFlow, type StepOutput } from "@/components/step-flow";
import type { ToolUIProps } from "@/components/tool-registry";

export default function CropPdfTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [top, setTop] = useState(50);
  const [bottom, setBottom] = useState(50);
  const [left, setLeft] = useState(50);
  const [right, setRight] = useState(50);
  const [outputs, setOutputs] = useState<StepOutput[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesChanged = useCallback((next: File[]) => {
    setFiles(next);
    setOutputs([]);
  }, []);

  const handleCrop = async () => {
    if (!files.length) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { loadPdf, savePdf } = await import("@/lib/engines/pdf");
      const doc = await loadPdf(files[0]);

      for (const page of doc.getPages()) {
        const { width, height } = page.getSize();
        page.setMediaBox(
          left,
          bottom,
          Math.max(10, width - left - right),
          Math.max(10, height - top - bottom)
        );
      }

      const blob = await savePdf(doc);
      setOutputs([{ name: `cropped-${files[0].name}`, blob }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to crop PDF";
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
      actionLabel="Crop PDF"
      processingLabel="Cropping PDF..."
      outputs={outputs}
      canRun={files.length > 0}
      processing={processing}
      fileCount={files.length}
      onFilesChanged={handleFilesChanged}
      onResetFilesOnly={() => setOutputs([])}
      onRun={handleCrop}
      onReset={() => {
        setFiles([]);
        setOutputs([]);
        setError(null);
      }}
      error={error}
      onDismissError={() => setError(null)}
      renderOperation={() => (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Top Margin", value: top, set: setTop },
              { label: "Bottom Margin", value: bottom, set: setBottom },
              { label: "Left Margin", value: left, set: setLeft },
              { label: "Right Margin", value: right, set: setRight },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <div className="flex justify-between text-sm text-text-secondary mb-1.5 font-medium">
                  <span>{label}</span>
                  <span className="font-mono text-accent">{value}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={value}
                  onChange={(e) => set(Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    />
  );
}
