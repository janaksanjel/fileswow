"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileUploader } from "./file-uploader";
import { DownloadButton } from "./download-button";

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
}

export interface StepFlowProps {
  /** Comma-separated accept string for the file input */
  accept: string;
  multiple?: boolean;
  maxFiles?: number;
  hint?: string;
  /** Renders the operation UI for step 2 (options + action button) */
  renderOperation: (ctx: StepFlowOperationContext) => React.ReactNode;
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

/* ─── Step indicator ────────────────────────────────────────────── */

const STEPS: Array<{ num: Step; label: string }> = [
  { num: 1, label: "Upload" },
  { num: 2, label: "Operation" },
  { num: 3, label: "Output" },
];

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 mb-5 select-none" aria-label={`Step ${current} of 3`}>
      {STEPS.map((s, i) => {
        const state =
          s.num < current ? "done" : s.num === current ? "active" : "todo";
        return (
          <div key={s.num} className="flex items-center gap-2 sm:gap-3 flex-1 last:flex-none">
            <div
              className={`flex items-center gap-2 shrink-0 transition-colors duration-200 ${
                state === "todo" ? "opacity-45" : ""
              }`}
            >
              <span
                className={`flow-step-num w-6 h-6 rounded-full flex items-center justify-center text-[10.5px] font-black transition-colors duration-200 ${
                  state === "done"
                    ? "bg-success text-white"
                    : state === "active"
                    ? "bg-accent text-text-on-accent"
                    : "bg-bg-elevated text-text-tertiary ring-1 ring-inset ring-border-strong"
                }`}
                key={`${s.num}-${state}`}
              >
                {state === "done" ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  String(s.num).padStart(2, "0")
                )}
              </span>
              <span
                className={`text-[11.5px] font-bold tracking-wide hidden sm:inline ${
                  state === "active" ? "text-accent" : "text-text-secondary"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flow-connector" aria-hidden="true">
                <div
                  className={`flow-connector-fill ${
                    s.num < current ? "flow-connector-fill-active" : "flow-connector-fill-idle"
                  }`}
                />
              </div>
            )}
          </div>
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
  error,
  onDismissError,
}: StepFlowProps) {
  const [step, setStep] = useState<Step>(1);
  const panelRef = useRef<HTMLDivElement>(null);

  /* All step transitions happen inside event handlers or rAF-deferred
     effects — never synchronously during render — so no cascades.
     If the parent clears files, onFilesChanged([]) fires and we snap
     back to Upload inside that handler (see handleFilesChanged). */
  const handleFilesChanged = useCallback(
    (files: File[]) => {
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
    const raf = requestAnimationFrame(() => setStep((s) => (s === 2 ? 3 : s)));
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
      {/* Back + step indicator */}
      <div className="mb-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <button
            onClick={() => (step > 1 ? setStep((s) => (s - 1) as Step) : onReset())}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-text-tertiary hover:text-text-primary transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </button>
          {step === 1 && hasFiles && (
            <button
              onClick={onReset}
              className="text-[12px] font-semibold text-text-tertiary hover:text-danger transition-colors"
            >
              Start over
            </button>
          )}
        </div>
        <StepIndicator current={step} />
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
              accept={accept}
              multiple={multiple}
              maxFiles={maxFiles}
              hint={hint}
              onFilesChanged={handleFilesChanged}
              onInvalidated={onInvalidated}
            />
            {/* Continue */}
            <button
              onClick={goToOperation}
              disabled={!hasFiles}
              className="btn-primary w-full mt-5 py-3 group"
            >
              <span>Continue</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
            {!hasFiles && (
              <p className="text-center text-[11.5px] text-text-tertiary mt-2.5">
                Add at least one file to continue
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div key="operation" className="flow-panel-enter">
            {/* Selected files summary */}
            <div className="flex items-center justify-between gap-3 mb-4 px-3.5 py-2.5 rounded-xl bg-bg-elevated/60 border border-border-base">
              <span className="text-[12px] font-semibold text-text-secondary truncate">
                {fileCount} file{fileCount !== 1 ? "s" : ""} ready
              </span>
              <button
                onClick={goUpload}
                className="text-[11.5px] font-semibold text-accent hover:underline underline-offset-2 shrink-0"
              >
                Change files
              </button>
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
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin-slow" />
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
              onReset={onReset}
              onDownloadAll={onDownloadAll}
              onBack={goUpload}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Output panel (step 3) ─────────────────────────────────────── */

function OutputPanel({
  outputs,
  onReset,
  onDownloadAll,
  onBack,
}: {
  outputs: StepOutput[];
  onReset: () => void;
  onDownloadAll?: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      {/* Success banner */}
      <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-success/[0.05] border border-success/20 mb-4">
        <span className="flow-check w-7 h-7 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="text-[13.5px] font-bold text-text-primary leading-tight">Done!</p>
          <p className="text-[11.5px] text-text-secondary leading-tight mt-0.5">
            {outputs.length === 1
              ? `${outputs[0].name} · ${(outputs[0].blob.size / 1024).toFixed(0)} KB`
              : `${outputs.length} files ready`}
          </p>
        </div>
      </div>

      {/* Download list */}
      <ul className="space-y-1.5">
        {outputs.map((o) => (
          <li
            key={o.name}
            className="flow-row flex items-center gap-3 px-3 py-2.5 rounded-xl bg-bg-elevated/60 border border-border-base"
          >
            <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-success/10 text-success">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </span>
            <span className="flex-1 min-w-0 text-[13px] font-semibold text-text-primary truncate">
              {o.name}
            </span>
            <span className="text-[11px] text-text-tertiary tabular-nums shrink-0">
              {(o.blob.size / 1024).toFixed(0)} KB
            </span>
            <DownloadButton blob={o.blob} filename={o.name} label="Save" />
          </li>
        ))}
      </ul>

      {outputs.length > 1 && onDownloadAll && (
        <button onClick={onDownloadAll} className="btn-secondary w-full mt-3 py-2.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M8 4v16" />
          </svg>
          Download all as ZIP
        </button>
      )}

      {/* Next actions */}
      <div className="flex items-center gap-2 mt-5">
        <button onClick={onBack} className="btn-secondary flex-1 py-2.5">
          New files
        </button>
        <button onClick={onReset} className="btn-primary flex-1 py-2.5">
          Start over
        </button>
      </div>
    </div>
  );
}
