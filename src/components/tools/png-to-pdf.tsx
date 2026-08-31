"use client";

import ImagesToPdfTool from "./images-to-pdf";

export default function PngToPdfTool(props: React.ComponentProps<typeof ImagesToPdfTool>) {
  return (
    <div>
      <p className="text-xs text-text-tertiary mb-4">Convert PNG images to a PDF document.</p>
      <ImagesToPdfTool {...props} />
    </div>
  );
}
