import { ALL_TOOLS, getToolsByCategory, SUB_CATEGORY_LABELS, type SubCategory } from "@/lib/catalog";
import { absoluteUrl, categoryUrl, jsonLdProps } from "@/lib/site";
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
    url: absoluteUrl("/"),
    mainEntity: {
      "@type": "ItemList",
      name: "Free Online Document Tools",
      numberOfItems: ALL_TOOLS.length,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "PDF Tools",
          url: categoryUrl("pdf"),
          description: `${pdfTools.length} free PDF tools`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Word Tools",
          url: categoryUrl("word"),
          description: `${wordTools.length} free Word tools`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Image Tools",
          url: categoryUrl("image"),
          description: `${imageTools.length} free image tools`,
        },
        {
          "@type": "ListItem",
          position: 4,
          name: "Text Tools",
          url: categoryUrl("text"),
          description: `${textTools.length} free text tools`,
        },
      ],
    },
  };

  // FAQPage schema — answers mirror the visible FAQ accordion in home-client.tsx
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Are these tools really free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Every tool on FilesWow is completely free with no usage limits, no watermarks, and no hidden premium tiers.",
        },
      },
      {
        "@type": "Question",
        name: "Are my files uploaded to a server?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. All processing happens locally in your browser using JavaScript and WebAssembly. Your files never leave your device.",
        },
      },
      {
        "@type": "Question",
        name: "Do I need to create an account?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No account or email is required. Open a tool, add your file, and get the result — that's it.",
        },
      },
      {
        "@type": "Question",
        name: "What file types are supported?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "FilesWow covers PDF, Word (DOCX), images (JPG, PNG, WebP, SVG), and plain text formats — over 100 tools across these categories.",
        },
      },
      {
        "@type": "Question",
        name: "Is it safe to use with confidential documents?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Because files are processed on your own device and never uploaded, confidential documents stay private — nothing is stored or logged anywhere.",
        },
      },
      {
        "@type": "Question",
        name: "Does it work on mobile?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. The site works in any modern mobile or desktop browser. Files are processed on your device, so very large files may take longer on older phones.",
        },
      },
    ],
  };

  return (
    <>
      <script {...jsonLdProps(homeJsonLd)} />
      <script {...jsonLdProps(faqJsonLd)} />
      <HomeClient pdfTools={pdfTools} wordTools={wordTools} imageTools={imageTools} textTools={textTools} crossTools={crossTools} />
    </>
  );
}


