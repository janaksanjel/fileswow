import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS, blogReadingMinutes, blogIndexUrl, type BlogPost } from "@/lib/blog";
import { absoluteUrl, jsonLdProps } from "@/lib/site";

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

const CATEGORY_LABELS: Record<string, string> = {
  pdf: "PDF",
  word: "Word",
  image: "Image",
  text: "Text & Transfer",
};

const CATEGORY_COLORS: Record<string, string> = {
  pdf: "bg-accent/10 text-accent",
  word: "bg-warning/10 text-warning",
  image: "bg-accent-blue/10 text-accent-blue",
  text: "bg-success/10 text-success",
};

export default function BlogIndexPage() {
  const [featured, ...rest] = BLOG_POSTS;

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
      url: `/blog/${p.slug}`,
      datePublished: p.published,
      dateModified: p.updated,
      keywords: p.keyword,
      author: { "@type": "Organization", name: "FilesWow.com" },
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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Breadcrumb */}
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
          <span className="text-text-secondary">Blog</span>
        </nav>

        {/* Heading */}
        <header className="mb-10">
          <h1 className="heading-xl text-text-primary mb-3 [text-wrap:balance]">
            The FilesWow <span className="text-gradient">blog</span>
          </h1>
          <p className="body-lg text-text-secondary max-w-xl">
            Step-by-step tutorials for real file work — merging, compressing,
            converting, signing, resizing — with privacy-first tools that run
            entirely in your browser. No fluff, no uploads, no sign-ups.
          </p>
        </header>

        {/* Featured post */}
        {featured && <FeaturedCard post={featured} />}

        {/* Post grid */}
        <div className="mt-6 space-y-4">
          {rest.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>

        {/* Cross-link to tools */}
        <p className="mt-10 text-[13px] text-text-secondary">
          Looking for the tools themselves?{" "}
          <Link href="/" className="text-accent font-semibold hover:underline">
            Browse all 100+ free tools
          </Link>{" "}
          — every tutorial links to the tool that does the job.
        </p>
      </div>
    </>
  );
}

/* ─── Featured card — hero treatment for the newest post ─────────── */

function FeaturedCard({ post }: { post: BlogPost }) {
  const minutes = blogReadingMinutes(post);
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="block group card card-interactive p-6 sm:p-8 relative overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-accent to-accent-blue opacity-70" aria-hidden="true" />
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide bg-accent text-white">
          Featured
        </span>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${CATEGORY_COLORS[post.category] ?? "bg-text-tertiary/10 text-text-tertiary"}`}
        >
          {CATEGORY_LABELS[post.category] ?? post.category}
        </span>
        <span className="text-[11px] font-medium text-text-tertiary">
          {new Date(post.updated).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}{" "}
          · {minutes} min read
        </span>
      </div>
      <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-text-primary mb-2 group-hover:text-accent transition-colors [text-wrap:balance]">
        {post.title}
      </h2>
      <p className="text-[13.5px] leading-relaxed text-text-secondary mb-4">
        {post.description}
      </p>
      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent">
        Read the tutorial
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform duration-200 group-hover:translate-x-0.5"
          aria-hidden="true"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </span>
    </Link>
  );
}

/* ─── Standard post card ─────────────────────────────────────────── */

function PostCard({ post }: { post: BlogPost }) {
  const minutes = blogReadingMinutes(post);
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="block group card p-5 sm:p-6 hover:border-border-strong transition-colors"
    >
      <div className="flex flex-wrap items-center gap-2 mb-2.5">
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${CATEGORY_COLORS[post.category] ?? "bg-text-tertiary/10 text-text-tertiary"}`}
        >
          {CATEGORY_LABELS[post.category] ?? post.category}
        </span>
        <span className="text-[11px] font-medium text-text-tertiary">
          Updated{" "}
          {new Date(post.updated).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
        <span className="text-[11px] font-medium text-text-tertiary">
          · {minutes} min read
        </span>
      </div>
      <h2 className="text-[17px] font-bold text-text-primary mb-1.5 group-hover:text-accent transition-colors [text-wrap:balance]">
        {post.title}
      </h2>
      <p className="text-[13.5px] leading-relaxed text-text-secondary">
        {post.description}
      </p>
    </Link>
  );
}
