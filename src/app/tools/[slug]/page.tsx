import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ALL_TOOLS, getToolBySlug, getRelatedTools, SUB_CATEGORY_LABELS } from "@/lib/catalog";
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

  const categoryLabel = tool.category === "pdf" ? "PDF" : tool.category === "word" ? "Word" : tool.category === "image" ? "Image" : "Cross-format";

  return {
    title: `${tool.name} — Free Online ${categoryLabel} Tool`,
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
      url: `https://fileswow.com/tools/${tool.slug}`,
      type: "website",
      siteName: "FilesWow.com",
    },
    twitter: {
      card: "summary_large_image",
      title: `${tool.name} | FilesWow.com`,
      description: tool.description,
    },
    alternates: {
      canonical: `https://fileswow.com/tools/${tool.slug}`,
    },
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();

  const relatedTools = getRelatedTools(tool);
  const categoryLabel = tool.category === "pdf" ? "PDF Tools" : tool.category === "word" ? "Word Tools" : tool.category === "image" ? "Image Tools" : "Tools";
  const subCategoryLabel = SUB_CATEGORY_LABELS[tool.subCategory] || tool.subCategory;

  // SoftwareApplication schema
  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `FilesWow.com — ${tool.name}`,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web Browser",
    description: tool.description,
    url: `https://fileswow.com/tools/${tool.slug}`,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/AvailableNow",
    },
    featureList: tool.howItWorks.join(", "),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "150",
      bestRating: "5",
      worstRating: "1",
    },
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
        item: "https://fileswow.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: categoryLabel,
        item: `https://fileswow.com/${tool.category}-tools`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: tool.name,
        item: `https://fileswow.com/tools/${tool.slug}`,
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
    url: `https://fileswow.com/tools/${tool.slug}`,
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
      url: `https://fileswow.com/tools/${tool.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />

      <ToolClient tool={tool} relatedTools={relatedTools} />
    </>
  );
}
