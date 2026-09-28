import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES, guideUrl, readingMinutes } from "@/lib/guides";
import { absoluteUrl, jsonLdProps } from "@/lib/site";

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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Heading */}
        <nav
          className="flex items-center gap-2 text-xs font-medium text-text-tertiary mb-6"
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

        <header className="mb-10">
          <h1 className="heading-xl text-text-primary mb-3 [text-wrap:balance]">
            Practical <span className="text-gradient">guides</span> for real document work
          </h1>
          <p className="body-lg text-text-secondary max-w-xl">
            In-depth, no-fluff articles on the operations people actually do —
            merging, compressing, converting, signing, OCR — with the reasoning
            and the pitfalls, not just the steps.
          </p>
        </header>

        {/* Guide cards */}
        <div className="space-y-4">
          {GUIDES.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="block group card p-5 sm:p-6 hover:border-border-strong transition-colors"
            >
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${CATEGORY_COLORS[guide.category] ?? "bg-text-tertiary/10 text-text-tertiary"}`}
                >
                  {CATEGORY_LABELS[guide.category] ?? guide.category}
                </span>
                <span className="text-[11px] font-medium text-text-tertiary">
                  Updated{" "}
                  {new Date(guide.updated).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="text-[11px] font-medium text-text-tertiary">
                  · {readingMinutes(guide)} min read
                </span>
              </div>
              <h2 className="text-[17px] font-bold text-text-primary mb-1.5 group-hover:text-accent transition-colors">
                {guide.title}
              </h2>
              <p className="text-[13.5px] leading-relaxed text-text-secondary">
                {guide.description}
              </p>
            </Link>
          ))}
        </div>

        {/* Cross-link to tools */}
        <p className="mt-10 text-[13px] text-text-secondary">
          Looking for the tools themselves?{" "}
          <Link href="/" className="text-accent font-semibold hover:underline">
            Browse all {`100+`} free tools
          </Link>{" "}
          — every guide links to the tools that do the job.
        </p>
      </div>
    </>
  );
}
