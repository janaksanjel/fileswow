"use client";
import { useState } from "react";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function placeholder_generator_Tool({ onProcessing }: ToolUIProps) {
  const [width, setWidth] = useState(400);
  const [height, setHeight] = useState(300);
  const [bgColor, setBgColor] = useState("#374151");
  const [textColor, setTextColor] = useState("#9ca3af");
  const [text, setText] = useState("400×300");
  const [result, setResult] = useState<Blob | null>(null);

  const generate = () => {
    onProcessing?.(true);
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = bgColor; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = textColor;
    ctx.font = `bold ${Math.min(width, height) / 8}px Arial`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(text || `${width}×${height}`, width / 2, height / 2);
    canvas.toBlob((b) => { if (b) setResult(b); onProcessing?.(false); }, "image/png");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-xs text-text-tertiary mb-1">Width: {width}px</label>
          <input type="range" min={50} max={2000} step={50} value={width} onChange={(e) => { setWidth(parseInt(e.target.value)); setResult(null); setText(`${e.target.value}×${height}`); }} className="w-full accent-accent" /></div>
        <div><label className="block text-xs text-text-tertiary mb-1">Height: {height}px</label>
          <input type="range" min={50} max={2000} step={50} value={height} onChange={(e) => { setHeight(parseInt(e.target.value)); setResult(null); setText(`${width}×${e.target.value}`); }} className="w-full accent-accent" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-xs text-text-tertiary mb-1">Background</label>
          <input type="color" value={bgColor} onChange={(e) => { setBgColor(e.target.value); setResult(null); }} className="w-full h-8 rounded cursor-pointer" /></div>
        <div><label className="block text-xs text-text-tertiary mb-1">Text Color</label>
          <input type="color" value={textColor} onChange={(e) => { setTextColor(e.target.value); setResult(null); }} className="w-full h-8 rounded cursor-pointer" /></div>
      </div>
      <div><label className="block text-xs text-text-tertiary mb-1">Label Text</label>
        <input value={text} onChange={(e) => { setText(e.target.value); setResult(null); }} className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm" /></div>
      {result && <DownloadButton blob={result} filename="placeholder.png" />}
      {!result && <button onClick={generate} className="btn-primary w-full py-3">Generate Placeholder</button>}
    </div>
  );
}