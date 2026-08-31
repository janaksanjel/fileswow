"use client";

import { useState } from "react";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function TextToPdfTool({ onProcessing, onError }: ToolUIProps) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleConvert = async () => {
    if (!text.trim()) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);

      const lines = text.split("\n");
      const pageSize = { width: 595.28, height: 841.89 };
      const margin = 50;
      const fontSize = 12;
      const lineHeight = fontSize * 1.5;
      const maxLinesPerPage = Math.floor((pageSize.height - margin * 2) / lineHeight);

      let currentPage = doc.addPage([pageSize.width, pageSize.height]);
      let y = pageSize.height - margin;
      let lineCount = 0;

      for (const line of lines) {
        if (lineCount >= maxLinesPerPage) {
          currentPage = doc.addPage([pageSize.width, pageSize.height]);
          y = pageSize.height - margin;
          lineCount = 0;
        }
        currentPage.drawText(line || " ", {
          x: margin,
          y,
          size: fontSize,
          font,
          color: rgb(0.1, 0.1, 0.1),
          maxWidth: pageSize.width - margin * 2,
        });
        y -= lineHeight;
        lineCount++;
      }

      const bytes = await doc.save();
      setResult(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }));
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to create PDF");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-text-secondary mb-2">Enter your text</label>
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setResult(null); }}
          placeholder="Paste or type your text here..."
          rows={12}
          className="w-full px-4 py-3 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm font-mono focus:border-accent focus:outline-none transition-colors resize-y"
        />
        <p className="mt-1 text-xs text-text-tertiary">{text.length} characters · {text.split("\n").length} lines</p>
      </div>

      {result && (
        <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
          <p className="text-sm text-success mb-3">✓ PDF created!</p>
          <DownloadButton blob={result} filename="text.pdf" />
        </div>
      )}

      {!result && (
        <button onClick={handleConvert} disabled={processing || !text.trim()} className="btn-primary w-full py-3">
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
              Converting...
            </span>
          ) : "Convert to PDF"}
        </button>
      )}
    </div>
  );
}
