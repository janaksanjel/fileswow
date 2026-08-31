"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import type { ToolUIProps } from "@/components/tool-registry";

export default function image_info_Tool({ onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState<Record<string, string> | null>(null);

  const handleFile = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    const img = new Image();
img.onload = () => {
  setInfo({
    "File Name": f.name,
    "File Size": (f.size / 1024).toFixed(1) + " KB",
    "File Type": f.type || "unknown",
    "Width": img.naturalWidth + "px",
    "Height": img.naturalHeight + "px",
    "Aspect Ratio": (img.naturalWidth / img.naturalHeight).toFixed(2),
    "Megapixels": ((img.naturalWidth * img.naturalHeight) / 1000000).toFixed(2) + " MP",
  });
  URL.revokeObjectURL(img.src);
};
img.src = URL.createObjectURL(f);
  }, []);

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept="image/*" onFilesSelected={handleFile} label="Drop an image to view its info" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <div className="flex-1">
              <p className="text-sm text-text-primary truncate">{file.name}</p>
              <p className="text-xs text-text-tertiary">{(file.size / 1024).toFixed(1)} KB | {file.type}</p>
            </div>
            <button onClick={() => { setFile(null); setInfo(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          {info && (
            <div className="rounded-xl bg-bg-elevated border border-border-base overflow-hidden">
              {Object.entries(info).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between px-4 py-2.5 border-b border-border-base last:border-0">
                  <span className="text-xs text-text-tertiary font-medium">{key}</span>
                  <span className="text-sm text-text-primary font-mono">{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}