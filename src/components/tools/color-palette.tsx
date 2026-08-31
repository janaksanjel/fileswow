"use client";
import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import type { ToolUIProps } from "@/components/tool-registry";

export default function color_palette_Tool({ onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [colors, setColors] = useState<string[]>([]);

  const handleFile = useCallback((files: File[]) => {
    const f = files[0]; if (!f) return; setFile(f);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      // Simple color quantization
      const colorMap: Record<string, number> = {};
      for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel
        const r = Math.round(data[i] / 32) * 32;
        const g = Math.round(data[i+1] / 32) * 32;
        const b = Math.round(data[i+2] / 32) * 32;
        const key = `${r},${g},${b}`;
        colorMap[key] = (colorMap[key] || 0) + 1;
      }
      const sorted = Object.entries(colorMap).sort((a, b) => b[1] - a[1]).slice(0, 8);
      setColors(sorted.map(([k]) => {
        const [r, g, b] = k.split(",").map(Number);
        return `#${[r,g,b].map(v => v.toString(16).padStart(2,"0")).join("")}`;
      }));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(f);
  }, []);

  return (
    <div className="space-y-6">
      {!file ? <DropZone accept="image/*" onFilesSelected={handleFile} label="Drop an image to extract colors" /> : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); setColors([]); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>
          {colors.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {colors.map((c, i) => (
                <button key={i} onClick={() => navigator.clipboard.writeText(c)}
                  className="group relative aspect-square rounded-lg border border-border-base hover:scale-105 transition-transform"
                  style={{ backgroundColor: c }}>
                  <span className="absolute inset-x-0 bottom-1 text-center text-[10px] font-mono opacity-0 group-hover:opacity-100 text-white drop-shadow">{c}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}