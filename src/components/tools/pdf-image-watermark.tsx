"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function PdfImageWatermarkTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [opacity, setOpacity] = useState(30);
  const [scale, setScale] = useState(50);
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

  const handleImage = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setImageFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const handleApply = async () => {
    if (!file || !imageFile) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const pdfBuffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(pdfBuffer);
      const imgBuffer = await imageFile.arrayBuffer();

      let image;
      if (imageFile.type === "image/png") {
        image = await doc.embedPng(imgBuffer);
      } else {
        image = await doc.embedJpg(imgBuffer);
      }

      const factor = scale / 100;
      const imgWidth = image.width * factor;
      const imgHeight = image.height * factor;

      for (const page of doc.getPages()) {
        const { width, height } = page.getSize();
        page.drawImage(image, {
          x: (width - imgWidth) / 2,
          y: (height - imgHeight) / 2,
          width: imgWidth,
          height: imgHeight,
          opacity: opacity / 100,
        });
      }

      const bytes = await doc.save();
      setResult(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }));
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to add image watermark");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF" description="Select a PDF to add image watermark" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <div className="flex-1">
              <p className="text-sm text-text-primary truncate">{file.name}</p>
              <p className="text-xs text-text-tertiary">{pageCount} pages</p>
            </div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-sm text-text-secondary mb-2">Watermark image</label>
            {!imageFile ? (
              <DropZone accept=".jpg,.jpeg,.png" onFilesSelected={handleImage} label="Drop an image" description="JPG or PNG image for watermark" />
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
                {imagePreview && <img src={imagePreview} alt="Preview" className="w-12 h-12 object-contain rounded" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{imageFile.name}</p>
                </div>
                <button onClick={() => { setImageFile(null); setImagePreview(""); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">✕</button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Opacity: {opacity}%</label>
            <input type="range" min="5" max="100" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full accent-accent-start" />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Scale: {scale}%</label>
            <input type="range" min="10" max="150" value={scale} onChange={(e) => setScale(Number(e.target.value))} className="w-full accent-accent-start" />
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Image watermark applied!</p>
              <DownloadButton blob={result} filename={`watermarked-${file.name}`} />
            </div>
          )}

          {!result && (
            <button onClick={handleApply} disabled={processing || !imageFile} className="btn-primary w-full py-3">
              {processing ? "Applying watermark..." : "Apply Image Watermark"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
