"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getToolsByCategory } from "@/lib/catalog";
import type { ToolUIProps } from "@/components/tool-registry";

export default function CommandPaletteTool({ onProcessing, onError }: ToolUIProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const allTools = [...getToolsByCategory("pdf"), ...getToolsByCategory("word"), ...getToolsByCategory("cross")];
  const filtered = query.trim()
    ? allTools.filter(t => t.name.toLowerCase().includes(query.toLowerCase()) || t.slug.includes(query.toLowerCase()) || t.description.toLowerCase().includes(query.toLowerCase()))
    : allTools.slice(0, 20);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="space-y-4">
      <div className="relative">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
        <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm focus:border-accent focus:outline-none" placeholder="Search tools... (e.g., merge, compress, convert)" />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-text-tertiary bg-bg-surface px-1.5 py-0.5 rounded border border-border-base">ESC</kbd>
      </div>
      <p className="text-xs text-text-tertiary">{filtered.length} tool{filtered.length !== 1 ? "s" : ""} found</p>
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {filtered.map(tool => (
          <Link key={tool.slug} href={`/tools/${tool.slug}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-elevated transition-colors">
            <span className="text-lg w-8 text-center">{tool.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary font-medium">{tool.name}</p>
              <p className="text-xs text-text-tertiary truncate">{tool.description}</p>
            </div>
            <span className="text-[10px] text-text-tertiary uppercase bg-bg-surface px-2 py-0.5 rounded">{tool.category}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
