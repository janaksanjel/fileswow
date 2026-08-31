"use client";

import { useState, useRef, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function ScanToPdfTool({ onProcessing, onError }: ToolUIProps) {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const handleFiles = useCallback((files: File[]) => {
    setImages(prev => [...prev, ...files]);
    setResult(null);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => setPreviews(prev => [...prev, e.target?.result as string]);
      reader.readAsDataURL(file);
    });
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch {
      onError?.("Camera access denied or not available");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `scan-${Date.now()}.jpg`, { type: "image/jpeg" });
          setImages(prev => [...prev, file]);
          setPreviews(prev => [...prev, URL.createObjectURL(blob)]);
          setResult(null);
        }
      }, "image/jpeg", 0.9);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleConvert = async () => {
    if (images.length === 0) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { PDFDocument } = await import("pdf-lib");

      const doc = await PDFDocument.create();
      for (const img of images) {
        const bytes = await img.arrayBuffer();
        let image;
        if (img.type === "image/png") {
          image = await doc.embedPng(bytes);
        } else {
          image = await doc.embedJpg(bytes);
        }
        const { width, height } = image.scale(1);
        const pageWidth = 595.28;
        const pageHeight = 841.89;
        const scale = Math.min(pageWidth / width, pageHeight / height);
        const page = doc.addPage([pageWidth, pageHeight]);
        page.drawImage(image, {
          x: (pageWidth - width * scale) / 2,
          y: (pageHeight - height * scale) / 2,
          width: width * scale,
          height: height * scale,
        });
      }

      const bytes = await doc.save();
      setResult(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }));
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to create PDF");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {images.length === 0 && !cameraActive && (
        <div className="space-y-3">
          <DropZone accept="image/*" multiple onFilesSelected={handleFiles} label="Upload document images" description="JPG, PNG images of your documents" />
          <div className="text-center">
            <p className="text-xs text-text-tertiary mb-2">— or —</p>
            <button onClick={startCamera} className="px-4 py-2 rounded-lg text-sm font-medium text-accent bg-accent/10 hover:bg-accent/20 transition-colors">📸 Open Camera</button>
          </div>
        </div>
      )}

      {cameraActive && (
        <div className="space-y-3">
          <video ref={videoRef} className="w-full rounded-lg bg-black" playsInline />
          <div className="flex gap-2">
            <button onClick={capturePhoto} className="flex-1 py-2 rounded-lg text-sm font-medium text-white bg-accent-start hover:bg-accent-end transition-colors">📸 Capture</button>
            <button onClick={stopCamera} className="flex-1 py-2 rounded-lg text-sm font-medium text-text-secondary bg-bg-elevated border border-border-base hover:text-text-primary transition-colors">Stop Camera</button>
          </div>
        </div>
      )}

      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">{images.length} scan(s) captured</p>
            <button onClick={() => { setImages([]); setPreviews([]); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Clear all</button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {previews.map((src, i) => (
              <div key={i} className="relative group">
                <img src={src} alt={`Scan ${i + 1}`} className="w-full h-24 object-cover rounded-lg border border-border-base" />
                <button onClick={() => removeImage(i)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-danger text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                <span className="absolute bottom-1 left-1 text-[10px] text-white bg-black/50 px-1 rounded">{i + 1}</span>
              </div>
            ))}
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ PDF created!</p>
              <DownloadButton blob={result} filename="scanned-document.pdf" />
            </div>
          )}

          {!result && (
            <button onClick={handleConvert} disabled={processing} className="btn-primary w-full py-3">
              {processing ? "Creating PDF..." : `Create PDF from ${images.length} scan(s)`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
