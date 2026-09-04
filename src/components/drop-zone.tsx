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
        relative flex flex-col items-center justify-center gap-3
        px-6 py-10 sm:py-14
        bg-bg-surface
        border-2 border-dashed border-border-strong cursor-pointer
        transition-shadow duration-150
        shadow-[4px_4px_0_var(--shadow-color)]
        hover:shadow-[5px_5px_0_var(--shadow-color)]
        ${
          isDragging
            ? "dropzone-active border-2 border-solid"
            : ""
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

      {/* Corner ticks for the “drop here” target */}
      <span aria-hidden="true" className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-accent" />
      <span aria-hidden="true" className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-accent" />
      <span aria-hidden="true" className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-accent" />
      <span aria-hidden="true" className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-accent" />

      <span
        className={`
          w-11 h-11 flex items-center justify-center border-2 transition-colors duration-150
          ${isDragging
            ? "bg-accent border-border-strong text-text-on-accent"
            : "bg-bg-elevated border-border-strong text-text-primary"}
        `}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </span>

      <div className="text-center">
        <p className="text-[14px] font-bold text-text-primary mb-0.5">
          {isDragging ? "Drop to start!" : label}
        </p>
        <p className="text-[12px] text-text-tertiary">
          {description || (
            <>
              <span className="hidden sm:inline">Drag &amp; drop or </span>
              <span className="text-text-primary font-extrabold uppercase text-[11px] tracking-wide underline decoration-accent decoration-[3px] underline-offset-4">browse</span>
              <span className="hidden sm:inline"> from your computer</span>
            </>
          )}
        </p>
      </div>

      {acceptLabel && (
        <p className="text-[10px] font-bold text-text-tertiary px-2 py-0.5 bg-bg-elevated border-2 border-border-strong uppercase tracking-wider">
          {acceptLabel}
          {multiple ? " · MULTIPLE" : ""}
        </p>
      )}
    </div>
  );
}
