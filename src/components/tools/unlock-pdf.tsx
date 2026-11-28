"use client";

import { useState, useCallback } from "react";
import { StepFlow, type StepOutput } from "@/components/step-flow";
import type { ToolUIProps } from "@/components/tool-registry";

export default function UnlockPdfTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [password, setPassword] = useState("");
  const [progressMsg, setProgressMsg] = useState("");
  const [outputs, setOutputs] = useState<StepOutput[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesChanged = useCallback((next: File[]) => {
    setFiles(next);
    setOutputs([]);
    setError(null);
  }, []);

  const handleUnlock = async () => {
    if (!files.length) return;
    setProcessing(true);
    setError(null);
    setProgressMsg("");
    onProcessing?.(true);
    try {
      const { unlockPdfBytes } = await import("@/lib/engines/pdf");
      const blob = await unlockPdfBytes(files[0], password, (msg) =>
        setProgressMsg(msg)
      );
      setOutputs([{ name: `unlocked-${files[0].name}`, blob }]);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to unlock PDF. Is the password correct?";
      setError(msg);
      onError?.(msg);
    } finally {
      setProcessing(false);
      setProgressMsg("");
      onProcessing?.(false);
    }
  };

  return (
    <StepFlow
      accept=".pdf"
      maxFiles={1}
      hint="Password-protected PDF document"
      actionLabel="Unlock PDF"
      processingLabel={progressMsg || "Unlocking PDF..."}
      outputs={outputs}
      canRun={files.length > 0}
      processing={processing}
      fileCount={files.length}
      onFilesChanged={handleFilesChanged}
      onResetFilesOnly={() => setOutputs([])}
      onRun={handleUnlock}
      onReset={() => {
        setFiles([]);
        setOutputs([]);
        setError(null);
        setPassword("");
      }}
      error={error}
      onDismissError={() => setError(null)}
      renderOperation={() => (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-2 font-semibold">
              PDF Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter PDF password (leave blank if only printing/copying is restricted)"
              className="w-full px-4 py-2.5 rounded-xl bg-bg-input border border-border-strong text-text-primary text-sm focus:border-accent focus:outline-none transition-colors"
            />
            <p className="mt-1.5 text-xs text-text-tertiary">
              Supports RC4, AES-128 &amp; AES-256 encrypted PDFs — decrypted 100% locally in your browser.
            </p>
          </div>
        </div>
      )}
    />
  );
}
