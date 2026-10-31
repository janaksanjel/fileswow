"use client";

import { useState, useCallback } from "react";
import { StepFlow, type StepOutput } from "@/components/step-flow";
import type { ToolUIProps } from "@/components/tool-registry";
import { convertPdfToWord } from "@/lib/engines/pdf-to-word";
import { PdfDrawerPreview } from "@/components/pdf-drawer-preview";

export default function PdfToWordTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
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

  const handleConvert = useCallback(async () => {
    if (!files.length) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const blob = await convertPdfToWord(files[0]);
      setOutputs([
        {
          name: files[0].name.replace(/\.pdf$/i, ".docx"),
          blob,
        },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to convert to Word";
      setError(msg);
      onError?.(msg);
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  }, [files, onProcessing, onError]);

  const handleDownloadAll = useCallback(async () => {
    if (outputs.length === 0) return;
    const a = document.createElement("a");
    const url = URL.createObjectURL(outputs[0].blob);
    a.href = url;
    a.download = outputs[0].name;
    a.click();
    URL.revokeObjectURL(url);
  }, [outputs]);

  return (
    <>
      <StepFlow
        accept=".pdf"
        maxFiles={1}
        hint="Single PDF file"
        actionLabel="Convert to Word"
        processingLabel="Converting to DOCX..."
        outputs={outputs}
        canRun={files.length > 0}
        processing={processing}
        fileCount={files.length}
        onFilesChanged={handleFilesChanged}
        onResetFilesOnly={() => {
          setOutputs([]);
          setPageCount(0);
        }}
        onRun={handleConvert}
        onReset={() => {
          setFiles([]);
          setOutputs([]);
          setError(null);
          setPageCount(0);
        }}
        onDownloadAll={handleDownloadAll}
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
                    Inspect high-res pages and zoom before converting to Word
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

            {/* Quality & Language support card */}
            <div className="p-4 rounded-xl bg-bg-elevated/70 border border-border-base space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-accent-blue/15 text-accent-blue flex items-center justify-center text-[11px] font-bold">
                  W
                </span>
                <span className="text-[13px] font-bold text-text-primary">
                  High-Fidelity Word (.docx) Engine
                </span>
              </div>
              <p className="text-[12px] text-text-secondary leading-relaxed">
                Reconstructs exact paragraphs, headings, bold/italic styles, margins, and page breaks without cloud uploads.
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded-md bg-bg-surface border border-border-base text-[10.5px] font-semibold text-text-secondary">
                  ✓ Universal Unicode (All Languages)
                </span>
                <span className="px-2 py-0.5 rounded-md bg-bg-surface border border-border-base text-[10.5px] font-semibold text-text-secondary">
                  ✓ Hindi, Nepali & Devanagari
                </span>
                <span className="px-2 py-0.5 rounded-md bg-bg-surface border border-border-base text-[10.5px] font-semibold text-text-secondary">
                  ✓ Arabic & Hebrew RTL
                </span>
                <span className="px-2 py-0.5 rounded-md bg-bg-surface border border-border-base text-[10.5px] font-semibold text-text-secondary">
                  ✓ Chinese, Japanese, Korean
                </span>
                <span className="px-2 py-0.5 rounded-md bg-bg-surface border border-border-base text-[10.5px] font-semibold text-text-secondary">
                  ✓ 100% Client-Side
                </span>
              </div>
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
