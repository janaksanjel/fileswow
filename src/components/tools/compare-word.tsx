"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import type { ToolUIProps } from "@/components/tool-registry";

export default function CompareWordTool({ onProcessing, onError }: ToolUIProps) {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [textA, setTextA] = useState("");
  const [textB, setTextB] = useState("");
  const [processing, setProcessing] = useState(false);

  const extract = async (f: File) => {
    const mammoth = (await import("mammoth")).default;
    const buffer = Buffer.from(await f.arrayBuffer());
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  };

  const handleFileA = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFileA(f);
    setProcessing(true);
    onProcessing?.(true);
    try { setTextA(await extract(f)); } catch { setTextA(""); }
    finally { setProcessing(false); onProcessing?.(false); }
  }, [onProcessing]);

  const handleFileB = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFileB(f);
    setProcessing(true);
    onProcessing?.(true);
    try { setTextB(await extract(f)); } catch { setTextB(""); }
    finally { setProcessing(false); onProcessing?.(false); }
  }, [onProcessing]);

  const linesA = textA.split("\n");
  const linesB = textB.split("\n");
  const diffCount = Math.abs(linesA.length - linesB.length);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-text-secondary mb-2">First document</label>
          {!fileA ? <DropZone accept=".docx,.doc" onFilesSelected={handleFileA} label="Drop DOCX A" description="First document" /> : (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base"><span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">A</span><div className="flex-1 min-w-0"><p className="text-sm text-text-primary truncate">{fileA.name}</p></div><button onClick={() => { setFileA(null); setTextA(""); }} className="text-xs text-text-tertiary hover:text-danger">✕</button></div>
          )}
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-2">Second document</label>
          {!fileB ? <DropZone accept=".docx,.doc" onFilesSelected={handleFileB} label="Drop DOCX B" description="Second document" /> : (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base"><span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">B</span><div className="flex-1 min-w-0"><p className="text-sm text-text-primary truncate">{fileB.name}</p></div><button onClick={() => { setFileB(null); setTextB(""); }} className="text-xs text-text-tertiary hover:text-danger">✕</button></div>
          )}
        </div>
      </div>
      {textA && textB && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div><p className="text-xs text-text-tertiary mb-1 font-medium">{fileA?.name} ({linesA.length} lines)</p><pre className="p-3 rounded-lg bg-bg-elevated border border-border-base text-xs text-text-primary font-mono overflow-auto max-h-64 whitespace-pre-wrap">{textA.substring(0, 3000)}</pre></div>
            <div><p className="text-xs text-text-tertiary mb-1 font-medium">{fileB?.name} ({linesB.length} lines)</p><pre className="p-3 rounded-lg bg-bg-elevated border border-border-base text-xs text-text-primary font-mono overflow-auto max-h-64 whitespace-pre-wrap">{textB.substring(0, 3000)}</pre></div>
          </div>
          <div className="p-3 rounded-lg bg-bg-elevated border border-border-base"><p className="text-xs text-text-secondary">A: {linesA.length} lines · B: {linesB.length} lines · Difference: {diffCount} lines</p></div>
        </div>
      )}
    </div>
  );
}
