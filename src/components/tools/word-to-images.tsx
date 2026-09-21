"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";
import { prepareScriptFonts, waitForFonts, waitForImages } from "@/lib/script-fonts";

export default function WordToImagesTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<{ name: string; blob: Blob }[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback((files: File[]) => { setFile(files[0] || null); setResults([]); }, []);

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const mammoth = (await import("mammoth")).default;
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = result.value;
      document.body.appendChild(tempDiv);

      // Script-aware fonts: Devanagari (Nepali/Hindi), Arabic, CJK, etc.
      const { fontFamily, hasRtl } = await prepareScriptFonts(tempDiv.textContent || "");
      tempDiv.style.cssText = `position:absolute;left:-9999px;top:0;width:800px;padding:40px;font-family:${fontFamily};font-size:14px;color:#000;background:#fff;line-height:1.65;`;
      if (hasRtl) tempDiv.setAttribute("dir", "auto");

      await Promise.all([waitForFonts(), waitForImages(tempDiv)]);

      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(tempDiv, { scale: 2, useCORS: true, logging: false });
      document.body.removeChild(tempDiv);

      const dataUrl = canvas.toDataURL("image/png");
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      setResults([{ name: `${file.name.replace(/\.docx?$/i, "")}.png`, blob }]);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to convert");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".docx,.doc" onFilesSelected={handleFile} label="Drop a Word document" description="Convert DOCX pages to images" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">DOCX</span>
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); setResults([]); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>
          {results.length > 0 && <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center"><p className="text-sm text-success mb-3">✓ Image created!</p><div className="flex flex-wrap gap-2">{results.map(r => <DownloadButton key={r.name} blob={r.blob} filename={r.name} label={r.name} />)}</div></div>}
          {!results.length && <button onClick={handleConvert} disabled={processing} className="btn-primary w-full py-3">{processing ? "Converting..." : "Convert to Image"}</button>}
        </div>
      )}
    </div>
  );
}
