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
    <div className="art-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-text-tertiary mb-6 animate-fade-in">
          <Link href="/" className="hover:text-text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-text-secondary">{title}</span>
        </nav>

        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="heading-xl text-text-primary mb-2">{title}</h1>
          <p className="body-md text-text-secondary max-w-2xl">{subtitle}</p>
          <div className="flex items-center gap-3 mt-4">
            <span className="text-xs text-text-tertiary">{tools.length} tools</span>
            <span className="w-1 h-1 rounded-full bg-text-tertiary" />
            <span className="text-xs text-success font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              Client-side
            </span>
          </div>
        </div>

        {/* Accent line */}
        <div className="accent-line mb-8" />

        {/* Tool sections */}
        {categories.map((subCat) => {
          const sectionTools = tools.filter((t) => t.subCategory === subCat);
          if (sectionTools.length === 0) return null;
          return (
            <div key={subCat} className="mb-10 sm:mb-12">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="caption font-semibold text-text-tertiary uppercase tracking-wider">
                  {categoryLabels[subCat]}
                </h2>
                <div className="flex-1 h-px bg-border-base" />
                <span className="text-[10px] text-text-tertiary bg-bg-elevated px-2 py-0.5 rounded">
                  {sectionTools.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 stagger">
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
