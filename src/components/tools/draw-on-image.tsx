"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function draw_on_image_Tool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [penColor, setPenColor] = useState("#ff0000");
  const [penSize, setPenSize] = useState(4);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleFile = useCallback((files: File[]) => {
    const f = files[0]; if (!f) return;
    setFile(f); setResult(null);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const maxW = 600;
      const scale = Math.min(1, maxW / img.naturalWidth);
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = URL.createObjectURL(f);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    setDrawing(true);
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => setDrawing(false);

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setProcessing(true); onProcessing?.(true);
    canvas.toBlob((blob) => {
      if (blob) setResult(blob);
      setProcessing(false); onProcessing?.(false);
    }, "image/png");
  };

  const handleReset = () => {
    if (!canvasRef.current || !imgRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="space-y-6">
      {!file ? <DropZone accept="image/*" onFilesSelected={handleFile} label="Drop an image to draw on" /> : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>
          <canvas ref={canvasRef} className="w-full rounded-lg border border-border-base cursor-crosshair touch-none"
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
          <div className="flex items-center gap-3">
            <div><label className="block text-xs text-text-tertiary mb-1">Color</label>
              <input type="color" value={penColor} onChange={(e) => setPenColor(e.target.value)} className="w-10 h-8 rounded cursor-pointer" /></div>
            <div className="flex-1"><label className="block text-xs text-text-tertiary mb-1">Size: {penSize}px</label>
              <input type="range" min={1} max={20} value={penSize} onChange={(e) => setPenSize(parseInt(e.target.value))} className="w-full accent-accent" /></div>
            <button onClick={handleReset} className="px-3 py-2 text-xs text-text-tertiary hover:text-text-primary bg-bg-elevated rounded-lg border border-border-base">Reset</button>
          </div>
          {result && <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10"><p className="text-sm text-success mb-1">✓ Drawing saved!</p><DownloadButton blob={result} filename={"drawn-" + file.name} /></div>}
          {!result && <button onClick={handleSave} disabled={processing} className="btn-primary w-full py-3">Save Drawing</button>}
        </div>
      )}
    </div>
  );
}