"use client";

import { useState, useCallback } from "react";
import { PdfDrawerPreview } from "./pdf-drawer-preview";

interface DownloadButtonProps {
  blob: Blob;
  filename: string;
  label?: string;
  className?: string;
  hidePreview?: boolean;
}

export function DownloadButton({
  blob,
  filename,
  label,
  className = "btn-primary",
  hidePreview = false,
}: DownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleDownload = useCallback(() => {
    setDownloading(true);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setTimeout(() => setDownloading(false), 500);
  }, [blob, filename]);

  const isPreviewable =
    !hidePreview &&
    blob &&
    (blob.type === "application/pdf" ||
      filename.toLowerCase().endsWith(".pdf") ||
      blob.type.startsWith("image/") ||
      /\.(png|jpe?g|webp|svg|gif|bmp|ico|avif)$/i.test(filename));

  return (
    <>
      <div className="inline-flex items-center gap-2 flex-wrap">
        {isPreviewable && (
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="btn-secondary px-3.5 py-2.5 text-[12.5px] font-semibold inline-flex items-center gap-1.5 hover:border-accent hover:text-accent transition-colors shrink-0 shadow-sm"
            title="Preview in right drawer before downloading"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>Preview</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className={className}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {label || "Download"}
        </button>
      </div>

      {/* Slide-over Right Drawer Preview */}
      <PdfDrawerPreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        fileOrBlob={blob}
        title={filename ? `Preview: ${filename}` : "Result Preview"}
      />
    </>
  );
}
