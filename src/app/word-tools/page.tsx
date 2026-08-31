import type { Metadata } from "next";
import { WORD_TOOLS, SUB_CATEGORY_LABELS, WORD_SUB_CATEGORIES } from "@/lib/catalog";
import { CategoryHubClient } from "../pdf-tools/category-hub-client";

export const metadata: Metadata = {
  title: "Word/DOCX Tools — Merge, Split, Convert & Edit | FilesWow.com",
  description:
    "30+ free Word/DOCX tools. Merge, split, convert, edit, and protect Word documents — all in your browser. No upload required. 100% private.",
};

export default function WordToolsPage() {
  return (
    <CategoryHubClient
      tools={WORD_TOOLS}
      title="Word / DOCX Tools"
      subtitle="Everything you need to work with Word documents — processed entirely in your browser."
      categories={WORD_SUB_CATEGORIES}
      categoryLabels={SUB_CATEGORY_LABELS}
    />
  );
}
