"use client";

import { useCallback, useState } from "react";
import { StepFlow, type StepOutput } from "@/components/step-flow";
import type { ToolUIProps } from "@/components/tool-registry";

interface ImageFormatConverterProps extends ToolUIProps {
  accept: string;
  targetMime: "image/jpeg" | "image/png" | "image/webp";
  targetExt: "jpg" | "png" | "webp";
  actionLabel: string;
  hint: string;
  showQuality?: boolean;
}

/**
 * Shared 50-image batch converter using StepFlow (thumbnail cards, floating "+"
 * add button, 3-pill stepper, optimized canvas cleanup, and ZIP download).
 */
export function ImageFormatConverter({
  accept,
  targetMime,
  targetExt,
  actionLabel,
  hint,
  showQuality = true,
  onProcessing,
  onError,
}: ImageFormatConverterProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [quality, setQuality] = useState(0.92);
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
    setError(null);
    onProcessing?.(true);
    try {
      const nextOutputs: StepOutput[] = [];
      for (let idx = 0; idx < files.length; idx++) {
        const file = files[idx];
        const img = new Image();
        const url = URL.createObjectURL(file);
        await new Promise<void>((res, rej) => {
          img.onload = () => res();
          img.onerror = () => rej(new Error(`Failed to load ${file.name}`));
          img.src = url;
        });

        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d")!;
        if (targetMime === "image/jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        const blob = await new Promise<Blob>((res, rej) => {
          canvas.toBlob(
            (b) => (b ? res(b) : rej(new Error(`Conversion failed for ${file.name}`))),
            targetMime,
            quality
          );
        });
        canvas.width = 0;
        canvas.height = 0;

        nextOutputs.push({
          name: file.name.replace(/\.[^.]+$/, `.${targetExt}`),
          blob,
        });
        if (idx % 3 === 2) {
          await new Promise((r) => setTimeout(r, 0));
        }
      }
      setOutputs(nextOutputs);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Conversion failed";
      setError(msg);
      onError?.(msg);
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  }, [files, onError, onProcessing, quality, targetExt, targetMime]);

  return (
    <StepFlow
      accept={accept}
      multiple
      maxFiles={50}
      hint={`${hint} (up to 50 images)`}
      actionLabel={
        files.length > 1 ? `${actionLabel} (${files.length})` : actionLabel
      }
      processingLabel="Converting…"
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
      renderOperation={() =>
        showQuality ? (
          <div className="p-3.5 rounded-xl bg-bg-elevated border border-border-base">
            <label className="block text-xs font-semibold text-text-secondary mb-2">
              Quality: <span className="text-accent tabular-nums">{Math.round(quality * 100)}%</span>
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.02"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full accent-[var(--accent)]"
            />
          </div>
        ) : (
          <div className="px-3.5 py-3 rounded-xl bg-bg-elevated/60 border border-border-base text-xs text-text-secondary">
            Lossless PNG conversion — preserves full image resolution and transparency.
          </div>
        )
      }
    />
  );
}
