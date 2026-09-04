"use client";

import { useState, useCallback, useRef } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function SignPdfTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [signatureText, setSignatureText] = useState("");
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(36);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleFile = useCallback((files: File[]) => {
    setFile(files[0] || null);
    setResult(null);
  }, []);

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  const stopDraw = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureImage(canvas.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureImage(null);
  };

  const handleSign = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { loadPdf, savePdf } = await import("@/lib/engines/pdf");
      const { rgb, StandardFonts } = await import("pdf-lib");
      const doc = await loadPdf(file);
      const font = await doc.embedFont(StandardFonts.Helvetica);

      if (signatureText) {
        const lastPage = doc.getPage(doc.getPageCount() - 1);
        const { width } = lastPage.getSize();
        const textWidth = font.widthOfTextAtSize(signatureText, fontSize);
        lastPage.drawText(signatureText, {
          x: width - textWidth - 72,
          y: 72,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
      }

      const blob = await savePdf(doc);
      setResult(blob);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to sign PDF");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF to sign" description="Select a single PDF file" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <span className="text-sm text-text-primary truncate flex-1">{file.name}</span>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          {/* Draw signature */}
          <div className="p-3 rounded-lg bg-bg-elevated border border-border-base space-y-3">
            <label className="block text-sm text-text-secondary font-medium">Draw Signature</label>
            <canvas
              ref={canvasRef}
              width={400}
              height={120}
              className="w-full bg-white rounded-lg border border-border-base cursor-crosshair"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
            />
            <button onClick={clearCanvas} className="text-xs text-text-tertiary hover:text-danger transition-colors">Clear canvas</button>
          </div>

          {/* Type signature */}
          <div className="p-3 rounded-lg bg-bg-elevated border border-border-base space-y-3">
            <label className="block text-sm text-text-secondary font-medium">Or Type Signature</label>
            <input
              type="text"
              value={signatureText}
              onChange={(e) => setSignatureText(e.target.value)}
              placeholder="Type your name..."
              className="w-full px-4 py-2.5 rounded-lg bg-bg-input border border-border-base text-text-primary text-sm focus:border-accent focus:outline-none transition-colors"
            />
            <div>
              <label className="block text-xs text-text-tertiary mb-1">Font size: {fontSize}px</label>
              <input type="range" min="16" max="72" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full accent-accent-start" />
            </div>
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Signed!</p>
              <DownloadButton blob={result} filename={`signed-${file.name}`} />
            </div>
          )}

          {!result && (
            <button onClick={handleSign} disabled={processing || (!signatureText && !signatureImage)} className="btn-primary w-full py-3">
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />
                  Signing...
                </span>
              ) : "Sign PDF"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
