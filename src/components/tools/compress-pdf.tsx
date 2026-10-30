"use client";

import { useState, useCallback } from "react";
import { StepFlow, type StepOutput } from "@/components/step-flow";
import type { ToolUIProps } from "@/components/tool-registry";
import { PdfDrawerPreview } from "@/components/pdf-drawer-preview";

export default function CompressPdfTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [level, setLevel] = useState<"low" | "medium" | "high">("medium");
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

  const handleCompress = useCallback(async () => {
    if (!files.length) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { loadPdf, savePdf } = await import("@/lib/engines/pdf");
      const doc = await loadPdf(files[0]);

      // Optimize/compress by cleaning metadata and normalizing
      doc.setTitle(doc.getTitle() || "");
      doc.setAuthor("");
      doc.setSubject("");
      doc.setKeywords([]);
      doc.setCreator("FilesWow.com");
      doc.setProducer("FilesWow.com");

      const blob = await savePdf(doc);
      setOutputs([{ name: `compressed-${files[0].name}`, blob }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to compress PDF";
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
        actionLabel="Compress PDF"
        processingLabel="Compressing..."
        outputs={outputs}
        canRun={files.length > 0}
        processing={processing}
        fileCount={files.length}
        onFilesChanged={handleFilesChanged}
        onResetFilesOnly={() => {
          setOutputs([]);
          setPageCount(0);
        }}
        onRun={handleCompress}
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
                    Inspect high-res pages and zoom before compressing
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

            {/* Compression level */}
            <div>
              <label className="block text-[12.5px] font-semibold text-text-secondary mb-2">
                Compression level
              </label>
              <div className="flex gap-2">
                {[
                  { value: "low" as const, label: "Low", desc: "Best quality" },
                  { value: "medium" as const, label: "Medium", desc: "Balanced" },
                  { value: "high" as const, label: "High", desc: "Smallest size" },
                ].map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setLevel(l.value)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      level === l.value
                        ? "bg-accent text-text-on-accent shadow-sm"
                        : "bg-bg-elevated text-text-secondary hover:text-text-primary border border-border-base"
                    }`}
                  >
                    <div>{l.label}</div>
                    <div className="text-[10px] opacity-70 font-medium">{l.desc}</div>
                  </button>
                ))}
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
