"use client";

import { useState, useCallback } from "react";
import { StepFlow, type StepOutput } from "@/components/step-flow";
import type { ToolUIProps } from "@/components/tool-registry";

export default function ProtectPdfTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [outputs, setOutputs] = useState<StepOutput[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesChanged = useCallback((next: File[]) => {
    setFiles(next);
    setOutputs([]);
  }, []);

  const passwordMismatch = password && confirmPassword && password !== confirmPassword;
  const canProtect = files.length > 0 && password.length >= 4 && !passwordMismatch;

  const handleProtect = async () => {
    if (!canProtect) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { protectPdf, savePdf } = await import("@/lib/engines/pdf");
      const doc = await protectPdf(files[0], password);
      const blob = await savePdf(doc);
      setOutputs([{ name: `protected-${files[0].name}`, blob }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to protect PDF";
      setError(msg);
      onError?.(msg);
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  return (
    <StepFlow
      accept=".pdf"
      maxFiles={1}
      hint="Single PDF document"
      actionLabel="Protect PDF"
      processingLabel="Protecting PDF..."
      outputs={outputs}
      canRun={canProtect}
      processing={processing}
      fileCount={files.length}
      onFilesChanged={handleFilesChanged}
      onResetFilesOnly={() => setOutputs([])}
      onRun={handleProtect}
      onReset={() => {
        setFiles([]);
        setOutputs([]);
        setError(null);
        setPassword("");
        setConfirmPassword("");
      }}
      error={error}
      onDismissError={() => setError(null)}
      renderOperation={() => (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-2 font-semibold">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter a password (min 4 characters)"
              className="w-full px-4 py-2.5 rounded-xl bg-bg-input border border-border-strong text-text-primary text-sm focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2 font-semibold">Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className={`w-full px-4 py-2.5 rounded-xl bg-bg-input border text-text-primary text-sm focus:outline-none transition-colors ${
                passwordMismatch ? "border-danger focus:border-danger" : "border-border-strong focus:border-accent"
              }`}
            />
            {passwordMismatch && (
              <p className="mt-1.5 text-xs text-danger font-medium">Passwords do not match</p>
            )}
          </div>
        </div>
      )}
    />
  );
}
