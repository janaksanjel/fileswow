"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { PdfDrawerPreview } from "./pdf-drawer-preview";
import { emitAppleToast } from "./apple-toast";

export type ToolStep = 1 | 2 | 3;

export interface ReadyOutputItem {
  id: string;
  blob: Blob;
  filename: string;
}

interface ToolStepContextValue {
  hasStepFlow: boolean;
  hasDropZone: boolean;
  step: ToolStep;
  readyOutputs: ReadyOutputItem[];
  setHasStepFlow: (v: boolean) => void;
  setStep: (s: ToolStep) => void;
  reportDropZoneMounted: () => void;
  reportDropZoneUnmounted: () => void;
  registerDownloadOutput: (id: string, blob: Blob, filename: string) => void;
  unregisterDownloadOutput: (id: string) => void;
  clearDownloadOutputs: () => void;
}

const ToolStepContext = createContext<ToolStepContextValue | null>(null);

export function ToolStepProvider({ children }: { children: React.ReactNode }) {
  const [hasStepFlow, setHasStepFlow] = useState(false);
  const [hasDropZone, setHasDropZone] = useState(false);
  const [step, setStep] = useState<ToolStep>(1);
  const [readyOutputs, setReadyOutputs] = useState<ReadyOutputItem[]>([]);

  const reportDropZoneMounted = useCallback(() => {
    setHasDropZone(true);
    setReadyOutputs([]);
    setStep(1);
  }, []);

  const reportDropZoneUnmounted = useCallback(() => {
    setStep((s) => (s === 1 ? 2 : s));
  }, []);

  const registerDownloadOutput = useCallback((id: string, blob: Blob, filename: string) => {
    setReadyOutputs((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      return [...filtered, { id, blob, filename }];
    });
    setStep(3);
  }, []);

  const unregisterDownloadOutput = useCallback((id: string) => {
    setReadyOutputs((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearDownloadOutputs = useCallback(() => {
    setReadyOutputs([]);
  }, []);

  return (
    <ToolStepContext.Provider
      value={{
        hasStepFlow,
        hasDropZone,
        step,
        readyOutputs,
        setHasStepFlow,
        setStep,
        reportDropZoneMounted,
        reportDropZoneUnmounted,
        registerDownloadOutput,
        unregisterDownloadOutput,
        clearDownloadOutputs,
      }}
    >
      {children}
    </ToolStepContext.Provider>
  );
}

export function useToolStep() {
  return useContext(ToolStepContext);
}

const STEPS: Array<{ num: ToolStep; label: string }> = [
  { num: 1, label: "Upload" },
  { num: 2, label: "Customize" },
  { num: 3, label: "Download" },
];

/**
 * Unified step indicator shown automatically for all tools that don't render StepFlow:
 * - File-upload (DropZone) tools: 1 Upload → 2 Customize → 3 Download
 * - Editor / generator tools (Text to Word, Text to PDF, QR, etc.): 1 Create & Edit → 2 Download
 */
export function AutoToolStepBar() {
  const ctx = useToolStep();
  if (!ctx || ctx.hasStepFlow) return null;

  if (!ctx.hasDropZone) {
    const isDownloadStep = ctx.step === 3 && ctx.readyOutputs.length > 0;
    const editorSteps = [
      { num: 1, label: "Create & Edit" },
      { num: 2, label: "Download" },
    ];
    return (
      <div
        className="grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl bg-bg-elevated/85 border border-border-base mb-5 select-none"
        role="navigation"
        aria-label={`Step ${isDownloadStep ? 2 : 1} of 2`}
      >
        {editorSteps.map((s) => {
          const state =
            s.num === 1
              ? isDownloadStep
                ? "done"
                : "active"
              : isDownloadStep
                ? "active"
                : "todo";
          const canJumpBack = state === "done" && s.num === 1;
          return (
            <button
              key={s.num}
              type="button"
              disabled={!canJumpBack}
              onClick={() => canJumpBack && ctx.setStep(1)}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 sm:px-3 rounded-xl text-[12px] sm:text-[12.5px] font-semibold transition-all duration-200 ${
                state === "active"
                  ? "bg-bg-surface text-accent shadow-sm border border-border-base"
                  : state === "done"
                    ? "text-text-primary hover:bg-bg-surface/60 cursor-pointer"
                    : "text-text-tertiary opacity-60 cursor-default"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10.5px] font-bold shrink-0 transition-colors ${
                  state === "done"
                    ? "bg-success text-white"
                    : state === "active"
                      ? "bg-accent text-text-on-accent"
                      : "bg-bg-surface text-text-tertiary border border-border-base"
                }`}
              >
                {state === "done" ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  s.num
                )}
              </span>
              <span className="truncate">{s.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-bg-elevated/85 border border-border-base mb-5 select-none"
      role="navigation"
      aria-label={`Step ${ctx.step} of 3`}
    >
      {STEPS.map((s) => {
        const state =
          s.num < ctx.step ? "done" : s.num === ctx.step ? "active" : "todo";
        const canJumpBack = state === "done" && s.num === 2 && ctx.step === 3;
        return (
          <button
            key={s.num}
            type="button"
            disabled={!canJumpBack}
            onClick={() => canJumpBack && ctx.setStep(2)}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 sm:px-3 rounded-xl text-[12px] sm:text-[12.5px] font-semibold transition-all duration-200 ${
              state === "active"
                ? "bg-bg-surface text-accent shadow-sm border border-border-base"
                : state === "done"
                  ? `text-text-primary ${canJumpBack ? "hover:bg-bg-surface/60 cursor-pointer" : ""}`
                  : "text-text-tertiary opacity-60 cursor-default"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10.5px] font-bold shrink-0 transition-colors ${
                state === "done"
                  ? "bg-success text-white"
                  : state === "active"
                    ? "bg-accent text-text-on-accent"
                    : "bg-bg-surface text-text-tertiary border border-border-base"
              }`}
            >
              {state === "done" ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                s.num
              )}
            </span>
            <span className="truncate">{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Clean, centered Step 3 Final Download Card shown in place of the Customize form
 * for DropZone-based tools once their output is ready.
 */
export function AutoToolFinalOutput({
  onResetTool,
  children,
}: {
  onResetTool: () => void;
  children: React.ReactNode;
}) {
  const ctx = useToolStep();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showAllFiles, setShowAllFiles] = useState(false);
  const [zipping, setZipping] = useState(false);

  const showFinalOnly =
    Boolean(ctx) &&
    !ctx!.hasStepFlow &&
    ctx!.step === 3 &&
    ctx!.readyOutputs.length > 0;

  const outputs = ctx?.readyOutputs ?? [];
  const primary = outputs[0];
  const totalBytes = outputs.reduce((sum, o) => sum + o.blob.size, 0);
  const formatSize = (bytes: number) =>
    bytes >= 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(2)} MB`
      : `${Math.max(1, Math.round(bytes / 1024))} KB`;

  const isPreviewable = Boolean(
    primary &&
      (primary.blob.type === "application/pdf" ||
        primary.filename.toLowerCase().endsWith(".pdf") ||
        primary.blob.type.startsWith("image/") ||
        /\.(png|jpe?g|webp|svg|gif|bmp|ico|avif)$/i.test(primary.filename))
  );

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    emitAppleToast("Downloaded", filename);
  };

  const handleZipAll = async () => {
    setZipping(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      outputs.forEach((o) => zip.file(o.filename, o.blob));
      const zipBlob = await zip.generateAsync({ type: "blob" });
      triggerDownload(zipBlob, "fileswow-output.zip");
    } finally {
      setZipping(false);
    }
  };

  return (
    <>
      {/* Always keep the exact same wrapper element so children never unmount/lose state */}
      <div className={showFinalOnly ? "hidden" : undefined} aria-hidden={showFinalOnly || undefined}>
        {children}
      </div>

      {showFinalOnly && ctx && primary && (
        <>
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-success/[0.06] to-bg-elevated/40 border border-success/25 text-center space-y-5">
            <div className="flex flex-col items-center gap-3">
              <span className="flow-check w-13 h-13 rounded-2xl bg-success/15 text-success ring-4 ring-success/10 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>

              <div className="space-y-1 max-w-md">
                <h3 className="text-[17px] sm:text-[18px] font-bold text-text-primary tracking-tight">
                  {outputs.length === 1 ? "Your file is ready!" : `${outputs.length} files are ready!`}
                </h3>
                <div className="inline-flex flex-wrap items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-bg-surface border border-border-base text-[12px] text-text-secondary">
                  <span className="font-semibold text-text-primary truncate max-w-[220px] sm:max-w-[300px]">
                    {outputs.length === 1 ? primary.filename : `${outputs.length} processed files`}
                  </span>
                  <span className="text-text-tertiary">·</span>
                  <span className="tabular-nums">{formatSize(totalBytes)}</span>
                  <span className="text-text-tertiary hidden sm:inline">·</span>
                  <span className="text-success font-medium hidden sm:inline">100% private</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {outputs.length === 1 ? (
                <button
                  type="button"
                  onClick={() => triggerDownload(primary.blob, primary.filename)}
                  className="btn-primary px-6 py-3 text-[13.5px] font-bold shadow-md inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download {primary.filename}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleZipAll}
                  disabled={zipping}
                  className="btn-primary px-6 py-3 text-[13.5px] font-bold shadow-md inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  {zipping ? "Creating ZIP…" : `Download All (${outputs.length} files · ZIP)`}
                </button>
              )}

              {isPreviewable && (
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="btn-secondary px-5 py-3 text-[13.5px] font-semibold inline-flex items-center gap-1.5 hover:border-accent hover:text-accent transition-colors cursor-pointer"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span>Preview</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-2 border-t border-border-base/70 text-[12px]">
              {outputs.length > 1 && (
                <button
                  type="button"
                  onClick={() => setShowAllFiles((v) => !v)}
                  className="font-semibold text-accent hover:underline cursor-pointer"
                >
                  {showAllFiles ? "Hide individual files" : `Show individual files (${outputs.length})`}
                </button>
              )}
              <button
                type="button"
                onClick={() => ctx.setStep(ctx.hasDropZone ? 2 : 1)}
                className="font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                {ctx.hasDropZone ? "← Back to options" : "← Back to edit"}
              </button>
              <button
                type="button"
                onClick={() => {
                  ctx.clearDownloadOutputs();
                  onResetTool();
                }}
                className="font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                Convert another file
              </button>
            </div>
          </div>

          {outputs.length > 1 && showAllFiles && (
            <ul className="mt-3 space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              {outputs.map((o, idx) => (
                <li
                  key={o.id}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-bg-elevated/60 border border-border-base"
                >
                  <span className="text-[11px] font-bold text-text-tertiary tabular-nums w-5 text-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="flex-1 min-w-0 text-[12.5px] font-semibold text-text-primary truncate">
                    {o.filename}
                  </span>
                  <span className="text-[11px] text-text-tertiary tabular-nums shrink-0">
                    {formatSize(o.blob.size)}
                  </span>
                  <button
                    type="button"
                    onClick={() => triggerDownload(o.blob, o.filename)}
                    className="btn-secondary px-3 py-1 text-[11px] font-semibold hover:border-accent hover:text-accent cursor-pointer"
                  >
                    Save
                  </button>
                </li>
              ))}
            </ul>
          )}

          <PdfDrawerPreview
            open={previewOpen}
            onClose={() => setPreviewOpen(false)}
            fileOrBlob={primary.blob}
            title={`Preview: ${primary.filename}`}
          />
        </>
      )}
    </>
  );
}
