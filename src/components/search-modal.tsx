"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { searchTools, getCategoryColor, type SearchResult } from "@/lib/search";
import { ToolIcon } from "./icon";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Search as user types
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      const found = searchTools(query, 12);
      setResults(found);
      setSelectedIndex(0);
      setIsSearching(false);
    }, 80); // Debounce 80ms

    return () => clearTimeout(timer);
  }, [query]);

  const navigateTo = useCallback(
    (slug: string) => {
      onClose();
      router.push(`/tools/${slug}`);
    },
    [onClose, router]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (results[selectedIndex]) {
            navigateTo(results[selectedIndex].tool.slug);
          }
          break;
        case "Escape":
          onClose();
          break;
      }
    },
    [results, selectedIndex, navigateTo, onClose]
  );

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[selectedIndex] as HTMLElement;
    if (item) {
      item.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Global keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) {
          onClose();
        }
        // The parent will handle opening
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const matchTypeLabel = (type: SearchResult["matchType"]) => {
    switch (type) {
      case "exact": return "Exact";
      case "starts-with": return "Starts with";
      case "contains": return "Contains";
      case "fuzzy": return "Similar";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl mx-4 animate-fade-in-up">
        <div className="rounded-2xl bg-bg-surface border border-border-strong shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border-base">
            {/* Search icon */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-text-tertiary shrink-0"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search tools... (e.g. merge, compress, convert)"
              className="flex-1 bg-transparent text-text-primary text-[15px] placeholder:text-text-tertiary outline-none"
            />

            {/* Shortcut hint */}
            <kbd className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-bg-elevated border border-border-base text-[11px] text-text-tertiary font-mono">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[400px] overflow-y-auto">
            {query.trim() && results.length === 0 && !isSearching && (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-text-secondary">No tools found for &ldquo;{query}&rdquo;</p>
                <p className="text-xs text-text-tertiary mt-1">Try a different search term</p>
              </div>
            )}

            {isSearching && query.trim() && (
              <div className="px-5 py-6 text-center">
                <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin-slow mx-auto" />
              </div>
            )}

            {results.length > 0 && (
              <div className="py-2">
                {/* Results header */}
                <div className="px-4 py-1.5">
                  <span className="text-[11px] text-text-tertiary uppercase tracking-wider font-medium">
                    {results.length} result{results.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {results.map((result, i) => (
                  <button
                    key={result.tool.slug}
                    onClick={() => navigateTo(result.tool.slug)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      i === selectedIndex
                        ? "bg-accent-subtle"
                        : "hover:bg-bg-hover"
                    }`}
                  >
                    {/* Icon */}
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-bg-elevated border border-border-base shrink-0">
                      <ToolIcon name={result.tool.slug} size={18} className="text-text-secondary" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[13px] font-semibold ${i === selectedIndex ? "text-accent" : "text-text-primary"} truncate`}>
                          {highlightMatch(result.tool.name, query)}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${getCategoryColor(result.tool.category)}`}>
                          {result.tool.category.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-tertiary truncate mt-0.5">
                        {result.tool.description}
                      </p>
                    </div>

                    {/* Score badge */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] text-text-tertiary">
                        {matchTypeLabel(result.matchType)}
                      </span>
                      <div className="w-8 h-1.5 rounded-full bg-bg-elevated overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent/60"
                          style={{ width: `${result.score}%` }}
                        />
                      </div>
                    </div>

                    {/* Arrow on selected */}
                    {i === selectedIndex && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-accent shrink-0"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}

            {!query.trim() && (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-text-secondary mb-1">Start typing to search tools</p>
                <p className="text-xs text-text-tertiary">
                  Try: &ldquo;merge&rdquo;, &ldquo;compress&rdquo;, &ldquo;convert&rdquo;, &ldquo;sign&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-2.5 border-t border-border-base bg-bg-elevated/30">
            <div className="flex items-center gap-3 text-[10px] text-text-tertiary">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-bg-elevated border border-border-base font-mono">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-bg-elevated border border-border-base font-mono">↵</kbd>
                open
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-bg-elevated border border-border-base font-mono">esc</kbd>
                close
              </span>
            </div>
            <span className="text-[10px] text-text-tertiary">FilesWow.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Highlight matching characters in the tool name
 */
function highlightMatch(name: string, query: string): React.ReactNode {
  if (!query.trim()) return name;

  const q = query.toLowerCase();
  const nameLower = name.toLowerCase();
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;

  // Find all occurrences of query chars in sequence
  let qi = 0;
  const matchIndices: number[] = [];

  for (let ni = 0; ni < nameLower.length && qi < q.length; ni++) {
    if (nameLower[ni] === q[qi]) {
      matchIndices.push(ni);
      qi++;
    }
  }

  if (matchIndices.length === 0) return name;

  // Build highlighted string
  let i = 0;
  while (i < name.length) {
    if (matchIndices.includes(i)) {
      // Find consecutive matches
      let end = i + 1;
      while (matchIndices.includes(end)) end++;
      parts.push(
        <span key={`m-${i}`} className="text-accent font-bold underline decoration-accent/30 underline-offset-2">
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
