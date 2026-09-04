"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import type { ToolUIProps } from "@/components/tool-registry";

interface PageInfo {
  index: number;
  width: number;
  height: number;
  rotation: number;
}

interface AnalysisResult {
  pageCount: number;
  fileSize: string;
  fileSizeBytes: number;
  pages: PageInfo[];
  avgPageSize: string;
  totalArea: string;
  estimatedReadingTime: string;
  estimatedWordCount: number;
  orientation: { portrait: number; landscape: number };
  isMixedSize: boolean;
}

export default function PdfPageCounterTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const buffer = await f.arrayBuffer();
      const doc = await PDFDocument.load(buffer);
      const pages = doc.getPages();
      let portrait = 0, landscape = 0;
      let totalWidth = 0, totalHeight = 0;
      let isMixedSize = false;
      const firstSize = pages[0]?.getSize();
      const pageInfos: PageInfo[] = [];

      for (const page of pages) {
        const { width, height } = page.getSize();
        const rotation = page.getRotation().angle;
        const effectiveWidth = rotation === 90 || rotation === 270 ? height : width;
        const effectiveHeight = rotation === 90 || rotation === 270 ? width : height;

        if (effectiveWidth > effectiveHeight) landscape++;
        else portrait++;

        totalWidth += width;
        totalHeight += height;

        if (firstSize && (Math.abs(width - firstSize.width) > 1 || Math.abs(height - firstSize.height) > 1)) {
          isMixedSize = true;
        }

        pageInfos.push({ index: pageInfos.length + 1, width: Math.round(width), height: Math.round(height), rotation });
      }

      const pageCount = pages.length;
      const avgWidth = totalWidth / pageCount;
      const avgHeight = totalHeight / pageCount;

      // Estimate words per page based on average page size (rough heuristic)
      const avgArea = avgWidth * avgHeight;
      const estimatedWords = Math.round(avgArea / 12); // ~1 word per 12 sq pt
      const readingMinutes = Math.max(1, Math.round(estimatedWords / 238)); // 238 wpm average

      setResult({
        pageCount,
        fileSize: `${(f.size / (1024 * 1024)).toFixed(2)} MB`,
        fileSizeBytes: f.size,
        pages: pageInfos,
        avgPageSize: `${Math.round(avgWidth)} × ${Math.round(avgHeight)} pt`,
        totalArea: `${Math.round(avgWidth * avgHeight * pageCount / 72 / 72)} in²`,
        estimatedReadingTime: readingMinutes > 60 ? `${Math.round(readingMinutes / 60)}h ${readingMinutes % 60}m` : `${readingMinutes} min`,
        estimatedWordCount: estimatedWords,
        orientation: { portrait, landscape },
        isMixedSize,
      });
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to analyze PDF");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  }, [onError, onProcessing]);

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF to analyze" description="Get detailed page statistics" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <div className="flex-1">
              <p className="text-sm text-text-primary truncate">{file.name}</p>
              <p className="text-xs text-text-tertiary">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          {processing && (
            <div className="flex items-center justify-center py-8">
              <span className="w-6 h-6 border border-accent-start/30 border-t-accent-start rounded-full animate-spin-slow" />
            </div>
          )}

          {result && (
            <div className="space-y-3">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Pages", value: String(result.pageCount), icon: "📄" },
                  { label: "Reading Time", value: result.estimatedReadingTime, icon: "⏱️" },
                  { label: "Avg Size", value: result.avgPageSize, icon: "📐" },
                  { label: "Mixed Sizes", value: result.isMixedSize ? "Yes" : "No", icon: result.isMixedSize ? "⚠️" : "✓" },
                ].map(stat => (
                  <div key={stat.label} className="p-3 rounded-lg bg-bg-elevated border border-border-base text-center">
                    <span className="text-lg">{stat.icon}</span>
                    <p className="text-sm font-semibold text-text-primary mt-1">{stat.value}</p>
                    <p className="text-[10px] text-text-tertiary uppercase tracking-wider">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Orientation */}
              <div className="p-3 rounded-lg bg-bg-elevated border border-border-base">
                <p className="text-xs text-text-secondary mb-2">Orientation</p>
                <div className="flex gap-4">
                  <span className="text-sm text-text-primary">🖼️ Portrait: {result.orientation.portrait}</span>
                  <span className="text-sm text-text-primary">🏞️ Landscape: {result.orientation.landscape}</span>
                </div>
              </div>

              {/* Additional Info */}
              <div className="rounded-xl border border-border-base overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      ["Estimated words", `~${result.estimatedWordCount.toLocaleString()}`],
                      ["Total print area", result.totalArea],
                    ].map(([label, value]) => (
                      <tr key={label} className="border-b border-border-base last:border-0">
                        <td className="px-4 py-2.5 text-text-secondary font-medium bg-bg-elevated w-1/2">{label}</td>
                        <td className="px-4 py-2.5 text-text-primary">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
