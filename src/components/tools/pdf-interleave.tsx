"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function PdfInterleaveTool({ onProcessing, onError }: ToolUIProps) {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [pagesA, setPagesA] = useState(0);
  const [pagesB, setPagesB] = useState(0);

  const handleFileA = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFileA(f);
    setResult(null);
    try {
      const { loadPdf } = await import("@/lib/engines/pdf");
      const doc = await loadPdf(f);
      setPagesA(doc.getPageCount());
    } catch {
      setPagesA(0);
    }
  }, []);

  const handleFileB = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFileB(f);
    setResult(null);
    try {
      const { loadPdf } = await import("@/lib/engines/pdf");
      const doc = await loadPdf(f);
      setPagesB(doc.getPageCount());
    } catch {
      setPagesB(0);
    }
  }, []);

  const handleInterleave = async () => {
    if (!fileA || !fileB) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { loadPdf, savePdf } = await import("@/lib/engines/pdf");
      const docA = await loadPdf(fileA);
      const docB = await loadPdf(fileB);
      const newDoc = await import("pdf-lib").then(m => m.PDFDocument.create());

      const indicesA = docA.getPageIndices();
      const indicesB = docB.getPageIndices();
      const maxLen = Math.max(indicesA.length, indicesB.length);

      for (let i = 0; i < maxLen; i++) {
        if (i < indicesA.length) {
          const [p] = await newDoc.copyPages(docA, [indicesA[i]]);
          newDoc.addPage(p);
        }
        if (i < indicesB.length) {
          const [p] = await newDoc.copyPages(docB, [indicesB[i]]);
          newDoc.addPage(p);
        }
      }

      const blob = await savePdf(newDoc);
      setResult(blob);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to interleave PDFs");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-text-secondary mb-2">First PDF</label>
          {!fileA ? (
            <DropZone accept=".pdf" onFilesSelected={handleFileA} label="Drop PDF A" description="First document" />
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
              <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">A</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary truncate">{fileA.name}</p>
                <p className="text-xs text-text-tertiary">{pagesA} pages</p>
              </div>
              <button onClick={() => { setFileA(null); setPagesA(0); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">✕</button>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-2">Second PDF</label>
          {!fileB ? (
            <DropZone accept=".pdf" onFilesSelected={handleFileB} label="Drop PDF B" description="Second document" />
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
              <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">B</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary truncate">{fileB.name}</p>
                <p className="text-xs text-text-tertiary">{pagesB} pages</p>
              </div>
              <button onClick={() => { setFileB(null); setPagesB(0); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">✕</button>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 rounded-lg bg-bg-elevated border border-border-base">
        <p className="text-xs text-text-secondary">
          Pages will be interleaved: A₁, B₁, A₂, B₂, ... Result: {pagesA + pagesB} total pages
        </p>
      </div>

      {result && (
        <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
          <p className="text-sm text-success mb-3">✓ Interleaved successfully!</p>
          <DownloadButton blob={result} filename="interleaved.pdf" />
        </div>
      )}

      {!result && (
        <button onClick={handleInterleave} disabled={processing || !fileA || !fileB} className="btn-primary w-full py-3">
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
              Interleaving...
            </span>
          ) : "Interleave PDFs"}
        </button>
      )}
    </div>
  );
}
