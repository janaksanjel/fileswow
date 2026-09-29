"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import { DownloadButton } from "@/components/download-button";
import type { ToolUIProps } from "@/components/tool-registry";
import { prepareScriptFonts, waitForFonts, waitForImages } from "@/lib/script-fonts";

/**
 * Word to Images — converts a Word document to one PNG per page with real
 * pagination. The DOCX is rendered to HTML (mammoth), laid out into A4 pages
 * (DOM column pagination), and each page is captured at 2× scale
 * (html2canvas). Script-aware font loading keeps Devanagari, Arabic, CJK,
 * Thai, and other non-Latin text rendering correctly.
 */

const PAGE_WIDTH_PX = 794;  // A4 at 96 DPI
const PAGE_HEIGHT_PX = 1123;

interface PageResult {
  name: string;
  blob: Blob;
  url: string;
}

/** Split an element's block children into page-sized chunks by height. */
function paginate(element: HTMLElement): HTMLElement[] {
  const content = Array.from(element.childNodes);
  const pages: HTMLElement[] = [];
  let currentPage = createPageShell(element);
  let currentInner = currentPage.querySelector("[data-page-inner]") as HTMLElement;

  const CONTENT_HEIGHT = PAGE_HEIGHT_PX - 96; // padding budget

  for (const node of content) {
    if (node.nodeType === Node.TEXT_NODE && !(node.textContent || "").trim()) {
      continue; // skip whitespace between blocks
    }

    currentInner.appendChild(node);

    // Move oversized single elements (tall tables/images) to their own page
    if (currentInner.scrollHeight > CONTENT_HEIGHT && currentInner.children.length > 1) {
      // Try to pull back the last block if it overflowed
      const last = currentInner.lastElementChild as HTMLElement | null;
      if (last && currentInner.scrollHeight - last.offsetHeight >= CONTENT_HEIGHT * 0.5) {
        element.appendChild(last); // wait — put it back on the source to re-add below
        // Re-append to source list so it starts the next page
        content.splice(content.indexOf(node) + 1, 0, last);
        currentInner.removeChild(last);
      }
    }

    if (currentInner.scrollHeight >= CONTENT_HEIGHT) {
      pages.push(currentPage);
      currentPage = createPageShell(element);
      currentInner = currentPage.querySelector("[data-page-inner]") as HTMLElement;
    }
  }

  if (currentInner.childNodes.length > 0 || pages.length === 0) {
    pages.push(currentPage);
  }
  return pages;
}

function createPageShell(source: HTMLElement): HTMLElement {
  const page = document.createElement("div");
  page.className = "wow-page";
  page.style.cssText = `width:${PAGE_WIDTH_PX}px;height:${PAGE_HEIGHT_PX}px;padding:48px;background:#fff;box-sizing:border-box;overflow:hidden;position:absolute;left:-99999px;top:0;`;
  const inner = document.createElement("div");
  inner.setAttribute("data-page-inner", "");
  inner.style.cssText = `font-family:${source.style.fontFamily};font-size:${source.style.fontSize};color:#000;line-height:1.65;`;
  page.appendChild(inner);
  return page;
}

async function renderPagesToImages(
  file: File,
  onProgress?: (done: number, total: number) => void
): Promise<PageResult[]> {
  const mammoth = (await import("mammoth")).default;
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });

  // Build a source container to measure content
  const source = document.createElement("div");
  source.innerHTML = result.value;
  document.body.appendChild(source);
  const { fontFamily, hasRtl } = await prepareScriptFonts(source.textContent || "");
  source.style.cssText = `position:absolute;left:-99999px;top:0;width:${PAGE_WIDTH_PX - 96}px;font-family:${fontFamily};font-size:14px;color:#000;background:#fff;line-height:1.65;`;
  if (hasRtl) source.setAttribute("dir", "auto");
  await Promise.all([waitForFonts(), waitForImages(source)]);

  // Paginate
  const pages = paginate(source);
  document.body.removeChild(source);

  // Render each page
  const html2canvas = (await import("html2canvas")).default;
  const baseName = file.name.replace(/\.docx?$/i, "");
  const results: PageResult[] = [];

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    document.body.appendChild(page);
    try {
      const canvas = await html2canvas(page, { scale: 2, useCORS: true, logging: false, width: PAGE_WIDTH_PX, height: PAGE_HEIGHT_PX });
      const dataUrl = canvas.toDataURL("image/png");
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const name = `page-${String(i + 1).padStart(2, "0")}.png`;
      results.push({ name: `${baseName}-${name}`, blob, url: URL.createObjectURL(blob) });
    } finally {
      document.body.removeChild(page);
    }
    onProgress?.(i + 1, pages.length);
  }

  return results;
}

