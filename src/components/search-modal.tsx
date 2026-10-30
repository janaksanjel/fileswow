"use client";

import { useState, useEffect, useMemo, useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { searchTools, getCategoryColor } from "@/lib/search";
import { ALL_TOOLS } from "@/lib/catalog";
import { ToolIcon } from "./icon";
import { Dialog } from "./ui/dialog";
import {
  subscribeUsage,
  getRecentToolsSnapshot,
  getPopularToolsSnapshot,
  getEmptyToolsSnapshot,
  clearUsageHistory,
} from "@/lib/usage";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Command palette (⌘K / Ctrl+K) — fuzzy search over the full catalog,
 * recent tools on top, arrow-key navigation, category tag per row.
 */
export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const router = useRouter();

  // Recent + popular for the empty state — store-backed so they stay fresh
  const recentTools = useSyncExternalStore(
    subscribeUsage,
    getRecentToolsSnapshot,
    getEmptyToolsSnapshot
  );
  const popularTools = useSyncExternalStore(
    subscribeUsage,
    getPopularToolsSnapshot,
    getEmptyToolsSnapshot
  );
  const popularQuick = popularTools.slice(0, 6);

  // Reset the query each time the palette opens — "adjust state during
  // render" pattern (no setState-in-effect cascade).
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setQuery("");
      setSelected(0);
    }
  }

  // Fuzzy search is synchronous and fast over the catalog — derive it
  // during render instead of debouncing through an effect.
  const trimmed = query.trim();
  const results = useMemo(() => (trimmed ? searchTools(trimmed, 12) : []), [trimmed]);
  const selectedIndex = Math.min(selected, Math.max(results.length - 1, 0));

  const navigateTo = useCallback(
    (slug: string) => {
      onClose();
      router.push(`/tools/${slug}`);
    },
    [onClose, router]
  );

  const handleClearHistory = useCallback(() => {
    clearUsageHistory();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelected((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelected((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (results[selectedIndex]) {
            navigateTo(results[selectedIndex].tool.slug);
          }
          break;
      }
    },
    [results, selectedIndex, navigateTo]
  );

  // Keep the highlighted row in view
  useEffect(() => {
    if (!open || !trimmed) return;
    const item = document.getElementById(`cmd-option-${selectedIndex}`);
    item?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex, trimmed, open]);

  return (
    <Dialog open={open} onClose={onClose} label="Search tools" className="w-full max-w-xl">
      <div className="bg-bg-surface rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] border border-white/80 dark:border-white/10 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 sm:px-5 h-14 bg-bg-input/40 border-b border-border-base">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-text-tertiary shrink-0"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            data-autofocus
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="cmd-listbox"
            aria-activedescendant={query.trim() && results[selectedIndex] ? `cmd-option-${selectedIndex}` : undefined}
            aria-label={`Search ${ALL_TOOLS.length} tools`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Search ${ALL_TOOLS.length} tools…`}
            className="flex-1 bg-transparent text-text-primary text-[15px] placeholder:text-text-tertiary outline-none min-w-0 h-full"
          />

          <span className="kbd shrink-0">esc</span>
        </div>

        {/* Results */}
        <div id="cmd-listbox" role="listbox" aria-label="Tools" className="max-h-[380px] overflow-y-auto">
          {trimmed && results.length === 0 && (
            <div className="px-4 py-12 text-center">
              <p className="text-sm font-medium text-text-primary">No tools found</p>
              <p className="text-xs text-text-tertiary mt-1">
                Try “merge”, “compress”, or a different term
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div className="py-1.5">
              {results.map((result, i) => (
                <button
                  key={result.tool.slug}
                  id={`cmd-option-${i}`}
                  role="option"
                  aria-selected={i === selectedIndex}
                  onClick={() => navigateTo(result.tool.slug)}                        onMouseEnter={() => setSelected(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    i === selectedIndex ? "bg-accent-subtle" : "hover:bg-bg-hover"
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-bg-surface ring-1 ring-inset ring-border-strong flex items-center justify-center shrink-0">
                    <ToolIcon name={result.tool.slug} size={17} className="text-text-secondary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <span
                      className={`block text-[13.5px] font-semibold truncate ${
                        i === selectedIndex ? "text-accent" : "text-text-primary"
                      }`}
                    >
                      {highlightMatch(result.tool.name, query)}
                    </span>
                    <p className="text-[12px] text-text-tertiary truncate mt-px">
                      {result.tool.description}
                    </p>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase shrink-0 ${getCategoryColor(
                      result.tool.category
                    )}`}
                  >
                    {result.tool.category}
                  </span>

                  {i === selectedIndex && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-accent shrink-0"
                      aria-hidden="true"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}

          {!trimmed && (recentTools.length > 0 || popularQuick.length > 0) && (
            <div className="py-2">
              {recentTools.length > 0 && (
                <>
                  <div className="px-4 pt-2 pb-1.5 flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-text-tertiary">
                      Recent
                    </p>
                    <button
                      onClick={handleClearHistory}
                      className="text-[11px] font-bold uppercase tracking-widest text-text-tertiary hover:text-danger transition-colors"
                      aria-label="Clear recently used tools history"
                    >
                      Clear
                    </button>
                  </div>
                  {recentTools.map((tool) => (
                    <button
                      key={tool.slug}
                      onClick={() => navigateTo(tool.slug)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-bg-hover transition-colors"
                    >
                      <div className="w-7 h-7 rounded-md bg-bg-surface ring-1 ring-inset ring-border-strong flex items-center justify-center shrink-0">
                        <ToolIcon name={tool.slug} size={14} className="text-text-secondary" />
                      </div>
                      <span className="text-[13px] font-medium text-text-primary truncate">
                        {tool.name}
                      </span>
                    </button>
                  ))}
                </>
              )}
              {popularQuick.length > 0 && (
                <>
                  <p className="px-4 pt-3 pb-1.5 text-[11px] font-bold uppercase tracking-widest text-text-tertiary">
                    Popular
                  </p>
                  <div className="flex flex-wrap gap-1.5 px-4 pb-2">
                    {popularQuick.map((tool) => (
                      <button
                        key={tool.slug}
                        onClick={() => navigateTo(tool.slug)}
                        className="px-2.5 py-1 rounded-full bg-bg-elevated ring-1 ring-border-base text-[12px] font-medium text-text-secondary hover:text-accent hover:ring-accent/40 transition-colors"
                      >
                        {tool.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {!trimmed && recentTools.length === 0 && popularQuick.length === 0 && (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-medium text-text-primary mb-1">Type to search</p>
              <p className="text-xs text-text-tertiary">
                Try “merge”, “compress”, “watermark”, or “background”
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-t border-border-base bg-bg-base">
          <div className="flex items-center gap-4 text-[11px] font-medium text-text-tertiary">
            <span className="flex items-center gap-1.5">
              <span className="kbd">↑↓</span>
              navigate
            </span>
            <span className="flex items-center gap-1.5">
              <span className="kbd">↵</span>
              open
            </span>
            <span className="flex items-center gap-1.5">
              <span className="kbd">esc</span>
              close
            </span>
          </div>
          <span className="text-[11px] font-medium text-text-tertiary tabular-nums">
            {ALL_TOOLS.length} tools
          </span>
        </div>
      </div>
    </Dialog>
  );
}

function highlightMatch(name: string, query: string): React.ReactNode {
  if (!query.trim()) return name;

  const q = query.toLowerCase();
  const nameLower = name.toLowerCase();
  const parts: React.ReactNode[] = [];

  let qi = 0;
  const matchIndices: number[] = [];

  for (let ni = 0; ni < nameLower.length && qi < q.length; ni++) {
    if (nameLower[ni] === q[qi]) {
      matchIndices.push(ni);
      qi++;
    }
  }

  if (matchIndices.length === 0) return name;

  let i = 0;
  while (i < name.length) {
    if (matchIndices.includes(i)) {
      let end = i + 1;
      while (matchIndices.includes(end)) end++;
      parts.push(
        <span key={`m-${i}`} className="text-accent font-semibold">
          {name.slice(i, end)}
        </span>
      );
      i = end;
    } else {
      let end = i + 1;
      while (end < name.length && !matchIndices.includes(end)) end++;
      parts.push(<span key={`t-${i}`}>{name.slice(i, end)}</span>);
      i = end;
    }
  }

  return <>{parts}</>;
}
