"use client";
import { useState, useCallback, useRef } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function arrow_on_image_Tool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [shape, setShape] = useState<"arrow"|"rect"|"circle">("arrow");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [startPos, setStartPos] = useState<{x:number;y:number}|null>(null);
  const [drawing, setDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState("#ff0000");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const savedState = useRef<ImageData|null>(null);

  const handleFile = useCallback((files: File[]) => {
    const f = files[0]; if (!f) return;
    setFile(f); setResult(null);
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const maxW = 600;
      const scale = Math.min(1, maxW / img.naturalWidth);
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      savedState.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    };
    img.src = URL.createObjectURL(f);
  }, []);

  const getPos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * (canvas.width / rect.width), y: (e.clientY - rect.top) * (canvas.height / rect.height) };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    setStartPos(getPos(e)); setDrawing(true);
    if (savedState.current) canvasRef.current?.getContext("2d")?.putImageData(savedState.current, 0, 0);
  };

  const onMouseUp = (e: React.MouseEvent) => {
    if (!startPos || !canvasRef.current) return;
    const end = getPos(e);
    const ctx = canvasRef.current.getContext("2d")!;
    ctx.strokeStyle = strokeColor; ctx.lineWidth = strokeWidth; ctx.lineCap = "round";

    if (shape === "rect") {
      ctx.strokeRect(startPos.x, startPos.y, end.x - startPos.x, end.y - startPos.y);
    } else if (shape === "circle") {
      const rx = Math.abs(end.x - startPos.x) / 2, ry = Math.abs(end.y - startPos.y) / 2;
      const cx = (startPos.x + end.x) / 2, cy = (startPos.y + end.y) / 2;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
    } else {
      // Arrow
      const angle = Math.atan2(end.y - startPos.y, end.x - startPos.x);
      const headLen = 20;
      ctx.beginPath(); ctx.moveTo(startPos.x, startPos.y); ctx.lineTo(end.x, end.y); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(end.x - headLen * Math.cos(angle - Math.PI/6), end.y - headLen * Math.sin(angle - Math.PI/6));
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(end.x - headLen * Math.cos(angle + Math.PI/6), end.y - headLen * Math.sin(angle + Math.PI/6));
      ctx.stroke();
    }
    savedState.current = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    setDrawing(false); setStartPos(null);
  };

  const handleSave = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    setProcessing(true); onProcessing?.(true);
    canvas.toBlob((blob) => { if (blob) setResult(blob); setProcessing(false); onProcessing?.(false); }, "image/png");
  };

  return (
    <div className="space-y-6">
      {!file ? <DropZone accept="image/*" onFilesSelected={handleFile} label="Drop an image to annotate" /> : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>
          <div className="flex gap-2">
            {(["arrow","rect","circle"] as const).map(s => (
              <button key={s} onClick={() => setShape(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${shape === s ? "bg-accent-start text-white" : "bg-bg-elevated text-text-secondary border border-border-base"}`}>{s === "arrow" ? "Arrow" : s === "rect" ? "Rectangle" : "Circle"}</button>
            ))}
          </div>
          <canvas ref={canvasRef} className="w-full rounded-lg border border-border-base cursor-crosshair" onMouseDown={onMouseDown} onMouseUp={onMouseUp} />
          <div className="flex items-center gap-3">
            <input type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)} className="w-10 h-8 rounded cursor-pointer" />
            <input type="range" min={1} max={10} value={strokeWidth} onChange={(e) => setStrokeWidth(parseInt(e.target.value))} className="flex-1 accent-accent" />
          </div>
          {result && <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10"><p className="text-sm text-success mb-1">✓ Annotated!</p><DownloadButton blob={result} filename={"annotated-" + file.name} /></div>}
          {!result && <button onClick={handleSave} disabled={processing} className="btn-primary w-full py-3">Save Annotation</button>}
        </div>
      )}
    </div>
  );
}