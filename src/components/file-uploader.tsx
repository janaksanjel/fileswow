"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ─── Public types ─────────────────────────────────────────────── */

export interface UploadedFile {
  id: string;
  file: File;
  status: "uploading" | "done" | "error";
  progress: number;
}

interface FileUploaderProps {
  /** Comma-separated accept string, e.g. ".pdf" or "image/*" */
  accept?: string;
  multiple?: boolean;
  /** Max files allowed (single-file tools pass 1) */
  maxFiles?: number;
  /** Short label shown under the title, e.g. "PDF files up to 100 MB" */
  hint?: string;
  /** Files are managed internally; notify parent on any change */
  onFilesChanged?: (files: File[]) => void;
  /** Called when the parent should clear its result (files changed) */
  onInvalidated?: () => void;
  /** Auto-start "uploading" simulation when files are added */
  simulateUpload?: boolean;
}

/* ─── Helpers ──────────────────────────────────────────────────── */

let uid = 0;
function nextId() {
  return `f${++uid}-${Date.now()}`;
}

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

/* Extension → tinted-chip palette (keeps category colors from the theme) */
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
  EPUB: "bg-warning/10 text-warning",
  RTF: "bg-text-tertiary/10 text-text-secondary",
  CSV: "bg-success/10 text-success",
};

/* ─── Component ────────────────────────────────────────────────── */

