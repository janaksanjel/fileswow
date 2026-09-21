"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";
import { inpaintRegion, unblendWatermark, type Mask } from "@/lib/engines/inpaint";

interface PagePreview {
  dataUrl: string;
  w: number;
  h: number;
  src: ImageData; // rendered page pixels at output resolution
}

export default function WatermarkRemoverPdfTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PagePreview[]>([]);
  const [pageIdx, setPageIdx] = useState(0);
  const [quality, setQuality] = useState(2); // render scale
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [mode, setMode] = useState<"brush" | "rect">("brush");
  const [brushSize, setBrushSize] = useState(30);
  const [applyToAll, setApplyToAll] = useState(true);
  const [strength, setStrength] = useState(1);
  const [unblend, setUnblend] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const masksRef = useRef<Mask[]>([]);
  const paintingRef = useRef(false);
  const lastPtRef = useRef<{ x: number; y: number } | null>(null);
  const rectStartRef = useRef<{ x: number; y: number } | null>(null);

  const fmt = (b: number) => (b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(1) + " MB");

  const handleFile = useCallback((files: File[]) => {
    setFile(files[0] || null);
    setPages([]);
    setResult(null);
    setPageIdx(0);
  }, []);

  // Render all pages to preview canvases when a file is loaded
  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    (async () => {
      setProcessing(true);
      onProcessing?.(true);
      setProgress("Rendering pages…");
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const buf = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buf.slice(0) }).promise;
        const rendered: PagePreview[] = [];
        for (let i = 1; i <= pdf.numPages && !cancelled; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: quality });
          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvas, viewport }).promise;
          const src = ctx.getImageData(0, 0, canvas.width, canvas.height);
          rendered.push({ dataUrl: canvas.toDataURL("image/png"), w: canvas.width, h: canvas.height, src });
          setProgress(`Rendering pages… ${i}/${pdf.numPages}`);
        }
        if (cancelled) return;
        setPages(rendered);
        masksRef.current = rendered.map((p) => new Uint8Array(p.w * p.h));
      } catch (err) {
        onError?.(err instanceof Error ? err.message : "Failed to open PDF");
      } finally {
        setProcessing(false);
        onProcessing?.(false);
        setProgress("");
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, quality]);

  const cur = pages[pageIdx];

  // Draw current page onto the visible canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !cur) return;
    canvas.width = cur.w;
    canvas.height = cur.h;
    canvas.getContext("2d")!.putImageData(cur.src, 0, 0);
    const ov = overlayRef.current;
    if (ov) {
      ov.width = cur.w;
      ov.height = cur.h;
      ov.getContext("2d")!.clearRect(0, 0, ov.width, ov.height);
    }
  }, [pageIdx, cur]);

  const canvasPoint = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * canvas.width,
      y: ((e.clientY - r.top) / r.height) * canvas.height,
    };
  };

  const paintMask = (x: number, y: number) => {
    const mask = masksRef.current[pageIdx];
    const canvas = canvasRef.current!;
    const octx = overlayRef.current!.getContext("2d")!;
    const r = brushSize / 2;
    const x0 = Math.max(0, Math.floor(x - r));
    const x1 = Math.min(canvas.width - 1, Math.ceil(x + r));
    const y0 = Math.max(0, Math.floor(y - r));
    const y1 = Math.min(canvas.height - 1, Math.ceil(y + r));
    for (let py = y0; py <= y1; py++)
      for (let px = x0; px <= x1; px++) {
        const dx = px - x, dy = py - y;
        if (dx * dx + dy * dy <= r * r) mask[py * canvas.width + px] = 1;
      }
    octx.fillStyle = "rgba(239,68,68,0.4)";
    octx.beginPath();
    octx.arc(x, y, r, 0, Math.PI * 2);
    octx.fill();
  };

  const paintRectMask = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const mask = masksRef.current[pageIdx];
    const canvas = canvasRef.current!;
    const x0 = Math.max(0, Math.floor(Math.min(a.x, b.x)));
    const x1 = Math.min(canvas.width - 1, Math.ceil(Math.max(a.x, b.x)));
    const y0 = Math.max(0, Math.floor(Math.min(a.y, b.y)));
    const y1 = Math.min(canvas.height - 1, Math.ceil(Math.max(a.y, b.y)));
    for (let py = y0; py <= y1; py++)
      for (let px = x0; px <= x1; px++) mask[py * canvas.width + px] = 1;
    const octx = overlayRef.current!.getContext("2d")!;
    octx.fillStyle = "rgba(239,68,68,0.4)";
    octx.fillRect(x0, y0, x1 - x0 + 1, y1 - y0 + 1);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (processing || !cur) return;
    e.currentTarget.setPointerCapture(e.pointerId);
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
    if (mode === "brush" && lastPtRef.current) {
      const last = lastPtRef.current;
      const dist = Math.hypot(p.x - last.x, p.y - last.y);
      const steps = Math.max(1, Math.ceil(dist / (brushSize / 4)));
      for (let s = 1; s <= steps; s++)
        paintMask(last.x + ((p.x - last.x) * s) / steps, last.y + ((p.y - last.y) * s) / steps);
      lastPtRef.current = p;
    } else if (mode === "rect" && rectStartRef.current) {
      // live rubber-band preview
      const octx = overlayRef.current!.getContext("2d")!;
      const a = rectStartRef.current;
      octx.clearRect(0, 0, overlayRef.current!.width, overlayRef.current!.height);
      octx.fillStyle = "rgba(239,68,68,0.25)";
      octx.strokeStyle = "rgba(239,68,68,0.9)";
      octx.lineWidth = 2;
      const rx = Math.min(a.x, p.x), ry = Math.min(a.y, p.y);
      const rw = Math.abs(p.x - a.x), rh = Math.abs(p.y - a.y);
      octx.fillRect(rx, ry, rw, rh);
      octx.strokeRect(rx, ry, rw, rh);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!paintingRef.current) return;
    paintingRef.current = false;
    lastPtRef.current = null;
    if (mode === "rect" && rectStartRef.current) {
      paintRectMask(rectStartRef.current, canvasPoint(e));
      rectStartRef.current = null;
    }
  };

  const clearPage = () => {
    const m = masksRef.current[pageIdx];
    if (!m) return;
    m.fill(0);
    const ov = overlayRef.current;
    if (ov) ov.getContext("2d")!.clearRect(0, 0, ov.width, ov.height);
  };

  const hasSelection = () => masksRef.current.some((m) => m && m.some((v) => v === 1));

  const healPage = async (idx: number) => {
    const page = pages[idx];
    const mask = masksRef.current[idx];
    let out: ImageData;
    if (unblend) {
      out = await unblendWatermark(page.src, mask, null, strength);
    } else {
      out = await inpaintRegion(page.src, mask);
    }
    page.src = out; // healed pixels become the page source
    return out;
  };

  const run = async () => {
    if (!file || !pages.length || !hasSelection()) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      // 0. Optionally replicate the current page's selection onto every page
      if (applyToAll) {
        const srcMask = masksRef.current[pageIdx];
        let any = false;
        for (let k = 0; k < srcMask.length; k++) if (srcMask[k]) { any = true; break; }
        if (any) {
          for (let i = 0; i < masksRef.current.length; i++) {
            if (i === pageIdx || masksRef.current[i].length !== srcMask.length) continue;
            masksRef.current[i].set(srcMask);
          }
        }
      }

      // 1. Heal every page that has a selection
      for (let i = 0; i < pages.length; i++) {
        const m = masksRef.current[i];
        let any = false;
        for (let k = 0; k < m.length; k++) if (m[k]) { any = true; break; }
        if (!any) continue;
        setProgress(`Removing watermark — page ${i + 1}/${pages.length}…`);
        await healPage(i);
        m.fill(0);
      }

      // 2. Rebuild the PDF from healed page images (PDF is rasterized)
      setProgress("Rebuilding PDF…");
      const { PDFDocument } = await import("pdf-lib");
      const outDoc = await PDFDocument.create();
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const canvas = document.createElement("canvas");
        canvas.width = page.w;
        canvas.height = page.h;
        canvas.getContext("2d")!.putImageData(page.src, 0, 0);
        const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.95));
        const bytes = await blob.arrayBuffer();
        const img = await outDoc.embedJpg(bytes);
        // Page size in PDF points: viewport at scale=quality → divide
        const pW = page.w / quality;
        const pH = page.h / quality;
        const p = outDoc.addPage([pW, pH]);
        p.drawImage(img, { x: 0, y: 0, width: pW, height: pH });
      }
      const pdfBytes = await outDoc.save();
      const outBlob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      setResult(outBlob);

      // refresh visible canvas
      const cv = canvasRef.current;
      if (cv) cv.getContext("2d")!.putImageData(pages[pageIdx].src, 0, 0);
      const ov = overlayRef.current;
      if (ov) ov.getContext("2d")!.clearRect(0, 0, ov.width, ov.height);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to remove watermark from PDF");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
      setProgress("");
    }
  };

  if (!file) {
    return (
      <div className="space-y-6">
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF to remove its watermark" />
        <div className="p-4 rounded-xl bg-bg-elevated border border-border-base text-xs text-text-tertiary space-y-2">
          <p className="font-semibold text-text-secondary text-sm">✨ How it works</p>
          <p>1. Select the watermark area on any page — brush for odd shapes, rectangle for banners/text lines.</p>
          <p>2. The same selection can be applied to every page (great for repeated corner logos).</p>
          <p>3. For <strong>semi-transparent</strong> stamps, enable &ldquo;Un-blend mode&rdquo; under the quality setting.</p>
          <p className="text-warning">Note: pages are re-rendered as high-quality images inside the PDF, so text is no longer selectable afterward.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
        <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
        <div className="flex-1">
          <p className="text-sm text-text-primary truncate">{file.name}</p>
          <p className="text-xs text-text-tertiary">{pages.length || "…"} pages · {fmt(file.size)}</p>
        </div>
        <button onClick={() => { setFile(null); setPages([]); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
      </div>

      {!pages.length && processing && (
        <div className="p-6 text-center text-sm text-text-secondary">
          <span className="inline-block w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin-slow mr-2 align-middle" />
          {progress}
        </div>
      )}

      {cur && (
        <>
          {/* Page navigation */}
          {pages.length > 1 && (
            <div className="flex items-center gap-2">
              <button onClick={() => setPageIdx((i) => Math.max(0, i - 1))} disabled={pageIdx === 0 || processing} className="btn-secondary px-3 py-1.5 text-xs">← Prev</button>
              <span className="text-xs text-text-tertiary flex-1 text-center">Page {pageIdx + 1} of {pages.length}</span>
              <button onClick={() => setPageIdx((i) => Math.min(pages.length - 1, i + 1))} disabled={pageIdx === pages.length - 1 || processing} className="btn-secondary px-3 py-1.5 text-xs">Next →</button>
            </div>
          )}

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
            {processing && progress && (
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-3">
                <span className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
                <span className="text-xs text-white px-4 text-center">{progress}</span>
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
                <input type="range" min={8} max={120} value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} disabled={processing} className="w-full accent-accent" />
              </div>
            )}
          </div>

          {/* Options */}
          <details className="rounded-xl bg-bg-elevated border border-border-base px-4 py-3" open>
            <summary className="text-sm font-medium text-text-secondary cursor-pointer">Options</summary>
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-sm text-text-secondary mb-2">Render quality: {quality}× ({quality === 1 ? "fast, lower quality" : quality === 2 ? "recommended" : "best, slower"})</label>
                <input type="range" min={1} max={3} step={0.5} value={quality} onChange={(e) => { setQuality(parseFloat(e.target.value)); setPages([]); }} disabled={processing} className="w-full accent-accent" />
                <p className="text-[11px] text-text-tertiary mt-1">Changing quality re-renders the pages.</p>
              </div>
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                <input type="checkbox" checked={unblend} onChange={(e) => setUnblend(e.target.checked)} className="accent-accent" />
                Un-blend mode (best for semi-transparent stamps/watermarks)
              </label>
              {unblend && (
                <div>
                  <label className="block text-sm text-text-secondary mb-2">Strength: {strength.toFixed(2)}×</label>
                  <input type="range" min={50} max={150} value={strength * 100} onChange={(e) => setStrength(parseInt(e.target.value) / 100)} className="w-full accent-accent" />
                </div>
              )}
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                <input type="checkbox" checked={applyToAll} onChange={(e) => setApplyToAll(e.target.checked)} className="accent-accent" />
                Apply this page&apos;s selection to all pages on removal
              </label>
            </div>
          </details>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={run} disabled={processing || !pages.length} className="btn-primary flex-1 py-3">
              {processing ? "Working…" : "Remove Watermark & Download"}
            </button>
            <button onClick={clearPage} disabled={processing} className="btn-secondary px-4 py-3">Clear selection</button>
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10">
              <p className="text-sm text-success mb-1">✓ Watermark removed!</p>
              <p className="text-xs text-text-tertiary mb-3">{fmt(file.size)} → {fmt(result.size)}</p>
              <DownloadButton blob={result} filename={"no-watermark-" + (file.name.replace(/\.pdf$/i, "") || "document") + ".pdf"} />
              <p className="text-xs text-text-tertiary mt-2">Leftovers on some pages? Select them again and run the tool once more — already-cleaned pages are untouched.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
