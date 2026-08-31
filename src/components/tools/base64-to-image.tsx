"use client";

import { useState, useCallback } from "react";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function base64_to_image_Tool({ onError }: ToolUIProps) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleConvert = () => {
    try {
      const matches = input.match(/^data:image\/([^;]+);base64,(.+)$/);
      if (!matches) { onError?.("Invalid Base64 image string. Expected format: data:image/...;base64,..."); return; }
      const ext = matches[1];
      const binary = atob(matches[2]);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: `image/${ext}` });
      setResult(blob);
      setPreview(URL.createObjectURL(blob));
    } catch { onError?.("Failed to decode Base64 string"); }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-text-secondary mb-2">Paste Base64 String</label>
        <textarea value={input} onChange={(e) => { setInput(e.target.value); setResult(null); setPreview(null); }}
          placeholder="data:image/png;base64,iVBORw0KGgo..."
          className="w-full h-40 px-3 py-2 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-xs font-mono" />
      </div>
      {preview && <img src={preview} alt="Decoded" className="w-full rounded-lg border border-border-base" />}
      {result && <DownloadButton blob={result} filename="decoded-image.png" />}
      {!result && <button onClick={handleConvert} disabled={!input} className="btn-primary w-full py-3">Decode Image</button>}
    </div>
  );
}