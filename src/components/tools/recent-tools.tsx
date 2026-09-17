"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  subscribeUsage,
  getRecentEntriesSnapshot,
  getEmptyEntriesSnapshot,
  type RecentToolEntry,
} from "@/lib/usage";
import { ToolIcon } from "@/components/icon";

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(ts).toLocaleDateString();
}

export default function RecentToolsTool() {
  const entries = useSyncExternalStore(
    subscribeUsage,
    getRecentEntriesSnapshot,
    getEmptyEntriesSnapshot
  );
  const [error] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      {entries.length > 0 ? (
        <div className="space-y-2">
          {entries.slice(0, 12).map((entry: RecentToolEntry, i) => (
            <Link
              key={entry.tool.slug}
              href={`/tools/${entry.tool.slug}`}
              className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-base hover:border-accent/30 transition-colors"
            >
              <span className="text-xs text-text-tertiary w-6 text-center font-mono">{i + 1}</span>
              <span className="w-9 h-9 rounded-lg bg-bg-surface ring-1 ring-inset ring-border-base flex items-center justify-center shrink-0">
                <ToolIcon name={entry.tool.slug} size={16} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">{entry.tool.name}</p>
                <p className="text-xs text-text-tertiary">{formatRelative(entry.lastUsed)}</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary"><path d="M9 18l6-6-6-6" /></svg>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-sm text-text-secondary">No recently used tools yet</p>
          <p className="text-xs text-text-tertiary mt-1">Tools you use will appear here automatically</p>
        </div>
      )}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
