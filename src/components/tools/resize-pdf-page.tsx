"use client";

import { useState, useCallback } from "react";
import { StepFlow, type StepOutput } from "@/components/step-flow";
import type { ToolUIProps } from "@/components/tool-registry";

const PRESETS = [
  { label: "A4", width: 595.28, height: 841.89 },
  { label: "Letter", width: 612, height: 792 },
  { label: "Legal", width: 612, height: 1008 },
  { label: "A3", width: 841.89, height: 1190.55 },
  { label: "A5", width: 419.53, height: 595.28 },
  { label: "Custom", width: 0, height: 0 },
];

export default function ResizePdfPageTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [preset, setPreset] = useState("A4");
  const [customWidth, setCustomWidth] = useState(595);
  const [customHeight, setCustomHeight] = useState(842);
  const [outputs, setOutputs] = useState<StepOutput[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesChanged = useCallback((next: File[]) => {
    setFiles(next);
    setOutputs([]);
  }, []);

  const handleResize = async () => {
    if (!files.length) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { loadPdf, savePdf } = await import("@/lib/engines/pdf");
      const doc = await loadPdf(files[0]);

      const selected = PRESETS.find((p) => p.label === preset);
      const w = preset === "Custom" ? customWidth : selected?.width || 595.28;
      const h = preset === "Custom" ? customHeight : selected?.height || 841.89;

      for (const page of doc.getPages()) {
        page.setSize(w, h);
      }

      const blob = await savePdf(doc);
      setOutputs([{ name: `resized-${files[0].name}`, blob }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to resize PDF";
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
      actionLabel={`Resize to ${preset}`}
      processingLabel="Resizing PDF..."
      outputs={outputs}
      canRun={files.length > 0}
      processing={processing}
      fileCount={files.length}
      onFilesChanged={handleFilesChanged}
      onResetFilesOnly={() => setOutputs([])}
      onRun={handleResize}
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
            <label className="block text-sm text-text-secondary mb-2 font-semibold">Target Page size</label>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setPreset(p.label)}
                  className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    preset === p.label
                      ? "bg-accent text-white shadow-sm"
                      : "bg-bg-input text-text-secondary hover:text-text-primary border border-border-strong"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {preset === "Custom" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1.5 font-semibold">Width (pt)</label>
                <input
                  type="number"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-bg-input border border-border-strong text-text-primary text-sm font-mono focus:border-accent focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1.5 font-semibold">Height (pt)</label>
                <input
                  type="number"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-bg-input border border-border-strong text-text-primary text-sm font-mono focus:border-accent focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}
        </div>
      )}
    />
  );
}
