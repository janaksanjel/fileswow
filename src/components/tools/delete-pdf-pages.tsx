"use client";

import { useState, useCallback } from "react";
import { StepFlow, type StepOutput } from "@/components/step-flow";
import type { ToolUIProps } from "@/components/tool-registry";
import { PdfDrawerPreview } from "@/components/pdf-drawer-preview";

export default function DeletePdfPagesTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [pagesToDelete, setPagesToDelete] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [outputs, setOutputs] = useState<StepOutput[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } else {
      setPageCount(0);
    }
  }, []);

  const parsePages = (input: string): number[] => {
    return input
      .split(",")
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n) && n >= 1 && (pageCount === 0 || n <= pageCount));
  };

  const toDelete = parsePages(pagesToDelete);

  const handleDelete = async () => {
    if (!files.length) return;
    const pages = parsePages(pagesToDelete);
    if (pages.length === 0) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { deletePages, savePdf } = await import("@/lib/engines/pdf");
      const doc = await deletePages(files[0], pages);
      const blob = await savePdf(doc);
      setOutputs([{ name: `trimmed-${files[0].name}`, blob }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete pages";
      setError(msg);
      onError?.(msg);
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <>
      <StepFlow
        accept=".pdf"
        maxFiles={1}
        hint="Single PDF document"
        actionLabel={toDelete.length > 0 ? `Delete ${toDelete.length} Page(s)` : "Delete Pages"}
        processingLabel="Deleting pages..."
        outputs={outputs}
        canRun={files.length > 0 && toDelete.length > 0}
        processing={processing}
        fileCount={files.length}
        onFilesChanged={handleFilesChanged}
        onResetFilesOnly={() => {
          setOutputs([]);
          setPageCount(0);
        }}
        onRun={handleDelete}
        onReset={() => {
          setFiles([]);
          setOutputs([]);
          setError(null);
          setPageCount(0);
          setPagesToDelete("");
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
                    Inspect high-res pages and zoom before deleting
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

            <div>
              <label className="block text-sm text-text-secondary mb-2 font-semibold">
                Pages to delete (comma-separated)
              </label>
              <input
                type="text"
                value={pagesToDelete}
                onChange={(e) => setPagesToDelete(e.target.value)}
                placeholder="e.g., 1, 3, 5"
                className="w-full px-4 py-2.5 rounded-xl bg-bg-input border border-border-strong text-text-primary text-sm font-mono focus:border-accent focus:outline-none transition-colors"
              />
              <p className="mt-1.5 text-xs text-text-tertiary">
                Enter page numbers like 1, 3, 5. Document has {pageCount} pages.
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
