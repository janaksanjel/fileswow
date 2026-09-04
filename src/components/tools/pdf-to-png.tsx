"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import { PdfPreview } from "@/components/pdf-preview";
import type { ToolUIProps } from "@/components/tool-registry";

export default function PdfToPngTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dpi, setDpi] = useState(150);
  const [results, setResults] = useState<{ name: string; blob: Blob }[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback((files: File[]) => {
    setFile(files[0] || null);
    setResults([]);
  }, []);

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const pdfjsLib = await import("pdfjs-dist");
      const { GlobalWorkerOptions } = pdfjsLib;
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
          canvas.toBlob((b) => resolve(b!), "image/png")
        );
        images.push({ name: `page-${i}.png`, blob });
      }

      setResults(images);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to convert");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  const downloadAll = async () => {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    results.forEach((r) => zip.file(r.name, r.blob));
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "pages.zip";
    a.click();
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF to convert" description="Select a single PDF file" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <span className="text-sm text-text-primary truncate flex-1">{file.name}</span>
            <button onClick={() => { setFile(null); setResults([]); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          <PdfPreview file={file} className="rounded-xl overflow-hidden" />

          <div>
            <label className="block text-sm text-text-secondary mb-2">DPI: {dpi}</label>
            <div className="flex gap-2">
              {[72, 150, 300].map((d) => (
                <button key={d} onClick={() => setDpi(d)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${dpi === d ? "bg-accent-start text-white" : "bg-bg-elevated text-text-secondary border border-border-base"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {results.length > 0 && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10">
              <p className="text-sm text-success mb-3">✓ {results.length} PNG image{results.length !== 1 ? "s" : ""} created!</p>
              <div className="flex flex-wrap gap-2">
                {results.map((r) => (
                  <DownloadButton key={r.name} blob={r.blob} filename={r.name} label={r.name} />
                ))}
                {results.length > 1 && (
                  <button onClick={downloadAll} className="px-4 py-2 rounded-lg text-sm font-medium text-text-primary bg-bg-surface border border-border-base hover:bg-bg-elevated transition-colors">
                    📦 ZIP
                  </button>
                )}
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
              ) : "Convert to PNG"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
