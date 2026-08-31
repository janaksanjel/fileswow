import type { Metadata } from "next";
import { WORD_TOOLS, SUB_CATEGORY_LABELS, WORD_SUB_CATEGORIES } from "@/lib/catalog";
import { CategoryHubClient } from "../pdf-tools/category-hub-client";

export const metadata: Metadata = {
  title: "Word/DOCX Tools — Merge, Split, Convert & Edit | FilesWow.com",
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
    url: "https://fileswow.com/word-tools",
    type: "website",
  },
  alternates: {
    canonical: "https://fileswow.com/word-tools",
  },
};

export default function WordToolsPage() {
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Free Word/DOCX Tools Online",
    description:
      "30+ free Word tools processed entirely in your browser. No upload required.",
    url: "https://fileswow.com/word-tools",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: WORD_TOOLS.length,
      itemListElement: WORD_TOOLS.map((tool, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: tool.name,
        url: `https://fileswow.com/tools/${tool.slug}`,
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
        item: "https://fileswow.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Word Tools",
        item: "https://fileswow.com/word-tools",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
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
