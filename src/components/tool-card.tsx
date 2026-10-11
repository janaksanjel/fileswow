"use client";

import Link from "next/link";
import { SUB_CATEGORY_LABELS, type ToolDef } from "@/lib/catalog";
import { ToolIcon } from "./icon";
import { categoryTile } from "@/lib/category-style";

interface ToolCardProps {
  tool: ToolDef;
  index?: number;
}

/**
 * The one tool card used across the site: icon tile + name + a two-line
 * description, badges only when true (WASM / BETA), a 2px lift and a
 * revealing arrow on hover, visible focus ring, whole card = one link.
 */
export function ToolCard({ tool, index = 0 }: ToolCardProps) {
  const tierLabel = tool.tier === 2 ? "WASM" : tool.tier === 3 ? "BETA" : null;

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="card group relative flex flex-col p-4"
      style={{ animationDelay: `${Math.min(index, 12) * 25}ms` }}
    >
      <div className="flex items-start gap-3">
        {/* Icon tile — tinted per category */}
        <span
          className={`w-10 h-10 rounded-lg ring-1 ring-inset flex items-center justify-center shrink-0 transition-transform duration-150 ease-out group-hover:-translate-y-0.5 ${categoryTile(
            tool.category
          )}`}
        >
          <ToolIcon name={tool.slug} size={19} />
        </span>

        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[14px] font-semibold text-text-primary truncate group-hover:text-accent transition-colors duration-150">
              {tool.name}
            </h3>
            {tierLabel && (
              <span
                className={`badge badge-mono shrink-0 ${
                  tool.tier === 2 ? "badge-accent" : ""
                }`}
              >
                {tierLabel}
              </span>
            )}
          </div>
          <p className="text-[12.5px] text-text-secondary leading-snug line-clamp-2">
            {tool.description}
          </p>
        </div>
      </div>

      {/* Footer: sub-category tag + hover arrow */}
      <div className="mt-3.5 pt-3 flex items-center justify-between border-t border-border-base">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-text-tertiary truncate">
          {SUB_CATEGORY_LABELS[tool.subCategory] ?? tool.subCategory}
        </span>
        <span className="w-6 h-6 rounded-full flex items-center justify-center text-text-tertiary opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 transition-all duration-150 ease-out shrink-0">
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
