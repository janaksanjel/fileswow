"use client";

import { useState, useCallback } from "react";
import { StepFlow, type StepOutput } from "@/components/step-flow";
import type { ToolUIProps } from "@/components/tool-registry";

export default function WatermarkPdfTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("CONFIDENTIAL");
  const [fontSize, setFontSize] = useState(50);
  const [opacity, setOpacity] = useState(0.3);
  const [rotation, setRotation] = useState(-45);
  const [outputs, setOutputs] = useState<StepOutput[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesChanged = useCallback((next: File[]) => {
    setFiles(next);
    setOutputs([]);
  }, []);

  const handleWatermark = async () => {
    if (!files.length || !text.trim()) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { addWatermark, savePdf } = await import("@/lib/engines/pdf");
      const doc = await addWatermark(files[0], text, { fontSize, opacity, rotation });
      const blob = await savePdf(doc);
      setOutputs([{ name: `watermarked-${files[0].name}`, blob }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add watermark";
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
      actionLabel="Add Watermark"
      processingLabel="Adding watermark..."
      outputs={outputs}
      canRun={files.length > 0 && text.trim().length > 0}
      processing={processing}
      fileCount={files.length}
      onFilesChanged={handleFilesChanged}
      onResetFilesOnly={() => setOutputs([])}
      onRun={handleWatermark}
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
            <label className="block text-sm text-text-secondary mb-2 font-semibold">Watermark text</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-bg-input border border-border-strong text-text-primary text-sm focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm text-text-secondary mb-1">
              <span>Font size</span>
              <span className="font-mono text-accent">{fontSize}px</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm text-text-secondary mb-1">
              <span>Opacity</span>
              <span className="font-mono text-accent">{Math.round(opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm text-text-secondary mb-1">
              <span>Rotation</span>
              <span className="font-mono text-accent">{rotation}°</span>
            </div>
            <input
              type="range"
              min="-90"
              max="0"
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </div>
        </div>
      )}
    />
  );
}
