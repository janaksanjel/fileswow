import type { Metadata } from "next";
import { WORD_TOOLS, SUB_CATEGORY_LABELS, WORD_SUB_CATEGORIES } from "@/lib/catalog";
import { absoluteUrl, categoryUrl, toolUrl, jsonLdProps } from "@/lib/site";
import { CategoryHubClient } from "../pdf-tools/category-hub-client";

export const metadata: Metadata = {
  title: "Word/DOCX Tools — Convert, Merge & Edit",
  description:
    "30+ free Word/DOCX tools. Merge, split, convert, edit, and protect Word documents — all in your browser. No upload required. 100% private.",
  keywords: [
    "Word to PDF free",
    "PDF to Word converter",
    "free Word tools online",
    "merge Word documents",
    "Word to HTML converter",
    "Word document editor online",
    "DOCX tools free",
    "Word to Markdown converter",
    "protect Word document",
    "Word template filler",
  ],
  openGraph: {
    title: "Word/DOCX Tools — Merge, Split, Convert & Edit",
    description:
      "30+ free Word/DOCX tools. Merge, split, convert, edit, and protect documents.",
    url: categoryUrl("word"),
    type: "website",
  },
  alternates: {
    canonical: categoryUrl("word"),
  },
};

export default function WordToolsPage() {
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Free Word/DOCX Tools Online",
    description:
      "30+ free Word tools processed entirely in your browser. No upload required.",
    url: categoryUrl("word"),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: WORD_TOOLS.length,
      itemListElement: WORD_TOOLS.map((tool, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: tool.name,
        url: toolUrl(tool.slug),
        description: tool.description,
      })),
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Word Tools",
        item: categoryUrl("word"),
      },
    ],
  };

  return (
    <>
      <script {...jsonLdProps(collectionJsonLd)} />
      <script {...jsonLdProps(breadcrumbJsonLd)} />
      <CategoryHubClient
        tools={WORD_TOOLS}
        title="Word / DOCX Tools"
        subtitle="Everything you need to work with Word documents — processed entirely in your browser."
        categories={WORD_SUB_CATEGORIES}
        categoryLabels={SUB_CATEGORY_LABELS}
      />
    </>
  );
}
