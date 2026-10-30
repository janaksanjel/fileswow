"use client";

import { useState } from "react";
import { PdfDrawerPreview } from "./pdf-drawer-preview";

interface FilePreviewButtonProps {
  file: File | Blob | null;
  filename?: string;
  className?: string;
  label?: string;
}

export function FilePreviewButton({
  file,
  filename,
  className,
  label = "Preview",
}: FilePreviewButtonProps) {
  const [open, setOpen] = useState(false);
  if (!file) return null;

  const displayName = filename || (file instanceof File ? file.name : "Preview");

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={
          className ||
          "px-2.5 py-1 rounded-md text-[11.5px] font-semibold text-accent hover:bg-accent/10 border border-accent/30 inline-flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
        }
        title="Preview in right drawer"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <span>{label}</span>
      </button>

      <PdfDrawerPreview
        open={open}
        onClose={() => setOpen(false)}
        fileOrBlob={file}
        title={displayName ? `Preview: ${displayName}` : "File Preview"}
      />
    </>
  );
}

