import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES, guideUrl, readingMinutes } from "@/lib/guides";
import { absoluteUrl, jsonLdProps, TOOL_COUNT } from "@/lib/site";

export const metadata: Metadata = {
  title: "Guides — In-Depth Tutorials for PDF, Word & Image Work",
  description:
    "Practical, in-depth guides: merging PDFs without quality loss, compression that survives email, signing documents legally, image formats explained, OCR workflows, and more.",
  alternates: {
    canonical: absoluteUrl("/guides"),
    languages: { "x-default": absoluteUrl("/guides") },
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  pdf: "PDF",
  word: "Word",
  image: "Image",
  text: "Data & Text",
};

const CATEGORY_COLORS: Record<string, string> = {
  pdf: "bg-accent/10 text-accent",
  word: "bg-warning/10 text-warning",
  image: "bg-accent-blue/10 text-accent-blue",
  text: "bg-success/10 text-success",
};

export default function GuidesIndexPage() {
  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "FilesWow.com Guides",
    description:
      "In-depth, practical guides for working with PDF, Word, and image files — written by the FilesWow.com team.",
    url: absoluteUrl("/guides"),
    blogPost: GUIDES.map((g) => ({
      "@type": "BlogPosting",
      headline: g.title,
      description: g.description,
      url: guideUrl(g.slug),
      dateModified: g.updated,
      author: { "@type": "Organization", name: "FilesWow.com" },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Guides", item: absoluteUrl("/guides") },
    ],
  };

  return (
    <>
      <script {...jsonLdProps(blogJsonLd)} />
      <script {...jsonLdProps(breadcrumbJsonLd)} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Heading */}
        <nav
          className="flex items-center gap-2 text-xs font-medium text-text-tertiary mb-5"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-accent transition-colors">
            Home
          </Link>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="text-text-secondary">Guides</span>
        </nav>

        <header className="mb-8 pb-6 border-b border-border-base">
          <h1 className="heading-lg text-text-primary mb-2 [text-wrap:balance]">
            Practical guides for real document work
          </h1>
          <p className="body-md text-text-secondary max-w-2xl">
            In-depth, no-fluff articles on the operations people actually do —
            merging, compressing, converting, signing, and OCR — with the reasoning
            and pitfalls, not just the steps.
          </p>
        </header>

        {/* Guide cards — 2-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GUIDES.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="group flex flex-col p-5 rounded-2xl bg-bg-surface border border-border-base hover:border-accent/40 hover:shadow-[var(--elevation-md)] transition-all"
            >
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <span
                  className={`text-[10.5px] px-2 py-0.5 rounded-md font-semibold uppercase tracking-wide ${CATEGORY_COLORS[guide.category] ?? "bg-bg-elevated text-text-secondary"}`}
                >
                  {CATEGORY_LABELS[guide.category] ?? guide.category}
                </span>
                <span className="text-[11.5px] text-text-tertiary">
                  {new Date(guide.updated).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="text-[11.5px] text-text-tertiary">
                  · {readingMinutes(guide)} min read
                </span>
              </div>
              <h2 className="text-[16px] font-semibold text-text-primary mb-1.5 group-hover:text-accent transition-colors leading-snug">
                {guide.title}
              </h2>
              <p className="text-[13px] leading-relaxed text-text-secondary line-clamp-3">
                {guide.description}
              </p>
            </Link>
          ))}
        </div>

        {/* Cross-link to tools */}
        <p className="mt-10 text-[13px] text-text-secondary">
          Looking for the tools themselves?{" "}
          <Link href="/" className="text-accent font-semibold hover:underline">
            Browse all {TOOL_COUNT} free tools
          </Link>{" "}
          — every guide links to the tools that do the job.
        </p>
      </div>
    </>
  );
}
