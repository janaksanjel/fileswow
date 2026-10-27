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
 * description, badges only when true (WASM / BETA). The mono sub-category
 * tag was dropped — it read as noise next to the description; the hover
 * arrow is the only affordance now. Whole card = one link.
 */
export function ToolCard({ tool, index = 0 }: ToolCardProps) {
  const tierLabel = tool.tier === 2 ? "WASM" : tool.tier === 3 ? "BETA" : null;
  void SUB_CATEGORY_LABELS;

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

        <div className="flex-1 min-w-0 pt-0.5 min-h-[44px] flex flex-col">
          <div className="flex items-center gap-2">
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
            <span className="ml-auto opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 transition-all duration-150 ease-out shrink-0 text-text-tertiary">
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
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 19" />
              </svg>
            </span>
          </div>
          <p className="text-[12.5px] text-text-secondary leading-snug line-clamp-2 mt-1">
            {tool.description}
          </p>
        </div>
      </div>
    </Link>
  );
}
