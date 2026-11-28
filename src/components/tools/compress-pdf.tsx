"use client";

import { useState, useCallback } from "react";
import { StepFlow, type StepOutput } from "@/components/step-flow";
import type { ToolUIProps } from "@/components/tool-registry";
import { PdfDrawerPreview } from "@/components/pdf-drawer-preview";
import { smartCompressPdf } from "@/lib/engines/smart-pdf-compress";

interface CompressionStats {
  originalSize: number;
  compressedSize: number;
  reduction: number;
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function CompressPdfTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [level, setLevel] = useState<"low" | "medium" | "high" | "target">("medium");
  const [targetKb, setTargetKb] = useState(300);
  const [pageCount, setPageCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [outputs, setOutputs] = useState<StepOutput[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [stats, setStats] = useState<CompressionStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFilesChanged = useCallback(async (next: File[]) => {
    setFiles(next);
    setOutputs([]);
    setStats(null);
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
    setStats(null);
    try {
      const file = files[0];
      const finalBlob = await smartCompressPdf(file, {
        level,
        targetKb,
        onProgress: (msg) => setProgressMsg(msg),
      });

      const originalSize = file.size;
      const compressedSize = finalBlob.size;
      const reduction = Math.max(
        0,
        Math.round(((originalSize - compressedSize) / originalSize) * 100)
      );

      setStats({
        originalSize,
        compressedSize,
        reduction,
      });

      setOutputs([{ name: `compressed-${file.name}`, blob: finalBlob }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to compress PDF";
      setError(msg);
      onError?.(msg);
    } finally {
      setProcessing(false);
      setProgressMsg("");
      onProcessing?.(false);
    }
  }, [files, level, targetKb, onProcessing, onError]);

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
        processingLabel={progressMsg || "Compressing PDF..."}
        outputs={outputs}
        canRun={files.length > 0}
        processing={processing}
        fileCount={files.length}
        onFilesChanged={handleFilesChanged}
        onResetFilesOnly={() => {
          setOutputs([]);
          setStats(null);
          setPageCount(0);
        }}
        onRun={handleCompress}
        onReset={() => {
          setFiles([]);
          setOutputs([]);
          setStats(null);
          setError(null);
          setPageCount(0);
        }}
        onDownloadAll={handleDownloadAll}
        error={error}
        onDismissError={() => setError(null)}
        renderResult={() =>
          stats ? (
            <div className="p-4 rounded-xl bg-accent/[0.08] border border-accent/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in-up">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-xl bg-accent/20 text-accent font-extrabold text-base flex items-center justify-center shrink-0">
                  -{stats.reduction}%
                </span>
                <div>
                  <p className="text-[14px] font-bold text-text-primary">
                    Compression Complete!
                  </p>
                  <p className="text-[12.5px] text-text-secondary mt-0.5">
                    Original: <span className="line-through">{formatBytes(stats.originalSize)}</span>{" "}
                    → Compressed: <strong className="text-accent font-bold">{formatBytes(stats.compressedSize)}</strong>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="badge badge-accent font-bold px-3 py-1 text-xs">
                  {stats.reduction}% smaller
                </span>
              </div>
            </div>
          ) : null
        }
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
                    {pageCount} page{pageCount !== 1 ? "s" : ""} · {files[0] ? formatBytes(files[0].size) : ""}
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

            {/* Compression level options */}
            <div>
              <label className="block text-[12.5px] font-semibold text-text-secondary mb-2">
                Choose Compression Level (Like iLovePDF)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {[
                  {
                    value: "high" as const,
                    label: "Extreme",
                    sub: "~75–90% smaller",
                    desc: "Smallest preset size for strict limits.",
                  },
                  {
                    value: "medium" as const,
                    label: "Recommended",
                    sub: "~50–75% smaller",
                    desc: "Best balance of quality & size.",
                  },
                  {
                    value: "low" as const,
                    label: "Less Compression",
                    sub: "~30–50% smaller",
                    desc: "High quality for sharp text & print.",
                  },
                  {
                    value: "target" as const,
                    label: "Target Size (KB)",
                    sub: "Exact KB limit",
                    desc: "Enter max KB; preserves best quality.",
                  },
                ].map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setLevel(l.value)}
                    className={`p-3.5 rounded-xl text-left transition-all border cursor-pointer ${
                      level === l.value
                        ? "bg-accent/10 border-accent text-text-primary shadow-xs ring-1 ring-accent"
                        : "bg-bg-elevated text-text-secondary hover:text-text-primary border-border-base"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[13px] text-text-primary">{l.label}</span>
                      {level === l.value && (
                        <span className="w-2 h-2 rounded-full bg-accent" />
                      )}
                    </div>
                    <div className="text-[11.5px] font-semibold text-accent mb-1">{l.sub}</div>
                    <div className="text-[11px] text-text-tertiary leading-snug">{l.desc}</div>
                  </button>
                ))}
              </div>

              {level === "target" && (
                <div className="mt-3 p-3.5 rounded-xl bg-bg-elevated border border-border-base space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label htmlFor="pdf-target-kb" className="text-xs font-semibold text-text-secondary">
                      Target maximum PDF size (KB):
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        id="pdf-target-kb"
                        type="number"
                        min={20}
                        max={50000}
                        value={targetKb}
                        onChange={(e) => setTargetKb(Math.max(20, Number(e.target.value) || 20))}
                        className="w-24 h-8 px-2.5 rounded-lg border border-border-strong bg-bg-input text-sm font-bold text-text-primary text-right outline-none focus:border-accent"
                      />
                      <span className="text-xs font-semibold text-text-tertiary">KB</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[100, 200, 300, 500, 1024].map((preset) => (
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
                        {preset >= 1024 ? "1 MB (1024 KB)" : `${preset} KB`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Info hint */}
            <p className="text-[11.5px] text-text-tertiary flex items-center gap-1.5 pt-1">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>Tip: Select <strong>Extreme Compression</strong> if you need your PDF under 1MB or 2MB.</span>
            </p>
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
