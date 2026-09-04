"use client";

import Link from "next/link";
import { ToolCard } from "@/components/tool-card";
import { categoryTile } from "@/lib/category-style";
import { CATEGORY_COUNTS, type ToolDef, type ToolCategory, type SubCategory } from "@/lib/catalog";

const CATEGORY_LINKS: Array<{ key: ToolCategory; label: string; href: string }> = [
  { key: "pdf", label: "PDF", href: "/pdf-tools" },
  { key: "word", label: "Word", href: "/word-tools" },
  { key: "image", label: "Image", href: "/image-tools" },
  { key: "text", label: "Text", href: "/text-tools" },
];

interface CategoryHubClientProps {
  tools: ToolDef[];
  title: string;
  subtitle: string;
  categories: SubCategory[];
  categoryLabels: Record<SubCategory, string>;
}

export function CategoryHubClient({
  tools,
  title,
  subtitle,
  categories,
  categoryLabels,
}: CategoryHubClientProps) {
  const category: ToolCategory = tools[0]?.category ?? "pdf";
  const tile = categoryTile(category);
  const count = CATEGORY_COUNTS[category];

  return (
    <div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-medium text-text-tertiary mb-8" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-accent transition-colors">
            Home
          </Link>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="text-text-secondary">{title}</span>
        </nav>

        {/* Header */}
        <div className="mb-10 flex items-start gap-4 sm:gap-5">
          <span className={`hidden sm:flex w-14 h-14 rounded-2xl ring-1 ring-inset items-center justify-center shrink-0 mt-1 ${tile}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </span>
          <div className="min-w-0">
            <h1 className="heading-xl text-text-primary mb-2.5">{title}</h1>
            <p className="body-md text-text-secondary max-w-2xl">{subtitle}</p>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-surface border border-border-base text-[11px] font-semibold text-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                {tools.length} tools
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-surface border border-border-base text-[11px] font-semibold text-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                100% client-side
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-surface border border-border-base text-[11px] font-semibold text-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-blue" />
                Free forever
              </span>
            </div>
          </div>
        </div>

        {/* Category switcher */}
        <div className="mb-10">
          <div className="inline-flex flex-wrap items-center rounded-2xl bg-bg-elevated border border-border-base p-1 gap-1">
            {CATEGORY_LINKS.map((cat) => {
              const isActive = cat.key === category;
              return (
                <Link
                  key={cat.key}
                  href={cat.href}
                  className={`px-5 sm:px-6 h-10 rounded-xl inline-flex items-center gap-2 text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? "text-text-primary bg-bg-surface shadow-sm ring-1 ring-border-base"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {cat.label}
                  <span className={`text-[11px] font-bold rounded-full px-1.5 py-px ${isActive ? "text-accent bg-accent/10" : "text-text-tertiary bg-bg-surface/60"}`}>
                    {CATEGORY_COUNTS[cat.key]}
                  </span>
                </Link>
              );
            })}
          </div>
          <p className="mt-3 text-xs font-semibold text-text-tertiary">
            {count} tools · free forever · no account needed
          </p>
        </div>

        {/* Tool sections */}
        {categories.map((subCat) => {
          const sectionTools = tools.filter((t) => t.subCategory === subCat);
          if (sectionTools.length === 0) return null;
          return (
            <div key={subCat} className="mb-12 sm:mb-14">
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-[13px] font-bold uppercase tracking-widest text-text-secondary whitespace-nowrap">
                  {categoryLabels[subCat]}
                </h2>
                <div className="flex-1 h-px bg-border-base" />
                <span className="text-[11px] font-bold text-text-tertiary bg-bg-elevated px-2 py-0.5 rounded-full whitespace-nowrap">
                  {sectionTools.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {sectionTools.map((tool, i) => (
                  <ToolCard key={tool.slug} tool={tool} index={i} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
