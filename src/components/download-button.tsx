"use client";

import { useState, useCallback } from "react";

interface DownloadButtonProps {
  blob: Blob;
  filename: string;
  label?: string;
}

export function DownloadButton({ blob, filename, label }: DownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);

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

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="btn-primary"
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
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {label || "Download"}
    </button>
  );
}
