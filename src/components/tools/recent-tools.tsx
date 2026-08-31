"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { ToolUIProps } from "@/components/tool-registry";

export default function RecentToolsTool({ onProcessing, onError }: ToolUIProps) {
  const [recent, setRecent] = useState<{ slug: string; name: string; lastUsed: string }[]>([]);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("recent-tools") : null;
    if (stored) setRecent(JSON.parse(stored));
  }, []);

  return (
    <div className="space-y-4">
      {recent.length > 0 ? (
        <div className="space-y-2">
          {recent.map((tool, i) => (
            <Link key={`${tool.slug}-${i}`} href={`/tools/${tool.slug}`} className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base hover:border-accent/30 transition-colors">
              <span className="text-xs text-text-tertiary w-6 text-center font-mono">{i + 1}</span>
              <div className="flex-1">
                <p className="text-sm text-text-primary">{tool.name}</p>
                <p className="text-xs text-text-tertiary">{tool.lastUsed}</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary"><path d="M9 18l6-6-6-6" /></svg>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-sm text-text-secondary">No recently used tools yet</p>
          <p className="text-xs text-text-tertiary mt-1">Tools you use will appear here</p>
        </div>
      )}
    </div>
  );
}
