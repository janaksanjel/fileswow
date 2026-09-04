"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";

export default function ProtectPdfTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback((files: File[]) => {
    setFile(files[0] || null);
    setResult(null);
  }, []);

  const passwordMismatch = password && confirmPassword && password !== confirmPassword;
  const canProtect = file && password.length >= 4 && !passwordMismatch;

  const handleProtect = async () => {
    if (!canProtect) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { protectPdf, savePdf } = await import("@/lib/engines/pdf");
      const doc = await protectPdf(file!, password);
      const blob = await savePdf(doc);
      setResult(blob);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to protect PDF");
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone accept=".pdf" onFilesSelected={handleFile} label="Drop a PDF to protect" description="Select a single PDF file" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end">PDF</span>
            <span className="text-sm text-text-primary truncate flex-1">{file.name}</span>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-xs text-text-tertiary hover:text-danger transition-colors">Remove</button>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter a password (min 4 characters)"
              className="w-full px-4 py-2.5 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className={`w-full px-4 py-2.5 rounded-lg bg-bg-elevated border text-text-primary text-sm focus:outline-none transition-colors ${
                passwordMismatch ? "border-danger focus:border-danger" : "border-border-base focus:border-accent"
              }`}
            />
            {passwordMismatch && (
              <p className="mt-1 text-xs text-danger">Passwords do not match</p>
            )}
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10 text-center">
              <p className="text-sm text-success mb-3">✓ PDF protected with password!</p>
              <DownloadButton blob={result} filename={`protected-${file.name}`} />
            </div>
          )}

          {!result && (
            <button onClick={handleProtect} disabled={processing || !canProtect} className="btn-primary w-full py-3">
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin-slow" />
                  Protecting...
                </span>
              ) : "Protect PDF"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
