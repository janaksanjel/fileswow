"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function SplitPdfByPageCountTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pagesPerChunk, setPagesPerChunk] = useState(5);
  const [results, setResults] = useState<{ name: string; blob: Blob }[]>([]);
  const [processing, setProcessing] = useState(false);
  const [pageCount, setPageCount] = useState(0);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResults([]);
    try {
      const { loadPdf } = await import("@/lib/engines/pdf");
      const doc = await loadPdf(f);
      setPageCount(doc.getPageCount());
    } catch {
      setPageCount(0);
    }
  }, []);

  const handleSplit = async () => {
    if (!file || pagesPerChunk < 1) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { loadPdf, savePdf } = await import("@/lib/engines/pdf");
      const source = await loadPdf(file);
      const total = source.getPageCount();
      const chunks: { name: string; blob: Blob }[] = [];

      for (let start = 0; start < total; start += pagesPerChunk) {
        const end = Math.min(start + pagesPerChunk, total);
        const newDoc = await import("pdf-lib").then((m) => m.PDFDocument.create());
        const indices = Array.from({ length: end - start }, (_, i) => start + i);
        const pages = await newDoc.copyPages(source, indices);
        pages.forEach((p) => newDoc.addPage(p));
        const blob = await savePdf(newDoc);
        const chunkNum = chunks.length + 1;
        chunks.push({ name: `part-${chunkNum}.pdf`, blob });
      }

      setResults(chunks);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to split PDF");
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
    const a = document.createElement("a");
    a.href = url;
    a.download = "split-parts.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  const estimatedChunks = pageCount > 0 ? Math.ceil(pageCount / pagesPerChunk) : 0;

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF to split" description="Select a PDF file to split into equal parts" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <div className="flex-1">
              <p className="text-sm text-text-primary truncate">{file.name}</p>
              <p className="text-xs text-text-tertiary">{pageCount} pages</p>
            </div>
            <button onClick={() => { setFile(null); setResults([]); setPageCount(0); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Pages per part</label>
            <div className="flex items-center gap-3">
              <input type="range" min="1" max={Math.max(pageCount, 1)} value={pagesPerChunk} onChange={(e) => setPagesPerChunk(Number(e.target.value))} className="flex-1 accent-accent-start" />
              <input type="number" min="1" max={pageCount} value={pagesPerChunk} onChange={(e) => setPagesPerChunk(Math.max(1, Number(e.target.value)))} className="w-20 px-3 py-2 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm font-mono text-center focus:border-accent focus:outline-none" />
            </div>
            <p className="mt-1 text-xs text-text-tertiary">This will create {estimatedChunks} part{estimatedChunks !== 1 ? "s" : ""}</p>
          </div>

          {results.length > 0 && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10">
                <p className="text-sm text-success mb-3">✓ Split complete! {results.length} parts created</p>
                <div className="flex flex-wrap gap-2">
                  {results.map((r) => (
                    <DownloadButton key={r.name} blob={r.blob} filename={r.name} label={r.name} />
                  ))}
                  {results.length > 1 && (
                    <button onClick={downloadAll} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-text-primary bg-bg-surface border border-border-base hover:bg-bg-elevated transition-colors">📦 Download all</button>
                  )}
                </div>
              </div>
            </div>
          )}

          {!results.length && (
            <button onClick={handleSplit} disabled={processing || pagesPerChunk < 1} className="btn-primary w-full py-3">
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
                  Splitting...
                </span>
              ) : `Split into ${estimatedChunks} parts`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
