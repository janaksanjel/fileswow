"use client";
import { useState } from "react";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function gradient_generator_Tool({ onProcessing }: ToolUIProps) {
  const [color1, setColor1] = useState("#667eea");
  const [color2, setColor2] = useState("#764ba2");
  const [direction, setDirection] = useState<"to-right"|"to-bottom"|"diagonal">("diagonal");
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(400);
  const [result, setResult] = useState<Blob | null>(null);

  const generate = () => {
    onProcessing?.(true);
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    let grad: CanvasGradient;
    if (direction === "to-right") grad = ctx.createLinearGradient(0, 0, width, 0);
    else if (direction === "to-bottom") grad = ctx.createLinearGradient(0, 0, 0, height);
    else grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, color1); grad.addColorStop(1, color2);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, width, height);
    canvas.toBlob((b) => { if (b) setResult(b); onProcessing?.(false); }, "image/png");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-xs text-text-tertiary mb-1">Color 1</label>
          <input type="color" value={color1} onChange={(e) => { setColor1(e.target.value); setResult(null); }} className="w-full h-10 rounded cursor-pointer" /></div>
        <div><label className="block text-xs text-text-tertiary mb-1">Color 2</label>
          <input type="color" value={color2} onChange={(e) => { setColor2(e.target.value); setResult(null); }} className="w-full h-10 rounded cursor-pointer" /></div>
      </div>
      <div className="flex gap-2">
        {(["to-right","to-bottom","diagonal"] as const).map(d => (
          <button key={d} onClick={() => { setDirection(d); setResult(null); }} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all ${direction === d ? "bg-accent-start text-white" : "bg-bg-elevated text-text-secondary border border-border-base"}`}>{d.replace("-", " ")}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-xs text-text-tertiary mb-1">Width: {width}px</label>
          <input type="range" min={100} max={2000} step={50} value={width} onChange={(e) => { setWidth(parseInt(e.target.value)); setResult(null); }} className="w-full accent-accent" /></div>
        <div><label className="block text-xs text-text-tertiary mb-1">Height: {height}px</label>
          <input type="range" min={100} max={2000} step={50} value={height} onChange={(e) => { setHeight(parseInt(e.target.value)); setResult(null); }} className="w-full accent-accent" /></div>
      </div>
      {result && <DownloadButton blob={result} filename="gradient.png" />}
      {!result && <button onClick={generate} className="btn-primary w-full py-3">Generate Gradient</button>}
    </div>
  );
}