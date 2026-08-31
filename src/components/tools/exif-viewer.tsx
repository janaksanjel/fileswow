"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import type { ToolUIProps } from "@/components/tool-registry";

export default function exif_viewer_Tool({ onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState<Record<string, string> | null>(null);

  const handleFile = useCallback((files: File[]) => {
    const f = files[0]; if (!f) return; setFile(f);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        // Simple EXIF parse - look for common tags
        const view = new DataView(reader.result as ArrayBuffer);
        const exifData: Record<string, string> = {
          "File Name": f.name,
          "File Size": (f.size / 1024).toFixed(1) + " KB",
          "File Type": f.type,
        };
        // Try to read EXIF
        if (view.getUint16(0) === 0xFFD8) {
          exifData["Format"] = "JPEG (EXIF)";
          let offset = 2;
          while (offset < view.byteLength - 1) {
            if (view.getUint16(offset) !== 0xFFE1) { offset += 2; continue; }
            const exifLen = view.getUint16(offset + 2);
            if (view.getUint16(offset + 4) !== 0x4578) break;
            exifData["EXIF Present"] = "Yes";
            break;
          }
        }
        setInfo(exifData);
      } catch { setInfo({ "File Name": f.name, "Error": "Could not parse EXIF data" }); }
    };
    reader.readAsArrayBuffer(f);
  }, []);

  return (
    <div className="space-y-6">
      {!file ? <DropZone accept="image/*" onFilesSelected={handleFile} label="Drop an image to view EXIF data" /> : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); setInfo(null); }} className="text-xs text-text-tertiary hover:text-danger">Remove</button>
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