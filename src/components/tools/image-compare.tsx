"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import type { ToolUIProps } from "@/components/tool-registry";

export default function image_compare_Tool({ onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);

  const handleFile = useCallback((f: File[]) => {
    setFiles(prev => [...prev, ...f].slice(0, 2));
  }, []);

  return (
    <div className="space-y-6">
      {files.length < 2 ? (
        <DropZone accept="image/*" multiple onFilesSelected={handleFile} label="Drop two images to compare" description={"Selected: " + files.length + "/2 images"} maxFiles={2} />
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2">
            {files.map((f, i) => (
              <div key={i} className="flex-1 flex items-center gap-2 p-3 rounded-lg bg-bg-elevated border border-border-base">
                <div className="flex-1"><p className="text-sm text-text-primary truncate">{f.name}</p></div>
                <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-xs text-text-tertiary hover:text-danger">✕</button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {files.map((f, i) => (
              <div key={i} className="rounded-lg border border-border-base overflow-hidden">
                <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-auto" />
                <div className="p-2 text-center text-xs text-text-tertiary">{f.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}