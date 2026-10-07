"use client";

import { useState, useCallback } from "react";
import { StepFlow, type StepOutput } from "@/components/step-flow";
import type { ToolUIProps } from "@/components/tool-registry";

export default function MergePdfTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [outputs, setOutputs] = useState<StepOutput[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesChanged = useCallback((next: File[]) => {
    setFiles(next);
    setOutputs([]);
  }, []);

  const handleRun = useCallback(async () => {
    if (files.length < 2) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { mergePdfs, savePdf } = await import("@/lib/engines/pdf");
      const merged = await mergePdfs(files);
      const blob = await savePdf(merged);
      setOutputs([{ name: "merged.pdf", blob }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to merge PDFs";
      setError(msg);
      onError?.(msg);
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  }, [files, onProcessing, onError]);

  const handleDownloadAll = useCallback(async () => {
    if (outputs.length === 0) return;
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    for (const o of outputs) zip.file(o.name, o.blob);
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "merged.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }, [outputs]);

  return (
    <StepFlow
      accept=".pdf"
      multiple
      hint="PDF files · 2 or more"
      actionLabel={`Merge ${files.length || ""} PDFs`.trim()}
      processingLabel="Merging..."
      renderOperation={({ files: count }) => (
        <div className="px-3.5 py-3 rounded-xl bg-bg-elevated/60 border border-border-base">
          <p className="text-[12.5px] text-text-secondary leading-relaxed">
            Pages are merged in the order shown above — file 1 first.
            {count < 2 && (
              <span className="text-warning font-semibold"> Add at least 2 PDFs to merge.</span>
            )}
          </p>
        </div>
      )}
      outputs={outputs}
      canRun={files.length >= 2}
      processing={processing}
      fileCount={files.length}
      onFilesChanged={handleFilesChanged}
      onResetFilesOnly={() => setOutputs([])}
      onRun={handleRun}
      onReset={() => {
        setFiles([]);
        setOutputs([]);
        setError(null);
      }}
      onDownloadAll={handleDownloadAll}
      error={error}
      onDismissError={() => setError(null)}
    />
  );
}
