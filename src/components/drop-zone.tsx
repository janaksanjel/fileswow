"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
      <div className="flex flex-col items-center gap-3.5 px-6 pt-10 sm:pt-11 pb-7">
        {/* Document tile — a sheet with an up-arrow, not a generic blob */}
        <span
          className={`w-14 h-14 rounded-xl flex items-center justify-center ring-1 ring-inset transition-colors duration-150 ${
            isDragging
              ? "bg-accent text-text-on-accent ring-accent"
              : "bg-accent-subtle text-accent ring-transparent"
          }`}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <polyline points="14 3 14 8 19 8" />
            <line x1="12" y1="17.5" x2="12" y2="11.5" />
            <polyline points="9.3 14 12 11.3 14.7 14" />
          </svg>
        </span>

        <p className="text-base font-semibold text-text-primary text-center">
          {isDragging ? "Release to add your file" : label}
        </p>

        {/* Solid CTA & Paste button */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <span className="btn-primary px-6 py-2.5 text-[14px] pointer-events-none">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {selectLabel}
          </span>
          <button
            type="button"
            onClick={handlePasteFromClipboard}
            className="btn-secondary px-4 py-2.5 text-[13px] font-semibold flex items-center gap-1.5"
            title="Paste file or image from clipboard (Ctrl+V)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            </svg>
            Paste
          </button>
        </div>

        <p className="text-[13px] text-text-tertiary text-center">
          {description || (
            <span className="flex items-center justify-center gap-1.5">
              or drop files here — paste with <kbd className="kbd text-[11px] px-1.5 py-0.5">Ctrl+V</kbd>
            </span>
          )}
        </p>

        {formats.length > 0 && !isDragging && (
          <ul className="flex flex-wrap items-center justify-center gap-1.5" aria-label="Accepted file formats">
            {formats.slice(0, 8).map((f) => (
              <li
                key={f}
                className="font-mono text-[10.5px] font-semibold text-text-secondary bg-bg-elevated border border-border-base rounded-md px-2 py-0.5 uppercase tracking-[0.06em]"
              >
                {f}
              </li>
            ))}
            {multiple && (
              <li className="font-mono text-[10.5px] font-semibold text-text-tertiary px-1 uppercase tracking-[0.06em]">
                + multiple
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Trust strip — the one line every tool carries */}
      <p className="flex items-center justify-center gap-1.5 border-t border-dashed border-border-base px-6 py-3 text-[11.5px] text-text-tertiary">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-success" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
        Processed on your device — nothing is uploaded
      </p>
    </div>
  );
}
