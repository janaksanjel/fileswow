import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ALL_TOOLS, getToolBySlug, getRelatedTools, SUB_CATEGORY_LABELS } from "@/lib/catalog";
import { absoluteUrl, toolUrl, categoryUrl, jsonLdProps } from "@/lib/site";
import { ToolClient } from "./tool-client";

interface ToolPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return ALL_TOOLS.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) return {};

  const categoryLabel = tool.category === "pdf" ? "PDF" : tool.category === "word" ? "Word" : tool.category === "image" ? "Image" : tool.category === "text" ? "Text" : "Cross-format";

  // SEO: keep titles ≤ 60 chars. Add the brand suffix only when it fits.
  const BASE_SUFFIX = " — Free Online Tool";
  const BRAND_SUFFIX = " | FilesWow.com";
  const base = `${tool.name}${BASE_SUFFIX}`;
  const title =
    base.length + BRAND_SUFFIX.length <= 60
      ? base + BRAND_SUFFIX
      : base.length <= 60
        ? base
        : `${tool.name} | FilesWow.com`;

  return {
    title,
    description: `${tool.description} Processed entirely in your browser. No upload required. 100% private and free.`,
    keywords: [
      tool.name,
      `${tool.name} free`,
      `${tool.name} online`,
      `${tool.name} no upload`,
      `free ${tool.name.toLowerCase()}`,
      `online ${tool.name.toLowerCase()}`,
      `${tool.description}`,
      "free online tool",
      "no upload required",
      "client-side processing",
    ],
    openGraph: {
      title: `${tool.name} | FilesWow.com`,
      description: `${tool.description} Free, private, runs in your browser.`,
      url: toolUrl(tool.slug),
      type: "website",
      siteName: "FilesWow.com",
    },
    twitter: {
      card: "summary_large_image",
      title: `${tool.name} | FilesWow.com`,
      description: tool.description,
    },
    alternates: {
      canonical: toolUrl(tool.slug),
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
        item: categoryUrl(tool.category),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: tool.name,
        item: toolUrl(tool.slug),
      },
    ],
  };

  // FAQ schema
  const faqJsonLd = tool.faq.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: tool.faq.map((item) => ({
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

  return (
    <>
      <script {...jsonLdProps(softwareJsonLd)} />
      <script {...jsonLdProps(howToJsonLd)} />
      <script {...jsonLdProps(breadcrumbJsonLd)} />
      {faqJsonLd && <script {...jsonLdProps(faqJsonLd)} />}
      <script {...jsonLdProps(webAppJsonLd)} />

      <ToolClient tool={tool} relatedTools={relatedTools} />
    </>
  );
}
