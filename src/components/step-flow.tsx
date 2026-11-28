"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileUploader } from "./file-uploader";
import { DownloadButton } from "./download-button";
import { PdfDrawerPreview } from "./pdf-drawer-preview";
import { emitAppleToast } from "./apple-toast";
import { useToolStep } from "./tool-step-context";

/* ─── Types ──────────────────────────────────────────────────────── */

export type { UploadedFile } from "./file-uploader";

export interface StepOutput {
  name: string;
  blob: Blob;
}

export interface StepFlowResultProps {
  outputs: StepOutput[];
  /** Start a fresh run (clears files + returns to step 1) */
  onReset: () => void;
  /** Zip + download all outputs when there are many */
  onDownloadAll?: () => void;
  /** Optional custom result banner/stats above the outputs */
  renderResult?: () => React.ReactNode;
}

export interface StepFlowProps {
  /** Comma-separated accept string for the file input */
  accept: string;
  multiple?: boolean;
  maxFiles?: number;
  minFiles?: number;
  hint?: string;
  /** Renders the operation UI for step 2 (options + action button) */
  renderOperation: (ctx: StepFlowOperationContext) => React.ReactNode;
  /** Optional custom result banner/stats for step 3 */
  renderResult?: () => React.ReactNode;
  /** Current outputs — presence of ≥1 output shows step 3 */
  outputs: StepOutput[];
  /** Can the user run the operation right now? */
  canRun: boolean;
  /** Is the operation currently processing? */
  processing: boolean;
  /** Verb for the Continue→Run action, e.g. "Merge", "Convert" */
  actionLabel: string;
  /** Processing verb, e.g. "Merging" */
  processingLabel?: string;
  /** Files selected so far (parent mirrors state) */
  fileCount: number;
  onFilesChanged: (files: File[]) => void;
  /** Parent-only cleanup when the file list is emptied from inside the
      uploader (e.g. "Clear all") — clear outputs/error, NOT step state. */
  onResetFilesOnly: () => void;
  onInvalidated?: () => void;
  /** Run the operation (called from step 2 button) */
  onRun: () => void;
  /** Clear everything and return to step 1 */
  onReset: () => void;
  /** Zip + download all (optional) */
  onDownloadAll?: () => void;
  /** Optional error display */
  error?: string | null;
  onDismissError?: () => void;
}

export interface StepFlowOperationContext {
  files: number;
  /** Navigate back to step 1 (e.g. from a "change files" link) */
  backToUpload: () => void;
}

type Step = 1 | 2 | 3;

function isPreviewableFile(file?: File | Blob | null) {
  if (!file) return false;
  const type = file.type?.toLowerCase() || "";
  const name = (file instanceof File ? file.name : "").toLowerCase();
  return (
    type === "application/pdf" ||
    name.endsWith(".pdf") ||
    type.startsWith("image/") ||
    /\.(png|jpe?g|webp|svg|gif|bmp|ico|avif)$/i.test(name)
  );
}


/* ─── Step indicator ────────────────────────────────────────────── */

const STEPS: Array<{ num: Step; label: string }> = [
  { num: 1, label: "Upload" },
  { num: 2, label: "Customize" },
  { num: 3, label: "Download" },
];

