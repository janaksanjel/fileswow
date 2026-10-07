"use client";

import { useState, useCallback } from "react";
import { StepFlow, type StepOutput } from "@/components/step-flow";
import type { ToolUIProps } from "@/components/tool-registry";

export default function SplitPdfTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [ranges, setRanges] = useState("1-3, 5, 8-10");
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

  const parseRanges = (input: string): Array<{ start: number; end: number }> => {
    const ranges: Array<{ start: number; end: number }> = [];
    const parts = input.split(",").map((s) => s.trim());
    for (const part of parts) {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map(Number);
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          ranges.push({ start, end });
        }
      } else {
        const num = parseInt(part);
        if (!isNaN(num)) {
          ranges.push({ start: num, end: num });
        }
      }
    }
    return ranges;
  };

  const handleSplit = useCallback(async () => {
    if (!files.length) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { splitPdf, savePdf } = await import("@/lib/engines/pdf");
      const parsed = parseRanges(ranges);
      const docs = await splitPdf(files[0], parsed);
      const res: StepOutput[] = await Promise.all(
        docs.map(async (doc, i) => ({
          name: `split-${i + 1}.pdf`,
          blob: await savePdf(doc),
        }))
      );
      setOutputs(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to split PDF";
      setError(msg);
      onError?.(msg);
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  }, [files, ranges, onProcessing, onError]);

  const handleDownloadAll = useCallback(async () => {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    for (const o of outputs) zip.file(o.name, o.blob);
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "split-pages.zip";
    a.click();
    URL.revokeObjectURL(url);
  }, [outputs]);

  return (
    <StepFlow
      accept=".pdf"
      maxFiles={1}
      hint="Single PDF file"
      actionLabel="Split PDF"
      processingLabel="Splitting..."
      outputs={outputs}
      canRun={files.length > 0 && parseRanges(ranges).length > 0}
      processing={processing}
      fileCount={files.length}
      onFilesChanged={handleFilesChanged}
      onResetFilesOnly={() => {
        setOutputs([]);
        setPageCount(0);
      }}
      onRun={handleSplit}
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
        <div className="space-y-2.5">
          <label className="block text-[12.5px] font-semibold text-text-secondary">
            Page ranges (comma-separated)
          </label>
          <input
            type="text"
            value={ranges}
            onChange={(e) => setRanges(e.target.value)}
            placeholder="1-3, 5, 8-10"
            className="w-full px-3.5 py-2.5 rounded-xl bg-bg-input border border-border-strong text-text-primary text-sm font-mono focus:border-accent focus:outline-none transition-colors"
          />
          <p className="text-[11px] text-text-tertiary">
            Ranges like 1-3, single pages like 5, or mix both.
            {pageCount > 0 && <> Document has {pageCount} pages.</>}
          </p>
        </div>
      )}
    />
  );
}
