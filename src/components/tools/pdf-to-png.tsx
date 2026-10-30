"use client";

import { useState, useCallback } from "react";
import { StepFlow, type StepOutput } from "@/components/step-flow";
import type { ToolUIProps } from "@/components/tool-registry";

export default function PdfToPngTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [dpi, setDpi] = useState(150);
  const [outputs, setOutputs] = useState<StepOutput[]>([]);
  const [processing, setProcessing] = useState(false);
  const [pageCount, setPageCount] = useState(0);
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

  const handleConvert = async () => {
    if (!files.length) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const pdfjsLib = await import("pdfjs-dist");
      const { GlobalWorkerOptions } = pdfjsLib;
      GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const arrayBuffer = await files[0].arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const images: StepOutput[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: dpi / 72 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await (page.render as any)({ canvasContext: canvas.getContext("2d")!, canvas, viewport }).promise;

        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), "image/png")
        );
        images.push({ name: `${files[0].name.replace(/\.pdf$/i, "")}-page-${i}.png`, blob });
      }

      setOutputs(images);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to convert PDF to PNG";
      setError(msg);
      onError?.(msg);
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  const handleDownloadAll = async () => {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    outputs.forEach((r) => zip.file(r.name, r.blob));
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${files[0]?.name.replace(/\.pdf$/i, "") || "pdf"}-pngs.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <StepFlow
      accept=".pdf"
      maxFiles={1}
      hint="Single PDF document"
      actionLabel={pageCount > 0 ? `Convert ${pageCount} Page${pageCount !== 1 ? "s" : ""} to PNG` : "Convert to PNG"}
      processingLabel="Rendering PNG images..."
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
          <div>
            <label className="block text-sm text-text-secondary mb-2 font-semibold">Image Resolution (DPI)</label>
            <div className="flex gap-2">
              {[
                { label: "72 DPI (Standard Web)", value: 72 },
                { label: "150 DPI (Balanced)", value: 150 },
                { label: "300 DPI (High Print)", value: 300 },
              ].map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDpi(d.value)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    dpi === d.value
                      ? "bg-accent text-white shadow-sm"
                      : "bg-bg-input text-text-secondary hover:text-text-primary border border-border-strong"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    />
  );
}
