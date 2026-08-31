"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import type { ToolUIProps } from "@/components/tool-registry";

export default function WordFontCheckerTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fonts, setFonts] = useState<{ name: string; count: number }[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setFonts([]);
    setProcessing(true);
    onProcessing?.(true);
    try {
      const JSZip = (await import("jszip")).default;
      const buffer = await f.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer);
      const stylesXml = await zip.file("word/styles.xml")?.async("text");
      if (stylesXml) {
        const found = [...stylesXml.matchAll(/w:rFonts w:ascii="([^"]+)"/g)].map(m => m[1]);
        const freq: Record<string, number> = {};
        found.forEach(f => freq[f] = (freq[f] || 0) + 1);
        setFonts(Object.entries(freq).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count));
      }
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  }, [onError, onProcessing]);

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".docx,.doc" onFilesSelected={handleFile} label="Drop a Word document" description="Check which fonts are used" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">DOCX</span>
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); setFonts([]); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>
          {processing && <div className="flex items-center justify-center py-8"><span className="w-6 h-6 border-2 border-accent-start/30 border-t-accent-start rounded-full animate-spin-slow" /></div>}
          {fonts.length > 0 && (
            <div className="rounded-xl border border-border-base overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-bg-elevated"><th className="px-4 py-2 text-left text-text-secondary font-medium">Font</th><th className="px-4 py-2 text-right text-text-secondary font-medium">Usage</th></tr></thead>
                <tbody>{fonts.map((f, i) => (
                  <tr key={i} className="border-t border-border-base"><td className="px-4 py-2.5 text-text-primary font-mono text-xs">{f.name}</td><td className="px-4 py-2.5 text-text-secondary text-right">{f.count}x</td></tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {fonts.length === 0 && !processing && <p className="text-sm text-text-secondary text-center py-4">No font information found</p>}
        </div>
      )}
    </div>
  );
}
