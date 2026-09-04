"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function RotatePdfTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [angle, setAngle] = useState<90 | 180 | 270>(90);
  const [pageSelection, setPageSelection] = useState("all");
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [pageCount, setPageCount] = useState(0);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    try {
      const { loadPdf } = await import("@/lib/engines/pdf");
      const doc = await loadPdf(f);
      setPageCount(doc.getPageCount());
    } catch {
      setPageCount(0);
    }
  }, []);

  const handleRotate = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { rotatePages, savePdf } = await import("@/lib/engines/pdf");
      const pages =
        pageSelection === "all"
          ? []
          : pageSelection.split(",").map((s) => parseInt(s.trim())).filter((n) => !isNaN(n));
      const doc = await rotatePages(file, pages, angle);
      const blob = await savePdf(doc);
      setResult(blob);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to rotate PDF");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file && (
        <DropZone
          accept=".pdf"
          onFilesSelected={handleFile}
          label="Drop a PDF to rotate"
          description="Select a single PDF file"
        />
      )}

      {file && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <div className="flex-1">
              <p className="text-sm text-text-primary truncate">{file.name}</p>
              <p className="text-xs text-text-tertiary">{pageCount} pages</p>
            </div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">
              Remove
            </button>
          </div>

          {/* Angle selector */}
          <div>
            <label className="block text-sm text-text-secondary mb-2">Rotation angle</label>
            <div className="flex gap-2">
              {[90, 180, 270].map((a) => (
                <button
                  key={a}
                  onClick={() => setAngle(a as 90 | 180 | 270)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    angle === a
                      ? "bg-accent-start text-white"
                      : "bg-bg-elevated text-text-secondary hover:text-text-primary border border-border-base"
                  }`}
                >
                  {a}°
                </button>
              ))}
            </div>
          </div>

          {/* Page selection */}
          <div>
            <label className="block text-sm text-text-secondary mb-2">Pages to rotate</label>
            <input
              type="text"
              value={pageSelection}
              onChange={(e) => setPageSelection(e.target.value)}
              placeholder="all"
              className="w-full px-4 py-2.5 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm font-mono focus:border-accent focus:outline-none transition-colors"
            />
            <p className="mt-1 text-xs text-text-tertiary">Enter "all" or comma-separated page numbers (e.g., 1, 3, 5-8)</p>
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Rotation complete!</p>
              <DownloadButton blob={result} filename={`rotated-${file.name}`} />
            </div>
          )}

          {!result && (
            <button
              onClick={handleRotate}
              disabled={processing}
              className="btn-primary w-full py-3"
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />
                  Rotating...
                </span>
              ) : (
                `Rotate ${angle}°`
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
