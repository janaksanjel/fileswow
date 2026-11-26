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
      {/* Search + Category Filters Toolbar */}
      <div className="mb-7 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <label htmlFor="blog-search-input" className="sr-only">
            Search articles
          </label>
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
            placeholder="Search tutorials (e.g. merge pdf, dpi, docx)…"
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-bg-surface border border-border-base text-[13.5px] text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
          />
        </div>

        <div className="inline-flex flex-wrap gap-1 p-1 rounded-xl bg-bg-elevated border border-border-base self-start" role="group" aria-label="Filter articles by category">
          {CATEGORY_TABS.map((tab) => {
            const active = category === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-all cursor-pointer ${
                  active
                    ? "bg-bg-surface text-text-primary shadow-[var(--elevation-sm)]"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
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
              className="block group p-6 rounded-2xl bg-bg-surface border border-border-base hover:border-accent/40 hover:shadow-[var(--elevation-md)] transition-all mb-6"
            >
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <span className="text-[10.5px] px-2 py-0.5 rounded-md font-semibold uppercase tracking-wide bg-accent text-text-on-accent">
                  Featured
                </span>
                <span
                  className={`text-[10.5px] px-2 py-0.5 rounded-md font-semibold uppercase tracking-wide ${CATEGORY_COLORS[featured.category] ?? "bg-bg-elevated text-text-secondary"}`}
                >
                  {CATEGORY_LABELS[featured.category] ?? featured.category}
                </span>
                <span className="text-[11.5px] text-text-tertiary">
                  {new Date(featured.updated).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  · {featured.minutes} min read
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-text-primary mb-1.5 group-hover:text-accent transition-colors [text-wrap:balance]">
                {featured.title}
              </h2>
              <p className="text-[13.5px] leading-relaxed text-text-secondary mb-3 max-w-3xl">
                {featured.description}
              </p>
              <span className="inline-flex items-center gap-1 text-[13px] font-medium text-accent-ink">
                Read the tutorial →
              </span>
            </Link>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col p-5 rounded-2xl bg-bg-surface border border-border-base hover:border-accent/40 hover:shadow-[var(--elevation-md)] transition-all"
              >
                <div className="flex flex-wrap items-center gap-2 mb-2.5">
                  <span
                    className={`text-[10.5px] px-2 py-0.5 rounded-md font-semibold uppercase tracking-wide ${CATEGORY_COLORS[post.category] ?? "bg-bg-elevated text-text-secondary"}`}
                  >
                    {CATEGORY_LABELS[post.category] ?? post.category}
                  </span>
                  <span className="text-[11.5px] text-text-tertiary">
                    {new Date(post.updated).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="text-[11.5px] text-text-tertiary">
                    · {post.minutes} min read
                  </span>
                </div>
                <h2 className="text-[16px] font-semibold text-text-primary mb-1.5 group-hover:text-accent transition-colors leading-snug [text-wrap:balance]">
                  {post.title}
                </h2>
                <p className="text-[13px] leading-relaxed text-text-secondary line-clamp-3">
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
