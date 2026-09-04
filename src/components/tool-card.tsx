"use client";

import Link from "next/link";
import type { ToolDef } from "@/lib/catalog";
import { ToolIcon } from "./icon";
import { categoryText } from "@/lib/category-style";

interface ToolCardProps {
  tool: ToolDef;
  index?: number;
}

export function ToolCard({ tool, index = 0 }: ToolCardProps) {
  const tierLabel = tool.tier === 2 ? "WASM" : tool.tier === 3 ? "BETA" : null;
  const label = categoryText(tool.category);

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="card group relative flex flex-col p-4 sm:p-5"
      style={{ animationDelay: `${index * 25}ms` }}
    >
      <div className="flex items-start gap-3">
        {/* Icon tile */}
        <span className="w-11 h-11 rounded-xl bg-bg-elevated ring-1 ring-inset ring-border-base flex items-center justify-center shrink-0 transition-all duration-200 group-hover:ring-accent/40 group-hover:shadow-sm">
          <ToolIcon name={tool.slug} size={21} />
        </span>

        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[13.5px] font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
              {tool.name}
            </h3>
          </div>
          <p className="text-[12px] text-text-secondary leading-relaxed line-clamp-2">
            {tool.description}
          </p>
        </div>
      </div>

      {/* Footer row */}
      <div className="mt-4 pt-3 flex items-center justify-between border-t border-border-base">
        <div className="flex items-center gap-1.5 min-w-0">
          {tierLabel && (
            <span className={`tier-badge shrink-0 ${tool.tier === 2 ? "tier-badge-2" : "tier-badge-3"}`}>
              {tierLabel}
            </span>
          )}
          <span className={`text-[10px] uppercase tracking-wider font-bold truncate ${label}`}>
            {tool.subCategory}
          </span>
        </div>
        <span className="w-6 h-6 rounded-full flex items-center justify-center text-text-tertiary opacity-60 group-hover:opacity-100 group-hover:bg-accent group-hover:text-white transition-all duration-200 shrink-0">
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform duration-200 group-hover:translate-x-px"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
