"use client";

import ReorderPdfPagesTool from "./reorder-pdf-pages";

export default function OrganizePdfTool(props: React.ComponentProps<typeof ReorderPdfPagesTool>) {
  return (
    <div>
      <p className="text-xs text-text-tertiary mb-4">Reorder, extract, and manage your PDF pages in one place.</p>
      <ReorderPdfPagesTool {...props} />
    </div>
  );
}
