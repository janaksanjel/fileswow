import { ALL_TOOLS, getToolsByCategory, SUB_CATEGORY_LABELS, type SubCategory } from "@/lib/catalog";
import { HomeClient } from "./home-client";

export default function HomePage() {
  const pdfTools = getToolsByCategory("pdf");
  const wordTools = getToolsByCategory("word");
  const imageTools = getToolsByCategory("image");
  const textTools = getToolsByCategory("text");
  const crossTools = getToolsByCategory("cross");

  const homeJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "FilesWow.com — Free PDF, Word & Image Tools Online",
    description:
      "100+ free PDF, Word, and image tools. Processed entirely in your browser. No upload required.",
    url: "https://fileswow.com",
    mainEntity: {
      "@type": "ItemList",
      name: "Free Online Document Tools",
      numberOfItems: ALL_TOOLS.length,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "PDF Tools",
          url: "https://fileswow.com/pdf-tools",
          description: `${pdfTools.length} free PDF tools`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Word Tools",
          url: "https://fileswow.com/word-tools",
          description: `${wordTools.length} free Word tools`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Image Tools",
          url: "https://fileswow.com/image-tools",
          description: `${imageTools.length} free image tools`,
        },
        {
          "@type": "ListItem",
          position: 4,
          name: "Text Tools",
          url: "https://fileswow.com/text-tools",
          description: `${textTools.length} free text tools`,
        },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <HomeClient pdfTools={pdfTools} wordTools={wordTools} imageTools={imageTools} textTools={textTools} crossTools={crossTools} />
    </>
  );
}
