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
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[14vh] animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Search tools"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[3px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-bg-surface rounded-2xl shadow-xl ring-1 ring-black/10 overflow-hidden animate-fade-in-up">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 sm:px-5 h-14">
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
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search 120+ tools…"
            className="flex-1 bg-transparent text-text-primary text-[15px] placeholder:text-text-tertiary outline-none min-w-0"
            aria-label="Search tools"
          />

          <span className="kbd shrink-0">ESC</span>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[380px] overflow-y-auto border-t border-border-base">
          {query.trim() && results.length === 0 && !isSearching && (
            <div className="px-4 py-12 text-center">
              <p className="text-sm font-medium text-text-primary">No tools found</p>
              <p className="text-xs text-text-tertiary mt-1">Try “merge”, “compress”, or a different term</p>
            </div>
          )}

          {isSearching && query.trim() && (
            <div className="px-4 py-8 text-center">
              <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin-slow mx-auto" />
            </div>
          )}

          {results.length > 0 && (
            <div className="py-1.5">
              {results.map((result, i) => (
                <button
                  key={result.tool.slug}
                  onClick={() => navigateTo(result.tool.slug)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    i === selectedIndex ? "bg-accent-subtle" : "hover:bg-bg-hover"
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-bg-surface ring-1 ring-inset ring-border-strong flex items-center justify-center shrink-0">
                    <ToolIcon name={result.tool.slug} size={17} className="text-text-secondary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[13.5px] font-semibold ${i === selectedIndex ? "text-accent" : "text-text-primary"} truncate`}>
                        {highlightMatch(result.tool.name, query)}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-text-tertiary truncate mt-px">
                      {result.tool.description}
                    </p>
                  </div>

                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${getCategoryColor(result.tool.category)}`}>
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

          {!query.trim() && (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-medium text-text-primary mb-1">Type to search</p>
              <p className="text-xs text-text-tertiary">
                Try “merge”, “compress”, “watermark”, or “background”
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-t border-border-base bg-bg-base/40">
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
          <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">FilesWow</span>
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
