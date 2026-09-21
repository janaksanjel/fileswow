import type { Metadata } from "next";
import { PDF_TOOLS, SUB_CATEGORY_LABELS, PDF_SUB_CATEGORIES } from "@/lib/catalog";
import { absoluteUrl, categoryUrl, toolUrl, jsonLdProps } from "@/lib/site";
import { CategoryHubClient } from "./category-hub-client";

export const metadata: Metadata = {
  title: "PDF Tools — Merge, Split, Convert & Edit",
  description:
    "60+ free PDF tools. Merge, split, compress, convert, rotate, watermark, protect, and edit PDFs — all in your browser. No upload required. 100% private.",
  keywords: [
    "free PDF tools online",
    "merge PDF free",
    "split PDF online",
    "compress PDF free",
    "PDF to Word converter",
    "Word to PDF free",
    "edit PDF online free",
    "PDF watermark tool",
    "PDF password protect",
    "OCR PDF online",
    "PDF merge tool no upload",
    "client-side PDF editor",
  ],
  openGraph: {
    title: "PDF Tools — Merge, Split, Convert, Edit & More",
    description:
      "60+ free PDF tools. Merge, split, compress, convert, and edit PDFs — all in your browser.",
    url: categoryUrl("pdf"),
    type: "website",
  },
  alternates: {
    canonical: categoryUrl("pdf"),
  },
};

export default function PDFToolsPage() {
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Free PDF Tools Online",
    description:
      "60+ free PDF tools processed entirely in your browser. No upload required.",
    url: categoryUrl("pdf"),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: PDF_TOOLS.length,
      itemListElement: PDF_TOOLS.slice(0, 20).map((tool, i) => ({
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
        name: "PDF Tools",
        item: categoryUrl("pdf"),
      },
    ],
  };

  return (
    <>
      <script {...jsonLdProps(collectionJsonLd)} />
      <script {...jsonLdProps(breadcrumbJsonLd)} />
      <CategoryHubClient
        tools={PDF_TOOLS}
        title="PDF Tools"
        subtitle="Everything you need to work with PDF files — processed entirely in your browser."
        categories={PDF_SUB_CATEGORIES}
        categoryLabels={SUB_CATEGORY_LABELS}
      />
    </>
  );
}
