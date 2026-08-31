"use client";

import { useState, useRef, useEffect } from "react";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

interface SavedSig { id: string; name: string; dataUrl: string; }

export default function SignatureManagerTool({ onProcessing, onError }: ToolUIProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [saved, setSaved] = useState<SavedSig[]>([]);
  const [sigName, setSigName] = useState("");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("signatures") : null;
    if (stored) setSaved(JSON.parse(stored));
  }, []);

  const startDraw = () => { setDrawing(true); };
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };
  const endDraw = () => { setDrawing(false); };

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const saveSignature = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    const newSig: SavedSig = { id: Date.now().toString(), name: sigName || `Signature ${saved.length + 1}`, dataUrl };
    const updated = [...saved, newSig];
    setSaved(updated);
    localStorage.setItem("signatures", JSON.stringify(updated));
    setSigName("");
    clearCanvas();
  };

  const deleteSig = (id: string) => {
    const updated = saved.filter(s => s.id !== id);
    setSaved(updated);
    localStorage.setItem("signatures", JSON.stringify(updated));
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-text-secondary mb-2">Draw your signature</label>
        <canvas ref={canvasRef} width={500} height={150} onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw} className="w-full rounded-lg bg-white border-2 border-dashed border-border-base cursor-crosshair" style={{ touchAction: "none" }} />
        <div className="flex gap-2 mt-2">
          <button onClick={clearCanvas} className="px-3 py-1.5 rounded text-xs text-text-secondary bg-bg-elevated border border-border-base hover:text-text-primary">Clear</button>
        </div>
      </div>
      <div className="flex gap-2">
        <input type="text" value={sigName} onChange={(e) => setSigName(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-bg-elevated border border-border-base text-sm focus:border-accent focus:outline-none" placeholder="Signature name (optional)" />
        <button onClick={saveSignature} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-accent-start hover:bg-accent-end transition-colors">Save</button>
      </div>
      {saved.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-text-secondary">Saved signatures ({saved.length})</p>
          {saved.map(sig => (
            <div key={sig.id} className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
              <img src={sig.dataUrl} alt={sig.name} className="h-12 object-contain bg-white rounded px-2" />
              <span className="text-sm text-text-primary flex-1">{sig.name}</span>
              <button onClick={() => deleteSig(sig.id)} className="text-xs text-text-tertiary hover:text-danger">Delete</button>
            </div>
          ))}
        </div>
      )}
      <div className="p-3 rounded-lg bg-bg-elevated border border-border-base"><p className="text-xs text-text-secondary">ℹ Signatures are stored locally in your browser using localStorage. They never leave your device.</p></div>
    </div>
  );
}
