"use client";

import { useCallback, useRef, useState } from "react";

interface DropZoneProps {
  accept?: string;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  label?: string;
  description?: string;
  maxFiles?: number;
}

export function DropZone({
  accept = ".pdf",
  multiple = false,
  onFilesSelected,
  label = "Drop your file here",
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

      onFilesSelected(filtered);
    },
    [onFilesSelected, maxFiles]
  );

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

  const acceptLabel = accept
    .split(",")
    .map((s) => s.trim().replace(".", "").toUpperCase())
    .join(" / ");

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
        group relative flex flex-col items-center justify-center gap-4
        px-6 py-12 sm:py-16
        rounded-2xl bg-bg-surface
        border border-dashed cursor-pointer
        transition-all duration-200
        ${
          isDragging
            ? "dropzone-active border-solid"
            : "border-border-strong hover:border-accent/60 hover:bg-accent/[0.02]"
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

      {/* Upload icon */}
      <span
        className={`
          w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-200
          ${
            isDragging
              ? "bg-accent text-text-on-accent shadow-md"
              : "bg-accent-subtle text-accent group-hover:scale-105 transition-transform"
          }
        `}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </span>

      <div className="text-center">
        <p className="text-[15px] font-semibold text-text-primary mb-1">
          {isDragging ? "Drop it — you're all set!" : label}
        </p>
        <p className="text-[12.5px] text-text-tertiary">
          {description || (
            <>
              <span className="hidden sm:inline">Drag &amp; drop or </span>
              <span className="text-accent font-semibold underline decoration-accent/40 decoration-2 underline-offset-4 hover:decoration-accent transition-colors">
                browse
              </span>
              <span className="hidden sm:inline"> from your computer</span>
            </>
          )}
        </p>
      </div>

      {acceptLabel && (
        <p className="text-[10px] font-bold text-text-tertiary px-2.5 py-1 bg-bg-elevated rounded-full uppercase tracking-wider">
          {acceptLabel}
          {multiple ? " · MULTIPLE" : ""}
        </p>
      )}
    </div>
  );
}
