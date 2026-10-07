"use client";

import React, { useState, useMemo } from "react";
import type { ToolDef } from "@/lib/catalog";
import { ToolCard } from "@/components/tool-card";

export interface PopularToolsSectionProps {
  tools: ToolDef[];
  categories?: readonly string[] | string[];
  categoryLabels?: Record<string, string>;
  categoryTitle: string;
}

export function PopularToolsSection({
  tools,
  categories = [],
  categoryLabels = {},
  categoryTitle,
}: PopularToolsSectionProps) {
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Find sub-categories that actually have tools
  const activeSubCategories = useMemo(() => {
    const present = new Set(tools.map((t) => t.subCategory));
    return categories.filter((sub) => present.has(sub as any));
  }, [tools, categories]);

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const matchesSub =
        selectedSubCategory === "all" || tool.subCategory === selectedSubCategory;
      if (!matchesSub) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.slug.toLowerCase().includes(q)
      );
    });
  }, [tools, selectedSubCategory, searchQuery]);

  return (
    <section className="py-12 sm:py-16 border-t border-border-base" aria-labelledby="tools-catalog-heading">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-accent bg-accent/10 px-3 py-1 rounded-full border border-accent/20 inline-block mb-3">
              Full Browser Suite
            </span>
            <h2 id="tools-catalog-heading" className="heading-lg text-text-primary">
              All {categoryTitle} ({tools.length})
            </h2>
            <p className="body-md text-text-secondary mt-1 max-w-xl">
              Launch individual standalone tools directly with deep client-side features.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-72">
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
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Filter ${tools.length} tools...`}
              className="w-full bg-bg-surface border border-border-base rounded-2xl pl-10 pr-9 py-2.5 text-xs text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary text-xs"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Sub-category Filter Pills */}
        {activeSubCategories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedSubCategory("all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedSubCategory === "all"
                  ? "bg-accent text-white shadow-xs"
                  : "bg-bg-surface border border-border-base text-text-secondary hover:text-text-primary hover:border-accent/40"
              }`}
            >
              All ({tools.length})
            </button>
            {activeSubCategories.map((sub) => {
              const count = tools.filter((t) => t.subCategory === sub).length;
              const label = categoryLabels[sub] || sub;
              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSelectedSubCategory(sub)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedSubCategory === sub
                      ? "bg-accent text-white shadow-xs"
                      : "bg-bg-surface border border-border-base text-text-secondary hover:text-text-primary hover:border-accent/40"
                  }`}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Tools Grid */}
        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTools.map((tool, idx) => (
              <ToolCard key={tool.slug} tool={tool} index={idx} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4 rounded-3xl bg-bg-surface border border-border-base">
            <p className="text-sm font-semibold text-text-primary mb-1">
              No tools found matching your filter.
            </p>
            <p className="text-xs text-text-secondary mb-4">
              Try adjusting your search query or selecting a different category.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedSubCategory("all");
              }}
              className="btn-secondary px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

