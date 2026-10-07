"use client";

import { useCallback, useRef, useState } from "react";
import { DownloadButton } from "@/components/download-button";
import RichTextEditor from "@/components/rich-text-editor";
import type { ToolUIProps } from "@/components/tool-registry";

export default function TextToWordTool({ onProcessing, onError }: ToolUIProps) {
  const editorElRef = useRef<HTMLDivElement | null>(null);
  const [keepFormatting, setKeepFormatting] = useState(true);
  const [result, setResult] = useState<{ blob: Blob; paragraphCount: number } | null>(null);
  const [filename, setFilename] = useState("document.docx");
  const [processing, setProcessing] = useState(false);

  const handleEditorReady = useCallback((el: HTMLDivElement | null) => {
    editorElRef.current = el;
  }, []);

  const handleConvert = useCallback(async () => {
    const editor = editorElRef.current;
    if (!editor || processing) return;
    if (editor.innerText.trim() === "") {
      onError?.("Type or paste some text first — the document is empty.");
      return;
    }
    setProcessing(true);
    onProcessing?.(true);
    try {
      // Derive the download filename from the first heading (DOM is
      // available here; never read refs during render).
      const heading = editor.querySelector("h1, h2")?.textContent?.trim();
      const slug = (heading || "document").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
      setFilename(`${slug || "document"}.docx`);

      const { richTextToDocx } = await import("@/lib/richtext-docx");
      const res = await richTextToDocx(editor);
      setResult(res);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to create Word document");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  }, [onProcessing, onError, processing]);

  return (
    <div className="space-y-5">
      <RichTextEditor
        editorId="rte-word"
        keepFormatting={keepFormatting}
        onKeepFormattingChange={setKeepFormatting}
        onEditorReady={handleEditorReady}
      />

      {result ? (
        <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center space-y-3">
          <p className="text-sm text-success font-semibold">✓ Word document created — {result.paragraphCount} paragraph{result.paragraphCount === 1 ? "" : "s"}, fully editable</p>
          <div className="flex items-center justify-center gap-2">
            <DownloadButton blob={result.blob} filename={filename} label="Download DOCX" />
            <button type="button" className="btn-secondary" onClick={() => setResult(null)}>Edit more</button>
          </div>
        </div>
      ) : (
        <button onClick={handleConvert} disabled={processing} className="btn-primary w-full py-3">
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />
              Building document…
            </span>
          ) : (
            "Convert to Word"
          )}
        </button>
      )}
    </div>
  );
}