function StepIndicator({
  current,
  onNavigate,
}: {
  current: Step;
  onNavigate?: (step: Step) => void;
}) {
  return (
    <div
      className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-bg-elevated/85 border border-border-base mb-5 select-none"
      role="navigation"
      aria-label={`Step ${current} of 3`}
    >
      {STEPS.map((s) => {
        const state =
          s.num < current ? "done" : s.num === current ? "active" : "todo";
        const canJump = state === "done" && Boolean(onNavigate);
        return (
          <button
            key={s.num}
            type="button"
            disabled={!canJump}
            onClick={() => canJump && onNavigate?.(s.num)}
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

/* ─── Main component ────────────────────────────────────────────── */

export function StepFlow({
  accept,
  multiple = false,
  maxFiles,
  minFiles,
  hint,
  renderOperation,
  outputs,
  canRun,
  processing,
  actionLabel,
  processingLabel,
  fileCount,
  onFilesChanged,
  onResetFilesOnly,
  onInvalidated,
  onRun,
  onReset,
  onDownloadAll,
  renderResult,
  error,
  onDismissError,
}: StepFlowProps) {
  const [step, setStep] = useState<Step>(1);
  const panelRef = useRef<HTMLDivElement>(null);
  const [currentFiles, setCurrentFiles] = useState<File[]>([]);
  const [uploaderResetKey, setUploaderResetKey] = useState(0);
  const [activeDrawerFile, setActiveDrawerFile] = useState<{ file: File | Blob; title: string } | null>(null);
  const stepCtx = useToolStep();

  useEffect(() => {
    stepCtx?.setHasStepFlow(true);
    return () => stepCtx?.setHasStepFlow(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* All step transitions happen inside event handlers or rAF-deferred
     effects — never synchronously during render — so no cascades.
     If the parent clears files, onFilesChanged([]) fires and we snap
     back to Upload inside that handler (see handleFilesChanged). */
  const handleFilesChanged = useCallback(
    (files: File[]) => {
      setCurrentFiles(files);
      if (files.length === 0) {
        setStep(1);
        onResetFilesOnly();
      }
      onFilesChanged(files);
    },
    [onFilesChanged, onResetFilesOnly]
  );

  const goUpload = useCallback(() => setStep(1), []);
  const goToOperation = useCallback(() => {
    setStep(2);
    requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  }, []);

  /* Start over from Output (Step 3) keeps already-uploaded files so users never have to re-upload */
  const handleStartOverKeepFiles = useCallback(() => {
    if (currentFiles.length > 0) {
      onFilesChanged(currentFiles);
      onInvalidated?.();
      setStep(2);
    } else {
      setUploaderResetKey((k) => k + 1);
      setStep(1);
      onReset();
    }
  }, [currentFiles, onFilesChanged, onInvalidated, onReset]);

  /* Full reset (clears files and returns to Upload) */
  const handleFullReset = useCallback(() => {
    setCurrentFiles([]);
    setUploaderResetKey((k) => k + 1);
    setStep(1);
    onReset();
  }, [onReset]);

  /* Browser back button = previous step while inside the flow */
  useEffect(() => {
    const onPop = () => {
      setStep((s) => {
        if (s > 1) {
          window.history.pushState({ stepFlow: true }, "");
          return (s - 1) as Step;
        }
        return s;
      });
    };
    if (step > 1) {
      window.history.pushState({ stepFlow: true }, "");
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [step > 1]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Advance to Output one frame after results land, so the spinner
     settles first. setStep is deferred out of the effect body (a frame
     later) to avoid a synchronous cascading render. */
  useEffect(() => {
    if (outputs.length === 0) return;
    const raf = requestAnimationFrame(() => {
      setStep((s) => {
        if (s === 2) {
          emitAppleToast(
            "Complete",
            `${outputs.length} file${outputs.length > 1 ? "s" : ""} ready to download`
          );
          return 3;
        }
        return s;
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [outputs.length]);

  const runAndAdvance = useCallback(() => {
    if (!canRun || processing) return;
    setStep(2); // stay on Operation while the runner works
    onRun();
  }, [canRun, processing, onRun]);

  const hasFiles = fileCount > 0;

  return (
    <div>
      {/* Modern Stepper + contextual action */}
      <div className="mb-4">
        {(step > 1 || (step === 1 && hasFiles)) && (
          <div className="flex items-center justify-between gap-3 mb-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as Step)}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                Back to {step === 2 ? "Upload" : "Customize"}
              </button>
            ) : (
              <span />
            )}
            {step === 1 && hasFiles && (
              <button
                type="button"
                onClick={handleFullReset}
                className="text-[12px] font-semibold text-text-tertiary hover:text-danger transition-colors cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>
        )}
        <StepIndicator
          current={step}
          onNavigate={(target) => {
            if (target < step) setStep(target);
          }}
        />
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-danger/[0.05] border border-danger/25 flex items-start gap-3">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-danger mt-0.5 shrink-0" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <p className="flex-1 min-w-0 text-[12.5px] text-danger font-medium break-words">{error}</p>
          {onDismissError && (
            <button onClick={onDismissError} className="text-text-tertiary hover:text-danger transition-colors shrink-0" aria-label="Dismiss">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Panels */}
      <div ref={panelRef}>
        {step === 1 && (
          <div key="upload" className="flow-panel-enter">
            <FileUploader
              key={uploaderResetKey}
              accept={accept}
              multiple={multiple}
              maxFiles={maxFiles}
              hint={hint}
              initialFiles={currentFiles}
              onFilesChanged={handleFilesChanged}
              onInvalidated={onInvalidated}
            />
            {/* Continue & Preview Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 mt-5">
              {hasFiles && currentFiles.length > 0 && isPreviewableFile(currentFiles[0]) && (
                <button
                  type="button"
                  onClick={() => setActiveDrawerFile({ file: currentFiles[0], title: currentFiles[0].name })}
                  className="btn-secondary w-full sm:w-auto px-4 py-3 text-[13px] font-semibold flex items-center justify-center gap-1.5 shrink-0 hover:border-accent hover:text-accent transition-colors"
                  title="Preview uploaded file in right drawer"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span>Preview</span>
                </button>
              )}
              <button
                onClick={goToOperation}
                disabled={!hasFiles || (minFiles ? currentFiles.length < minFiles : false)}
                className="btn-primary w-full sm:flex-1 py-3 group flex items-center justify-center gap-2"
              >
                <span>Continue</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
            {(!hasFiles || (minFiles && currentFiles.length < minFiles)) && (
              <p className="text-center text-[11.5px] text-text-tertiary mt-2.5">
                {minFiles && minFiles > 1
                  ? `Add at least ${minFiles} files to continue (${currentFiles.length}/${minFiles} added)`
                  : "Add at least one file to continue"}
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div key="operation" className="flow-panel-enter">
            {/* Selected files summary */}
            <div className="flex items-center justify-between gap-2 sm:gap-3 mb-4 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-bg-elevated/60 border border-border-base">
              <span className="text-[11.5px] sm:text-[12px] font-semibold text-text-secondary truncate">
                {fileCount} file{fileCount !== 1 ? "s" : ""} ready
              </span>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {!multiple && currentFiles.length === 1 && isPreviewableFile(currentFiles[0]) && (
                  <button
                    type="button"
                    onClick={() => setActiveDrawerFile({ file: currentFiles[0], title: currentFiles[0].name })}
                    className="text-[11px] sm:text-[11.5px] font-bold text-accent hover:underline flex items-center gap-1.5"
                    title="Preview uploaded document/image in right drawer"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span>Preview</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={goUpload}
                  className="text-[11px] sm:text-[11.5px] font-semibold text-text-secondary hover:underline underline-offset-2 shrink-0"
                >
                  Change files
                </button>
              </div>
            </div>

            {renderOperation({ files: fileCount, backToUpload: goUpload })}

            {/* Run button */}
            <button
              onClick={runAndAdvance}
              disabled={!canRun || processing}
              className="btn-primary w-full mt-5 py-3"
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full border-2 animate-spin-slow"
                    style={{
                      borderColor: "color-mix(in srgb, currentColor 35%, transparent)",
                      borderTopColor: "currentColor",
                    }}
                  />
                  {processingLabel || `${actionLabel}...`}
                </span>
              ) : (
                <>
                  <span>{actionLabel}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}

        {step === 3 && (
          <div key="output" className="flow-panel-enter">
            <OutputPanel
              outputs={outputs}
              onReset={handleStartOverKeepFiles}
              onDownloadAll={onDownloadAll}
              onBack={goUpload}
              renderResult={renderResult}
            />
          </div>
        )}
      </div>

      {/* Slide-over Right Drawer Preview for uploaded file in Step 1 & 2 */}
      <PdfDrawerPreview
        open={activeDrawerFile !== null}
        onClose={() => setActiveDrawerFile(null)}
        fileOrBlob={activeDrawerFile?.file ?? null}
        title={activeDrawerFile?.title ?? "File Preview"}
      />
    </div>
  );
}

/* ─── Output panel (step 3) ─────────────────────────────────────── */

function OutputPanel({
  outputs,
  onReset,
  onDownloadAll,
  onBack,
  renderResult,
}: {
  outputs: StepOutput[];
  onReset: () => void;
  onDownloadAll?: () => void;
  onBack: () => void;
  renderResult?: () => React.ReactNode;
}) {
  const [previewOutput, setPreviewOutput] = useState<StepOutput | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showAllFiles, setShowAllFiles] = useState(false);
  const [zipping, setZipping] = useState(false);

  const currentOutput = outputs[activeIndex] || outputs[0];
  const totalBytes = outputs.reduce((sum, o) => sum + o.blob.size, 0);
  const formatSize = (bytes: number) =>
    bytes >= 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(2)} MB`
      : `${Math.max(1, Math.round(bytes / 1024))} KB`;

  const handleZipAll = useCallback(async () => {
    if (onDownloadAll) {
      onDownloadAll();
      return;
    }
    setZipping(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      outputs.forEach((o) => zip.file(o.name, o.blob));
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "fileswow-output.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      emitAppleToast("Downloaded ZIP", `${outputs.length} files`);
    } finally {
      setZipping(false);
    }
  }, [onDownloadAll, outputs]);

  const isPreviewableOutput = (name: string, blob: Blob) => {
    const n = name.toLowerCase();
    const t = blob.type.toLowerCase();
    return (
      n.endsWith(".pdf") ||
      t === "application/pdf" ||
      t.startsWith("image/") ||
      /\.(png|jpe?g|webp|svg|gif|bmp|ico|avif)$/i.test(n)
    );
  };

  return (
    <div className="space-y-4">
      {renderResult?.()}

      {/* Centered, balanced, rewarding Final Download Card */}
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
                {outputs.length === 1 ? outputs[0].name : `${outputs.length} processed files`}
              </span>
              <span className="text-text-tertiary">·</span>
              <span className="tabular-nums">{formatSize(totalBytes)}</span>
              <span className="text-text-tertiary hidden sm:inline">·</span>
              <span className="text-success font-medium hidden sm:inline">100% private</span>
            </div>
          </div>
        </div>

        {/* Centered Primary Action Row (Download + Preview side-by-side) */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {outputs.length === 1 ? (
            <DownloadButton
              blob={outputs[0].blob}
              filename={outputs[0].name}
              label={`Download ${outputs[0].name}`}
              className="btn-primary px-6 py-3 text-[13.5px] font-bold shadow-md"
              hidePreview
            />
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

          {isPreviewableOutput(currentOutput.name, currentOutput.blob) && (
            <button
              type="button"
              onClick={() => setPreviewOutput(currentOutput)}
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

        {/* Clean footer actions */}
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
            onClick={onBack}
            className="font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            ← Back to options
          </button>
          <button
            type="button"
            onClick={onReset}
            className="font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            Convert another file
          </button>
        </div>
      </div>

      {/* Individual file list — collapsed by default when > 1 output */}
      {outputs.length > 1 && showAllFiles && (
        <ul className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
          {outputs.map((o, idx) => (
            <li
              key={`${o.name}-${idx}`}
              className="flow-row flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 rounded-xl bg-bg-elevated/60 border border-border-base"
            >
              <span className="text-[11px] font-bold text-text-tertiary tabular-nums w-5 text-center shrink-0">
                {idx + 1}
              </span>
              <span className="flex-1 min-w-0 text-[12.5px] font-semibold text-text-primary truncate">
                {o.name}
              </span>
              <span className="text-[11px] text-text-tertiary tabular-nums shrink-0 hidden xs:inline">
                {formatSize(o.blob.size)}
              </span>
              {isPreviewableOutput(o.name, o.blob) && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveIndex(idx);
                    setPreviewOutput(o);
                  }}
                  className="btn-secondary px-2.5 py-1.5 text-[11px] font-semibold hover:border-accent hover:text-accent transition-colors shrink-0"
                >
                  Preview
                </button>
              )}
              <DownloadButton blob={o.blob} filename={o.name} label="Save" hidePreview />
            </li>
          ))}
        </ul>
      )}

      {/* Slide-over Right Drawer Preview — identical to Step 2 Operation */}
      <PdfDrawerPreview
        open={previewOutput !== null}
        onClose={() => setPreviewOutput(null)}
        fileOrBlob={previewOutput?.blob ?? null}
        title={previewOutput ? `Preview: ${previewOutput.name}` : "Document Preview"}
        filesList={outputs}
        currentIndex={activeIndex}
        onSelectIndex={(idx) => {
          setActiveIndex(idx);
          setPreviewOutput(outputs[idx]);
        }}
      />
    </div>
  );
}
