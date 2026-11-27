"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { FilePreviewButton } from "@/components/file-preview-button";
import type { ToolUIProps } from "@/components/tool-registry";
import { UiIcon } from "@/components/ui-icon";
import { extractStructuredLines } from "@/lib/engines/pdf-to-word";
import type { OcrMode, OcrProgress } from "@/lib/engines/nepali-pdf-ocr";

export default function PdfToTextTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ocrMode, setOcrMode] = useState<OcrMode>("auto");
  const [progress, setProgress] = useState<OcrProgress | null>(null);
  const [meta, setMeta] = useState<{ pageCount: number; ocrPages: number } | null>(null);

  const runExtract = useCallback(
    async (targetFile: File, mode: OcrMode) => {
      setProcessing(true);
      setProgress(null);
      setText("");
      setMeta(null);
      onProcessing?.(true);
      try {
        const result = await extractStructuredLines(targetFile, {
          ocrMode: mode,
          onProgress: (p) => setProgress(p),
        });

        const pageBlocks: string[] = [];
        let currentPage = -1;
        let currentLines: string[] = [];

        for (const line of result.lines) {
          if (line.page !== currentPage) {
            if (currentLines.length > 0) {
              pageBlocks.push(currentLines.join("\n"));
            }
            currentPage = line.page;
            currentLines = result.pageCount > 1 ? [`--- Page ${line.page} ---`] : [];
          }
          currentLines.push(line.fullText);
        }
        if (currentLines.length > 0) {
          pageBlocks.push(currentLines.join("\n"));
        }

        const extracted = pageBlocks.join("\n\n").trim();
        setMeta({ pageCount: result.pageCount, ocrPages: result.ocrPages });
        setText(
          extracted ||
            "No text could be extracted from this PDF. Try switching to 'AI OCR (All Pages)' if the pages are scanned."
        );
      } catch (err) {
        onError?.(err instanceof Error ? err.message : "Failed to extract text from PDF");
      } finally {
        setProcessing(false);
        setProgress(null);
        onProcessing?.(false);
      }
    },
    [onError, onProcessing]
  );

  const handleFile = useCallback(
    async (files: File[]) => {
      const f = files[0];
      if (!f) return;
      setFile(f);
      await runExtract(f, ocrMode);
    },
    [ocrMode, runExtract]
  );

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked
    }
  };

  return (
    <div className="space-y-5">
      {/* Mode & Language Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-bg-elevated border border-border-base">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: "auto", label: "Smart Auto (All Languages + OCR)" },
              { id: "always", label: "Force AI OCR" },
              { id: "off", label: "Fast Text Only" },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              disabled={processing}
              onClick={() => {
                setOcrMode(m.id);
                if (file) void runExtract(file, m.id);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer disabled:opacity-50 ${
                ocrMode === m.id
                  ? "bg-accent text-white border-accent"
                  : "bg-bg-input text-text-secondary border-border-base hover:text-text-primary"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <span className="px-2.5 py-1 rounded-full bg-accent-subtle text-accent text-[11px] font-semibold">
          Auto-Detects Any Language
        </span>
      </div>

      {!file ? (
        <DropZone
          accept=".pdf"
          onFilesSelected={handleFile}
          label="Drop a PDF to extract text"
          description="Supports all world languages — digital Unicode, legacy fonts & scanned PDFs — 100% free in your browser"
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">
              PDF
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary truncate">{file.name}</p>
              {meta && (
                <p className="text-[11px] text-text-tertiary">
                  {meta.pageCount} page{meta.pageCount === 1 ? "" : "s"}
                  {meta.ocrPages > 0 ? ` · AI OCR used on ${meta.ocrPages} page(s)` : " · Digital text extracted"}
                </p>
              )}
            </div>
            <FilePreviewButton file={file} />
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setText("");
                setMeta(null);
              }}
              className="text-xs text-text-tertiary hover:text-danger transition-colors cursor-pointer"
            >
              Remove
            </button>
          </div>

          {processing && (
            <div className="p-4 rounded-xl bg-bg-elevated border border-border-base space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-text-secondary">
                <span>{progress?.stage || "Extracting text from PDF…"}</span>
                <span className="tabular-nums">{progress ? `${progress.percent}%` : ""}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-bg-surface overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-300"
                  style={{ width: `${Math.max(8, progress?.percent ?? 15)}%` }}
                />
              </div>
            </div>
          )}

          {text && !processing && (
            <div className="space-y-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={16}
                aria-label="Extracted PDF text"
                className="w-full px-4 py-3 rounded-xl bg-bg-elevated border border-border-base text-text-primary text-sm leading-relaxed resize-y outline-none focus:border-accent"
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-text-primary bg-bg-surface border border-border-base hover:bg-bg-elevated transition-colors cursor-pointer"
                >
                  <UiIcon name="copy" size={15} className="inline align-[-3px] mr-1.5" />
                  {copied ? "Copied!" : "Copy to clipboard"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = file.name.replace(/\.pdf$/i, ".txt");
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="btn-primary px-4 py-2 text-sm cursor-pointer"
                >
                  <UiIcon name="download" size={15} className="inline align-[-3px] mr-1.5" />
                  Download as TXT
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
