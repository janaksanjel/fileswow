"use client";

import ImagesToPdfTool from "./images-to-pdf";

// JPG to PDF is just images-to-pdf with a single file
export default function JpgToPdfTool(props: React.ComponentProps<typeof ImagesToPdfTool>) {
  return (
    <div>
      <p className="text-xs text-text-tertiary mb-4">Convert JPG images to a PDF document.</p>
      <ImagesToPdfTool {...props} />
    </div>
  );
}
