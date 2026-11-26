import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS, blogReadingMinutes, blogIndexUrl, blogUrl } from "@/lib/blog";
import { absoluteUrl, jsonLdProps, TOOL_COUNT } from "@/lib/site";
import { BlogIndexClient, type BlogCardItem } from "./blog-index-client";

export const metadata: Metadata = {
  title: "Blog — File Tips, Tutorials & Tools (PDF, Word, Image)",
  description:
    "Practical, step-by-step tutorials for PDF, Word, and image work: merge, compress, convert, sign, resize, and edit files free — with privacy-first tools that never upload your documents.",
  keywords: [
    "pdf tips and tutorials",
    "file tools blog",
    "how to merge pdf",
    "pdf guides",
    "word to pdf tutorial",
    "image editing tutorials",
    "free file tools blog",
  ],
  alternates: {
    canonical: blogIndexUrl(),
    languages: { "x-default": blogIndexUrl() },
  },
  openGraph: {
    title: "FilesWow.com Blog — File Tips, Tutorials & Tools",
    description:
      "Step-by-step tutorials for PDF, Word, and image work — free, private, in-browser tools for every task.",
    url: blogIndexUrl(),
    type: "website",
    siteName: "FilesWow.com",
  },
};

export default function BlogIndexPage() {
  const cardItems: BlogCardItem[] = BLOG_POSTS.map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    category: p.category,
    updated: p.updated,
    minutes: blogReadingMinutes(p),
    keywords: [p.keyword, ...p.keywords],
  }));

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "FilesWow.com Blog",
    description:
      "Practical tutorials for PDF, Word, and image files — step-by-step how-tos written by the FilesWow.com team.",
    url: blogIndexUrl(),
    publisher: {
      "@type": "Organization",
      name: "FilesWow.com",
      url: absoluteUrl("/"),
    },
    blogPost: BLOG_POSTS.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      description: p.description,
      url: blogUrl(p.slug),
      datePublished: p.published,
      dateModified: p.updated,
      keywords: p.keyword,
      author: { "@type": "Organization", name: p.author },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Blog", item: blogIndexUrl() },
    ],
  };

  return (
    <>
      <script {...jsonLdProps(blogJsonLd)} />
      <script {...jsonLdProps(breadcrumbJsonLd)} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb */}
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
          <span className="text-text-secondary">Blog</span>
        </nav>

        {/* Heading */}
        <header className="mb-8 pb-6 border-b border-border-base">
          <h1 className="heading-lg text-text-primary mb-2 [text-wrap:balance]">
            The FilesWow blog
          </h1>
          <p className="body-md text-text-secondary max-w-2xl">
            Step-by-step tutorials for real file work — merging, compressing,
            converting, signing, and resizing — with privacy-first tools that run
            entirely in your browser.
          </p>
        </header>

        {/* Interactive search, category filter & article list */}
        <BlogIndexClient posts={cardItems} />

        {/* Cross-link to tools */}
        <p className="mt-10 text-[13px] text-text-secondary">
          Looking for the tools themselves?{" "}
          <Link href="/" className="text-accent font-semibold hover:underline">
            Browse all {TOOL_COUNT} free tools
          </Link>{" "}
          — every tutorial links to the tool that does the job.
        </p>
      </div>
    </>
  );
}
