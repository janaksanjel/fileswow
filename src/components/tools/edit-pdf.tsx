"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import { PdfPreview } from "@/components/pdf-preview";
import type { ToolUIProps } from "@/components/tool-registry";

export default function EditPdfTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [texts, setTexts] = useState<Array<{ text: string; x: number; y: number; fontSize: number; color: string }>>([]);
  const [newText, setNewText] = useState("");
  const [fontSize, setFontSize] = useState(16);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback((files: File[]) => {
    setFile(files[0] || null);
    setResult(null);
    setTexts([]);
  }, []);

  const addText = () => {
    if (!newText.trim()) return;
    setTexts([...texts, { text: newText, x: 72, y: 700, fontSize, color: "#000000" }]);
    setNewText("");
  };

  const removeText = (index: number) => {
    setTexts(texts.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { loadPdf, savePdf } = await import("@/lib/engines/pdf");
      const { rgb } = await import("pdf-lib");
      const { StandardFonts } = await import("pdf-lib");
      const doc = await loadPdf(file);
      const font = await doc.embedFont(StandardFonts.Helvetica);

      for (const t of texts) {
        const page = doc.getPage(0);
        const hex = t.color.replace("#", "");
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        page.drawText(t.text, {
          x: t.x,
          y: t.y,
          size: t.fontSize,
          font,
          color: rgb(r, g, b),
        });
      }

      const blob = await savePdf(doc);
      setResult(blob);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to edit PDF");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF to edit" description="Select a single PDF file" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <span className="text-sm text-text-primary truncate flex-1">{file.name}</span>
            <button onClick={() => { setFile(null); setResult(null); setTexts([]); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          {/* PDF Preview */}
          <PdfPreview file={file} className="rounded-xl overflow-hidden" />

          {/* Add text */}
          <div className="p-3 rounded-lg bg-bg-elevated border border-border-base space-y-3">
            <label className="block text-sm text-text-secondary font-medium">Add Text</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addText()}
                placeholder="Enter text to add..."
                className="flex-1 px-4 py-2.5 rounded-lg bg-bg-input border border-border-base text-text-primary text-sm focus:border-accent focus:outline-none transition-colors"
              />
              <button onClick={addText} className="px-4 py-2.5 rounded-lg bg-accent-start/10 text-accent-end text-sm font-medium hover:bg-accent-start/20 transition-colors">
                Add
              </button>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs text-text-tertiary mb-1">Font size</label>
                <input type="number" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full px-3 py-1.5 rounded bg-bg-input border border-border-base text-text-primary text-sm font-mono focus:border-accent focus:outline-none" />
              </div>
            </div>
          </div>

          {/* Text items */}
          {texts.length > 0 && (
            <div className="space-y-2">
              {texts.map((t, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-bg-elevated border border-border-base">
                  <span className="text-sm text-text-primary flex-1 truncate">"{t.text}"</span>
                  <span className="text-xs text-text-tertiary">{t.fontSize}px</span>
                  <button onClick={() => removeText(i)} className="text-xs text-text-tertiary hover:text-danger transition-colors">✕</button>
                </div>
              ))}
            </div>
          )}

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Edit complete!</p>
              <DownloadButton blob={result} filename={`edited-${file.name}`} />
            </div>
          )}

          {!result && (
            <button onClick={handleSave} disabled={processing || texts.length === 0} className="btn-primary w-full py-3">
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />
                  Saving...
                </span>
              ) : "Save Edited PDF"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
