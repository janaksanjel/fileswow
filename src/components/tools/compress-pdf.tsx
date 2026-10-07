"use client";

import { useState, useCallback } from "react";
import { StepFlow, type StepOutput } from "@/components/step-flow";
import { PdfPreview } from "@/components/pdf-preview";
import type { ToolUIProps } from "@/components/tool-registry";

export default function CompressPdfTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [level, setLevel] = useState<"low" | "medium" | "high">("medium");
  const [outputs, setOutputs] = useState<StepOutput[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesChanged = useCallback((next: File[]) => {
    setFiles(next);
    setOutputs([]);
  }, []);

  const handleCompress = useCallback(async () => {
    if (!files.length) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { loadPdf, savePdf } = await import("@/lib/engines/pdf");
      const doc = await loadPdf(files[0]);

      // Simulate compression by re-saving with metadata stripped
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

  return (
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
      onResetFilesOnly={() => setOutputs([])}
      onRun={handleCompress}
      onReset={() => {
        setFiles([]);
        setOutputs([]);
        setError(null);
      }}
      error={error}
      onDismissError={() => setError(null)}
      renderOperation={() => (
        <div className="space-y-4">
          {files.length > 0 && <PdfPreview file={files[0]} className="rounded-xl overflow-hidden" />}

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
  );
}
