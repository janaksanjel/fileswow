"use client";

import { useState, useCallback } from "react";
import { StepFlow, type StepOutput } from "@/components/step-flow";
import type { ToolUIProps } from "@/components/tool-registry";
import { compressCanvasToTargetBytes } from "@/lib/target-kb-compress";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function CompressImageTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<"preset" | "target">("target");
  const [quality, setQuality] = useState(78);
  const [targetKb, setTargetKb] = useState(100);
  const [outputs, setOutputs] = useState<StepOutput[]>([]);
  const [stats, setStats] = useState<{ before: number; after: number } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesChanged = useCallback((next: File[]) => {
    setFiles(next);
    setOutputs([]);
    setStats(null);
  }, []);

  const process = useCallback(async () => {
    if (!files.length) return;
    setProcessing(true);
    setError(null);
    setStats(null);
    onProcessing?.(true);
    try {
      const nextOutputs: StepOutput[] = [];
      let totalBefore = 0;
      let totalAfter = 0;
      const targetBytes = Math.max(5, targetKb) * 1024;

      for (let idx = 0; idx < files.length; idx++) {
        const file = files[idx];
        totalBefore += file.size;
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
        const ctx = canvas.getContext("2d", { alpha: false })!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        let blob: Blob;
        if (mode === "target") {
          blob = await compressCanvasToTargetBytes(canvas, targetBytes, "image/jpeg");
        } else {
          const q = Math.min(0.95, Math.max(0.1, quality / 100));
          blob = await new Promise<Blob>((res, rej) =>
            canvas.toBlob((b) => (b ? res(b) : rej(new Error("Compression failed"))), "image/jpeg", q)
          );
        }

        canvas.width = 0;
        canvas.height = 0;
        totalAfter += blob.size;

        nextOutputs.push({
          name: `compressed-${file.name.replace(/\.[^.]+$/, ".jpg")}`,
          blob,
        });

        if (idx % 3 === 2) {
          await new Promise((r) => setTimeout(r, 0));
        }
      }

      setStats({ before: totalBefore, after: totalAfter });
      setOutputs(nextOutputs);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to compress image";
      setError(msg);
      onError?.(msg);
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  }, [files, mode, quality, targetKb, onProcessing, onError]);

  const reduction =
    stats && stats.before > 0
      ? Math.max(0, Math.round(((stats.before - stats.after) / stats.before) * 100))
      : 0;

  return (
    <StepFlow
      accept="image/*"
      multiple
      maxFiles={50}
      hint="JPG, PNG, WebP (up to 50 images)"
      actionLabel={
        files.length > 1 ? `Compress ${files.length} Images` : "Compress Image"
      }
      processingLabel="Compressing…"
      outputs={outputs}
      canRun={files.length > 0}
      processing={processing}
      fileCount={files.length}
      onFilesChanged={handleFilesChanged}
      onResetFilesOnly={() => {
        setOutputs([]);
        setStats(null);
      }}
      onRun={process}
      onReset={() => {
        setFiles([]);
        setOutputs([]);
        setStats(null);
        setError(null);
      }}
      error={error}
      onDismissError={() => setError(null)}
      renderResult={() =>
        stats ? (
          <div className="p-3.5 rounded-xl bg-accent/[0.08] border border-accent/25 flex items-center justify-between gap-3">
            <div className="text-xs text-text-secondary">
              <span className="line-through">{formatSize(stats.before)}</span>
              {" → "}
              <strong className="text-accent font-bold">{formatSize(stats.after)}</strong>
            </div>
            <span className="badge badge-accent font-bold px-2.5 py-0.5 text-xs">
              -{reduction}% smaller
            </span>
          </div>
        ) : null
      }
      renderOperation={() => (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("target")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                mode === "target"
                  ? "border-accent bg-accent/10 ring-1 ring-accent"
                  : "border-border-base bg-bg-elevated hover:border-border-strong"
              }`}
            >
              <p className="text-[12.5px] font-bold text-text-primary">Target Size (KB)</p>
              <p className="text-[11px] text-text-tertiary mt-0.5">
                Auto-fits each image under your KB limit
              </p>
            </button>
            <button
              type="button"
              onClick={() => setMode("preset")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                mode === "preset"
                  ? "border-accent bg-accent/10 ring-1 ring-accent"
                  : "border-border-base bg-bg-elevated hover:border-border-strong"
              }`}
            >
              <p className="text-[12.5px] font-bold text-text-primary">Custom Quality %</p>
              <p className="text-[11px] text-text-tertiary mt-0.5">
                Choose exact JPEG quality slider
              </p>
            </button>
          </div>

          {mode === "target" ? (
            <div className="p-3.5 rounded-xl bg-bg-elevated border border-border-base space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="img-target-kb" className="text-xs font-semibold text-text-secondary">
                  Maximum size per image (KB):
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="img-target-kb"
                    type="number"
                    min={10}
                    max={10000}
                    value={targetKb}
                    onChange={(e) => setTargetKb(Math.max(10, Number(e.target.value) || 10))}
                    className="w-24 h-8 px-2.5 rounded-lg border border-border-strong bg-bg-input text-sm font-bold text-text-primary text-right outline-none focus:border-accent"
                  />
                  <span className="text-xs font-semibold text-text-tertiary">KB</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[25, 50, 100, 200, 500].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTargetKb(preset)}
                    className={`px-2.5 py-1 rounded-lg text-[11.5px] font-semibold border transition-colors cursor-pointer ${
                      targetKb === preset
                        ? "bg-accent text-white border-accent"
                        : "bg-bg-input text-text-secondary border-border-base hover:text-text-primary"
                    }`}
                  >
                    {preset} KB
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-bg-elevated border border-border-base">
              <label className="block text-xs font-semibold text-text-secondary mb-2">
                Image quality: <span className="text-accent tabular-nums">{quality}%</span>
              </label>
              <input
                type="range"
                min="10"
                max="95"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-[var(--accent)]"
              />
            </div>
          )}
        </div>
      )}
    />
  );
}
