"use client";

import { useCallback, useRef, useState } from "react";

/* ─── Public types (consumed by workflow-workspace) ────────────── */

export interface UploadedFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
}

interface FileUploadProps {
  category: string;
  files: UploadedFileItem[];
  textInput: string;
  onFilesSelected: (files: File[]) => void;
  onRemoveFile: (id: string) => void;
  onClearFiles: () => void;
  onTextChange: (text: string) => void;
  acceptedExtensions: string[];
  maxFileSizeMB: number;
  supportsMultipleFiles?: boolean;
  allowTextInput?: boolean;
}

/* ─── Helpers ──────────────────────────────────────────────────── */

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extLabel(name: string): string {
  const ext = name.split(".").pop();
  if (!ext) return "FILE";
  return ext.slice(0, 4).toUpperCase();
}

/* Extension → tinted-chip palette (same convention as file-uploader) */
const EXT_STYLES: Record<string, string> = {
  PDF: "bg-danger/10 text-danger",
  DOC: "bg-accent-start/10 text-accent-end",
  DOCX: "bg-accent-start/10 text-accent-end",
  XLS: "bg-success/10 text-success",
  XLSX: "bg-success/10 text-success",
  PPT: "bg-warning/10 text-warning",
  PPTX: "bg-warning/10 text-warning",
  JPG: "bg-accent-blue/10 text-accent-blue",
  JPEG: "bg-accent-blue/10 text-accent-blue",
  PNG: "bg-accent-blue/10 text-accent-blue",
  WEBP: "bg-accent-blue/10 text-accent-blue",
  SVG: "bg-accent-blue/10 text-accent-blue",
  GIF: "bg-accent-blue/10 text-accent-blue",
  TXT: "bg-text-tertiary/10 text-text-secondary",
  MD: "bg-text-tertiary/10 text-text-secondary",
  CSV: "bg-success/10 text-success",
  JSON: "bg-text-tertiary/10 text-text-secondary",
  LOG: "bg-text-tertiary/10 text-text-secondary",
};

const CATEGORY_HINTS: Record<string, string> = {
  pdf: "PDF documents",
  word: "Word documents",
  image: "images",
  text: "text files",
};

/* ─── Component ────────────────────────────────────────────────── */

