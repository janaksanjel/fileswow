"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function SplitPdfByBookmarksTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<{ name: string; blob: Blob }[]>([]);
  const [processing, setProcessing] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [sections, setSections] = useState<{ title: string; start: number; end: number }[]>([]);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResults([]);
    setSections([]);
    try {
      const { loadPdf } = await import("@/lib/engines/pdf");
      const doc = await loadPdf(f);
      const total = doc.getPageCount();
      setPageCount(total);
      // Create default sections (every 5 pages)
      const defaultSections = [];
      for (let i = 0; i < total; i += 5) {
        defaultSections.push({ title: `Section ${defaultSections.length + 1}`, start: i + 1, end: Math.min(i + 5, total) });
      }
      setSections(defaultSections);
    } catch { setPageCount(0); }
  }, []);

  const updateSection = (idx: number, field: string, value: string | number) => {
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const addSection = () => {
    setSections(prev => [...prev, { title: `Section ${prev.length + 1}`, start: 1, end: pageCount }]);
  };

  const removeSection = (idx: number) => {
    setSections(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSplit = async () => {
    if (!file || sections.length === 0) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const buffer = await file.arrayBuffer();
      const source = await PDFDocument.load(buffer);
      const results: { name: string; blob: Blob }[] = [];

      for (const section of sections) {
        const newDoc = await PDFDocument.create();
        const indices = [];
        for (let i = section.start - 1; i < section.end && i < source.getPageCount(); i++) {
          indices.push(i);
        }
        if (indices.length > 0) {
          const pages = await newDoc.copyPages(source, indices);
          pages.forEach(p => newDoc.addPage(p));
          const bytes = await newDoc.save();
          results.push({ name: `${section.title.replace(/[^a-z0-9]/gi, '_')}.pdf`, blob: new Blob([new Uint8Array(bytes)], { type: "application/pdf" }) });
        }
      }
      setResults(results);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to split by bookmarks");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF" description="Split by sections/bookmarks" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p><p className="text-xs text-text-tertiary">{pageCount} pages</p></div>
            <button onClick={() => { setFile(null); setResults([]); setSections([]); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          <div className="space-y-2">
            {sections.map((s, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-bg-elevated border border-border-base">
                <input type="text" value={s.title} onChange={(e) => updateSection(i, "title", e.target.value)} className="flex-1 px-2 py-1 rounded bg-transparent text-sm text-text-primary border border-border-base focus:border-accent focus:outline-none" />
                <input type="number" min="1" max={pageCount} value={s.start} onChange={(e) => updateSection(i, "start", Number(e.target.value))} className="w-16 px-2 py-1 rounded bg-transparent text-sm text-text-primary font-mono text-center border border-border-base focus:border-accent focus:outline-none" />
                <span className="text-xs text-text-tertiary">to</span>
                <input type="number" min="1" max={pageCount} value={s.end} onChange={(e) => updateSection(i, "end", Number(e.target.value))} className="w-16 px-2 py-1 rounded bg-transparent text-sm text-text-primary font-mono text-center border border-border-base focus:border-accent focus:outline-none" />
                <button onClick={() => removeSection(i)} className="text-text-tertiary hover:text-danger text-xs">✕</button>
              </div>
            ))}
          </div>

          <button onClick={addSection} className="text-sm text-accent hover:text-accent-end transition-colors">+ Add section</button>

          {results.length > 0 && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10">
              <p className="text-sm text-success mb-3">✓ Split into {results.length} sections</p>
              <div className="flex flex-wrap gap-2">
                {results.map(r => <DownloadButton key={r.name} blob={r.blob} filename={r.name} label={r.name} />)}
              </div>
            </div>
          )}

          {!results.length && (
            <button onClick={handleSplit} disabled={processing || sections.length === 0} className="btn-primary w-full py-3">
              {processing ? "Splitting..." : `Split into ${sections.length} sections`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
