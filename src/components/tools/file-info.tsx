"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import type { ToolUIProps } from "@/components/tool-registry";

interface FileInfo { name: string; size: string; type: string; lastModified: string; pages?: number; }

export default function FileInfoTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState<FileInfo | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setProcessing(true);
    onProcessing?.(true);
    try {
      const ext = f.name.split(".").pop()?.toLowerCase() || "";
      let pages: number | undefined;
      if (ext === "pdf") {
        const { PDFDocument } = await import("pdf-lib");
        const doc = await PDFDocument.load(await f.arrayBuffer());
        pages = doc.getPageCount();
      }
      setInfo({
        name: f.name,
        size: `${(f.size / 1024).toFixed(1)} KB (${(f.size / (1024 * 1024)).toFixed(2)} MB)`,
        type: f.type || `.${ext}`,
        lastModified: new Date(f.lastModified).toLocaleString(),
        pages,
      });
    } catch { setInfo({ name: f.name, size: `${(f.size / 1024).toFixed(1)} KB`, type: f.type || "unknown", lastModified: new Date(f.lastModified).toLocaleString() }); }
    finally { setProcessing(false); onProcessing?.(false); }
  }, [onError, onProcessing]);

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept="*/*" onFilesSelected={handleFile} label="Drop any file" description="View detailed file information" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">{file.name.split(".").pop()?.toUpperCase() || "?"}</span>
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); setInfo(null); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>
          {info && (
            <div className="rounded-xl border border-border-base overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ["File Name", info.name],
                    ["Size", info.size],
                    ["Type", info.type],
                    ["Last Modified", info.lastModified],
                    ...(info.pages !== undefined ? [["Pages", String(info.pages)]] : []),
                  ].map(([k, v]) => (
                    <tr key={k} className="border-b border-border-base last:border-0"><td className="px-4 py-2.5 text-text-secondary bg-bg-elevated w-1/3 font-medium">{k}</td><td className="px-4 py-2.5 text-text-primary font-mono text-xs">{v}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
