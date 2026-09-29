"use client";

// Client-side tool search for /search — instant results as you type,
// with the query mirrored into the URL (?q=...) so searches are shareable
// and bookmarkable.

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { searchTools, type SearchResult } from "@/lib/search";

export function SearchClient() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Restore ?q= from the URL on mount (shareable search URLs).
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get("q");
    if (initial) {
      setQuery(initial);
      setResults(searchTools(initial, 12));
    }
  }, []);

  // Live search + URL sync (replaceState so back-button stays sane).
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      setResults(searchTools(trimmed, 12));
      setSelectedIdx(0);
      const url = new URL(window.location.href);
      url.searchParams.set("q", trimmed);
      window.history.replaceState(null, "", url.toString());
    }, 100);
    return () => window.clearTimeout(timer);
  }, [query]);

  const open = useCallback(
    (result: SearchResult | undefined) => {
      if (!result) return;
      router.push(`/tools/${result.tool.slug}`);
    },
    [router]
  );

  return (
    <div>
      <div className="relative max-w-2xl">
        <div className="flex items-center gap-3 px-4 sm:px-5 h-14 bg-bg-surface border border-border-strong rounded-2xl shadow-md transition-all duration-200 focus-within:border-accent/60 focus-within:ring-4 focus-within:ring-accent/10">
          <svg
            width="18"
            height="18"
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
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") open(results[selectedIdx]);
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIdx((prev) => Math.min(prev + 1, results.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIdx((prev) => Math.max(prev - 1, 0));
              }
            }}
            placeholder="Search 200+ tools — try “merge pdf” or “word to pdf”"
            className="flex-1 bg-transparent outline-none body-md text-text-primary placeholder:text-text-tertiary"
            aria-label="Search tools"
            autoComplete="off"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
                const url = new URL(window.location.href);
                url.searchParams.delete("q");
                window.history.replaceState(null, "", url.toString());
              }}
              className="text-text-tertiary hover:text-text-primary transition-colors p-1 rounded-md"
              aria-label="Clear search"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div ref={resultsRef} className="mt-5">
        {query.trim() && (
          <p className="text-[12.5px] font-medium text-text-tertiary mb-3" aria-live="polite">
            {results.length > 0
              ? `${results.length} tool${results.length === 1 ? "" : "s"} matching “${query.trim()}”`
              : `No tools matching “${query.trim()}” — try fewer words, or browse the A–Z index below.`}
          </p>
        )}
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {results.map((result, i) => (
            <li key={result.tool.slug}>
              <button
                onClick={() => open(result)}
                onMouseEnter={() => setSelectedIdx(i)}
                className={`w-full text-left card p-4 transition-colors ${
                  i === selectedIdx ? "border-accent/60" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[14px] font-bold text-text-primary">
                    {result.tool.name}
                  </span>
                  <span className="text-[9.5px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide bg-accent-subtle text-accent shrink-0">
                    {result.matchType}
                  </span>
                </div>
                <p className="text-[12.5px] leading-relaxed text-text-secondary line-clamp-2">
                  {result.tool.description}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
