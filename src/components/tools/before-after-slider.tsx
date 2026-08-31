"use client";
import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import type { ToolUIProps } from "@/components/tool-registry";

export default function before_after_slider_Tool({ onError }: ToolUIProps) {
  const [before, setBefore] = useState<string | null>(null);
  const [after, setAfter] = useState<string | null>(null);
  const [sliderPos, setSliderPos] = useState(50);

  const handleBefore = useCallback((files: File[]) => {
    const f = files[0]; if (!f) return;
    setBefore(URL.createObjectURL(f));
  }, []);

  const handleAfter = useCallback((files: File[]) => {
    const f = files[0]; if (!f) return;
    setAfter(URL.createObjectURL(f));
  }, []);

  if (!before || !after) {
    return (
      <div className="space-y-6">
        {!before ? <DropZone accept="image/*" onFilesSelected={handleBefore} label="Drop the BEFORE image" /> : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
              <span className="text-xs text-success font-medium">BEFORE loaded</span>
              <button onClick={() => setBefore(null)} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
            </div>
            <DropZone accept="image/*" onFilesSelected={handleAfter} label="Drop the AFTER image" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-lg border border-border-base cursor-ew-resize select-none"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setSliderPos(((e.clientX - rect.left) / rect.width) * 100);
        }}>
        <img src={after} alt="After" className="w-full h-auto" />
        <div className="absolute inset-0 overflow-hidden" style={{ width: sliderPos + "%" }}>
          <img src={before} alt="Before" className="w-full h-auto" style={{ width: (100 / (sliderPos / 100)) + "%", maxWidth: "none" }} />
        </div>
        <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg" style={{ left: sliderPos + "%" }}>
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-xs font-bold">⇔</div>
        </div>
      </div>
      <div className="flex justify-between text-xs text-text-tertiary"><span>BEFORE</span><span>AFTER</span></div>
    </div>
  );
}