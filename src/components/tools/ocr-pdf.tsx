"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import { FilePreviewButton } from "@/components/file-preview-button";
import type { ToolUIProps } from "@/components/tool-registry";
import { UiIcon } from "@/components/ui-icon";
import {
  createOcrWorker,
  renderPdfPageToCanvas,
  type OcrProgress,
} from "@/lib/engines/nepali-pdf-ocr";

export default function OcrPdfTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [copied, setCopied] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [ocrLang, setOcrLang] = useState("nep+eng");
  const [progress, setProgress] = useState<OcrProgress | null>(null);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setExtractedText("");
    try {
      const { loadPdf } = await import("@/lib/engines/pdf");
      const doc = await loadPdf(f);
      setPageCount(doc.getPageCount());
    } catch {
      setPageCount(0);
    }
  }, []);

  const handleOcr = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(null);
    setResult(null);
    setExtractedText("");
    onProcessing?.(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let worker: any = null;
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      const { PDFDocument } = await import("pdf-lib");

      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      const totalPages = pdf.numPages;

      setProgress({
        page: 1,
        totalPages,
        stage: `Loading AI OCR model (${ocrLang})…`,
        percent: 5,
      });

      worker = await createOcrWorker(ocrLang, (p, status) => {
        setProgress((prev) => ({
          page: prev?.page ?? 1,
          totalPages,
          stage: `AI OCR: ${status}`,
          percent: Math.max(prev?.percent ?? 5, Math.round(p * 100 / totalPages)),
        }));
      });

      const mergedDoc = await PDFDocument.create();
      const sourceDoc = await PDFDocument.load(buffer);
      const pageTexts: string[] = [];

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        setProgress({
          page: pageNum,
          totalPages,
          stage: `Recognizing page ${pageNum} of ${totalPages}…`,
          percent: Math.round(((pageNum - 1) / totalPages) * 100),
        });

        const page = await pdf.getPage(pageNum);
        const { canvas } = await renderPdfPageToCanvas(page, 2.2);

        const res = await worker.recognize(
          canvas,
          { pdfTitle: file.name },
          { text: true, pdf: true }
        );

        canvas.width = 0;
        canvas.height = 0;

        const pageText = (res?.data?.text || "").trim();
        if (pageText) {
          pageTexts.push(totalPages > 1 ? `--- Page ${pageNum} ---\n${pageText}` : pageText);
        }

        const pdfBytes = res?.data?.pdf as number[] | null | undefined;
        if (pdfBytes && pdfBytes.length > 0) {
          const ocrPageDoc = await PDFDocument.load(new Uint8Array(pdfBytes));
          const [copiedPage] = await mergedDoc.copyPages(ocrPageDoc, [0]);
          mergedDoc.addPage(copiedPage);
        } else {
          const [fallbackPage] = await mergedDoc.copyPages(sourceDoc, [pageNum - 1]);
          mergedDoc.addPage(fallbackPage);
        }
      }

      const bytes = await mergedDoc.save();
      setResult(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }));
      setExtractedText(pageTexts.join("\n\n"));
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to run AI OCR on PDF");
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch {
          // Ignore termination error
        }
      }
      setProcessing(false);
      setProgress(null);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone
          accept=".pdf"
          onFilesSelected={handleFile}
          label="Drop a scanned or Nepali PDF"
          description="Free browser-based AI OCR makes scanned & Preeti/Unicode Nepali PDFs searchable and copyable"
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">
              PDF
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary truncate">{file.name}</p>
              <p className="text-xs text-text-tertiary">{pageCount} page{pageCount === 1 ? "" : "s"}</p>
            </div>
            <FilePreviewButton file={file} />
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setResult(null);
                setExtractedText("");
              }}
              className="text-xs text-text-tertiary hover:text-danger transition-colors cursor-pointer"
            >
              Remove
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-bg-elevated border border-border-base">
            <div>
              <p className="text-xs font-bold text-text-primary">Free AI OCR Language</p>
              <p className="text-[11px] text-text-secondary">
                Runs 100% locally in your browser — no file uploads or limits.
              </p>
            </div>
            <select
              value={ocrLang}
              onChange={(e) => setOcrLang(e.target.value)}
              disabled={processing}
              aria-label="OCR Language"
              className="h-8 rounded-lg border border-border-strong bg-bg-input px-2.5 text-xs font-semibold text-text-primary cursor-pointer"
            >
              <option value="nep+eng">Nepali + English</option>
              <option value="eng">English Only</option>
              <option value="hin+eng">Hindi + English</option>
            </select>
          </div>

          {processing && progress && (
            <div className="p-4 rounded-xl bg-bg-elevated border border-border-base space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-text-secondary">
                <span>{progress.stage}</span>
                <span className="tabular-nums">{progress.percent}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-bg-surface overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-300"
                  style={{ width: `${Math.max(6, progress.percent)}%` }}
                />
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-success/[0.04] border border-success/20 text-center">
                <p className="text-sm text-success font-semibold mb-3">
                  <UiIcon name="check" size={14} className="inline align-[-3px] mr-1" />
                  Searchable PDF &amp; OCR text ready!
                </p>
                <DownloadButton blob={result} filename={`ocr-${file.name}`} />
              </div>

              {extractedText && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary">Recognized Text</span>
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(extractedText);
                        setCopied(true);
                        window.setTimeout(() => setCopied(false), 1800);
                      }}
                      className="text-xs font-semibold text-accent hover:underline cursor-pointer"
                    >
                      {copied ? "Copied!" : "Copy text"}
                    </button>
                  </div>
                  <textarea
                    value={extractedText}
                    readOnly
                    rows={10}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-bg-elevated border border-border-base text-text-primary text-sm leading-relaxed resize-y"
                  />
                </div>
              )}
            </div>
          )}

          {!result && (
            <button
              type="button"
              onClick={handleOcr}
              disabled={processing}
              className="btn-primary w-full py-3 cursor-pointer disabled:opacity-60"
            >
              {processing ? "Running AI OCR…" : "Run Free AI OCR"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
