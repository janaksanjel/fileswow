"use client";

import React from "react";
import Link from "next/link";
import type { WorkflowCategory } from "@/lib/workflow-config";

interface CategoryMeta {
  category: WorkflowCategory;
  title: string;
  path: string;
  count: string;
  description: string;
  iconBg: string;
  textColor: string;
  borderColor: string;
}

const ALL_CATEGORIES: CategoryMeta[] = [
  {
    category: "pdf",
    title: "PDF Tools",
    path: "/pdf-tools",
    count: "60+ Tools",
    description: "Merge, split, compress, convert, rotate, and organize PDF documents.",
    iconBg: "bg-accent/10",
    textColor: "text-accent",
    borderColor: "group-hover:border-accent/40",
  },
  {
    category: "word",
    title: "Word Tools",
    path: "/word-tools",
    count: "20+ Tools",
    description: "Convert Word DOCX to PDF, extract text, split files, and preview documents.",
    iconBg: "bg-warning/10",
    textColor: "text-warning",
    borderColor: "group-hover:border-warning/40",
  },
  {
    category: "image",
    title: "Image Tools",
    path: "/image-tools",
    count: "30+ Tools",
    description: "Compress, resize, convert between JPG/PNG/WebP, crop, and optimize images.",
    iconBg: "bg-accent-blue/10",
    textColor: "text-accent-blue",
    borderColor: "group-hover:border-accent-blue/40",
  },
  {
    category: "text",
    title: "Text Tools",
    path: "/text-tools",
    count: "25+ Tools",
    description: "Format JSON, encode Base64, sort lines, count characters, and clean strings.",
    iconBg: "bg-success/10",
    textColor: "text-success",
    borderColor: "group-hover:border-success/40",
  },
];

export function RelatedCategoriesSection({ currentCategory }: { currentCategory: WorkflowCategory }) {
  const otherCategories = ALL_CATEGORIES.filter((c) => c.category !== currentCategory);

  return (
    <section className="py-12 sm:py-16 border-t border-border-base" aria-labelledby="related-suites-heading">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-text-tertiary bg-bg-elevated px-3 py-1 rounded-full border border-border-base inline-block mb-3">
            More Tool Suites
          </span>
          <h2 id="related-suites-heading" className="heading-lg text-text-primary mb-3">
            Explore Other Workspaces
          </h2>
          <p className="body-md text-text-secondary">
            Switch to other file categories featuring the exact same 3-step browser workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {otherCategories.map((cat) => (
            <Link
              key={cat.category}
              href={cat.path}
              className={`group p-6 rounded-3xl bg-bg-surface border border-border-base shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between ${cat.borderColor}`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-2xl ${cat.iconBg} ${cat.textColor} flex items-center justify-center transition-transform group-hover:scale-105`}
                  >
                    {cat.category === "pdf" && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    )}
                    {cat.category === "word" && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="7 8 10 16 12 11 14 16 17 8" />
                      </svg>
                    )}
                    {cat.category === "image" && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    )}
                    {cat.category === "text" && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="4 7 4 4 20 4 20 7" />
                        <line x1="9" y1="20" x2="15" y2="20" />
                        <line x1="12" y1="4" x2="12" y2="20" />
                      </svg>
                    )}
                  </div>

                  <span className="text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-bg-elevated border border-border-base text-text-tertiary">
                    {cat.count}
                  </span>
                </div>

                <h3 className="heading-md text-text-primary mb-2 group-hover:text-accent transition-colors">
                  {cat.title}
                </h3>
                <p className="body-sm text-text-secondary leading-relaxed">
                  {cat.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border-base/70 flex items-center justify-between text-xs font-bold text-text-tertiary group-hover:text-accent transition-colors">
                <span>Launch {cat.title}</span>
                <span className="transform group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

