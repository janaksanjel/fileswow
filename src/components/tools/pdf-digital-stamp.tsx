"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

type StampType = "received" | "approved" | "draft" | "confidential" | "custom";

const STAMP_PRESETS: Record<StampType, { text: string; color: string }> = {
  received: { text: "RECEIVED", color: "#2563eb" },
  approved: { text: "APPROVED", color: "#16a34a" },
  draft: { text: "DRAFT", color: "#ca8a04" },
  confidential: { text: "CONFIDENTIAL", color: "#dc2626" },
  custom: { text: "", color: "#6b7280" },
};

export default function PdfDigitalStampTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [stampType, setStampType] = useState<StampType>("received");
  const [customText, setCustomText] = useState("");
  const [includeDate, setIncludeDate] = useState(true);
  const [position, setPosition] = useState<"center" | "top-right" | "bottom-right">("center");
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [pageCount, setPageCount] = useState(0);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    try {
      const { loadPdf } = await import("@/lib/engines/pdf");
      const doc = await loadPdf(f);
      setPageCount(doc.getPageCount());
    } catch {
      setPageCount(0);
    }
  }, []);

  const handleStamp = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { loadPdf, savePdf } = await import("@/lib/engines/pdf");
      const { StandardFonts, rgb } = await import("pdf-lib");
      const doc = await loadPdf(file);
      const font = await doc.embedFont(StandardFonts.HelveticaBold);

      const stampText = stampType === "custom" ? customText : STAMP_PRESETS[stampType].text;
      const dateStr = includeDate ? new Date().toLocaleDateString() : "";
      const fullText = dateStr ? `${stampText} — ${dateStr}` : stampText;
      const fontSize = 28;

      const hexToRgb = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return rgb(r, g, b);
      };

      const color = hexToRgb(STAMP_PRESETS[stampType].color);

      for (const page of doc.getPages()) {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(fullText, fontSize);

        let x: number, y: number;
        switch (position) {
          case "center":
            x = (width - textWidth) / 2;
            y = height / 2;
            break;
          case "top-right":
            x = width - textWidth - 30;
            y = height - 40;
            break;
          case "bottom-right":
            x = width - textWidth - 30;
            y = 30;
            break;
        }

        // Draw semi-transparent rectangle behind text
        page.drawRectangle({
          x: x - 10,
          y: y - 8,
          width: textWidth + 20,
          height: fontSize + 16,
          color: rgb(1, 1, 1),
          opacity: 0.7,
          borderColor: color,
          borderWidth: 2,
        });

        page.drawText(fullText, { x, y, size: fontSize, font, color, opacity: 0.85 });
      }

      const blob = await savePdf(doc);
      setResult(blob);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to stamp PDF");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF" description="Select a PDF to stamp" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <div className="flex-1">
              <p className="text-sm text-text-primary truncate">{file.name}</p>
              <p className="text-xs text-text-tertiary">{pageCount} pages</p>
            </div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          {/* Stamp type */}
          <div>
            <label className="block text-sm text-text-secondary mb-2">Stamp type</label>
            <div className="grid grid-cols-3 gap-2">
              {(["received", "approved", "draft", "confidential", "custom"] as StampType[]).map(type => (
                <button key={type} onClick={() => setStampType(type)} className={`py-2 rounded-lg text-sm font-medium capitalize transition-all ${stampType === type ? "bg-accent-start text-white" : "bg-bg-elevated text-text-secondary hover:text-text-primary border border-border-base"}`}>
                  {type === "custom" ? "✏️ Custom" : type}
                </button>
              ))}
            </div>
          </div>

          {stampType === "custom" && (
            <div>
              <label className="block text-sm text-text-secondary mb-2">Custom text</label>
              <input type="text" value={customText} onChange={(e) => setCustomText(e.target.value)} placeholder="Enter stamp text" className="w-full px-4 py-2.5 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm focus:border-accent focus:outline-none" />
            </div>
          )}

          {/* Include date */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={includeDate} onChange={(e) => setIncludeDate(e.target.checked)} className="w-4 h-4 accent-accent-start" />
            <span className="text-sm text-text-secondary">Include today&apos;s date</span>
          </label>

          {/* Position */}
          <div>
            <label className="block text-sm text-text-secondary mb-2">Position</label>
            <div className="flex gap-2">
              {[["center", "Center"], ["top-right", "Top Right"], ["bottom-right", "Bottom Right"]].map(([val, label]) => (
                <button key={val} onClick={() => setPosition(val as any)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${position === val ? "bg-accent-start text-white" : "bg-bg-elevated text-text-secondary border border-border-base"}`}>{label}</button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="p-3 rounded-lg bg-bg-elevated border border-border-base text-center">
            <p className="text-xs text-text-tertiary mb-1">Preview</p>
            <span className="inline-block px-4 py-2 border border-current rounded font-bold text-lg" style={{ color: STAMP_PRESETS[stampType].color }}>
              {stampType === "custom" ? (customText || "YOUR TEXT") : STAMP_PRESETS[stampType].text}
              {includeDate && ` — ${new Date().toLocaleDateString()}`}
            </span>
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Stamp applied!</p>
              <DownloadButton blob={result} filename={`stamped-${file.name}`} />
            </div>
          )}

          {!result && (
            <button onClick={handleStamp} disabled={processing || (stampType === "custom" && !customText.trim())} className="btn-primary w-full py-3">
              {processing ? "Stamping..." : "Apply Digital Stamp"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
