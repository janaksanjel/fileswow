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

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

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
    }, 80);

    return () => clearTimeout(timer);
  }, [query]);

  const navigateTo = useCallback(
    (slug: string) => {
      onClose();
      router.push(`/tools/${slug}`);
    },
    [onClose, router]
  );

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

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[selectedIndex] as HTMLElement;
    if (item) {
      item.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl mx-4 animate-fade-in-up">
        <div className="bg-bg-surface border-2 border-border-strong shadow-[8px_8px_0_var(--shadow-color)] overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b-2 border-border-strong">
            <svg
              width="16"
              height="16"
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
              placeholder="Search tools..."
              className="flex-1 bg-transparent text-text-primary text-[14px] placeholder:text-text-tertiary outline-none"
            />

            <kbd className="hidden sm:flex items-center px-1.5 py-0.5 bg-bg-elevated border-2 border-border-strong text-[10px] font-bold text-text-tertiary font-mono">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[360px] overflow-y-auto">
            {query.trim() && results.length === 0 && !isSearching && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-text-secondary">No tools found</p>
                <p className="text-xs text-text-tertiary mt-1">Try a different term</p>
              </div>
            )}

            {isSearching && query.trim() && (
              <div className="px-4 py-6 text-center">
                <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin-slow mx-auto" />
              </div>
            )}

            {results.length > 0 && (
              <div className="py-1">
                {results.map((result, i) => (
                  <button
                    key={result.tool.slug}
                    onClick={() => navigateTo(result.tool.slug)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                      i === selectedIndex
                        ? "bg-bg-elevated"
                        : "hover:bg-bg-hover"
                    }`}
                  >
                    <div className="w-8 h-8 flex items-center justify-center bg-bg-elevated border-2 border-border-strong shrink-0">
                      <ToolIcon name={result.tool.slug} size={16} className="text-text-secondary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[13px] font-medium ${i === selectedIndex ? "text-accent" : "text-text-primary"} truncate`}>
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

                    {i === selectedIndex && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-text-secondary shrink-0"
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
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-text-secondary mb-1">Type to search</p>
                <p className="text-xs text-text-tertiary">
                  Try &ldquo;merge&rdquo;, &ldquo;compress&rdquo;, or &ldquo;convert&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t-2 border-border-strong">
            <div className="flex items-center gap-3 text-[10px] font-medium text-text-tertiary">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-bg-elevated border-2 border-border-strong font-mono">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-bg-elevated border-2 border-border-strong font-mono">↵</kbd>
                open
              </span>
            </div>
            <span className="text-[10px] font-bold text-text-tertiary">FilesWow</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function highlightMatch(name: string, query: string): React.ReactNode {
  if (!query.trim()) return name;

  const q = query.toLowerCase();
  const nameLower = name.toLowerCase();
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;

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
        <span key={`m-${i}`} className="text-accent font-medium">
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
