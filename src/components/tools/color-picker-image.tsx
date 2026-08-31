"use client";

import { useState, useCallback, useRef } from "react";
import { DropZone } from "@/components/drop-zone";
import type { ToolUIProps } from "@/components/tool-registry";

export default function color_picker_image_Tool({ onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pickedColor, setPickedColor] = useState<string | null>(null);
  const [rgb, setRgb] = useState<{r:number;g:number;b:number} | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleFile = useCallback((files: File[]) => {
    const f = files[0]; if (!f) return; setFile(f);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const c = canvasRef.current;
      if (!c) return;
      const maxW = 600;
      const scale = Math.min(1, maxW / img.naturalWidth);
      c.width = img.naturalWidth * scale;
      c.height = img.naturalHeight * scale;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0, c.width, c.height);
    };
    img.src = URL.createObjectURL(f);
  }, []);

  const pickColor = (e: React.MouseEvent) => {
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) * (c.width / rect.width));
    const y = Math.round((e.clientY - rect.top) * (c.height / rect.height));
    const ctx = c.getContext("2d")!;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = "#" + [pixel[0], pixel[1], pixel[2]].map(v => v.toString(16).padStart(2, "0")).join("");
    setPickedColor(hex);
    setRgb({ r: pixel[0], g: pixel[1], b: pixel[2] });
  };

  return (
    <div className="space-y-6">
      {!file ? <DropZone accept="image/*" onFilesSelected={handleFile} label="Drop an image to pick colors" /> : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); setPickedColor(null); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>
          <canvas ref={canvasRef} className="w-full rounded-lg border border-border-base cursor-crosshair" onClick={pickColor} />
          {pickedColor && rgb && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
              <div className="w-12 h-12 rounded-lg border border-border-base" style={{ backgroundColor: pickedColor }} />
              <div>
                <p className="text-sm font-mono text-text-primary">{pickedColor.toUpperCase()}</p>
                <p className="text-xs text-text-tertiary">RGB({rgb.r}, {rgb.g}, {rgb.b})</p>
              </div>
              <button onClick={() => navigator.clipboard.writeText(pickedColor)} className="ml-auto px-3 py-1.5 text-xs bg-bg-elevated border border-border-base rounded-lg hover:bg-bg-hover">Copy</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}