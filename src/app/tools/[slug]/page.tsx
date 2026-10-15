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
  "add-page-numbers-pdf": {
    title: "Add Page Numbers to PDF Online Free",
    desc: "Add page numbers to your PDF online for free. Choose position, numbering style (Page X of Y, starting number), and skip cover pages. 100% private, no upload.",
  },
  "jpg-to-pdf": {
    title: "Convert JPG to PDF Online Free",
    desc: "Convert JPG images to PDF documents online for free. Combine multiple photos, adjust page orientation, and preserve image quality. 100% private in browser.",
  },
  "insert-pdf-pages": {
    title: "Insert Pages into PDF Online Free",
    desc: "Insert pages from one PDF into another online for free. Add pages at any position without uploading files. 100% private, client-side processing.",
  },
  "add-blank-page-pdf": {
    title: "Add Blank Page to PDF Online Free",
    desc: "Insert blank pages into your PDF document at any position online for free. Perfect for duplex printing, chapter breaks, or notes. No upload required.",
  },
  "merge-pdf": {
    title: "Merge PDF Files Online Free (No Upload)",
    desc: "Combine multiple PDF files into one document online for free. Drag and drop reordering, 100% private, processed in your browser with no file upload.",
  },
  "split-pdf": {
    title: "Split PDF Files Online Free",
    desc: "Split PDF pages or extract specific page ranges online for free. Fast, client-side, 100% private with no server upload.",
  },
  "compress-pdf": {
    title: "Compress PDF Online Free (Reduce File Size)",
    desc: "Reduce PDF file size online for free while maintaining sharp text and image quality. Runs entirely in your browser — 100% private.",
  },
  "pdf-to-word": {
    title: "Convert PDF to Word Online Free",
    desc: "Convert PDF files into editable Word (DOCX) documents online for free. Fast, private browser-based conversion with no upload.",
  },
  "word-to-pdf": {
    title: "Convert Word to PDF Online Free",
    desc: "Convert Microsoft Word documents (DOCX) to clean, printable PDF files online for free. Runs 100% privately in your browser.",
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
      `${tool.name} free`,
      `${tool.name} online`,
      `${tool.name} no upload`,
      `how to ${tool.name.toLowerCase()}`,
      `free ${tool.name.toLowerCase()}`,
      `online ${tool.name.toLowerCase()}`,
      `${tool.description}`,
      "free online tool",
      "no upload required",
      "client-side processing",
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
  const subCategoryLabel = SUB_CATEGORY_LABELS[tool.subCategory] || tool.subCategory;

  // SoftwareApplication schema
  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `FilesWow.com — ${tool.name}`,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web Browser",
    description: tool.description,
    url: toolUrl(tool.slug),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/AvailableNow",
    },
    featureList: tool.howItWorks.join(", "),
  };

  // HowTo schema
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to ${tool.name}`,
    description: tool.description,
    totalTime: "PT2M",
    step: tool.howItWorks.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: `Step ${i + 1}`,
      text: step,
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
        // Cross-format tools have no hub page; link the breadcrumb to the
        // home page's #cross section instead of a 404ing /cross-tools URL.
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
        headline: `Guide to ${tool.name}`,
        description: tool.description,
        mainEntityOfPage: { "@type": "WebPage", "@id": toolUrl(tool.slug) },
        author: {
          "@type": "Organization",
          name: "FilesWow.com",
          url: absoluteUrl("/"),
        },
        publisher: {
          "@type": "Organization",
          name: "FilesWow.com",
          url: absoluteUrl("/"),
        },
      }
    : null;

  // FAQ schema — mirrors the visible accordion (merged FAQ), not just catalog FAQ
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

  // WebApplication schema for rich results
  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.name,
    url: toolUrl(tool.slug),
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    description: tool.description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    browserRequirements: "Requires a modern web browser with JavaScript enabled",
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

