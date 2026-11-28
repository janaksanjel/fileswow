"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToolStep } from "./tool-step-context";

interface DropZoneProps {
  accept?: string;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  label?: string;
  description?: string;
  maxFiles?: number;
}

/**
 * State 1 (empty) for every tool: a large dashed dropzone.
 * Click to browse, drop files, or paste from the clipboard (⌘V / Ctrl+V).
 * Drag-over = accent hairline + tint + a subtle scale (see .dropzone-active).
 * Below the fold of the zone, one quiet line makes the privacy promise:
 * processed on this device, never uploaded.
 */
export function DropZone({
  accept = ".pdf",
  multiple = false,
  onFilesSelected,
  label = "Drop files here or choose a file",
  description,
  maxFiles,
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const stepCtx = useToolStep();

  useEffect(() => {
    if (!stepCtx) return;
    stepCtx.reportDropZoneMounted();
    return () => {
      stepCtx.reportDropZoneUnmounted();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length === 0) return;

      const filtered = maxFiles
        ? droppedFiles.slice(0, maxFiles)
        : droppedFiles;
      onFilesSelected(multiple ? filtered : filtered.slice(0, 1));
    },
    [onFilesSelected, maxFiles, multiple]
  );

  /* Enhanced paste support (files, screenshots, images) */
  const handlePasteFromClipboard = useCallback(async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        const newFiles: File[] = [];
        for (const item of items) {
          for (const type of item.types) {
            if (type.startsWith("image/") || type.startsWith("application/pdf") || type.startsWith("text/")) {
              const blob = await item.getType(type);
              const ext = type.split("/")[1]?.replace("+xml", "") || "png";
              const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
              newFiles.push(new File([blob], `pasted-file-${timestamp}.${ext}`, { type, lastModified: Date.now() }));
            }
          }
        }
        if (newFiles.length > 0) {
          const accepted = multiple ? newFiles : newFiles.slice(0, 1);
          onFilesSelected(maxFiles ? accepted.slice(0, maxFiles) : accepted);
          return;
        }
      }
    } catch {
      /* clipboard read permission denied */
    }
  }, [onFilesSelected, maxFiles, multiple]);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      const files = Array.from(e.clipboardData?.files ?? []);
      const items = e.clipboardData?.items;
      const newFiles: File[] = [...files];

      if (items) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.kind === "file") {
            const file = item.getAsFile();
            if (file && !newFiles.some(f => f.name === file.name && f.size === file.size)) {
              newFiles.push(file);
            }
          }
        }
      }

      if (newFiles.length === 0) return;
      e.preventDefault();
      const accepted = multiple ? newFiles : newFiles.slice(0, 1);
      onFilesSelected(maxFiles ? accepted.slice(0, maxFiles) : accepted);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [onFilesSelected, maxFiles, multiple]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || []);
      if (selected.length > 0) {
        const filtered = maxFiles ? selected.slice(0, maxFiles) : selected;
        onFilesSelected(filtered);
      }
      if (inputRef.current) inputRef.current.value = "";
    },
    [onFilesSelected, maxFiles]
  );

  /* Accepted formats as individual mono chips — precise, not wordy */
  const formats = accept
    .split(",")
    .map((s) => s.trim().replace(".", "").replace("/*", "").replace("*", "ANY").toUpperCase())
    .filter(Boolean);

  /* Contextual label for the solid select button (iLovePDF-style CTA) */
  const extList = accept.split(",").map((s) => s.trim()).filter((s) => s.startsWith("."));
  const selectLabel = accept.includes("image/")
    ? multiple
      ? "Select images"
      : "Select an image"
    : extList.length === 1
      ? `Select ${extList[0].slice(1).toUpperCase()} file${multiple ? "s" : ""}`
      : `Select file${multiple ? "s" : ""}`;

  return (
    <div
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={label}
      className={`
        group relative w-full flex flex-col rounded-xl bg-bg-surface
        border border-dashed cursor-pointer select-none
        transition-[border-color,background-color,transform] duration-150 ease-out
        ${
          isDragging
            ? "dropzone-active border-solid"
            : "border-border-strong hover:border-accent/70 hover:bg-accent/[0.03]"
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Zone proper */}
      <div className={`flex flex-col items-center justify-center text-center px-4 sm:px-8 transition-all duration-200 ${isDragging ? "min-h-[clamp(150px,26dvh,240px)] py-6" : "min-h-[clamp(140px,24dvh,210px)] py-5"}`}>
        <span
          className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all duration-200 ${
            isDragging
              ? "bg-accent text-text-on-accent scale-105 shadow-[var(--elevation-md)]"
              : "bg-bg-surface border border-border-base text-accent shadow-[var(--elevation-sm)] group-hover:scale-105"
          }`}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </span>

        <p className="text-[16px] font-semibold text-text-primary tracking-[-0.01em] mb-1">
          {isDragging ? "Drop file to add" : selectLabel}
        </p>

        <p className="text-[13.5px] text-text-secondary max-w-md mb-5">
          {description || (
            <>
              <span className="hidden sm:inline">
                Drag and drop here, browse your device, or paste with <kbd>⌘V</kbd>
              </span>
              <span className="sm:hidden">
                Tap to choose files from your device
              </span>
            </>
          )}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 w-full sm:w-auto">
          <span className="btn-primary w-full sm:w-auto px-5 pointer-events-none">
            {isDragging ? "Release to drop" : selectLabel}
          </span>
          {!isDragging && (
            <button
              type="button"
              onClick={handlePasteFromClipboard}
              className="btn-ghost w-full sm:w-auto text-[13px]"
              title="Paste file or image from clipboard (Ctrl+V / ⌘V)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              </svg>
              <span>Paste</span>
            </button>
          )}
        </div>

        {!isDragging && (
          <p className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[12px] text-text-tertiary">
            {formats.length > 0 && (
              <>
                <span className="font-medium text-text-secondary">
                  {formats.slice(0, 6).join(", ")}
                  {multiple ? " · Multiple" : ""}
                </span>
                <span aria-hidden="true">·</span>
              </>
            )}
            <span className="inline-flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success shrink-0" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              Processed locally on your device
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
