"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import type { ToolUIProps } from "@/components/tool-registry";

export default function WordCommentsExtractorTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [comments, setComments] = useState<{ author: string; text: string; date: string }[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setComments([]);
    setProcessing(true);
    onProcessing?.(true);
    try {
      const JSZip = (await import("jszip")).default;
      const buffer = await f.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer);
      const commentsFile = zip.file("word/comments.xml");
      if (commentsFile) {
        const xml = await commentsFile.async("text");
        const found = [...xml.matchAll(/<w:comment[^>]*w:author="([^"]*)"[^>]*w:date="([^"]*)"[^>]*>[\s\S]*?<w:t[^>]*>([^<]*)<\/w:t>[\s\S]*?<\/w:comment>/g)];
        setComments(found.map(m => ({ author: m[1], date: m[2], text: m[3] })));
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
        <DropZone accept=".docx,.doc" onFilesSelected={handleFile} label="Drop a Word document" description="Extract all comments from DOCX" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">DOCX</span>
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p><p className="text-xs text-text-tertiary">{comments.length} comment(s)</p></div>
            <button onClick={() => { setFile(null); setComments([]); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>
          {processing && <div className="flex items-center justify-center py-8"><span className="w-6 h-6 border-2 border-accent-start/30 border-t-accent-start rounded-full animate-spin-slow" /></div>}
          {comments.length > 0 && (
            <div className="space-y-2">
              {comments.map((c, i) => (
                <div key={i} className="p-3 rounded-lg bg-bg-elevated border border-border-base">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-accent">{c.author}</span>
                    <span className="text-[10px] text-text-tertiary">{c.date}</span>
                  </div>
                  <p className="text-sm text-text-primary">{c.text}</p>
                </div>
              ))}
            </div>
          )}
          {comments.length === 0 && !processing && <p className="text-sm text-text-secondary text-center py-4">No comments found in this document</p>}
          {comments.length > 0 && (
            <button onClick={() => { const text = comments.map(c => `[${c.author}]: ${c.text}`).join("\n\n"); navigator.clipboard.writeText(text); }} className="w-full py-2 rounded-lg text-sm font-medium text-text-primary bg-bg-surface border border-border-base hover:bg-bg-elevated">📋 Copy all comments</button>
          )}
        </div>
      )}
    </div>
  );
}
