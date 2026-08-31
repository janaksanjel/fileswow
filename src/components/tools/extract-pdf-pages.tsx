"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function ExtractPdfPagesTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    try {
      const { loadPdf } = await import("@/lib/engines/pdf");
      const doc = await loadPdf(f);
      setPageCount(doc.getPageCount());
    } catch { setPageCount(0); }
  }, []);

  const parsePages = (input: string): number[] => {
    const nums: number[] = [];
    for (const part of input.split(",")) {
      const t = part.trim();
      if (t.includes("-")) {
        const [s, e] = t.split("-").map(Number);
        for (let i = s; i <= e; i++) nums.push(i);
      } else {
        const n = parseInt(t);
        if (!isNaN(n)) nums.push(n);
      }
    }
    return nums.filter(n => n >= 1 && n <= pageCount);
  };

  const handleExtract = async () => {
    if (!file) return;
    const p = parsePages(pages);
    if (p.length === 0) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { extractPages, savePdf } = await import("@/lib/engines/pdf");
      const doc = await extractPages(file, p);
      const blob = await savePdf(doc);
      setResult(blob);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to extract pages");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF" description="Select pages to extract" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <span className="text-sm text-text-primary truncate flex-1">{file.name}</span>
            <span className="text-xs text-text-tertiary">{pageCount} pages</span>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-2">Pages to extract</label>
            <input type="text" value={pages} onChange={(e) => setPages(e.target.value)} placeholder="e.g., 1, 3, 5-8" className="w-full px-4 py-2.5 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm font-mono focus:border-accent focus:outline-none transition-colors" />
            <p className="mt-1 text-xs text-text-tertiary">Range: 1–{pageCount}</p>
          </div>
          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Pages extracted!</p>
              <DownloadButton blob={result} filename="extracted.pdf" />
            </div>
          )}
          {!result && (
            <button onClick={handleExtract} disabled={processing || parsePages(pages).length === 0} className="btn-primary w-full py-3">
              {processing ? "Extracting..." : `Extract ${parsePages(pages).length} page(s)`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
