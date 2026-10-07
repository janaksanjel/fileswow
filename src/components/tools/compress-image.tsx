"use client";

import { useState, useCallback } from "react";
import { StepFlow, type StepOutput } from "@/components/step-flow";
import type { ToolUIProps } from "@/components/tool-registry";

export default function CompressImageTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [amount, setAmount] = useState(30);
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
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error("Failed to load"));
        img.src = url;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;
      // Simulate quality reduction by quantizing
      const q = Math.max(1, Math.round(amount / 5));
      for (let i = 0; i < d.length; i += 4) {
        d[i] = Math.round(d[i] / q) * q;
        d[i + 1] = Math.round(d[i + 1] / q) * q;
        d[i + 2] = Math.round(d[i + 2] / q) * q;
      }
      ctx.putImageData(imageData, 0, 0);

      const blob = await new Promise<Blob>((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error("Failed"))), "image/png")
      );
      setOutputs([{ name: `compressed-${file.name.replace(/\.[^.]+$/, ".png")}`, blob }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to compress image";
      setError(msg);
      onError?.(msg);
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  }, [files, amount, onProcessing, onError]);

  return (
    <StepFlow
      accept="image/*"
      maxFiles={1}
      hint="JPG, PNG, WebP"
      actionLabel="Compress Image"
      processingLabel="Compressing..."
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
        <div>
          <label className="block text-[12.5px] font-semibold text-text-secondary mb-2">
            Compression level: <span className="text-accent tabular-nums">{amount}</span>
          </label>
          <input
            type="range"
            min={1}
            max={100}
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value))}
            className="w-full accent-accent"
          />
          <p className="mt-1.5 text-[11px] text-text-tertiary">
            Higher values mean stronger compression.
          </p>
        </div>
      )}
    />
  );
}
