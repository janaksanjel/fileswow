"use client";

import { useState, useCallback } from "react";
import { StepFlow, type StepOutput } from "@/components/step-flow";
import type { ToolUIProps } from "@/components/tool-registry";
import { PdfDrawerPreview } from "@/components/pdf-drawer-preview";

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
  const [level, setLevel] = useState<"low" | "medium" | "high">("medium");
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
      const { GlobalWorkerOptions } = await import("pdfjs-dist");
      const pdfjsLib = await import("pdfjs-dist");
      const { PDFDocument } = await import("pdf-lib");

      GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;

      // Multi-level compression matching industry standards (iLovePDF)
      // high (extreme): smallest size, 70-90% reduction
      // medium (recommended): balanced size & quality, 50-75% reduction
      // low (less): high resolution, 30-50% reduction
      let scale = 1.25;
      let quality = 0.65;
      if (level === "high") {
        scale = 0.95;
        quality = 0.40;
      } else if (level === "low") {
        scale = 1.6;
        quality = 0.82;
      }

      const newDoc = await PDFDocument.create();

      for (let i = 1; i <= totalPages; i++) {
        setProgressMsg(`Compressing page ${i} of ${totalPages}...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const origViewport = page.getViewport({ scale: 1.0 });

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(viewport.width));
        canvas.height = Math.max(1, Math.round(viewport.height));
        const ctx = canvas.getContext("2d", { alpha: false });
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        await (page.render as any)({
          canvasContext: ctx,
          canvas,
          viewport,
        }).promise;

        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), "image/jpeg", quality)
        );

        const imgBytes = await blob.arrayBuffer();
        const embeddedImg = await newDoc.embedJpg(imgBytes);

        const newPage = newDoc.addPage([origViewport.width, origViewport.height]);
        newPage.drawImage(embeddedImg, {
          x: 0,
          y: 0,
          width: origViewport.width,
          height: origViewport.height,
        });

        // Release canvas memory
        canvas.width = 0;
        canvas.height = 0;
      }

      newDoc.setTitle(file.name.replace(/\.pdf$/i, ""));
      newDoc.setProducer("FilesWow.com");
      newDoc.setCreator("FilesWow.com");

      const compressedBytes = await newDoc.save({ useObjectStreams: true });
      let finalBlob = new Blob([new Uint8Array(compressedBytes)], { type: "application/pdf" });

      // If re-rasterizing didn't reduce size (e.g. tiny pure-vector document),
      // fall back to clean object-stream compression of the original
      if (finalBlob.size >= file.size) {
        try {
          const { loadPdf } = await import("@/lib/engines/pdf");
          const originalDoc = await loadPdf(file);
          const cleanBytes = await originalDoc.save({ useObjectStreams: true });
          const cleanBlob = new Blob([new Uint8Array(cleanBytes)], { type: "application/pdf" });
          if (cleanBlob.size < finalBlob.size) {
            finalBlob = cleanBlob;
          }
        } catch {
          // ignore fallback failure
        }
      }

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
  }, [files, level, onProcessing, onError]);

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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    value: "high" as const,
                    label: "Extreme Compression",
                    sub: "~75–90% reduction",
                    desc: "Smallest size. Best for email and portal limits.",
                  },
                  {
                    value: "medium" as const,
                    label: "Recommended",
                    sub: "~50–75% reduction",
                    desc: "Good quality & high compression. Best balance.",
                  },
                  {
                    value: "low" as const,
                    label: "Less Compression",
                    sub: "~30–50% reduction",
                    desc: "High quality. Best for printing & sharp details.",
                  },
                ].map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setLevel(l.value)}
                    className={`p-3.5 rounded-xl text-left transition-all border ${
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
