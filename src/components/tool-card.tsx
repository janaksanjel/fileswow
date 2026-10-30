"use client";

import Link from "next/link";
import type { ToolDef } from "@/lib/catalog";
import { ToolIcon } from "./icon";
import { categoryTile } from "@/lib/category-style";

interface ToolCardProps {
  tool: ToolDef;
  index?: number;
}

/**
 * Large tactile Neumorphic Tool Card matching reference design:
 * Spacious vertical layout with top-left icon tile, prominent title,
 * and 3-line readable description. Fully responsive across desktop, tablet, and mobile.
 */
export function ToolCard({ tool, index = 0 }: ToolCardProps) {
  const tierLabel = tool.tier === 2 ? "WASM" : tool.tier === 3 ? "BETA" : null;

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group relative flex flex-col justify-start p-5 sm:p-6 rounded-2xl bg-bg-surface border border-white/80 dark:border-white/10 shadow-[4px_4px_14px_var(--neu-shadow-dark),-4px_-4px_14px_var(--neu-shadow-light)] hover:shadow-[6px_6px_22px_var(--neu-shadow-dark),-6px_-6px_22px_var(--neu-shadow-light)] hover:-translate-y-1.5 transition-all duration-200 min-h-[175px] sm:min-h-[195px] select-none"
      style={{ animationDelay: `${Math.min(index, 12) * 25}ms` }}
    >
      {/* Top icon tile — 48x48 rounded-xl with category tint and subtle 3D lift */}
      <div className="flex items-center justify-between mb-4">
        <span
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${categoryTile(
            tool.category
          )} shadow-[2px_2px_6px_var(--neu-shadow-dark-soft),-2px_-2px_6px_var(--neu-shadow-light)]`}
        >
          <ToolIcon name={tool.slug} size={24} />
        </span>

        {/* Hover arrow indicator or tier badge */}
        <div className="flex items-center gap-1.5">
          {tierLabel && (
            <span className="badge badge-mono text-[10px] px-1.5 py-0.5 shrink-0 opacity-80">
              {tierLabel}
            </span>
          )}
          <span className="w-6 h-6 rounded-lg flex items-center justify-center opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 text-accent">
            <svg
              width="13"
              height="13"
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
      </div>

      {/* Prominent tool title */}
      <h3 className="text-[16px] sm:text-[17px] font-bold text-text-primary group-hover:text-accent transition-colors leading-snug mb-2">
        {tool.name}
      </h3>

      {/* Clear, readable 2-3 line description */}
      <p className="text-[12.5px] sm:text-[13px] text-text-secondary leading-relaxed line-clamp-3">
        {tool.description}
      </p>
    </Link>
  );
}
