"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function SplitPdfBySizeTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [targetSizeMB, setTargetSizeMB] = useState(5);
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
    } catch { setPageCount(0); }
  }, []);

  const handleSplit = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const buffer = await file.arrayBuffer();
      const source = await PDFDocument.load(buffer);
      const total = source.getPageCount();
      const targetBytes = targetSizeMB * 1024 * 1024;
      const avgPageBytes = buffer.byteLength / total;
      const pagesPerPart = Math.max(1, Math.floor(targetBytes / avgPageBytes));

      const chunks: { name: string; blob: Blob }[] = [];
      for (let start = 0; start < total; start += pagesPerPart) {
        const end = Math.min(start + pagesPerPart, total);
        const newDoc = await PDFDocument.create();
        const indices = Array.from({ length: end - start }, (_, i) => start + i);
        const pages = await newDoc.copyPages(source, indices);
        pages.forEach(p => newDoc.addPage(p));
        const bytes = await newDoc.save();
        const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
        chunks.push({ name: `part-${chunks.length + 1}.pdf`, blob });
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
    const a = document.createElement("a"); a.href = url; a.download = "split-parts.zip"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF to split by size" description="Split into parts under a target file size" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p><p className="text-xs text-text-tertiary">{pageCount} pages · {(file.size / 1024 / 1024).toFixed(1)}MB</p></div>
            <button onClick={() => { setFile(null); setResults([]); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Target max size per part</label>
            <div className="flex gap-2">
              {[1, 2, 5, 10, 25].map(s => (
                <button key={s} onClick={() => setTargetSizeMB(s)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${targetSizeMB === s ? "bg-accent-start text-white" : "bg-bg-elevated text-text-secondary border border-border-base"}`}>{s}MB</button>
              ))}
            </div>
          </div>

          {results.length > 0 && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10">
              <p className="text-sm text-success mb-3">✓ Split into {results.length} parts</p>
              <div className="flex flex-wrap gap-2">
                {results.map(r => <DownloadButton key={r.name} blob={r.blob} filename={r.name} label={r.name} />)}
                {results.length > 1 && <button onClick={downloadAll} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-text-primary bg-bg-surface border border-border-base hover:bg-bg-elevated">📦 Download all</button>}
              </div>
            </div>
          )}

          {!results.length && (
            <button onClick={handleSplit} disabled={processing} className="btn-primary w-full py-3">
              {processing ? "Splitting..." : `Split into ≤${targetSizeMB}MB parts`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
