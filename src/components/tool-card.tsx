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
      className="group relative flex flex-col p-4 rounded-xl bg-bg-surface border border-border-base hover:border-border-accent card-interactive overflow-hidden"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Top-edge accent glow on hover */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="flex items-start gap-3.5 mb-3">
        {/* Icon */}
        <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-bg-elevated border border-border-base group-hover:border-border-accent group-hover:bg-accent-subtle transition-all duration-200 shrink-0">
          <ToolIcon name={tool.slug} size={30} className="text-text-secondary group-hover:text-accent transition-colors" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[15px] font-bold text-text-primary truncate group-hover:text-accent transition-colors">
              {tool.name}
            </h3>
            {tierLabel && (
              <span className={`tier-badge ${tool.tier === 2 ? "tier-badge-2" : "tier-badge-3"}`}>
                {tierLabel}
              </span>
            )}
          </div>
          <p className="text-[13px] text-text-secondary leading-relaxed line-clamp-2">
            {tool.description}
          </p>
        </div>
      </div>

      {/* Footer hint */}
      <div className="mt-auto pt-2 flex items-center justify-between">
        <span className="text-[10px] text-text-tertiary uppercase tracking-wider font-medium">
          {tool.subCategory}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-text-tertiary group-hover:text-accent opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-1 group-hover:translate-x-0"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </div>
    </Link>
  );
}
