"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function PdfToJpgTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dpi, setDpi] = useState(150);
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

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { loadPdf } = await import("@/lib/engines/pdf");
      const { GlobalWorkerOptions } = await import("pdfjs-dist");
      const pdfjsLib = await import("pdfjs-dist");

      GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const images: { name: string; blob: Blob }[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: dpi / 72 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvas, viewport }).promise;

        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.92)
        );
        images.push({ name: `page-${i}.jpg`, blob });
      }

      setResults(images);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to convert PDF to JPG");
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
    a.download = "pages.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {!file && (
        <DropZone
          accept=".pdf"
          onFilesSelected={handleFile}
          label="Drop a PDF to convert"
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
            <button onClick={() => { setFile(null); setResults([]); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Image quality (DPI): {dpi}</label>
            <div className="flex gap-2">
              {[72, 150, 300].map((d) => (
                <button
                  key={d}
                  onClick={() => setDpi(d)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    dpi === d
                      ? "bg-accent-start text-white"
                      : "bg-bg-elevated text-text-secondary hover:text-text-primary border border-border-base"
                  }`}
                >
                  {d} DPI
                </button>
              ))}
            </div>
          </div>

          {results.length > 0 && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10">
                <p className="text-sm text-success mb-3">✓ Conversion complete! {results.length} image{results.length !== 1 ? "s" : ""} created</p>
                <div className="flex flex-wrap gap-2">
                  {results.map((r) => (
                    <DownloadButton key={r.name} blob={r.blob} filename={r.name} label={r.name} />
                  ))}
                  {results.length > 1 && (
                    <button onClick={downloadAll} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-text-primary bg-bg-surface border border-border-base hover:bg-bg-elevated transition-colors">
                      📦 Download all (ZIP)
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {!results.length && (
            <button onClick={handleConvert} disabled={processing} className="btn-primary w-full py-3">
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />
                  Converting...
                </span>
              ) : "Convert to JPG"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