export function FileUploader({
  accept = ".pdf",
  multiple = false,
  maxFiles,
  hint,
  onFilesChanged,
  onInvalidated,
  simulateUpload = true,
}: FileUploaderProps) {
  const [items, setItems] = useState<UploadedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timers = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  /* Simulated per-file upload: thin progress bar 0→100 in ~0.7 s */
  const startSimulation = useCallback((id: string) => {
    const timer = setInterval(() => {
      setItems((prev) => {
        const next = prev.map((it) => {
          if (it.id !== id) return it;
          const p = Math.min(100, it.progress + 12 + Math.random() * 18);
          return p >= 100 ? { ...it, progress: 100, status: "done" as const } : { ...it, progress: p };
        });
        return next;
      });
    }, 90);
    timers.current.set(id, timer);
  }, []);

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((t) => clearInterval(t));
      map.clear();
    };
  }, []);

  /* Add files — append (never replace) */
  const addFiles = useCallback(
    (incoming: File[]) => {
      if (incoming.length === 0) return;

      setItems((prev) => {
        const capacity = maxFiles ? maxFiles - prev.length : Infinity;
        if (capacity <= 0) return prev;
        const accepted = incoming.slice(0, capacity);
        const fresh: UploadedFile[] = accepted.map((file) => ({
          id: nextId(),
          file,
          status: simulateUpload ? "uploading" : "done",
          progress: 0,
        }));
        if (simulateUpload) {
          // Kick off simulation outside the reducer
          setTimeout(() => fresh.forEach((f) => startSimulation(f.id)), 0);
        }
        const merged = [...prev, ...fresh];
        onFilesChanged?.(merged.map((m) => m.file));
        return merged;
      });
      onInvalidated?.();
    },
    [maxFiles, onFilesChanged, onInvalidated, simulateUpload, startSimulation]
  );

  /* Remove a single file with exit animation */
  const [removing, setRemoving] = useState<Set<string>>(new Set());
  const removeFile = useCallback(
    (id: string) => {
      setRemoving((prev) => new Set(prev).add(id));
      setTimeout(() => {
        setItems((prev) => {
          const merged = prev.filter((it) => it.id !== id);
          onFilesChanged?.(merged.map((m) => m.file));
          return merged;
        });
        setRemoving((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 190);
      const t = timers.current.get(id);
      if (t) {
        clearInterval(t);
        timers.current.delete(id);
      }
    },
    [onFilesChanged]
  );

  const clearAll = useCallback(() => {
    timers.current.forEach((t) => clearInterval(t));
    timers.current.clear();
    setItems([]);
    onFilesChanged?.([]);
    onInvalidated?.();
  }, [onFilesChanged, onInvalidated]);

  /* Drag & drop */
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
      const files = Array.from(e.dataTransfer.files);
      addFiles(files);
    },
    [addFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      addFiles(Array.from(e.target.files || []));
      if (inputRef.current) inputRef.current.value = "";
    },
    [addFiles]
  );

  const hasFiles = items.length > 0;
  const allDone = items.every((it) => it.status === "done");
  const acceptLabel = accept
    .split(",")
    .map((s) => s.trim().replace(".", "").replace("/*", "").replace("*", "ANY"))
    .filter(Boolean)
    .join(" / ")
    .toUpperCase();

  /* Hidden shared <input> used by both the big zone and "Add more" */
  const hiddenInput = (
    <input
      ref={inputRef}
      type="file"
      accept={accept}
      multiple={multiple}
      onChange={handleInputChange}
      className="sr-only"
      tabIndex={-1}
      aria-hidden="true"
    />
  );

  return (
    <div>
      {hiddenInput}

      {/* ── Upload area ─────────────────────────────────────── */}
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
        {/* Icon */}
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

        {/* Text */}
        <div className="text-center">
          <p className="text-[14.5px] font-bold text-text-primary">
            {dragging ? "Drop your files here" : "Add your files"}
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

        {!dragging && (acceptLabel || hint) && (
          <p className="text-[10px] font-bold text-text-tertiary px-2.5 py-1 bg-bg-elevated rounded-full uppercase tracking-wider">
            {acceptLabel || hint}
          </p>
        )}
      </div>

      {/* ── File list ───────────────────────────────────────── */}
      {hasFiles && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-text-tertiary">
              {items.length} file{items.length !== 1 ? "s" : ""}
              {allDone ? " · ready" : ""}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearAll();
              }}
              className="text-[11px] font-semibold text-text-tertiary hover:text-danger transition-colors"
            >
              Clear all
            </button>
          </div>

          <ul className="space-y-1.5">
            {items.map((item, i) => {
              const ext = extLabel(item.file.name);
              const isRemoving = removing.has(item.id);
              const isUploading = item.status === "uploading";
              return (
                <li
                  key={item.id}
                  className={`flow-row flex items-center gap-3 px-3 py-2.5 rounded-xl bg-bg-elevated/60 border border-border-base
                    ${isRemoving ? "flow-row-removing" : ""}`}
                  style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
                >
                  {/* Thumbnail: image preview when possible, tinted chip otherwise */}
                  {item.file.type.startsWith("image/") ? (
                    /* eslint-disable-next-line @next/next/no-img-element -- local object URLs, not optimized assets */
                    <img
                      src={URL.createObjectURL(item.file)}
                      alt=""
                      className="w-8 h-8 rounded-lg object-cover border border-border-base shrink-0"
                      onLoad={(e) => {
                        // Revoke after decode to free memory
                        setTimeout(() => URL.revokeObjectURL((e.target as HTMLImageElement).src), 100);
                      }}
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

                  {/* Name + size / progress */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-text-primary truncate leading-tight">
                      {item.file.name}
                    </p>
                    {isUploading ? (
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flow-progress h-[3px] rounded-full flex-1 max-w-[160px]" />
                        <span className="text-[10.5px] font-bold text-accent tabular-nums">
                          {Math.round(item.progress)}%
                        </span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-text-tertiary mt-0.5 leading-tight">
                        {formatSize(item.file.size)}
                        {item.status === "error" && <span className="text-danger font-semibold"> · failed</span>}
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  {item.status === "done" && !isRemoving && (
                    <span className="flow-check w-5 h-5 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0" title="Uploaded">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    )}
                  {isUploading && (
                    <span className="w-4 h-4 rounded-full border-2 border-border-strong border-t-accent animate-spin-slow shrink-0" />
                  )}

                  {/* Remove */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(item.id);
                    }}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-text-tertiary hover:text-danger hover:bg-danger/10 transition-colors shrink-0"
                    aria-label={`Remove ${item.file.name}`}
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

          {/* Add more files — appends via the same hidden input */}
          {(!maxFiles || items.length < maxFiles) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
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
    </div>
  );
}
