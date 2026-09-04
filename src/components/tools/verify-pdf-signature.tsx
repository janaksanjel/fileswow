"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import type { ToolUIProps } from "@/components/tool-registry";

export default function VerifyPdfSignatureTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{
    hasSignature: boolean;
    pageCount: number;
    producer: string;
    creator: string;
    info: string;
  } | null>(null);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const buffer = await f.arrayBuffer();
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });

      // Check for signature form fields
      const form = doc.getForm();
      const fields = form.getFields();
      const signatureFields = fields.filter(f => {
        const name = f.getName();
        return name.toLowerCase().includes("sign") || name.toLowerCase().includes("sig");
      });

      setResult({
        hasSignature: signatureFields.length > 0,
        pageCount: doc.getPageCount(),
        producer: doc.getProducer() || "Unknown",
        creator: doc.getCreator() || "Unknown",
        info: signatureFields.length > 0
          ? `Found ${signatureFields.length} signature field(s): ${signatureFields.map(f => f.getName()).join(", ")}`
          : "No digital signature fields detected",
      });
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to verify signatures");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  }, [onError, onProcessing]);

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a signed PDF" description="Check for digital signatures" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <div className="flex-1"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          {processing && (
            <div className="flex items-center justify-center py-8">
              <span className="w-6 h-6 border border-accent-start/30 border-t-accent-start rounded-full animate-spin-slow" />
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className={`p-4 rounded-xl border ${result.hasSignature ? "bg-success/[0.04] border-success/10" : "bg-bg-elevated border-border-base"}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{result.hasSignature ? "✅" : "⚠️"}</span>
                  <div>
                    <p className={`text-sm font-semibold ${result.hasSignature ? "text-success" : "text-text-primary"}`}>
                      {result.hasSignature ? "Signature Fields Detected" : "No Signatures Found"}
                    </p>
                    <p className="text-xs text-text-secondary">{result.info}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border-base overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-border-base"><td className="px-4 py-2.5 text-text-secondary bg-bg-elevated w-1/3">Pages</td><td className="px-4 py-2.5 text-text-primary">{result.pageCount}</td></tr>
                    <tr className="border-b border-border-base"><td className="px-4 py-2.5 text-text-secondary bg-bg-elevated">Producer</td><td className="px-4 py-2.5 text-text-primary font-mono text-xs">{result.producer}</td></tr>
                    <tr><td className="px-4 py-2.5 text-text-secondary bg-bg-elevated">Creator</td><td className="px-4 py-2.5 text-text-primary font-mono text-xs">{result.creator}</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="p-3 rounded-lg bg-accent-blue/[0.04] border border-accent-blue/10">
                <p className="text-xs text-accent-blue">ℹ Full digital signature verification requires Adobe Acrobat or similar desktop software. This tool detects signature fields only.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
