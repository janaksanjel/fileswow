"use client";

import { useState, useCallback } from "react";
import { StepFlow, type StepOutput } from "@/components/step-flow";
import type { ToolUIProps } from "@/components/tool-registry";

export default function MergeWordTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [outputs, setOutputs] = useState<StepOutput[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesChanged = useCallback((next: File[]) => {
    setFiles(next);
    setOutputs([]);
  }, []);

  const handleMerge = useCallback(async () => {
    if (files.length < 2) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const mammoth = (await import("mammoth")).default;
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");
      const paragraphs: unknown[] = [];

      for (let i = 0; i < files.length; i++) {
        if (i > 0) paragraphs.push(new Paragraph({ children: [], pageBreakBefore: true }));
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: files[i].name, bold: true, size: 28 })],
            heading: HeadingLevel.HEADING_1,
          })
        );
        try {
          const arrayBuffer = await files[i].arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          const div = document.createElement("div");
          div.innerHTML = result.value;
          const text = div.textContent || div.innerText || "";
          text
            .split("\n")
            .filter(Boolean)
            .forEach((line) => {
              paragraphs.push(new Paragraph({ children: [new TextRun({ text: line.trim(), size: 22 })] }));
            });
        } catch {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: `[Could not read ${files[i].name}]`, color: "999999" })],
            })
          );
        }
      }

      const doc = new Document({ sections: [{ children: paragraphs as never[] }] });
      const blob = await Packer.toBlob(doc);
      setOutputs([{ name: "merged.docx", blob }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to merge Word documents";
      setError(msg);
      onError?.(msg);
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  }, [files, onProcessing, onError]);

  return (
    <StepFlow
      accept=".docx,.doc"
      multiple
      hint="DOCX files · 2 or more"
      actionLabel={`Merge ${files.length || ""} document${files.length === 1 ? "" : "s"}`.trim()}
      processingLabel="Merging..."
      outputs={outputs}
      canRun={files.length >= 2}
      processing={processing}
      fileCount={files.length}
      onFilesChanged={handleFilesChanged}
      onResetFilesOnly={() => setOutputs([])}
      onRun={handleMerge}
      onReset={() => {
        setFiles([]);
        setOutputs([]);
        setError(null);
      }}
      error={error}
      onDismissError={() => setError(null)}
      renderOperation={({ files: count }) => (
        <div className="px-3.5 py-3 rounded-xl bg-bg-elevated/60 border border-border-base">
          <p className="text-[12.5px] text-text-secondary leading-relaxed">
            Documents are combined in the order shown in Step 1, each starting on a new page.
            {count < 2 && (
              <span className="text-warning font-semibold"> Add at least 2 documents to merge.</span>
            )}
          </p>
        </div>
      )}
    />
  );
}
