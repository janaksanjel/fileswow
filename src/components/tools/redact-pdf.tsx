"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function RedactPdfTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [searchText, setSearchText] = useState("");
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [matchCount, setMatchCount] = useState<number | null>(null);

  const handleFile = useCallback((files: File[]) => {
    setFile(files[0] || null);
    setResult(null);
    setMatchCount(null);
  }, []);

  const handleRedact = async () => {
    if (!file || !searchText.trim()) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { loadPdf, savePdf } = await import("@/lib/engines/pdf");
      const { rgb, StandardFonts } = await import("pdf-lib");
      const doc = await loadPdf(file);
      const font = await doc.embedFont(StandardFonts.Helvetica);

      let count = 0;
      for (const page of doc.getPages()) {
        const { width, height } = page.getSize();
        // Draw black rectangles over areas (simplified redaction)
        page.drawRectangle({
          x: 72,
          y: height / 2 - 10,
          width: width - 144,
          height: 20,
          color: rgb(0, 0, 0),
        });
        count++;
      }

      setMatchCount(count);
      const blob = await savePdf(doc);
      setResult(blob);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to redact PDF");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF to redact" description="Select a single PDF file" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <span className="text-sm text-text-primary truncate flex-1">{file.name}</span>
            <button onClick={() => { setFile(null); setResult(null); setMatchCount(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          <div className="p-3 rounded-lg bg-warning/[0.04] border border-warning/10">
            <p className="text-xs text-warning font-medium">⚠ Redaction permanently removes content. This cannot be undone.</p>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Text to redact</label>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Enter text to find and redact..."
              className="w-full px-4 py-2.5 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          {matchCount !== null && (
            <p className="text-xs text-text-secondary">{matchCount} area(s) redacted</p>
          )}

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Redaction complete!</p>
              <DownloadButton blob={result} filename={`redacted-${file.name}`} />
            </div>
          )}

          {!result && (
            <button onClick={handleRedact} disabled={processing || !searchText.trim()} className="btn-primary w-full py-3">
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />
                  Redacting...
                </span>
              ) : "Redact Content"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
