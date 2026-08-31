import type { Metadata } from "next";
import { IMAGE_TOOLS, SUB_CATEGORY_LABELS, IMAGE_SUB_CATEGORIES } from "@/lib/catalog";
import { CategoryHubClient } from "../pdf-tools/category-hub-client";

export const metadata: Metadata = {
  title: "Image Tools — Convert, Resize, Crop, Filter & Edit | FilesWow.com",
  description:
    "60+ free image tools. Convert, resize, crop, filter, compress, watermark, and edit images — all in your browser. No upload required. 100% private.",
  keywords: [
    "free image editor online",
    "compress image free",
    "resize image online",
    "convert JPG to PNG",
    "remove background free",
    "image watermark tool",
    "crop image online free",
    "HEIC to JPG converter",
    "SVG to PNG converter",
    "QR code generator free",
    "image filters online",
    "photo editor no upload",
  ],
  openGraph: {
    title: "Image Tools — Convert, Resize, Crop, Filter & Edit",
    description:
      "60+ free image tools. Convert, resize, crop, filter, and edit images.",
    url: "https://fileswow.com/image-tools",
    type: "website",
  },
  alternates: {
    canonical: "https://fileswow.com/image-tools",
  },
};

export default function ImageToolsPage() {
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Free Image Tools Online",
    description:
      "60+ free image tools processed entirely in your browser. No upload required.",
    url: "https://fileswow.com/image-tools",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: IMAGE_TOOLS.length,
      itemListElement: IMAGE_TOOLS.map((tool, i) => ({
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
        name: "Image Tools",
        item: "https://fileswow.com/image-tools",
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
        tools={IMAGE_TOOLS}
        title="Image Tools"
        subtitle="Convert, resize, filter, and edit images — processed entirely in your browser."
        categories={IMAGE_SUB_CATEGORIES}
        categoryLabels={SUB_CATEGORY_LABELS}
      />
    </>
  );
}
