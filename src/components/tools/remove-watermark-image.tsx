"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";
import { inpaintRegion, unblendWatermark, type Mask } from "@/lib/engines/inpaint";

export default function WatermarkRemoverImageTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [result, setResult] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState<"brush" | "rect">("brush");
  const [brushSize, setBrushSize] = useState(36);
  const [strength, setStrength] = useState(1);
  const [unblend, setUnblend] = useState(false);
  const [wmColor, setWmColor] = useState<string>("#ffffff");
  const [useCustomColor, setUseCustomColor] = useState(false);
  const [hasMask, setHasMask] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const baseDataRef = useRef<ImageData | null>(null);
  const maskRef = useRef<Mask | null>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const paintingRef = useRef(false);
  const lastPtRef = useRef<{ x: number; y: number } | null>(null);
  const rectStartRef = useRef<{ x: number; y: number } | null>(null);
  const historyRef = useRef<ImageData[]>([]);
  const redoRef = useRef<ImageData[]>([]);

  const fmt = (b: number) => (b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(1) + " MB");

  const handleFile = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setHasMask(false);
    historyRef.current = [];
    redoRef.current = [];
    const url = URL.createObjectURL(f);
    setImgUrl(url);
  }, [resultUrl]);

  // Load image into canvas whenever a new file is chosen
  useEffect(() => {
    if (!imgUrl) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      imgRef.current = img;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0);
      baseDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      maskRef.current = new Uint8Array(canvas.width * canvas.height);
      setDims({ w: canvas.width, h: canvas.height });
      const ov = overlayRef.current;
      if (ov) {
        ov.width = canvas.width;
        ov.height = canvas.height;
        ov.getContext("2d")!.clearRect(0, 0, ov.width, ov.height);
      }
    };
    img.src = imgUrl;
    return () => { cancelled = true; };
  }, [imgUrl]);

  const resetOverlay = () => {
    const ov = overlayRef.current;
    if (ov) ov.getContext("2d")!.clearRect(0, 0, ov.width, ov.height);
    maskRef.current = new Uint8Array(canvasRef.current!.width * canvasRef.current!.height);
    setHasMask(false);
  };

  /** Re-render the base image (used after undo/redo and before paint). */
  const renderBase = (data: ImageData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")!.putImageData(data, 0, 0);
  };

  const pushHistory = () => {
    if (!baseDataRef.current) return;
    historyRef.current.push(baseDataRef.current);
    if (historyRef.current.length > 12) historyRef.current.shift();
    redoRef.current = [];
  };

  const undo = () => {
    const prev = historyRef.current.pop();
    if (!prev || !baseDataRef.current) return;
    redoRef.current.push(baseDataRef.current);
    baseDataRef.current = prev;
    renderBase(prev);
  };

  const redo = () => {
    const next = redoRef.current.pop();
    if (!next || !baseDataRef.current) return;
    historyRef.current.push(baseDataRef.current);
    baseDataRef.current = next;
    renderBase(next);
  };

  const canvasPoint = (e: React.PointerEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * canvas.width,
      y: ((e.clientY - r.top) / r.height) * canvas.height,
    };
  };

  const paintMask = (x: number, y: number) => {
    const mask = maskRef.current!;
    const canvas = canvasRef.current!;
    const ov = overlayRef.current!;
    const octx = ov.getContext("2d")!;
    const r = brushSize / 2;
    // paint circle into the mask
    const x0 = Math.max(0, Math.floor(x - r));
    const x1 = Math.min(canvas.width - 1, Math.ceil(x + r));
    const y0 = Math.max(0, Math.floor(y - r));
    const y1 = Math.min(canvas.height - 1, Math.ceil(y + r));
    for (let py = y0; py <= y1; py++) {
      for (let px = x0; px <= x1; px++) {
        const dx = px - x, dy = py - y;
        if (dx * dx + dy * dy <= r * r) mask[py * canvas.width + px] = 1;
      }
    }
    // visual feedback (semi-transparent red)
    octx.fillStyle = "rgba(239,68,68,0.4)";
    octx.beginPath();
    octx.arc(x, y, r, 0, Math.PI * 2);
    octx.fill();
  };

  const paintRect = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const mask = maskRef.current!;
    const canvas = canvasRef.current!;
    const x0 = Math.max(0, Math.floor(Math.min(a.x, b.x)));
    const x1 = Math.min(canvas.width - 1, Math.ceil(Math.max(a.x, b.x)));
    const y0 = Math.max(0, Math.floor(Math.min(a.y, b.y)));
    const y1 = Math.min(canvas.height - 1, Math.ceil(Math.max(a.y, b.y)));
    for (let py = y0; py <= y1; py++)
      for (let px = x0; px <= x1; px++) mask[py * canvas.width + px] = 1;
    const ov = overlayRef.current!;
    const octx = ov.getContext("2d")!;
    octx.fillStyle = "rgba(239,68,68,0.4)";
    octx.fillRect(x0, y0, x1 - x0 + 1, y1 - y0 + 1);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (processing || !baseDataRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pushHistory();
    paintingRef.current = true;
    const p = canvasPoint(e);
    if (mode === "brush") {
      lastPtRef.current = p;
      paintMask(p.x, p.y);
    } else {
      rectStartRef.current = p;
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!paintingRef.current || processing) return;
    const p = canvasPoint(e);
    if (mode === "brush") {
      const last = lastPtRef.current;
      if (last) {
        // interpolate between last and current point for smooth strokes
        const dist = Math.hypot(p.x - last.x, p.y - last.y);
        const steps = Math.max(1, Math.ceil(dist / (brushSize / 4)));
        for (let s = 1; s <= steps; s++) {
          paintMask(last.x + ((p.x - last.x) * s) / steps, last.y + ((p.y - last.y) * s) / steps);
        }
      }
      lastPtRef.current = p;
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!paintingRef.current) return;
    paintingRef.current = false;
    lastPtRef.current = null;
    if (mode === "rect" && rectStartRef.current) {
      paintRect(rectStartRef.current, canvasPoint(e));
      rectStartRef.current = null;
    }
    if (maskRef.current) setHasMask(true);
  };

  const run = async () => {
    const canvas = canvasRef.current;
    const base = baseDataRef.current;
    const mask = maskRef.current;
    if (!canvas || !base || !mask || !hasMask) return;
    setProcessing(true);
    onProcessing?.(true);
    setProgress(0);
    try {
      const ctx = canvas.getContext("2d")!;
      const src = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let out: ImageData;
      const color: [number, number, number] | null = useCustomColor
        ? [parseInt(wmColor.slice(1, 3), 16), parseInt(wmColor.slice(3, 5), 16), parseInt(wmColor.slice(5, 7), 16)]
        : null;
      if (unblend) {
        out = await unblendWatermark(src, mask, color, strength, setProgress);
      } else {
        out = await inpaintRegion(src, mask, setProgress);
      }
      ctx.putImageData(out, 0, 0);
      const blob = await new Promise<Blob>((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error("Failed to encode"))), "image/png")
      );
      // keep the healed pixels as the new base so the user can clean more areas
      baseDataRef.current = out;
      maskRef.current = new Uint8Array(canvas.width * canvas.height);
      const ov = overlayRef.current;
      if (ov) ov.getContext("2d")!.clearRect(0, 0, ov.width, ov.height);
      setHasMask(false);
      setResult(blob);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to remove watermark");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  if (!file) {
    return (
      <div className="space-y-6">
        <DropZone accept="image/*" onFilesSelected={handleFile} label="Drop an image to remove its watermark" />
        <div className="p-4 rounded-xl bg-bg-elevated border border-border-base text-xs text-text-tertiary space-y-2">
          <p className="font-semibold text-text-secondary text-sm">✨ How to get the best result</p>
          <p>1. <strong>Brush</strong> or <strong>rectangle-select</strong> the watermark area (works for logos, stamps, text).</p>
          <p>2. For <strong>semi-transparent</strong> watermarks, enable &ldquo;Un-blend mode&rdquo; — it mathematically reverses the watermark instead of just filling over it.</p>
          <p>3. Remove several areas one after another — each result becomes the new working image.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
        <div className="flex-1">
          <p className="text-sm text-text-primary truncate">{file.name}</p>
          <p className="text-xs text-text-tertiary">{dims.w} × {dims.h} px{file.size ? ` · ${fmt(file.size)}` : ""}</p>
        </div>
        <button onClick={() => { setFile(null); setImgUrl(null); setResult(null); if (imgUrl) URL.revokeObjectURL(imgUrl); if (resultUrl) URL.revokeObjectURL(resultUrl); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
      </div>

      {/* Selection canvas */}
      <div className="relative inline-block max-w-full rounded-xl overflow-hidden border border-border-strong select-none touch-none">
        <canvas ref={canvasRef} className="block max-w-full h-auto" />
        <canvas
          ref={overlayRef}
          className={`absolute inset-0 w-full h-full ${processing ? "pointer-events-none" : mode === "brush" ? "cursor-crosshair" : "cursor-cell"}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />
        {processing && (
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-3">
            <span className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
            <span className="text-xs text-white">Healing pixels… {Math.round(progress * 100)}%</span>
          </div>
        )}
      </div>

      {/* Tools */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm text-text-secondary mb-2">Selection tool</label>
          <div className="flex gap-2">
            {([{ v: "brush", l: "🖌 Brush" }, { v: "rect", l: "▭ Rectangle" }] as const).map((m) => (
              <button key={m.v} onClick={() => setMode(m.v)} disabled={processing}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === m.v ? "bg-accent-start text-white" : "bg-bg-elevated text-text-secondary hover:text-text-primary border border-border-base"}`}>
                {m.l}
              </button>
            ))}
          </div>
        </div>
        {mode === "brush" && (
          <div>
            <label className="block text-sm text-text-secondary mb-2">Brush size: {brushSize}px</label>
            <input type="range" min={6} max={160} value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} disabled={processing} className="w-full accent-accent" />
          </div>
        )}
      </div>

      {/* Advanced */}
      <details className="rounded-xl bg-bg-elevated border border-border-base px-4 py-3">
        <summary className="text-sm font-medium text-text-secondary cursor-pointer">Advanced: un-blend semi-transparent watermarks</summary>
        <div className="mt-3 space-y-3">
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input type="checkbox" checked={unblend} onChange={(e) => setUnblend(e.target.checked)} className="accent-accent" />
            Un-blend mode (best for translucent text/logo watermarks)
          </label>
          {unblend && (
            <>
              <div>
                <label className="block text-sm text-text-secondary mb-2">Strength: {strength.toFixed(2)}×</label>
                <input type="range" min={50} max={150} value={strength * 100} onChange={(e) => setStrength(parseInt(e.target.value) / 100)} className="w-full accent-accent" />
              </div>
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                <input type="checkbox" checked={useCustomColor} onChange={(e) => setUseCustomColor(e.target.checked)} className="accent-accent" />
                I know the watermark color (improves accuracy)
              </label>
              {useCustomColor && (
                <div className="flex items-center gap-3">
                  <input type="color" value={wmColor} onChange={(e) => setWmColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer bg-transparent" />
                  <span className="text-xs text-text-tertiary">Pick the watermark&apos;s tint (sample it with any eyedropper tool).</span>
                </div>
              )}
            </>
          )}
        </div>
      </details>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={run} disabled={processing || !hasMask} className="btn-primary flex-1 py-3">
          {processing ? "Removing…" : hasMask ? "Remove Watermark" : "Paint over the watermark first"}
        </button>
        <button onClick={undo} disabled={processing || historyRef.current.length === 0} className="btn-secondary px-4 py-3" title="Undo">↩</button>
        <button onClick={redo} disabled={processing || redoRef.current.length === 0} className="btn-secondary px-4 py-3" title="Redo">↪</button>
        <button onClick={resetOverlay} disabled={processing} className="btn-secondary px-4 py-3" title="Clear selection">Clear</button>
      </div>

      {result && resultUrl && (
        <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10">
          <p className="text-sm text-success mb-1">✓ Watermark removed!</p>
          <p className="text-xs text-text-tertiary mb-3">{fmt(originalSize(file))} → {fmt(result.size)} · PNG</p>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resultUrl} alt="Result preview" className="w-full sm:w-56 rounded-lg border border-border-base" />
            <div className="flex flex-col gap-2 justify-center">
              <DownloadButton blob={result} filename={"no-watermark-" + (file.name.replace(/\.[^.]+$/, "") || "image") + ".png"} />
              <p className="text-xs text-text-tertiary">Not perfect? Select the leftovers and remove again — quality stays lossless (PNG).</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function originalSize(f: File) {
  return f.size;
}