export function FileUpload({
  category,
  files,
  textInput,
  onFilesSelected,
  onRemoveFile,
  onClearFiles,
  onTextChange,
  acceptedExtensions,
  maxFileSizeMB,
  supportsMultipleFiles = false,
  allowTextInput = false,
}: FileUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const dragDepth = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = acceptedExtensions.join(",");

  const validateAndAdd = useCallback(
    (incoming: File[]) => {
      const valid: File[] = [];
      const problems: string[] = [];

      for (const file of incoming) {
        const ext = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
        const extOk = acceptedExtensions.length === 0 || acceptedExtensions.some((a) => a.toLowerCase() === ext);
        if (!extOk) {
          problems.push(`"${file.name}" is not a supported type for ${CATEGORY_HINTS[category] ?? "this tool"}`);
          continue;
        }
        if (file.size > maxFileSizeMB * 1024 * 1024) {
          problems.push(`"${file.name}" exceeds the ${maxFileSizeMB} MB limit`);
          continue;
        }
        valid.push(file);
      }

      if (!supportsMultipleFiles && valid.length > 1) {
        valid.length = 1;
        problems.push(`${category.toUpperCase()} workflow processes one file at a time — only the first file was added`);
      }

      setValidationError(problems.length > 0 ? problems[0] : null);
      if (valid.length > 0) onFilesSelected(valid);
    },
    [acceptedExtensions, category, maxFileSizeMB, onFilesSelected, supportsMultipleFiles]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current++;
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current--;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragDepth.current = 0;
      setDragging(false);
      validateAndAdd(Array.from(e.dataTransfer.files));
    },
    [validateAndAdd]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      validateAndAdd(Array.from(e.target.files || []));
      if (inputRef.current) inputRef.current.value = "";
    },
    [validateAndAdd]
  );

  const acceptLabel = acceptedExtensions
    .map((s) => s.replace(".", "").toUpperCase())
    .join(" / ");

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={supportsMultipleFiles}
        onChange={handleInputChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* ── Drop zone (shown when no files loaded) ─────────── */}
      {files.length === 0 && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Add files"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`flow-dropzone w-full flex flex-col items-center justify-center gap-3
            px-6 rounded-2xl border border-dashed cursor-pointer select-none
            transition-[padding,background-color,border-color] duration-200
            ${dragging ? "flow-dropzone-dragging border-transparent py-14" : "border-border-strong py-10 hover:border-accent/60 hover:bg-accent/[0.02]"}`}
        >
          <span
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200
              ${dragging ? "bg-accent text-text-on-accent scale-110 shadow-md" : "bg-accent-subtle text-accent"}`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={dragging ? "flow-upload-icon" : ""}
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </span>

          <div className="text-center">
            <p className="text-[14.5px] font-bold text-text-primary">
              {dragging ? "Drop your files here" : `Add your ${CATEGORY_HINTS[category] ?? "files"}`}
            </p>
            <p className="text-[12.5px] text-text-tertiary mt-1">
              {dragging ? (
                "Release to add them"
              ) : (
                <>
                  Drag &amp; drop files here or{" "}
                  <span className="text-accent font-semibold underline decoration-accent/40 decoration-2 underline-offset-4">
                    Choose files
                  </span>
                </>
              )}
            </p>
          </div>

          {!dragging && acceptLabel && (
            <p className="text-[10px] font-bold text-text-tertiary px-2.5 py-1 bg-bg-elevated rounded-full uppercase tracking-wider">
              {acceptLabel} · up to {maxFileSizeMB} MB
            </p>
          )}
        </div>
      )}

      {/* ── Validation error ────────────────────────────────── */}
      {validationError && (
        <p className="mt-2.5 text-xs font-semibold text-danger flex items-center gap-1.5" role="alert">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {validationError}
        </p>
      )}

      {/* ── File list ───────────────────────────────────────── */}
      {files.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-text-tertiary">
              {files.length} file{files.length !== 1 ? "s" : ""} added
            </p>
            <button
              type="button"
              onClick={onClearFiles}
              className="text-[11px] font-semibold text-text-tertiary hover:text-danger transition-colors"
            >
              Clear all
            </button>
          </div>

          <ul className="space-y-1.5">
            {files.map((item) => {
              const ext = extLabel(item.name);
              return (
                <li
                  key={item.id}
                  className="flow-row flex items-center gap-3 px-3 py-2.5 rounded-xl bg-bg-elevated/60 border border-border-base"
                >
                  {item.previewUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */
                    <img
                      src={item.previewUrl}
                      alt=""
                      className="w-9 h-9 rounded-lg object-cover border border-border-base shrink-0"
                    />
                  ) : (
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-[8.5px] font-black tracking-wide shrink-0 ${
                        EXT_STYLES[ext] || "bg-bg-surface text-text-tertiary ring-1 ring-inset ring-border-strong"
                      }`}
                    >
                      {ext}
                    </span>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-text-primary truncate leading-tight">{item.name}</p>
                    <p className="text-[11px] text-text-tertiary mt-0.5 leading-tight">{formatSize(item.size)}</p>
                  </div>

                  <span className="flow-check w-5 h-5 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0" title="Ready">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>

                  <button
                    type="button"
                    onClick={() => onRemoveFile(item.id)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-text-tertiary hover:text-danger hover:bg-danger/10 transition-colors shrink-0"
                    aria-label={`Remove ${item.name}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>

          {supportsMultipleFiles && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold text-accent bg-accent-subtle hover:bg-accent/15 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add more files
            </button>
          )}
        </div>
      )}

      {/* ── Optional text input (text category) ─────────────── */}
      {allowTextInput && (
        <div className="mt-4">
          <label htmlFor="workflow-text-input" className="block text-[11px] font-bold uppercase tracking-widest text-text-tertiary mb-1.5">
            …or paste text instead
          </label>
          <textarea
            id="workflow-text-input"
            value={textInput}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Paste or type your text here…"
            rows={6}
            className="w-full px-4 py-3 rounded-xl bg-bg-input border border-border-strong text-text-primary text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-colors resize-y"
          />
        </div>
      )}
    </div>
  );
}
