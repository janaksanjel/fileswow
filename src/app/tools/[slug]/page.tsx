import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ALL_TOOLS, getToolBySlug, getRelatedTools } from "@/lib/catalog";
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

  return {
    title: `${tool.name} — Free Online Tool`,
    description: `${tool.description} Processed entirely in your browser. No upload required.`,
    openGraph: {
      title: `${tool.name} | FilesWow.com`,
      description: tool.description,
      type: "website",
    },
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();

  const relatedTools = getRelatedTools(tool);

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: `FilesWow.com — ${tool.name}`,
            applicationCategory: "MultimediaApplication",
            operatingSystem: "Web Browser",
            description: tool.description,
            url: `https://fileswow.com/tools/${tool.slug}`,
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: `How to ${tool.name}`,
            description: tool.description,
            step: tool.howItWorks.map((step, i) => ({
              "@type": "HowToStep",
              position: i + 1,
              text: step,
            })),
          }),
        }}
      />

      <ToolClient tool={tool} relatedTools={relatedTools} />
    </>
  );
}
