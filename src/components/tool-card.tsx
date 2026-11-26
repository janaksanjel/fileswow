"use client";

import Link from "next/link";
import type { ToolDef } from "@/lib/catalog";
import { ToolIcon } from "./icon";
import { categoryTile } from "@/lib/category-style";

interface ToolCardProps {
  tool: ToolDef;
  index?: number;
}

export function ToolCard({ tool, index = 0 }: ToolCardProps) {
  const tierLabel = tool.tier === 2 ? "WASM" : tool.tier === 3 ? "BETA" : null;

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group relative flex items-start gap-3.5 p-4 rounded-2xl bg-bg-surface border border-border-base hover:border-accent/40 hover:bg-bg-warm hover:shadow-[var(--elevation-md)] hover:-translate-y-0.5 transition-all duration-200 select-none"
      style={{ animationDelay: `${Math.min(index, 12) * 15}ms` }}
    >
      <span
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-inset ring-black/[0.04] dark:ring-white/[0.06] transition-transform duration-200 group-hover:scale-105 ${categoryTile(
          tool.category
        )}`}
      >
        <ToolIcon name={tool.slug} size={20} />
      </span>

      <div className="min-w-0 flex-1 pr-5">
        <div className="flex items-center gap-2">
          <h3 className="text-[14.5px] font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
            {tool.name}
          </h3>
          {tierLabel && (
            <span className="text-[10px] font-mono font-medium text-text-tertiary bg-bg-elevated px-1.5 py-0.5 rounded shrink-0">
              {tierLabel}
            </span>
          )}
        </div>
        <p className="text-[12.5px] text-text-secondary leading-snug line-clamp-2 mt-1">
          {tool.description}
        </p>
      </div>

      {/* Subtle top-right launch arrow */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="absolute top-4 right-4 text-text-tertiary opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:text-accent transition-all duration-200"
      >
        <line x1="7" y1="17" x2="17" y2="7" />
        <polyline points="7 7 17 7 17 17" />
      </svg>
    </Link>
  );
}
