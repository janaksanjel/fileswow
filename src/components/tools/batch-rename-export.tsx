"use client";

import { useState } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function BatchRenameExportTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [pattern, setPattern] = useState("document_{{n}}");
  const [renamed, setRenamed] = useState<{ original: string; newName: string; blob: Blob }[]>([]);

  const handleFiles = (newFiles: File[]) => setFiles(prev => [...prev, ...newFiles]);

  const handleRename = async () => {
    onProcessing?.(true);
    try {
      const results = files.map((f, i) => {
        const ext = f.name.split(".").pop() || "";
        const newName = pattern.replace("{{n}}", String(i + 1).padStart(3, "0")).replace("{{name}}", f.name.replace(/\.[^.]+$/, ""));
        return { original: f.name, newName: `${newName}.${ext}`, blob: f };
      });
      setRenamed(results);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed");
    } finally {
      onProcessing?.(false);
    }
  };

  const downloadAll = async () => {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    for (const r of renamed) zip.file(r.newName, r.blob);
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a"); a.href = url; a.download = "renamed-files.zip"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {files.length === 0 ? (
        <DropZone accept="*/*" multiple onFilesSelected={handleFiles} label="Drop files to rename" description="Select multiple files" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between"><p className="text-sm text-text-secondary">{files.length} file(s)</p><button onClick={() => { setFiles([]); setRenamed([]); }} className="text-xs text-text-tertiary hover:text-danger">Clear</button></div>
          <div><label className="block text-sm text-text-secondary mb-2">Rename pattern</label><input type="text" value={pattern} onChange={(e) => setPattern(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm font-mono focus:border-accent focus:outline-none" placeholder="document_{{n}}" /><p className="mt-1 text-xs text-text-tertiary">{"Use {{n}} for number, {{name}} for original name"}</p></div>
          <div className="space-y-1 max-h-48 overflow-y-auto">{files.slice(0, 10).map((f, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded bg-bg-elevated border border-border-base text-xs">
              <span className="text-text-tertiary truncate flex-1">{f.name}</span>
              <span className="text-text-tertiary">→</span>
              <span className="text-accent truncate flex-1">{pattern.replace("{{n}}", String(i + 1).padStart(3, "0")).replace("{{name}}", f.name.replace(/\.[^.]+$/, ""))}.{f.name.split(".").pop()}</span>
            </div>
          ))}{files.length > 10 && <p className="text-xs text-text-tertiary text-center">+{files.length - 10} more</p>}</div>
          {renamed.length > 0 && <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10"><p className="text-sm text-success mb-3">✓ {renamed.length} files renamed!</p><button onClick={downloadAll} className="px-4 py-2 rounded-lg text-sm font-medium text-text-primary bg-bg-surface border border-border-base hover:bg-bg-elevated">📦 Download all (ZIP)</button></div>}
          {renamed.length === 0 && <button onClick={handleRename} disabled={files.length === 0} className="btn-primary w-full py-3">Rename {files.length} files</button>}
        </div>
      )}
    </div>
  );
}
