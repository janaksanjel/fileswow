"use client";

import { useState, useCallback, useEffect } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function EditPdfMetadataTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [subject, setSubject] = useState("");
  const [keywords, setKeywords] = useState("");
  const [creator, setCreator] = useState("");
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    try {
      const { getPdfInfo } = await import("@/lib/engines/pdf");
      const info = await getPdfInfo(f);
      setTitle(info.title || "");
      setAuthor(info.author || "");
      setSubject(info.subject || "");
      setKeywords(info.keywords || "");
      setCreator(info.creator || "");
    } catch {
      // ignore — just show empty fields
    }
  }, []);

  const handleSave = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { editPdfMetadata, savePdf } = await import("@/lib/engines/pdf");
      const doc = await editPdfMetadata(file, { title, author, subject, keywords, creator });
      const blob = await savePdf(doc);
      setResult(blob);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to edit metadata");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF to edit metadata" description="Change title, author, and other properties" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <span className="text-sm text-text-primary truncate flex-1">{file.name}</span>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          {[
            { label: "Title", value: title, set: setTitle },
            { label: "Author", value: author, set: setAuthor },
            { label: "Subject", value: subject, set: setSubject },
            { label: "Keywords", value: keywords, set: setKeywords },
            { label: "Creator", value: creator, set: setCreator },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <label className="block text-sm text-text-secondary mb-1.5">{label}</label>
              <input
                type="text"
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder={label}
                className="w-full px-4 py-2.5 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm focus:border-accent focus:outline-none transition-colors"
              />
            </div>
          ))}

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ Metadata updated!</p>
              <DownloadButton blob={result} filename={file.name} />
            </div>
          )}

          {!result && (
            <button onClick={handleSave} disabled={processing} className="btn-primary w-full py-3">
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
                  Saving...
                </span>
              ) : "Save Metadata"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
