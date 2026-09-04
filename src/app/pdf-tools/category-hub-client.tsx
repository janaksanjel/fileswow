"use client";

import Link from "next/link";
import { ToolCard } from "@/components/tool-card";
import type { ToolDef, SubCategory } from "@/lib/catalog";

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
  return (
    <div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs font-semibold text-text-tertiary mb-6">
          <Link href="/" className="hover:text-text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-text-secondary">{title}</span>
        </nav>

        {/* Header */}
        <div className="mb-7 flex items-start gap-4">
          <span className="hidden sm:flex w-14 h-14 bg-accent border-2 border-border-strong shadow-[4px_4px_0_var(--shadow-color)] shrink-0 items-center justify-center mt-1">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-on-accent)" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </span>
          <div>
            <h1 className="heading-xl text-text-primary mb-2">{title}</h1>
            <p className="body-md text-text-secondary max-w-2xl">{subtitle}</p>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-bg-surface border-2 border-border-strong text-[11px] font-extrabold uppercase tracking-wider text-text-secondary">
                <span className="w-2 h-2 bg-accent border border-border-strong" />
                {tools.length} tools
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-bg-surface border-2 border-border-strong text-[11px] font-extrabold uppercase tracking-wider text-success">
                <span className="w-2 h-2 bg-success border border-border-strong" />
                Client-side
              </span>
            </div>
          </div>
        </div>

        {/* Tool sections */}
        {categories.map((subCat) => {
          const sectionTools = tools.filter((t) => t.subCategory === subCat);
          if (sectionTools.length === 0) return null;
          return (
            <div key={subCat} className="mb-10 sm:mb-12">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-3 h-3 bg-accent shrink-0" />
                <h2 className="text-[13px] font-extrabold uppercase tracking-widest text-text-secondary">
                  {categoryLabels[subCat]}
                </h2>
                <div className="flex-1 border-b-2 border-border-base" />
                <span className="text-[10px] font-bold text-text-secondary bg-bg-surface border-2 border-border-strong px-2 py-0.5">
                  {sectionTools.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
