"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function WordToOdtTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback((files: File[]) => { setFile(files[0] || null); setResult(null); }, []);

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const mammoth = (await import("mammoth")).default;
      const JSZip = (await import("jszip")).default;
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await mammoth.convertToHtml({ buffer });

      const odt = new JSZip();
      const contentXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text">
<office:body><office:text>
<text:p>${result.value.replace(/<[^>]+>/g, (match) => {
  if (match.startsWith("<b>") || match.startsWith("<strong>")) return "<text:span text:style-name=\"bold\">";
  if (match.startsWith("<i>") || match.startsWith("<em>")) return "<text:span text:style-name=\"italic\">";
  return "";
}).replace(/<[^>]+>/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</text:p>
</office:text></office:body>
</office:document-content>`;
      odt.file("content.xml", contentXml);
      odt.file("mimetype", "application/vnd.oasis.opendocument.text");

      const blob = await odt.generateAsync({ type: "blob" });
      setResult(blob);
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
        <DropZone accept=".docx,.doc" onFilesSelected={handleFile} label="Drop a Word document" description="Convert DOCX to ODT" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">DOCX</span>
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>
          {result && <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center"><p className="text-sm text-success mb-3">✓ ODT created!</p><DownloadButton blob={result} filename={file!.name.replace(/\.docx?$/i, ".odt")} /></div>}
          {!result && <button onClick={handleConvert} disabled={processing} className="btn-primary w-full py-3">{processing ? "Converting..." : "Convert to ODT"}</button>}
        </div>
      )}
    </div>
  );
}
