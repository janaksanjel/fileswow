"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function SplitPdfTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [ranges, setRanges] = useState("1-3, 5, 8-10");
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

  const parseRanges = (input: string): Array<{ start: number; end: number }> => {
    const ranges: Array<{ start: number; end: number }> = [];
    const parts = input.split(",").map((s) => s.trim());
    for (const part of parts) {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map(Number);
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          ranges.push({ start, end });
        }
      } else {
        const num = parseInt(part);
        if (!isNaN(num)) {
          ranges.push({ start: num, end: num });
        }
      }
    }
    return ranges;
  };

  const handleSplit = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { splitPdf, savePdf } = await import("@/lib/engines/pdf");
      const parsed = parseRanges(ranges);
      const docs = await splitPdf(file, parsed);
      const res = await Promise.all(
        docs.map(async (doc, i) => {
          const blob = await savePdf(doc);
          return { name: `split-${i + 1}.pdf`, blob };
        })
      );
      setResults(res);
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
    for (const r of results) {
      zip.file(r.name, r.blob);
    }
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "split-pages.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {!file && (
        <DropZone
          accept=".pdf"
          onFilesSelected={handleFile}
          label="Drop a PDF to split"
          description="Select a single PDF file"
        />
      )}

      {file && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">
              PDF
            </span>
            <div className="flex-1">
              <p className="text-sm text-text-primary truncate">{file.name}</p>
              <p className="text-xs text-text-tertiary">{pageCount} pages</p>
            </div>
            <button
              onClick={() => { setFile(null); setResults([]); setPageCount(0); }}
              className="text-xs text-text-tertiary hover:text-danger transition-colors"
            >
              Remove
            </button>
          </div>

          {/* Range input */}
          <div>
            <label className="block text-sm text-text-secondary mb-2">
              Page ranges (comma-separated)
            </label>
            <input
              type="text"
              value={ranges}
              onChange={(e) => setRanges(e.target.value)}
              placeholder="1-3, 5, 8-10"
              className="w-full px-4 py-2.5 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm font-mono focus:border-accent focus:outline-none transition-colors"
            />
            <p className="mt-1 text-xs text-text-tertiary">
              Use ranges like 1-3, single pages like 5, or mix both. Pages: 1–{pageCount}
            </p>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10">
                <p className="text-sm text-success mb-3">
                  ✓ Split complete! {results.length} file{results.length !== 1 ? "s" : ""} created
                </p>
                <div className="flex flex-wrap gap-2">
                  {results.map((r) => (
                    <DownloadButton key={r.name} blob={r.blob} filename={r.name} label={r.name} />
                  ))}
                  {results.length > 1 && (
                    <button
                      onClick={downloadAll}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-text-primary bg-bg-surface border border-border-base hover:bg-bg-elevated transition-colors"
                    >
                      📦 Download all (ZIP)
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Split button */}
          {!results.length && (
            <button
              onClick={handleSplit}
              disabled={processing || !parseRanges(ranges).length}
              className="btn-primary w-full py-3"
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />
                  Splitting...
                </span>
              ) : (
                "Split PDF"
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
