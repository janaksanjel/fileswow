"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

type OutputFormat = "pdf" | "txt";

export default function BatchConverterTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState<OutputFormat>("pdf");
  const [results, setResults] = useState<{ name: string; blob: Blob }[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleFiles = useCallback((newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles]);
    setResults([]);
  }, []);

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const converted: { name: string; blob: Blob }[] = [];

      for (const file of files) {
        try {
          if (format === "pdf" && (file.type === "image/jpeg" || file.type === "image/png")) {
            const { PDFDocument } = await import("pdf-lib");
            const doc = await PDFDocument.create();
            const bytes = await file.arrayBuffer();
            let image;
            if (file.type === "image/png") {
              image = await doc.embedPng(bytes);
            } else {
              image = await doc.embedJpg(bytes);
            }
            const { width, height } = image.scale(1);
            const pageWidth = 595.28;
            const pageHeight = 841.89;
            const scale = Math.min(pageWidth / width, pageHeight / height);
            const page = doc.addPage([pageWidth, pageHeight]);
            page.drawImage(image, {
              x: (pageWidth - width * scale) / 2,
              y: (pageHeight - height * scale) / 2,
              width: width * scale,
              height: height * scale,
            });
            const pdfBytes = await doc.save();
            converted.push({ name: file.name.replace(/\.[^.]+$/, ".pdf"), blob: new Blob([pdfBytes] as BlobPart[], { type: "application/pdf" }) });
          } else if (format === "txt") {
            const text = await file.text();
            converted.push({ name: file.name.replace(/\.[^.]+$/, ".txt"), blob: new Blob([text], { type: "text/plain" }) });
          }
        } catch {
          // Skip failed files
        }
      }

      setResults(converted);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to batch convert");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  const downloadAll = async () => {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    for (const r of results) zip.file(r.name, r.blob);
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a"); a.href = url; a.download = "converted-files.zip"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {files.length === 0 ? (
        <DropZone accept="*/*" multiple onFilesSelected={handleFiles} label="Drop files to convert" description="Images, text files, or any supported format" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">{files.length} file(s) selected</p>
            <button onClick={() => { setFiles([]); setResults([]); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Clear all</button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {files.map((file, i) => (
              <div key={`${file.name}-${i}`} className="flex items-center gap-3 p-2 rounded-lg bg-bg-elevated border border-border-base">
                <span className="text-sm text-text-primary truncate flex-1">{file.name}</span>
                <span className="text-xs text-text-tertiary">{(file.size / 1024).toFixed(0)} KB</span>
                <button onClick={() => removeFile(i)} className="text-text-tertiary hover:text-danger text-xs">✕</button>
              </div>
            ))}
          </div>

          <DropZone accept="*/*" multiple onFilesSelected={handleFiles} label="Add more files" description="Drop additional files" />

          <div>
            <label className="block text-sm text-text-secondary mb-2">Output format</label>
            <div className="flex gap-2">
              {(["pdf", "txt"] as OutputFormat[]).map(f => (
                <button key={f} onClick={() => setFormat(f)} className={`flex-1 py-2 rounded-lg text-sm font-medium uppercase transition-all ${format === f ? "bg-accent-start text-white" : "bg-bg-elevated text-text-secondary border border-border-base"}`}>{f}</button>
              ))}
            </div>
          </div>

          {results.length > 0 && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10">
              <p className="text-sm text-success mb-3">✓ {results.length} files converted!</p>
              <div className="flex flex-wrap gap-2">
                {results.slice(0, 5).map(r => <DownloadButton key={r.name} blob={r.blob} filename={r.name} label={r.name} />)}
                {results.length > 1 && <button onClick={downloadAll} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-text-primary bg-bg-surface border border-border-base hover:bg-bg-elevated">📦 Download all (ZIP)</button>}
              </div>
            </div>
          )}

          {!results.length && (
            <button onClick={handleConvert} disabled={processing || files.length === 0} className="btn-primary w-full py-3">
              {processing ? "Converting..." : `Convert ${files.length} files to ${format.toUpperCase()}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
