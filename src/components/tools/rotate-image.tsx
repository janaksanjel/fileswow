"use client";

import { useState, useCallback } from "react";
import { StepFlow, type StepOutput } from "@/components/step-flow";
import type { ToolUIProps } from "@/components/tool-registry";

export default function RotateImageTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState("rotate-90");
  const [outputs, setOutputs] = useState<StepOutput[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesChanged = useCallback((next: File[]) => {
    setFiles(next);
    setOutputs([]);
  }, []);

  const process = useCallback(async () => {
    if (!files.length) return;
    const file = files[0];
    setProcessing(true);
    onProcessing?.(true);
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("Failed to load")); img.src = url; });

      const w = img.naturalWidth, h = img.naturalHeight;
      let drawW = w, drawH = h;

      if (mode === "rotate-90" || mode === "rotate-270") { drawW = h; drawH = w; }
      if (mode === "rotate-180") { /* same */ }
      if (mode === "flip-h" || mode === "flip-v") { /* same */ }

      const canvas = document.createElement("canvas");
      canvas.width = drawW;
      canvas.height = drawH;
      const ctx = canvas.getContext("2d")!;

      ctx.save();
      if (mode === "rotate-90") { ctx.translate(drawW, 0); ctx.rotate(Math.PI / 2); }
      else if (mode === "rotate-180") { ctx.translate(drawW, drawH); ctx.rotate(Math.PI); }
      else if (mode === "rotate-270") { ctx.translate(0, drawH); ctx.rotate(-Math.PI / 2); }
      else if (mode === "flip-h") { ctx.translate(drawW, 0); ctx.scale(-1, 1); }
      else if (mode === "flip-v") { ctx.translate(0, drawH); ctx.scale(1, -1); }
      ctx.drawImage(img, 0, 0);
      ctx.restore();

      URL.revokeObjectURL(url);
      const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => b ? res(b) : rej(new Error("Failed")), "image/png"));
      setOutputs([{ name: "rotated-" + file.name.replace(/\.[^.]+$/, ".png"), blob }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to rotate image";
      setError(msg);
      onError?.(msg);
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  }, [files, mode, onProcessing, onError]);
  const modes = [
    { v: "rotate-90", l: "90° CW" },
    { v: "rotate-180", l: "180°" },
    { v: "rotate-270", l: "90° CCW" },
    { v: "flip-h", l: "Flip H" },
    { v: "flip-v", l: "Flip V" },
  ];

  return (
    <StepFlow
      accept="image/*"
      maxFiles={1}
      hint="JPG, PNG, WebP"
      actionLabel={mode.startsWith("flip") ? "Flip Image" : "Rotate Image"}
      processingLabel="Processing..."
      outputs={outputs}
      canRun={files.length > 0}
      processing={processing}
      fileCount={files.length}
      onFilesChanged={handleFilesChanged}
      onResetFilesOnly={() => setOutputs([])}
      onRun={process}
      onReset={() => {
        setFiles([]);
        setOutputs([]);
        setError(null);
      }}
      error={error}
      onDismissError={() => setError(null)}
      renderOperation={() => (
        <div className="flex flex-wrap gap-2">
          {modes.map((m) => (
            <button
              key={m.v}
              type="button"
              onClick={() => setMode(m.v)}
              className={`px-3.5 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                mode === m.v
                  ? "bg-accent text-text-on-accent shadow-sm"
                  : "bg-bg-elevated text-text-secondary hover:text-text-primary border border-border-base"
              }`}
            >
              {m.l}
            </button>
          ))}
        </div>
      )}
    />
  );
}