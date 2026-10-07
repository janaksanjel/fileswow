"use client";

import { useState, useCallback } from "react";
import { StepFlow, type StepOutput } from "@/components/step-flow";
import type { ToolUIProps } from "@/components/tool-registry";

export default function RotatePdfTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [angle, setAngle] = useState<90 | 180 | 270>(90);
  const [pageSelection, setPageSelection] = useState("all");
  const [outputs, setOutputs] = useState<StepOutput[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);

  const handleFilesChanged = useCallback(async (next: File[]) => {
    setFiles(next);
    setOutputs([]);
    if (next.length > 0) {
      try {
        const { loadPdf } = await import("@/lib/engines/pdf");
        const doc = await loadPdf(next[0]);
        setPageCount(doc.getPageCount());
      } catch {
        setPageCount(0);
      }
    }
  }, []);

  const handleRotate = useCallback(async () => {
    if (!files.length) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { rotatePages, savePdf } = await import("@/lib/engines/pdf");
      const pages =
        pageSelection === "all"
          ? []
          : pageSelection
              .split(",")
              .map((s) => parseInt(s.trim()))
              .filter((n) => !isNaN(n));
      const doc = await rotatePages(files[0], pages, angle);
      const blob = await savePdf(doc);
      setOutputs([{ name: `rotated-${files[0].name}`, blob }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to rotate PDF";
      setError(msg);
      onError?.(msg);
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  }, [files, angle, pageSelection, onProcessing, onError]);

  return (
    <StepFlow
      accept=".pdf"
      maxFiles={1}
      hint="Single PDF file"
      actionLabel={`Rotate ${angle}°`}
      processingLabel="Rotating..."
      outputs={outputs}
      canRun={files.length > 0}
      processing={processing}
      fileCount={files.length}
      onFilesChanged={handleFilesChanged}
      onResetFilesOnly={() => {
        setOutputs([]);
        setPageCount(0);
      }}
      onRun={handleRotate}
      onReset={() => {
        setFiles([]);
        setOutputs([]);
        setError(null);
        setPageCount(0);
      }}
      error={error}
      onDismissError={() => setError(null)}
      renderOperation={() => (
        <div className="space-y-4">
          {/* Angle */}
          <div>
            <label className="block text-[12.5px] font-semibold text-text-secondary mb-2">
              Rotation angle
            </label>
            <div className="flex gap-2">
              {[90, 180, 270].map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAngle(a as 90 | 180 | 270)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                    angle === a
                      ? "bg-accent text-text-on-accent shadow-sm"
                      : "bg-bg-elevated text-text-secondary hover:text-text-primary border border-border-base"
                  }`}
                >
                  {a}°
                </button>
              ))}
            </div>
          </div>
          {/* Pages */}
          <div>
            <label className="block text-[12.5px] font-semibold text-text-secondary mb-2">
              Pages to rotate
            </label>
            <input
              type="text"
              value={pageSelection}
              onChange={(e) => setPageSelection(e.target.value)}
              placeholder="all"
              className="w-full px-3.5 py-2.5 rounded-xl bg-bg-input border border-border-strong text-text-primary text-sm font-mono focus:border-accent focus:outline-none transition-colors"
            />
            <p className="mt-1 text-[11px] text-text-tertiary">
              Enter &quot;all&quot; or comma-separated pages (e.g., 1, 3, 5-8)
              {pageCount > 0 && <> · {pageCount} pages</>}
            </p>
          </div>
        </div>
      )}
    />
  );
}
