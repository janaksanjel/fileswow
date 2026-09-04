"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import type { ToolUIProps } from "@/components/tool-registry";

interface SecurityInfo {
  pageCount: number;
  fileSize: string;
  title: string;
  author: string;
  encrypted: boolean;
  producer: string;
  creator: string;
  creationDate: string;
  modificationDate: string;
}

export default function PdfEncryptCheckTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState<SecurityInfo | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setInfo(null);
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const buffer = await f.arrayBuffer();
      const doc = await PDFDocument.load(buffer);

      setInfo({
        pageCount: doc.getPageCount(),
        fileSize: `${(f.size / 1024).toFixed(1)} KB`,
        title: doc.getTitle() || "None",
        author: doc.getAuthor() || "None",
        encrypted: false, // pdf-lib loads successfully if not encrypted
        producer: doc.getProducer() || "Unknown",
        creator: doc.getCreator() || "Unknown",
        creationDate: doc.getCreationDate()?.toLocaleDateString() || "Unknown",
        modificationDate: doc.getModificationDate()?.toLocaleDateString() || "Unknown",
      });
    } catch (err) {
      // If loading fails, it might be encrypted
      if (err instanceof Error && (err.message.includes("password") || err.message.includes("encrypted"))) {
        setInfo({
          pageCount: 0,
          fileSize: `${(f.size / 1024).toFixed(1)} KB`,
          title: "Protected",
          author: "N/A",
          encrypted: true,
          producer: "N/A",
          creator: "N/A",
          creationDate: "N/A",
          modificationDate: "N/A",
        });
      } else {
        onError?.(err instanceof Error ? err.message : "Failed to read PDF");
      }
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  }, [onError, onProcessing]);

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF to inspect" description="Check security and encryption info" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <div className="flex-1">
              <p className="text-sm text-text-primary truncate">{file.name}</p>
              <p className="text-xs text-text-tertiary">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button onClick={() => { setFile(null); setInfo(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          {processing && (
            <div className="flex items-center justify-center py-8">
              <span className="w-6 h-6 border border-accent-start/30 border-t-accent-start rounded-full animate-spin-slow" />
            </div>
          )}

          {info && (
            <div className="space-y-3">
              {/* Encryption Status */}
              <div className={`p-4 rounded-xl border ${info.encrypted ? "bg-warning/[0.04] border-warning/10" : "bg-success/[0.04] border-success/10"}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{info.encrypted ? "🔒" : "🔓"}</span>
                  <div>
                    <p className={`text-sm font-semibold ${info.encrypted ? "text-warning" : "text-success"}`}>
                      {info.encrypted ? "Password Protected" : "Not Encrypted"}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {info.encrypted ? "This PDF requires a password to open or modify" : "No password protection detected"}
                    </p>
                  </div>
                </div>
              </div>

              {/* File Details */}
              <div className="rounded-xl border border-border-base overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      ["File Size", info.fileSize],
                      ["Pages", String(info.pageCount)],
                      ["Title", info.title],
                      ["Author", info.author],
                      ["Creator", info.creator],
                      ["Producer", info.producer],
                      ["Created", info.creationDate],
                      ["Modified", info.modificationDate],
                    ].map(([label, value]) => (
                      <tr key={label} className="border-b border-border-base last:border-0">
                        <td className="px-4 py-2.5 text-text-secondary font-medium bg-bg-elevated w-1/3">{label}</td>
                        <td className="px-4 py-2.5 text-text-primary font-mono text-xs">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
