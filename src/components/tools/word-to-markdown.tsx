"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import type { ToolUIProps } from "@/components/tool-registry";

export default function WordToMarkdownTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [markdown, setMarkdown] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setMarkdown("");
    setProcessing(true);
    onProcessing?.(true);
    try {
      const mammoth = (await import("mammoth")).default;
      const buffer = Buffer.from(await f.arrayBuffer());
      const result = await mammoth.convertToHtml({ buffer });
      // Convert HTML to simple markdown
      let md = result.value
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n")
        .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n")
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n")
        .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
        .replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**")
        .replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
        .replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*")
        .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      setMarkdown(md);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to convert");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  }, [onError, onProcessing]);

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".docx,.doc" onFilesSelected={handleFile} label="Drop a Word document" description="Convert DOCX to Markdown" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">DOCX</span>
            <span className="text-sm text-text-primary truncate flex-1">{file.name}</span>
            <button onClick={() => { setFile(null); setMarkdown(""); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>
          {markdown && (
            <div className="space-y-3">
              <textarea value={markdown} readOnly rows={16} className="w-full px-4 py-3 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm font-mono resize-y" />
              <div className="flex items-center gap-2">
                <button onClick={() => navigator.clipboard.writeText(markdown)} className="px-4 py-2 rounded-lg text-sm font-medium text-text-primary bg-bg-surface border border-border-base hover:bg-bg-elevated">📋 Copy</button>
                <button onClick={() => { const blob = new Blob([markdown], { type: "text/markdown" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = file!.name.replace(/\.docx?$/i, ".md"); a.click(); URL.revokeObjectURL(url); }} className="px-4 py-2 rounded-lg text-sm font-medium text-text-primary bg-bg-surface border border-border-base hover:bg-bg-elevated">⬇ Download MD</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
