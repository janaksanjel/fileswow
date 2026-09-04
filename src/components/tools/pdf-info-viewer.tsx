"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import type { ToolUIProps } from "@/components/tool-registry";

interface PdfInfo {
  pageCount: number;
  title: string | undefined;
  author: string | undefined;
  subject: string | undefined;
  keywords: string | undefined;
  creator: string | undefined;
  producer: string | undefined;
  creationDate: Date | undefined;
  modificationDate: Date | undefined;
}

export default function PdfInfoViewerTool({ onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState<PdfInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setInfo(null);
    setLoading(true);
    try {
      const { getPdfInfo } = await import("@/lib/engines/pdf");
      const result = await getPdfInfo(f);
      setInfo(result);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to read PDF info");
    } finally {
      setLoading(false);
    }
  }, [onError]);

  return (
    <div className="space-y-6">
      {!file && (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF to inspect" description="View metadata, page count, and properties" />
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <span className="w-6 h-6 border border-accent-start/30 border-t-accent-start rounded-full animate-spin-slow" />
        </div>
      )}

      {info && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-bg-elevated border border-border-base">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Document Properties</h3>
            <div className="space-y-2">
              {[
                ["Pages", String(info.pageCount)],
                ["File size", file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "—"],
                ["Title", info.title || "—"],
                ["Author", info.author || "—"],
                ["Subject", info.subject || "—"],
                ["Keywords", info.keywords || "—"],
                ["Creator", info.creator || "—"],
                ["Producer", info.producer || "—"],
                ["Created", info.creationDate?.toLocaleDateString() || "—"],
                ["Modified", info.modificationDate?.toLocaleDateString() || "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-border-base last:border-0">
                  <span className="text-xs text-text-tertiary">{label}</span>
                  <span className="text-xs text-text-primary font-mono">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => { setFile(null); setInfo(null); }} className="w-full py-2.5 rounded-xl text-sm font-medium text-text-secondary border border-border-base hover:bg-bg-elevated transition-colors">
            Inspect another PDF
          </button>
        </div>
      )}
    </div>
  );
}
