"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import type { ToolUIProps } from "@/components/tool-registry";

export default function image_to_base64_Tool({ onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFile = useCallback((files: File[]) => {
    const f = files[0]; if (!f) return; setFile(f);
    const reader = new FileReader();
    reader.onload = () => setBase64(reader.result as string);
    reader.readAsDataURL(f);
  }, []);

  const copyToClipboard = () => {
    if (base64) { navigator.clipboard.writeText(base64); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div className="space-y-6">
      {!file ? <DropZone accept="image/*" onFilesSelected={handleFile} label="Drop an image to encode as Base64" /> : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); setBase64(null); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
          </div>
          {base64 && (
            <>
              <div className="text-xs text-text-tertiary">Length: {base64.length} characters</div>
              <textarea readOnly value={base64.slice(0, 500) + (base64.length > 500 ? "..." : "")} className="w-full h-32 px-3 py-2 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-xs font-mono" />
              <button onClick={copyToClipboard} className="btn-primary w-full py-3">{copied ? "✓ Copied!" : "Copy Full Base64 String"}</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}