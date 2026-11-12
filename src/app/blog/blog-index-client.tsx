"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export interface BlogCardItem {
  slug: string;
  title: string;
  description: string;
  category: "pdf" | "word" | "image" | "text";
  updated: string;
  minutes: number;
  keywords: string[];
}

const CATEGORY_TABS: Array<{ id: "all" | "pdf" | "word" | "image"; label: string }> = [
  { id: "all", label: "All articles" },
  { id: "pdf", label: "PDF Tutorials" },
  { id: "word", label: "Word & DOCX" },
  { id: "image", label: "Image Guides" },
];

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

export function BlogIndexClient({ posts }: { posts: BlogCardItem[] }) {
  const [category, setCategory] = useState<"all" | "pdf" | "word" | "image">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (category !== "all" && post.category !== category) return false;
      if (!q) return true;
      return (
        post.title.toLowerCase().includes(q) ||
        post.description.toLowerCase().includes(q) ||
        post.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [posts, category, query]);

  const showFeatured = category === "all" && query.trim() === "" && filtered.length > 0;
  const featured = showFeatured ? filtered[0] : null;
  const listPosts = showFeatured ? filtered.slice(1) : filtered;

  return (
    <div>
      {/* Search + Category Filters */}
      <div className="mb-8 space-y-4">
        <div>
          <label htmlFor="blog-search-input" className="sr-only">
            Search articles
          </label>
          <div className="relative">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              id="blog-search-input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tutorials (e.g. merge pdf, dpi, docx, privacy)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-surface border border-border-base text-[14px] text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter articles by category">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-pressed={category === tab.id}
              onClick={() => setCategory(tab.id)}
              className="chip"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 rounded-2xl bg-bg-surface border border-border-base text-center">
          <p className="text-[14px] text-text-secondary mb-3">
            No articles matched &ldquo;{query}&rdquo;.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
            className="btn-secondary text-[13px] px-4 py-2"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <>
          {featured && (
            <Link
              href={`/blog/${featured.slug}`}
              className="block group card card-interactive p-6 sm:p-8 relative overflow-hidden mb-6"
            >
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-accent to-accent-blue opacity-70" aria-hidden="true" />
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide bg-accent text-white">
                  Featured
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${CATEGORY_COLORS[featured.category] ?? "bg-text-tertiary/10 text-text-tertiary"}`}
                >
                  {CATEGORY_LABELS[featured.category] ?? featured.category}
                </span>
                <span className="text-[11px] font-medium text-text-tertiary">
                  {new Date(featured.updated).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  · {featured.minutes} min read
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-text-primary mb-2 group-hover:text-accent transition-colors [text-wrap:balance]">
                {featured.title}
              </h2>
              <p className="text-[13.5px] leading-relaxed text-text-secondary mb-4">
                {featured.description}
              </p>
              <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent">
                Read the tutorial →
              </span>
            </Link>
          )}

          <div className="space-y-4">
            {listPosts.map((post) => (
              <Link
                key={post.slug}
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
                    · {post.minutes} min read
                  </span>
                </div>
                <h2 className="text-[17px] font-bold text-text-primary mb-1.5 group-hover:text-accent transition-colors [text-wrap:balance]">
                  {post.title}
                </h2>
                <p className="text-[13.5px] leading-relaxed text-text-secondary">
                  {post.description}
                </p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
