"use client";

import { useState, useCallback, useRef } from "react";
import { StepFlow, type StepOutput } from "@/components/step-flow";
import type { ToolUIProps } from "@/components/tool-registry";
import { PdfDrawerPreview } from "@/components/pdf-drawer-preview";

interface FileWithMeta {
  file: File;
  pages: number;
  sizeFormatted: string;
}

export default function MergePdfTool({ onProcessing, onError }: ToolUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [fileMetas, setFileMetas] = useState<FileWithMeta[]>([]);
  const [outputs, setOutputs] = useState<StepOutput[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hidden input for adding more files directly from Step 2
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  // Drawer preview state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  // Asynchronously inspect page counts when files change
  const inspectFiles = useCallback(async (newFiles: File[]) => {
    try {
      const { loadPdf } = await import("@/lib/engines/pdf");
      const metas = await Promise.all(
        newFiles.map(async (file) => {
          const sizeKb = Math.round(file.size / 1024);
          const sizeFormatted = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;
          try {
            const doc = await loadPdf(file);
            return {
              file,
              pages: doc.getPageCount(),
              sizeFormatted,
            };
          } catch {
            return {
              file,
              pages: 0,
              sizeFormatted,
            };
          }
        })
      );
      setFileMetas(metas);
    } catch {
      setFileMetas(
        newFiles.map((f) => ({
          file: f,
          pages: 0,
          sizeFormatted: `${Math.round(f.size / 1024)} KB`,
        }))
      );
    }
  }, []);

  const handleFilesChanged = useCallback((next: File[]) => {
    setFiles(next);
    setOutputs([]);
    inspectFiles(next);
  }, [inspectFiles]);

  const handleAddMoreFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const additional = Array.from(e.target.files || []);
    if (additional.length === 0) return;
    const combined = [...files, ...additional];
    setFiles(combined);
    setOutputs([]);
    inspectFiles(combined);
    if (addMoreInputRef.current) addMoreInputRef.current.value = "";
  };

  const moveUp = (index: number) => {
    if (index <= 0) return;
    const nextFiles = [...files];
    const temp = nextFiles[index - 1];
    nextFiles[index - 1] = nextFiles[index];
    nextFiles[index] = temp;
    setFiles(nextFiles);

    const nextMetas = [...fileMetas];
    if (nextMetas.length === nextFiles.length) {
      const tempMeta = nextMetas[index - 1];
      nextMetas[index - 1] = nextMetas[index];
      nextMetas[index] = tempMeta;
      setFileMetas(nextMetas);
    }
  };

  const moveDown = (index: number) => {
    if (index >= files.length - 1) return;
    const nextFiles = [...files];
    const temp = nextFiles[index + 1];
    nextFiles[index + 1] = nextFiles[index];
    nextFiles[index] = temp;
    setFiles(nextFiles);

    const nextMetas = [...fileMetas];
    if (nextMetas.length === nextFiles.length) {
      const tempMeta = nextMetas[index + 1];
      nextMetas[index + 1] = nextMetas[index];
      nextMetas[index] = tempMeta;
      setFileMetas(nextMetas);
    }
  };

  const removeFile = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    setFileMetas(fileMetas.filter((_, i) => i !== index));
    if (previewIndex >= next.length) {
      setPreviewIndex(Math.max(0, next.length - 1));
    }
  };

  const openDrawerForIndex = (index: number) => {
    setPreviewIndex(index);
    setDrawerOpen(true);
  };

  const totalCombinedPages = fileMetas.reduce((sum, m) => sum + (m.pages || 0), 0);

  const handleRun = useCallback(async () => {
    if (files.length < 2) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const { mergePdfs, savePdf } = await import("@/lib/engines/pdf");
      const merged = await mergePdfs(files);
      const blob = await savePdf(merged);
      setOutputs([{ name: "merged.pdf", blob }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to merge PDFs";
      setError(msg);
      onError?.(msg);
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  }, [files, onProcessing, onError]);

  const handleDownloadAll = useCallback(async () => {
    if (outputs.length === 0) return;
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    for (const o of outputs) zip.file(o.name, o.blob);
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "merged.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }, [outputs]);

  const activeFile = files[previewIndex] || files[0] || null;
  const activeTitle = activeFile
    ? `${activeFile.name} (Document ${previewIndex + 1} of ${files.length})`
    : "PDF Preview";

  return (
    <>
      <input
        ref={addMoreInputRef}
        type="file"
        accept=".pdf"
        multiple
        onChange={handleAddMoreFiles}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      <StepFlow
        accept=".pdf"
        multiple
        minFiles={2}
        hint="PDF documents · Select 2 or more files"
        actionLabel={files.length >= 2 ? `Merge ${files.length} PDFs` : "Add 2+ PDFs to Merge"}
        processingLabel="Merging PDFs..."
        outputs={outputs}
        canRun={files.length >= 2}
        processing={processing}
        fileCount={files.length}
        onFilesChanged={handleFilesChanged}
        onResetFilesOnly={() => {
          setOutputs([]);
          setFileMetas([]);
        }}
        onRun={handleRun}
        onReset={() => {
          setFiles([]);
          setFileMetas([]);
          setOutputs([]);
          setError(null);
        }}
        onDownloadAll={handleDownloadAll}
        error={error}
        onDismissError={() => setError(null)}
        renderOperation={() => (
          <div className="space-y-4">
            {/* Top drawer preview callout banner — matches Split PDF */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-accent/[0.06] border border-accent/20">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </span>
                <div>
                  <p className="text-[13px] font-bold text-text-primary">
                    {files.length} PDF files ready to merge
                    {totalCombinedPages > 0 ? ` • ${totalCombinedPages} total pages` : ""}
                  </p>
                  <p className="text-[11.5px] text-text-secondary">
                    Inspect high-res documents and pages before merging
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openDrawerForIndex(0)}
                className="btn-primary py-2 px-4 text-[12.5px] shrink-0 flex items-center justify-center gap-1.5 shadow-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span>Preview in Right Drawer</span>
              </button>
            </div>

            {/* List Header with Add More PDFs button */}
            <div className="flex items-center justify-between px-1 text-[12px] font-semibold text-text-secondary">
              <div className="flex items-center gap-2">
                <span>Merge order (top to bottom):</span>
                <span className="text-[11px] font-mono text-text-tertiary">
                  {files.length} file{files.length !== 1 ? "s" : ""}
                </span>
              </div>
              <button
                type="button"
                onClick={() => addMoreInputRef.current?.click()}
                className="btn-secondary px-3 py-1.5 text-[12px] font-bold flex items-center gap-1.5 hover:border-accent hover:text-accent transition-colors shadow-xs"
                title="Add more PDF files to the merge list"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Add more PDFs</span>
              </button>
            </div>

            {/* Interactive File Cards */}
            <div className="space-y-2">
              {files.map((file, idx) => {
                const meta = fileMetas[idx];
                return (
                  <div
                    key={`${file.name}-${idx}`}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-bg-elevated/70 hover:bg-bg-elevated border border-border-base transition-colors group"
                  >
                    {/* Left: Index badge + PDF icon + Name & Meta */}
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-md bg-accent/15 text-accent text-[11px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>

                      {/* PDF icon */}
                      <span className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </svg>
                      </span>

                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-text-primary truncate">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-text-tertiary flex items-center gap-2">
                          <span>{meta?.sizeFormatted || `${Math.round(file.size / 1024)} KB`}</span>
                          {meta && meta.pages > 0 && (
                            <>
                              <span>•</span>
                              <span className="font-semibold text-text-secondary">
                                {meta.pages} page{meta.pages !== 1 ? "s" : ""}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Right: Actions (Move Up, Move Down, Preview, Remove) */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Move Up */}
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveUp(idx)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-bg-surface hover:bg-bg-hover disabled:opacity-25 border border-border-base text-text-secondary transition-colors"
                        title="Move up"
                        aria-label="Move up"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="18 15 12 9 6 15" />
                        </svg>
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        disabled={idx === files.length - 1}
                        onClick={() => moveDown(idx)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-bg-surface hover:bg-bg-hover disabled:opacity-25 border border-border-base text-text-secondary transition-colors"
                        title="Move down"
                        aria-label="Move down"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>

                      {/* Preview in Right Drawer */}
                      <button
                        type="button"
                        onClick={() => openDrawerForIndex(idx)}
                        className="px-2.5 py-1.5 rounded-lg bg-bg-surface hover:bg-accent hover:text-white border border-border-base hover:border-accent text-text-secondary text-[11.5px] font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                        title="Preview this document in right drawer"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        <span className="hidden sm:inline">Preview</span>
                      </button>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-bg-surface hover:bg-danger/10 hover:text-danger border border-border-base text-text-tertiary transition-colors"
                        title="Remove file"
                        aria-label="Remove file"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Notice */}
            <div className="flex items-center justify-between text-[11.5px] text-text-tertiary px-1 pt-1">
              <span>Files will be combined in the exact order shown above.</span>
              {files.length < 2 && (
                <span className="text-warning font-semibold">Add at least 2 files to merge.</span>
              )}
            </div>
          </div>
        )}
      />

      {/* Right Drawer Preview with multi-file flipping support */}
      <PdfDrawerPreview
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        fileOrBlob={activeFile}
        title={activeTitle}
        filesList={files}
        currentIndex={previewIndex}
        onSelectIndex={(idx) => setPreviewIndex(idx)}
      />
    </>
  );
}
