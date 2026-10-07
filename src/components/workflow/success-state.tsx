"use client";

import React, { useState } from "react";

export interface WorkflowResultData {
  fileName: string;
  downloadUrl?: string;
  blob?: Blob;
  sizeBytes?: number;
  originalSizeBytes?: number;
  textResult?: string;
  operationName: string;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

interface DownloadButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export function DownloadButton({
  onClick,
  label = "Download File",
  className = "",
}: DownloadButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn-primary px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-xl text-[15px] font-bold tracking-tight inline-flex items-center gap-2.5 transition-all transform hover:scale-[1.02] active:scale-[0.99] cursor-pointer ${className}`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {label}
    </button>
  );
}

interface SuccessStateProps {
  result: WorkflowResultData;
  onDownload: () => void;
  onProcessAnother: () => void;
}

export function SuccessState({
  result,
  onDownload,
  onProcessAnother,
}: SuccessStateProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyText = async () => {
    if (!result.textResult) return;
    try {
      await navigator.clipboard.writeText(result.textResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const hasReduction =
    result.originalSizeBytes &&
    result.sizeBytes &&
    result.originalSizeBytes > result.sizeBytes;

  const reductionPercent = hasReduction
    ? Math.round(
        ((result.originalSizeBytes! - result.sizeBytes!) / result.originalSizeBytes!) * 100
      )
    : 0;

  return (
    <div className="w-full max-w-lg mx-auto py-8 px-4 text-center space-y-6 animate-fade-in-up">
      {/* Animated Checkmark Circle */}
      <div className="relative inline-flex items-center justify-center">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-success/15 border-2 border-success/40 text-success flex items-center justify-center shadow-lg shadow-success/10 animate-bounce" style={{ animationDuration: "1.5s", animationIterationCount: 2 }}>
          <svg
            width="42"
            height="42"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>

      {/* Header */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-success bg-success/10 px-3 py-1 rounded-full border border-success/20 inline-block mb-1">
          {result.operationName} Complete
        </span>
        <h3 className="heading-lg text-text-primary">
          Your file is ready!
        </h3>
        <p className="body-md text-text-secondary">
          Processed locally in your browser with zero data retention.
        </p>
      </div>

      {/* File Result Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-bg-surface border border-border-base shadow-sm text-left flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center shrink-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-text-primary truncate" title={result.fileName}>
            {result.fileName}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {result.sizeBytes ? (
              <span className="text-xs text-text-secondary font-medium">
                {formatBytes(result.sizeBytes)}
              </span>
            ) : null}

            {hasReduction && (
              <span className="text-[10px] font-extrabold text-success bg-success/10 px-2 py-0.5 rounded-full">
                Saved {reductionPercent}%
              </span>
            )}

            <span className="text-[10px] font-extrabold text-text-tertiary uppercase">
              • Verified Output
            </span>
          </div>
        </div>
      </div>

      {/* Text Result Preview if available (e.g. for Text Tools) */}
      {result.textResult && (
        <div className="rounded-2xl bg-bg-surface border border-border-base p-4 text-left space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-text-secondary font-semibold">
            <span>Result Preview</span>
            <button
              type="button"
              onClick={handleCopyText}
              className="text-accent hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              {copied ? "Copied to clipboard! ✓" : "Copy text"}
            </button>
          </div>
          <div className="max-h-40 overflow-y-auto bg-bg-elevated p-3 rounded-xl font-mono text-xs text-text-primary whitespace-pre-wrap select-all">
            {result.textResult}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <DownloadButton
          onClick={onDownload}
          label={`Download ${result.fileName.split(".").pop()?.toUpperCase() || "File"}`}
          className="w-full sm:w-auto"
        />

        {result.textResult && (
          <button
            type="button"
            onClick={handleCopyText}
            className="btn-secondary px-6 py-3.5 rounded-2xl text-[14px] font-bold w-full sm:w-auto cursor-pointer"
          >
            {copied ? "Copied! ✓" : "Copy Text"}
          </button>
        )}

        <button
          type="button"
          onClick={onProcessAnother}
          className="btn-secondary px-6 py-3.5 rounded-2xl text-[14px] font-bold w-full sm:w-auto cursor-pointer"
        >
          Process Another File
        </button>
      </div>

      {/* Safety assurance */}
      <p className="text-[11px] text-text-tertiary">
        🔒 All files are deleted from temporary memory upon closing this tab.
      </p>
    </div>
  );
}

