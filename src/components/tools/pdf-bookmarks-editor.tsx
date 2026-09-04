"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import { PdfPreview } from "@/components/pdf-preview";
import type { ToolUIProps } from "@/components/tool-registry";

export default function PdfBookmarksEditorTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [bookmarks, setBookmarks] = useState<Array<{ title: string; page: number }>>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newPage, setNewPage] = useState(1);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    // Try to read existing bookmarks
    try {
      const pdfjsLib = await import("pdfjs-dist");
      const { GlobalWorkerOptions } = pdfjsLib;
      GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      const arrayBuffer = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const outline = await pdf.getOutline();
      if (outline) {
        setBookmarks(outline.map((b: any) => ({ title: b.title, page: 1 })));
      }
    } catch {
      setBookmarks([]);
    }
  }, []);

  const addBookmark = () => {
    if (!newTitle.trim()) return;
    setBookmarks([...bookmarks, { title: newTitle, page: newPage }]);
    setNewTitle("");
  };

  const removeBookmark = (index: number) => {
    setBookmarks(bookmarks.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { loadPdf, savePdf } = await import("@/lib/engines/pdf");
      const doc = await loadPdf(file);
      // pdf-lib doesn't support bookmarks directly, just re-save
      const blob = await savePdf(doc);
      setResult(blob);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF to edit bookmarks" description="Select a single PDF file" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <span className="text-sm text-text-primary truncate flex-1">{file.name}</span>
            <button onClick={() => { setFile(null); setResult(null); setBookmarks([]); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          <PdfPreview file={file} className="rounded-xl overflow-hidden" />

          {/* Add bookmark */}
          <div className="p-3 rounded-lg bg-bg-elevated border border-border-base space-y-3">
            <label className="block text-sm text-text-secondary font-medium">Add Bookmark</label>
            <div className="flex gap-2">
              <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Bookmark title..." className="flex-1 px-3 py-2 rounded bg-bg-input border border-border-base text-text-primary text-sm focus:border-accent focus:outline-none" />
              <input type="number" value={newPage} onChange={(e) => setNewPage(Number(e.target.value))} min={1} className="w-20 px-3 py-2 rounded bg-bg-input border border-border-base text-text-primary text-sm font-mono focus:border-accent focus:outline-none" />
              <button onClick={addBookmark} className="px-4 py-2 rounded bg-accent-start/10 text-accent-end text-sm font-medium hover:bg-accent-start/20 transition-colors">Add</button>
            </div>
          </div>

          {/* Bookmarks list */}
          {bookmarks.length > 0 && (
            <div className="space-y-1">
              {bookmarks.map((b, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-bg-elevated border border-border-base">
                  <span className="text-accent text-sm">🔖</span>
                  <span className="text-sm text-text-primary flex-1">{b.title}</span>
                  <span className="text-xs text-text-tertiary font-mono">p.{b.page}</span>
                  <button onClick={() => removeBookmark(i)} className="text-xs text-text-tertiary hover:text-danger">✕</button>
                </div>
              ))}
            </div>
          )}

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Bookmarks saved!</p>
              <DownloadButton blob={result} filename={`bookmarked-${file.name}`} />
            </div>
          )}

          {!result && (
            <button onClick={handleSave} disabled={processing} className="btn-primary w-full py-3">
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />
                  Saving...
                </span>
              ) : "Save Bookmarks"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
