"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { DropZone } from "@/components/drop-zone";
import type { ToolUIProps } from "@/components/tool-registry";

export default function image_histogram_Tool({ onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = useCallback((files: File[]) => {
    const f = files[0]; if (!f) return; setFile(f);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      const rHist = new Array(256).fill(0);
      const gHist = new Array(256).fill(0);
      const bHist = new Array(256).fill(0);
      for (let i = 0; i < data.length; i += 4) { rHist[data[i]]++; gHist[data[i+1]]++; bHist[data[i+2]]++; }
      // Draw histogram
      const hc = canvasRef.current;
      if (!hc) return;
      const hctx = hc.getContext("2d")!;
      hc.width = 400; hc.height = 200;
      hctx.fillStyle = "#1a1a2e"; hctx.fillRect(0, 0, 400, 200);
      const maxVal = Math.max(...rHist, ...gHist, ...bHist);
      const drawChannel = (hist: number[], color: string) => {
        hctx.strokeStyle = color; hctx.lineWidth = 1; hctx.beginPath();
        for (let i = 0; i < 256; i++) {
          const x = (i / 255) * 400;
          const y = 200 - (hist[i] / maxVal) * 180;
          i === 0 ? hctx.moveTo(x, y) : hctx.lineTo(x, y);
        }
        hctx.stroke();
      };
      drawChannel(rHist, "rgba(255,0,0,0.7)");
      drawChannel(gHist, "rgba(0,255,0,0.7)");
      drawChannel(bHist, "rgba(0,100,255,0.7)");
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(f);
  }, []);

  return (
    <div className="space-y-6">
      {!file ? <DropZone accept="image/*" onFilesSelected={handleFile} label="Drop an image to view histogram" /> : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>
          <canvas ref={canvasRef} className="w-full rounded-lg border border-border-base" />
          <div className="flex items-center justify-center gap-4 text-xs text-text-tertiary">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500" />Red</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-500" />Green</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500" />Blue</span>
          </div>
        </div>
      )}
    </div>
  );
}