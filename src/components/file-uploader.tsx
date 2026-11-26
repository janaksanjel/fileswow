"use client";

import { PdfDrawerPreview } from "./pdf-drawer-preview";

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
  /** Pre-populated files when returning to Step 1 (avoids re-uploading) */
  initialFiles?: File[];
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


function isPreviewableFile(file: File) {
  const type = file.type?.toLowerCase() || "";
  const name = file.name.toLowerCase();
  return (
    type === "application/pdf" ||
    name.endsWith(".pdf") ||
    type.startsWith("image/") ||
    /\.(png|jpe?g|webp|svg|gif|bmp|ico|avif)$/i.test(name)
  );
}

/* ─── Component ────────────────────────────────────────────────── */

export function FileUploader({
  accept = ".pdf",
  multiple = false,
  maxFiles,
  hint,
  onFilesChanged,
  onInvalidated,
  simulateUpload = true,
  initialFiles,
}: FileUploaderProps) {
  const [items, setItems] = useState<UploadedFile[]>(() =>
    (initialFiles || []).map((file) => ({
      id: nextId(),
      file,
      status: "done" as const,
      progress: 100,
    }))
  );
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const itemsRef = useRef<UploadedFile[]>(items);
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

  // Mirror state into the ref after render (never during render) so event
  // handlers always read the latest list.
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  /* Add files — append (never replace) */
  const addFiles = useCallback(
    (incoming: File[]) => {
      if (incoming.length === 0) return;

      const prev = itemsRef.current;
      const capacity = maxFiles ? maxFiles - prev.length : Infinity;
      if (capacity <= 0) return;
      const accepted = incoming.slice(0, capacity);
      const fresh: UploadedFile[] = accepted.map((file) => ({
        id: nextId(),
        file,
        status: simulateUpload ? "uploading" : "done",
        progress: 0,
      }));
      if (simulateUpload) {
        setTimeout(() => fresh.forEach((f) => startSimulation(f.id)), 0);
      }
      const merged = [...prev, ...fresh];
      itemsRef.current = merged;
      setItems(merged);

      // Notify parent safely outside state updater to avoid setState-in-render errors
      queueMicrotask(() => {
        onFilesChanged?.(merged.map((m) => m.file));
        onInvalidated?.();
      });
    },
    [maxFiles, onFilesChanged, onInvalidated, simulateUpload, startSimulation]
  );

  /* Remove a single file with exit animation */
  const [removing, setRemoving] = useState<Set<string>>(new Set());
  const removeFile = useCallback(
    (id: string) => {
      setRemoving((prev) => new Set(prev).add(id));
      setTimeout(() => {
        const merged = itemsRef.current.filter((it) => it.id !== id);
        itemsRef.current = merged;
        setItems(merged);
        queueMicrotask(() => {
          onFilesChanged?.(merged.map((m) => m.file));
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
    itemsRef.current = [];
    setItems([]);
    queueMicrotask(() => {
      onFilesChanged?.([]);
      onInvalidated?.();
    });
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

  /* Enhanced paste support (files, screenshots, images, text) */
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
          addFiles(newFiles);
          return;
        }
      }

      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = (await navigator.clipboard.readText()).trim();
        if (text) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
          addFiles([new File([new Blob([text], { type: "text/plain" })], `pasted-text-${timestamp}.txt`, { type: "text/plain" })]);
        }
      }
    } catch {
      /* clipboard read permission denied */
    }
  }, [addFiles]);

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

      if (newFiles.length === 0) {
        const text = e.clipboardData?.getData("text/plain")?.trim();
        if (text && (accept.includes("text") || accept.includes(".txt"))) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
          newFiles.push(new File([new Blob([text], { type: "text/plain" })], `pasted-text-${timestamp}.txt`, { type: "text/plain" }));
        }
      }

      if (newFiles.length === 0) return;
      e.preventDefault();
      addFiles(newFiles);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [addFiles, accept]);

  const hasFiles = items.length > 0;
  const allDone = items.every((it) => it.status === "done");
  const isAnyFile = accept === "*/*" || accept === "*";
  const acceptLabel = isAnyFile
    ? "ANY"
    : accept
        .split(",")
        .map((s) => s.trim().replace(".", "").replace("/*", "").replace("*", "ANY"))
        .filter(Boolean)
        .join(" / ")
        .toUpperCase();

  /* Contextual label for the solid select button (iLovePDF-style CTA) */
  const extList = accept.split(",").map((s) => s.trim()).filter((s) => s.startsWith("."));
  const selectLabel = isAnyFile
    ? multiple
      ? "Select files"
      : "Select a file"
    : accept.includes("image/")
      ? multiple
        ? "Select images"
        : "Select an image"
      : extList.length === 1
        ? `Select ${extList[0].slice(1).toUpperCase()} file${multiple ? "s" : ""}`
        : `Select file${multiple ? "s" : ""}`;

  /* Hidden shared <input> used by both the big zone and "Add more" */
  const hiddenInput = (
    <input
      ref={inputRef}
      type="file"
      accept={isAnyFile ? undefined : accept}
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
        className={`flow-dropzone group w-full flex flex-col items-center justify-center text-center rounded-2xl border-[1.5px] border-dashed cursor-pointer select-none px-4 sm:px-8 transition-all duration-200 ${
          dragging
            ? "flow-dropzone-dragging border-accent py-12 sm:py-16"
            : "border-border-strong py-9 sm:py-12 hover:border-accent/60 hover:bg-accent/[0.02]"
        }`}
      >
        <span
          className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all duration-200 ${
            dragging
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
          {dragging ? "Drop files to add" : selectLabel}
        </p>

        <p className="text-[13.5px] text-text-secondary max-w-md mb-5">
          {dragging ? (
            "Release to load files on your device"
          ) : (
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
            {dragging ? "Release to drop" : selectLabel}
          </span>
          {!dragging && (
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

        {!dragging && (
          <p className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[12px] text-text-tertiary">
            {(acceptLabel || hint) && (
              <>
                <span className="font-medium text-text-secondary">{hint || acceptLabel}</span>
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

      {/* ── Grouped file list ───────────────────────────────── */}
      {hasFiles && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-[12px] font-medium text-text-secondary">
              {items.length} file{items.length !== 1 ? "s" : ""}
              {allDone ? " · Ready" : ""}
            </p>
            <div className="flex items-center gap-3">
              {(!maxFiles || items.length < maxFiles) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    inputRef.current?.click();
                  }}
                  className="text-[12.5px] font-medium text-accent hover:underline underline-offset-2 cursor-pointer"
                >
                  + Add more
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearAll();
                }}
                className="text-[12.5px] font-medium text-text-tertiary hover:text-danger transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          <ul className="rounded-2xl border border-border-base bg-bg-surface divide-y divide-border-base overflow-hidden">
            {items.map((item, i) => {
              const ext = extLabel(item.file.name);
              const isRemoving = removing.has(item.id);
              const isUploading = item.status === "uploading";
              return (
                <li
                  key={item.id}
                  className={`flow-row flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-bg-elevated/50 ${
                    isRemoving ? "flow-row-removing" : ""
                  }`}
                  style={{ animationDelay: `${Math.min(i, 8) * 25}ms` }}
                >
                  {item.file.type.startsWith("image/") ? (
                    /* eslint-disable-next-line @next/next/no-img-element -- local object URLs, not optimized assets */
                    <img
                      src={URL.createObjectURL(item.file)}
                      alt=""
                      className="w-9 h-9 rounded-lg object-cover border border-border-base shrink-0"
                      onLoad={(e) => {
                        setTimeout(() => URL.revokeObjectURL((e.target as HTMLImageElement).src), 100);
                      }}
                    />
                  ) : (
                    <span
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-semibold tracking-wide shrink-0 ${
                        EXT_STYLES[ext] || "bg-bg-elevated text-text-secondary"
                      }`}
                    >
                      {ext}
                    </span>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-medium text-text-primary truncate leading-tight">
                      {item.file.name}
                    </p>
                    {isUploading ? (
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flow-progress h-[3px] rounded-full flex-1 max-w-[160px]" />
                        <span className="text-[11px] font-medium text-accent tabular-nums">
                          {Math.round(item.progress)}%
                        </span>
                      </div>
                    ) : (
                      <p className="text-[11.5px] text-text-tertiary mt-0.5 leading-tight">
                        {formatSize(item.file.size)}
                        {item.status === "error" && <span className="text-danger font-medium"> · Failed</span>}
                      </p>
                    )}
                  </div>

                  {item.status === "done" && !isRemoving && (
                    <span className="flow-check w-5 h-5 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0" title="Ready">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  )}
                  {isUploading && (
                    <span className="w-4 h-4 rounded-full border-2 border-border-strong border-t-accent animate-spin-slow shrink-0" />
                  )}

                  {isPreviewableFile(item.file) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewFile(item.file);
                      }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-text-tertiary hover:text-accent hover:bg-bg-elevated transition-colors shrink-0 cursor-pointer"
                      title={`Preview ${item.file.name}`}
                      aria-label={`Preview ${item.file.name}`}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(item.id);
                    }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-text-tertiary hover:text-danger hover:bg-bg-elevated transition-colors shrink-0 cursor-pointer"
                    aria-label={`Remove ${item.file.name}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {/* Right Drawer Preview for uploaded file */}
      <PdfDrawerPreview
        open={previewFile !== null}
        onClose={() => setPreviewFile(null)}
        fileOrBlob={previewFile}
        title={previewFile?.name ?? "Preview"}
      />
    </div>
  );
}
