import type { Metadata } from "next";
import { IMAGE_TOOLS, SUB_CATEGORY_LABELS, IMAGE_SUB_CATEGORIES } from "@/lib/catalog";
import { CategoryHubClient } from "../pdf-tools/category-hub-client";

export const metadata: Metadata = {
  title: "Image Tools — Convert, Resize, Crop, Filter & Edit | FilesWow.com",
  description:
    "60+ free image tools. Convert, resize, crop, filter, compress, watermark, and edit images — all in your browser. No upload required. 100% private.",
};

export default function ImageToolsPage() {
  return (
    <CategoryHubClient
      tools={IMAGE_TOOLS}
      title="Image Tools"
      subtitle="Convert, resize, filter, and edit images — processed entirely in your browser."
      categories={IMAGE_SUB_CATEGORIES}
      categoryLabels={SUB_CATEGORY_LABELS}
    />
  );
}
