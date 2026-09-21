import type { Metadata } from "next";
import { TEXT_TOOLS, SUB_CATEGORY_LABELS, TEXT_SUB_CATEGORIES } from "@/lib/catalog";
import { absoluteUrl, categoryUrl, toolUrl, jsonLdProps } from "@/lib/site";
import { CategoryHubClient } from "../pdf-tools/category-hub-client";

export const metadata: Metadata = {
  title: "Text Tools — P2P Transfer & More",
  description:
    "Free text tools. Send text between two devices instantly with P2P Text Transfer — direct browser-to-browser over WebRTC. No server, no uploads, 100% private.",
  keywords: [
    "send text between devices",
    "P2P text transfer online",
    "WebRTC text transfer",
    "transfer text phone to computer",
    "copy text between devices",
    "send text without server",
    "browser to browser text",
    "no upload text transfer",
  ],
  openGraph: {
    title: "Text Tools — P2P Text Transfer & More",
    description:
      "Send text directly between your devices — browser to browser, no server involved.",
    url: categoryUrl("text"),
    type: "website",
  },
  alternates: {
    canonical: categoryUrl("text"),
  },
};

export default function TextToolsPage() {
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Free Text Tools Online",
    description:
      "Free text tools processed entirely in your browser — no upload required.",
    url: categoryUrl("text"),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: TEXT_TOOLS.length,
      itemListElement: TEXT_TOOLS.map((tool, i) => ({
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
        name: "Text Tools",
        item: categoryUrl("text"),
      },
    ],
  };

  return (
    <>
      <script {...jsonLdProps(collectionJsonLd)} />
      <script {...jsonLdProps(breadcrumbJsonLd)} />
      <CategoryHubClient
        tools={TEXT_TOOLS}
        title="Text Tools"
        subtitle="Share and work with text — P2P Text Transfer sends messages directly between two browsers with no server in between."
        categories={TEXT_SUB_CATEGORIES}
        categoryLabels={SUB_CATEGORY_LABELS}
      />
    </>
  );
}
