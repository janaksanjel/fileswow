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
      // Reset so same file can be selected again
      if (inputRef.current) inputRef.current.value = "";
    },
    [onFilesSelected, maxFiles]
  );

  const acceptLabel = accept
    .split(",")
    .map((s) => s.trim().replace(".", "").toUpperCase())
    .join(", ");

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
        rounded-xl border-2 border-dashed cursor-pointer
        transition-all duration-200
        ${
          isDragging
            ? "dropzone-active border-accent bg-accent-subtle"
            : "border-border-strong hover:border-border-accent hover:bg-bg-hover/50"
        }
      `}
    >
      {/* Hidden file input */}
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
      <div
        className={`
          w-12 h-12 rounded-xl flex items-center justify-center
          transition-colors duration-200
          ${isDragging ? "bg-accent text-white" : "bg-bg-elevated text-text-secondary"}
        `}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>

      {/* Text */}
      <div className="text-center">
        <p className="text-sm font-medium text-text-primary mb-1">
          {isDragging ? "Drop to upload" : label}
        </p>
        <p className="text-xs text-text-tertiary">
          {description || (
            <>
              <span className="hidden sm:inline">Drag and drop or </span>
              <span className="text-accent font-medium">browse files</span>
              <span className="hidden sm:inline"> from your computer</span>
              <span className="sm:hidden"> <span className="text-accent font-medium">Tap to browse</span></span>
            </>
          )}
        </p>
        {acceptLabel && (
          <p className="text-[10px] text-text-tertiary mt-2 uppercase tracking-wider">
            {acceptLabel}
            {multiple ? " (multiple)" : ""}
          </p>
        )}
      </div>
    </div>
  );
}
