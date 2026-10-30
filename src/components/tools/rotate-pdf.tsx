"use client";

import { useState, useCallback } from "react";
import { StepFlow, type StepOutput } from "@/components/step-flow";
import type { ToolUIProps } from "@/components/tool-registry";
import { PdfDrawerPreview } from "@/components/pdf-drawer-preview";

export default function RotatePdfTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [angle, setAngle] = useState<90 | 180 | 270>(90);
  const [pageSelection, setPageSelection] = useState("all");
  const [outputs, setOutputs] = useState<StepOutput[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
    <>
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
            {/* Top drawer preview callout banner — matches Split PDF */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-accent/[0.06] border border-accent/20">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </span>
                <div>
                  <p className="text-[13px] font-bold text-text-primary">
                    Document has {pageCount} page{pageCount !== 1 ? "s" : ""}
                  </p>
                  <p className="text-[11.5px] text-text-secondary">
                    Inspect high-res pages and zoom before rotating
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="btn-primary py-2 px-4 text-[12.5px] shrink-0 flex items-center justify-center gap-1.5 shadow-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span>Preview in Right Drawer</span>
              </button>
            </div>

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

      <PdfDrawerPreview
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        fileOrBlob={files[0] || null}
        title={files[0]?.name || "PDF Document"}
      />
    </>
  );
}
