import type { Metadata } from "next";
import { PDF_TOOLS, SUB_CATEGORY_LABELS, PDF_SUB_CATEGORIES } from "@/lib/catalog";
import { CategoryHubClient } from "./category-hub-client";

export const metadata: Metadata = {
  title: "PDF Tools — Merge, Split, Convert, Edit & More | FilesWow.com",
  description:
    "60+ free PDF tools. Merge, split, compress, convert, rotate, watermark, protect, and edit PDFs — all in your browser. No upload required. 100% private.",
};

export default function PDFToolsPage() {
  return (
    <CategoryHubClient
      tools={PDF_TOOLS}
      title="PDF Tools"
      subtitle="Everything you need to work with PDF files — processed entirely in your browser."
      categories={PDF_SUB_CATEGORIES}
      categoryLabels={SUB_CATEGORY_LABELS}
    />
  );
}