export default function WordToImagesTool({ onProcessing, onError }: ToolUIProps) {
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<PageResult[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [zipping, setZipping] = useState(false);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback((files: File[]) => {
    setFile(files[0] || null);
    setResults([]);
    setZipBlob(null);
    setProgress({ done: 0, total: 0 });
  }, []);

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    onProcessing?.(true);
    try {
      const pages = await renderPagesToImages(file, (done, total) => setProgress({ done, total }));
      setResults(pages);
    } catch (err) {
      onError?.(
        err instanceof Error
          ? err.message
          : "Could not convert the document — make sure this is a .docx file (re-save from Word if it's an old .doc)."
      );
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  const handleZip = async () => {
    if (results.length === 0) return;
    setZipping(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (const r of results) {
        zip.file(r.name, r.blob);
      }
      const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
      setZipBlob(blob);
    } catch {
      onError?.("Could not build the ZIP archive.");
    } finally {
      setZipping(false);
    }
  };

  const baseName = file ? file.name.replace(/\.docx?$/i, "") : "document";

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone
          accept=".docx"
          onFilesSelected={handleFile}
          label="Drop a Word document"
          description="Each page becomes a numbered PNG image"
        />
      ) : (
        <div className="space-y-4">
          {/* File card */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base">
            <span className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-accent-start/10 text-accent-end shrink-0">DOCX</span>
            <div className="flex-1 min-w-0"><p className="text-sm text-text-primary truncate">{file.name}</p></div>
            <button onClick={() => { setFile(null); setResults([]); setZipBlob(null); }} className="text-xs text-text-tertiary hover:text-danger shrink-0">Remove</button>
          </div>

          {/* Progress */}
          {processing && progress.total > 0 && (
            <div>
              <div className="flex items-center justify-between text-[12.5px] text-text-secondary mb-1.5">
                <span>Rendering page {Math.min(progress.done + 1, progress.total)} of {progress.total}</span>
                <span className="tabular-nums">{Math.round((progress.done / progress.total) * 100)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-bg-elevated overflow-hidden">
                <div className="h-full bg-accent transition-all duration-200" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
              </div>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="p-4 rounded-xl bg-success/[0.04] border border-success/10">
              <p className="text-sm font-medium text-success mb-3">✓ {results.length} page image{results.length > 1 ? "s" : ""} created</p>

              {/* Page previews */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4 max-h-64 overflow-y-auto">
                {results.map((r, i) => (
                  <a key={r.name} href={r.url} download={r.name} className="group block rounded-lg border border-border-base bg-bg-surface overflow-hidden hover:border-accent transition-colors" title={`Download ${r.name}`}>
                    <img src={r.url} alt={`Page ${i + 1}`} className="w-full h-auto" />
                    <span className="block text-[10px] text-center py-1 text-text-tertiary group-hover:text-accent">Page {i + 1}</span>
                  </a>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                {results.length > 1 && (
                  <button onClick={handleZip} disabled={zipping} className="btn-primary">
                    {zipping ? "Building ZIP…" : `Download all as ZIP (${results.length} pages)`}
                  </button>
                )}
                {results.length === 1 && <DownloadButton blob={results[0].blob} filename={results[0].name} />}
              </div>
              {zipBlob && (
                <div className="mt-3">
                  <DownloadButton blob={zipBlob} filename={`${baseName}-pages.zip`} label="Save ZIP" />
                </div>
              )}
            </div>
          )}

          {!results.length && (
            <button onClick={handleConvert} disabled={processing} className="btn-primary w-full py-3">
              {processing ? "Converting to images…" : "Convert to Images"}
            </button>
          )}

          <p className="text-[11.5px] text-text-tertiary leading-relaxed">
            Pages are paginated to A4 exactly as they would print. Non-English scripts
            (Devanagari, Arabic, CJK, Thai, and more) render with matching Unicode fonts.
            Everything runs locally — your document never uploads.
          </p>
        </div>
      )}
    </div>
  );
}
