"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import type { ToolUIProps } from "@/components/tool-registry";

export default function SideBySideDiffTool({ onProcessing, onError }: ToolUIProps) {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [textA, setTextA] = useState("");
  const [textB, setTextB] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleFileA = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFileA(f);
    try {
      const text = await f.text();
      setTextA(text);
    } catch { setTextA("[Could not read file]"); }
  }, []);

  const handleFileB = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFileB(f);
    try {
      const text = await f.text();
      setTextB(text);
    } catch { setTextB("[Could not read file]"); }
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-text-secondary mb-2">First file</label>
          {!fileA ? (
            <DropZone accept=".pdf,.txt,.md" onFilesSelected={handleFileA} label="Drop file A" description="First document" />
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
              <div className="flex-1 min-w-0"><p className="text-sm text-text-primary truncate">{fileA.name}</p></div>
              <button onClick={() => { setFileA(null); setTextA(""); }} className="text-xs text-text-tertiary hover:text-danger">✕</button>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-2">Second file</label>
          {!fileB ? (
            <DropZone accept=".pdf,.txt,.md" onFilesSelected={handleFileB} label="Drop file B" description="Second document" />
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
              <div className="flex-1 min-w-0"><p className="text-sm text-text-primary truncate">{fileB.name}</p></div>
              <button onClick={() => { setFileB(null); setTextB(""); }} className="text-xs text-text-tertiary hover:text-danger">✕</button>
            </div>
          )}
        </div>
      </div>

      {textA && textB && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-text-tertiary mb-1 font-medium">{fileA?.name}</p>
            <pre className="p-3 rounded-lg bg-bg-elevated border border-border-base text-xs text-text-primary font-mono overflow-auto max-h-96 whitespace-pre-wrap">{textA.substring(0, 5000)}</pre>
          </div>
          <div>
            <p className="text-xs text-text-tertiary mb-1 font-medium">{fileB?.name}</p>
            <pre className="p-3 rounded-lg bg-bg-elevated border border-border-base text-xs text-text-primary font-mono overflow-auto max-h-96 whitespace-pre-wrap">{textB.substring(0, 5000)}</pre>
          </div>
        </div>
      )}

      {textA && textB && (
        <div className="p-3 rounded-lg bg-bg-elevated border border-border-base">
          <p className="text-xs text-text-secondary">
            ℹ File A: {textA.length} chars · File B: {textB.length} chars · Difference: {Math.abs(textA.length - textB.length)} chars
          </p>
        </div>
      )}
    </div>
  );
}
