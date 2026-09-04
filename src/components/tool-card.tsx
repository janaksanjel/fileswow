"use client";

import Link from "next/link";
import type { ToolDef } from "@/lib/catalog";
import { ToolIcon } from "./icon";

interface ToolCardProps {
  tool: ToolDef;
  index?: number;
}

export function ToolCard({ tool, index = 0 }: ToolCardProps) {
  const tierLabel = tool.tier === 2 ? "WASM" : tool.tier === 3 ? "BETA" : null;

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="card card-interactive group flex flex-col p-4"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <span className="w-10 h-10 flex items-center justify-center bg-bg-surface border-2 border-border-strong shrink-0 group-hover:border-accent transition-colors">
          <ToolIcon name={tool.slug} size={20} className="text-text-secondary group-hover:text-accent transition-colors" />
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-[13px] font-bold text-text-primary truncate">
              {tool.name}
            </h3>
            {tierLabel && (
              <span className={`tier-badge shrink-0 ${tool.tier === 2 ? "tier-badge-2" : "tier-badge-3"}`}>
                {tierLabel}
              </span>
            )}
          </div>
          <p className="text-[12px] text-text-secondary leading-relaxed line-clamp-2">
            {tool.description}
          </p>
        </div>
      </div>

      {/* Footer hint */}
      <div className="mt-3 pt-2.5 flex items-center justify-between border-t-2 border-border-base">
        <span className="text-[10px] text-text-tertiary uppercase tracking-wider font-bold">
          {tool.subCategory}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="square"
          className="text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </div>
    </Link>
  );
}
