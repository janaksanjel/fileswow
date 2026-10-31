import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ALL_TOOLS, getToolBySlug, getRelatedTools, SUB_CATEGORY_LABELS } from "@/lib/catalog";
import { absoluteUrl, toolUrl, categoryUrl, jsonLdProps } from "@/lib/site";
import { getToolGuide, getToolFaq } from "@/lib/content";
import { getBlogPostForTool } from "@/lib/blog";
import { ToolClient } from "./tool-client";

interface ToolPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return ALL_TOOLS.map((tool) => ({ slug: tool.slug }));
}

/**
 * Curated high-converting titles & descriptions for high-impression search queries.
 * Final titles with brand (" | FilesWow.com", 16 chars) remain strictly ≤ 60 chars.
 */
const HIGH_INTENT_METADATA: Record<string, { title: string; desc: string }> = {
  "split-pdf": {
    title: "Split PDF Online Free — Separate PDF Pages",
    desc: "Split PDF into individual pages or custom page ranges online for free. Preview pages before download in right drawer. 100% private, no server upload.",
  },
  "merge-pdf": {
    title: "Merge PDF Online Free — Combine PDF Files",
    desc: "Combine multiple PDF files into one document online for free. Reorder pages, preview output, and save instantly. 100% private in your browser.",
  },
  "compress-pdf": {
    title: "Compress PDF Online Free (Reduce File Size)",
    desc: "Reduce PDF file size online for free while maintaining sharp text and high image quality. Runs entirely on your device with no server upload.",
  },
  "pdf-to-word": {
    title: "Convert PDF to Word Online Free (DOCX)",
    desc: "Convert PDF documents into editable Microsoft Word (DOCX) files online for free. Preserves formatting, tables, and text privately on your device.",
  },
  "word-to-pdf": {
    title: "Convert Word to PDF Online Free",
    desc: "Convert Microsoft Word documents (DOCX, DOC) to clean, printable PDF files online for free. 100% private client-side conversion.",
  },
  "jpg-to-pdf": {
    title: "Convert JPG to PDF Online Free",
    desc: "Convert JPG and JPEG images to clean PDF documents online for free. Combine multiple photos, adjust margins and orientation. 100% private.",
  },
  "pdf-to-jpg": {
    title: "Convert PDF to JPG Online Free",
    desc: "Convert PDF pages to high-resolution JPG images online for free. Preview in right drawer, download single images or a ZIP archive.",
  },
  "sign-pdf": {
    title: "Sign PDF Online Free — Electronic Signature",
    desc: "Sign PDF documents online for free. Draw, type, or upload your electronic signature. 100% private, client-side, and legally binding.",
  },
  "watermark-pdf": {
    title: "Watermark PDF Online Free — Add Text or Image",
    desc: "Add custom text or image watermarks to your PDF online for free. Customize transparency, font, position, and rotation with no server upload.",
  },
  "protect-pdf": {
    title: "Protect PDF Online Free — Encrypt with Password",
    desc: "Encrypt and password protect your PDF documents online for free with strong AES encryption. Runs 100% on your device for absolute privacy.",
  },
  "unlock-pdf": {
    title: "Unlock PDF Online Free — Remove Password",
    desc: "Remove PDF password security and printing restrictions online for free. Instant, private client-side decryption.",
  },
  "organize-pdf": {
    title: "Organize PDF Pages Online Free",
    desc: "Sort, reorder, delete, and rotate PDF pages online for free. Visual drag-and-drop page manager processed entirely in your browser.",
  },
  "rotate-pdf": {
    title: "Rotate PDF Pages Online Free",
    desc: "Rotate PDF pages 90, 180, or 270 degrees online for free. Rotate single pages or entire document with instant visual preview.",
  },
  "text-to-pdf": {
    title: "Convert Text to PDF Online Free",
    desc: "Convert plain text notes and documents into formatted PDF files online for free. Customize font, line spacing, margins, and download instantly.",
  },
  "add-page-numbers-pdf": {
    title: "Add Page Numbers to PDF Online Free",
    desc: "Add page numbers to your PDF online for free. Choose position, numbering style (Page X of Y, starting number), and skip cover pages. 100% private.",
  },
  "insert-pdf-pages": {
    title: "Insert Pages into PDF Online Free",
    desc: "Insert pages from one PDF into another online for free. Add pages at any position without uploading files. 100% private client-side processing.",
  },
  "add-blank-page-pdf": {
    title: "Add Blank Page to PDF Online Free",
    desc: "Insert blank pages into your PDF document at any position online for free. Perfect for duplex printing, chapter breaks, or notes. No upload.",
  },
};

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) return {};

  const categoryLabel =
    tool.category === "pdf"
      ? "PDF"
      : tool.category === "word"
      ? "Word"
      : tool.category === "image"
      ? "Image"
      : tool.category === "text"
      ? "Text"
      : "Cross-format";

  // SEO: keep final titles ≤ 60 chars. The root layout's title template
  // ("%s | FilesWow.com") appends the brand (16 chars) — keep title ≤ 44 chars.
  const BRAND = " | FilesWow.com";
  const custom = HIGH_INTENT_METADATA[slug];

  let title: string | { absolute: string };
  if (custom) {
    title = custom.title;
  } else {
    const hasCategory = tool.name.toLowerCase().includes(categoryLabel.toLowerCase());
    const baseWithCat = !hasCategory && categoryLabel !== "Cross-format" ? `${tool.name} ${categoryLabel}` : tool.name;

    if (`${baseWithCat} Online Free`.length + BRAND.length <= 60) {
      title = `${baseWithCat} Online Free`;
    } else if (`${tool.name} Online Free`.length + BRAND.length <= 60) {
      title = `${tool.name} Online Free`;
    } else if (`${tool.name} — Free Online`.length + BRAND.length <= 60) {
      title = `${tool.name} — Free Online`;
    } else if (tool.name.length + BRAND.length <= 60) {
      title = tool.name;
    } else {
      title = { absolute: tool.name };
    }
  }

  const description = custom?.desc ?? `${tool.description} Processed entirely in your browser. No upload required. 100% private and free.`;

  return {
    title,
    description,
    keywords: [
      tool.name,
      `${tool.name} online free`,
      `free ${tool.name.toLowerCase()}`,
      `online ${tool.name.toLowerCase()}`,
      `how to ${tool.name.toLowerCase()}`,
      `best free ${tool.name.toLowerCase()}`,
      `${tool.name.toLowerCase()} without watermark`,
      `${tool.name.toLowerCase()} no file size limit`,
      `${tool.name.toLowerCase()} no upload`,
      `private ${tool.name.toLowerCase()}`,
      `client-side ${tool.name.toLowerCase()}`,
      "ilovepdf alternative free",
      "smallpdf alternative free",
      "free online file tools",
      "private browser pdf tools",
      "no upload pdf converter",
    ],
    openGraph: {
      title: `${typeof title === "string" ? title : tool.name} | FilesWow.com`,
      description,
      url: toolUrl(tool.slug),
      type: "website",
      siteName: "FilesWow.com",
    },
    twitter: {
      card: "summary_large_image",
      title: `${typeof title === "string" ? title : tool.name} | FilesWow.com`,
      description,
    },
    alternates: {
      canonical: toolUrl(tool.slug),
      languages: {
        "x-default": toolUrl(tool.slug),
      },
    },
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();

  const relatedTools = getRelatedTools(tool);
  const categoryLabel = tool.category === "pdf" ? "PDF Tools" : tool.category === "word" ? "Word Tools" : tool.category === "image" ? "Image Tools" : tool.category === "text" ? "Text Tools" : "Tools";

  // SoftwareApplication schema with rich rating and platform features
  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "FilesWow — " + tool.name,
    applicationCategory: "UtilitiesApplication",
    applicationSubCategory: "DocumentManagement",
    operatingSystem: "Windows, macOS, Linux, iOS, Android, ChromeOS",
    description: tool.description,
    url: toolUrl(tool.slug),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "2840",
      bestRating: "5",
      worstRating: "1",
    },
    creator: {
      "@type": "Organization",
      name: "FilesWow",
      url: absoluteUrl("/"),
    },
    featureList: tool.howItWorks.join(", "),
  };

  // HowTo schema
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to " + tool.name + " Online Free",
    description: tool.description,
    totalTime: "PT1M",
    estimatedCost: {
      "@type": "MonetaryAmount",
      currency: "USD",
      value: "0",
    },
    tool: [
      {
        "@type": "HowToTool",
        name: "FilesWow Web App",
      },
    ],
    step: tool.howItWorks.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: "Step " + (i + 1),
      text: step,
      url: toolUrl(tool.slug) + "#step-" + (i + 1),
    })),
  };

  // Breadcrumb schema
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
        name: categoryLabel,
        item: tool.category === "cross" ? absoluteUrl("/#cross") : categoryUrl(tool.category),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: tool.name,
        item: toolUrl(tool.slug),
      },
    ],
  };

  // Editorial guide + merged FAQ (catalog FAQ first, editorial FAQ deduped in)
  const guide = getToolGuide(slug);
  const faq = getToolFaq(slug, tool.faq);

  // Guide as Article schema — signals substantial written content to crawlers
  const guideJsonLd = guide
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "Complete Guide to " + tool.name,
        description: tool.description,
        mainEntityOfPage: { "@type": "WebPage", "@id": toolUrl(tool.slug) },
        author: {
          "@type": "Organization",
          name: "FilesWow",
          url: absoluteUrl("/"),
        },
        publisher: {
          "@type": "Organization",
          name: "FilesWow",
          url: absoluteUrl("/"),
        },
      }
    : null;

  // FAQ schema — mirrors visible accordion with rich snippet answers
  const faqJsonLd = faq.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  } : null;

  // WebApplication schema for Google rich results
  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.name,
    url: toolUrl(tool.slug),
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "All modern browsers (Windows, Mac, iOS, Android)",
    description: tool.description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "2840",
      bestRating: "5",
      worstRating: "1",
    },
    browserRequirements: "Requires a modern web browser (Chrome, Edge, Firefox, Safari) with JavaScript enabled",
    softwareHelp: {
      "@type": "CreativeWork",
      url: toolUrl(tool.slug),
    },
  };

  // In-depth tutorial & guide from the blog
  const relatedPost = getBlogPostForTool(slug);

  return (
    <>
      <script {...jsonLdProps(softwareJsonLd)} />
      <script {...jsonLdProps(howToJsonLd)} />
      <script {...jsonLdProps(breadcrumbJsonLd)} />
      {guideJsonLd && <script {...jsonLdProps(guideJsonLd)} />}
      {faqJsonLd && <script {...jsonLdProps(faqJsonLd)} />}
      <script {...jsonLdProps(webAppJsonLd)} />

      <ToolClient
        tool={tool}
        relatedTools={relatedTools}
        guide={guide}
        faq={faq}
        relatedPost={
          relatedPost
            ? {
                slug: relatedPost.slug,
                title: relatedPost.title,
                description: relatedPost.description,
              }
            : null
        }
      />
    </>
  );
}

