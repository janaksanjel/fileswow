"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ToolCard } from "@/components/tool-card";
import { searchTools, getCategoryColor } from "@/lib/search";
import { ToolIcon } from "@/components/icon";
import { SUB_CATEGORY_LABELS, type ToolDef, type SubCategory } from "@/lib/catalog";

interface HomeClientProps {
  pdfTools: ToolDef[];
  wordTools: ToolDef[];
  imageTools: ToolDef[];
  textTools: ToolDef[];
  crossTools: ToolDef[];
}

const PDF_SECTIONS: SubCategory[] = ["organize", "convert", "edit", "security", "sign", "form", "image", "info", "utility", "batch"];
const WORD_SECTIONS: SubCategory[] = ["organize", "convert", "edit", "security", "sign", "image", "info", "utility"];
const IMAGE_SECTIONS: SubCategory[] = ["convert", "crop", "rotate", "filters", "adjust", "effects", "annotate", "info", "utility"];

export function HomeClient({ pdfTools, wordTools, imageTools, textTools, crossTools }: HomeClientProps) {
  const [activeTab, setActiveTab] = useState<"pdf" | "word" | "image">("pdf");
  const [heroQuery, setHeroQuery] = useState("");
  const [heroResults, setHeroResults] = useState<Array<{ tool: ToolDef; score: number }>>([]);
  const [heroSelectedIdx, setHeroSelectedIdx] = useState(0);
  const router = useRouter();

  // Hero search
  useEffect(() => {
    if (!heroQuery.trim()) {
      setHeroResults([]);
      return;
    }
    const timer = setTimeout(() => {
      const found = searchTools(heroQuery, 8);
      setHeroResults(found);
      setHeroSelectedIdx(0);
    }, 100);
    return () => clearTimeout(timer);
  }, [heroQuery]);

  const tools = activeTab === "pdf" ? pdfTools : activeTab === "word" ? wordTools : imageTools;
  const sections = activeTab === "pdf" ? PDF_SECTIONS : activeTab === "word" ? WORD_SECTIONS : IMAGE_SECTIONS;

  return (
    <div>
      {/* Hero */}
      <section className="pt-16 sm:pt-24 pb-14 sm:pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-bg-surface border-2 border-border-strong shadow-[3px_3px_0_var(--shadow-color)] text-[11px] font-extrabold uppercase tracking-widest text-text-secondary mb-7">
            <span className="w-2.5 h-2.5 bg-accent border-2 border-border-strong" />
            100% client-side
          </div>

          {/* Headline */}
          <h1 className="heading-xl text-text-primary mb-4">
            Free{" "}
            <span className="text-accent">PDF &amp; Word</span>{" "}
            Tools in Your Browser
          </h1>

          {/* Subtitle */}
          <p className="body-lg text-text-secondary max-w-xl mx-auto mb-9">
            Merge, split, compress, convert, and edit documents.
            Free. No upload. No account. Private.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-lg mx-auto mb-7">
            <div className="flex items-center gap-3 px-4 py-3 bg-bg-surface border-2 border-border-strong shadow-[4px_4px_0_var(--shadow-color)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" className="text-text-tertiary shrink-0">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={heroQuery}
                onChange={(e) => setHeroQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && heroResults[heroSelectedIdx]) {
                    router.push(`/tools/${heroResults[heroSelectedIdx].tool.slug}`);
                  }
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setHeroSelectedIdx((prev) => Math.min(prev + 1, heroResults.length - 1));
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setHeroSelectedIdx((prev) => Math.max(prev - 1, 0));
                  }
                }}
                placeholder="Search tools..."
                className="flex-1 bg-transparent text-text-primary text-sm font-medium placeholder:text-text-tertiary outline-none"
              />
              <kbd className="hidden sm:flex items-center px-1.5 py-0.5 bg-bg-elevated border-2 border-border-strong text-[10px] font-bold text-text-tertiary font-mono">
                Ctrl+K
              </kbd>
            </div>

            {/* Hero search results dropdown */}
            {heroResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-bg-surface border-2 border-border-strong shadow-[6px_6px_0_var(--shadow-color)] overflow-hidden z-50 text-left">
                <div className="py-1">
                  {heroResults.map((result, i) => (
                    <button
                      key={result.tool.slug}
                      onClick={() => router.push(`/tools/${result.tool.slug}`)}
                      onMouseEnter={() => setHeroSelectedIdx(i)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                        i === heroSelectedIdx
                          ? "bg-bg-elevated"
                          : "hover:bg-bg-hover"
                      }`}
                    >
                      <div className="w-8 h-8 flex items-center justify-center bg-bg-surface border-2 border-border-strong shrink-0">
                        <ToolIcon name={result.tool.slug} size={16} className="text-text-secondary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block text-[13px] font-bold text-text-primary truncate">
                          {result.tool.name}
                        </span>
                        <p className="text-[11px] text-text-tertiary truncate">{result.tool.description}</p>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 border-2 border-border-strong font-extrabold shrink-0 ${getCategoryColor(result.tool.category)}`}>
                        {result.tool.category.toUpperCase()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tab Switcher */}
          <div className="inline-flex items-stretch gap-0 bg-bg-elevated border-2 border-border-strong shadow-[3px_3px_0_var(--shadow-color)] p-1">
            {(["pdf", "word", "image"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 text-sm font-extrabold uppercase tracking-wide transition-colors border-2 ${
                  activeTab === tab
                    ? "text-text-on-accent bg-accent border-border-strong shadow-[2px_2px_0_var(--shadow-color)]"
                    : "text-text-secondary border-transparent hover:text-text-primary"
                }`}
              >
                {tab === "pdf" ? "PDF" : tab === "word" ? "Word" : "Image"}
              </button>
            ))}
          </div>

          {/* Tool count */}
          <p className="mt-5 text-xs font-bold text-text-tertiary uppercase tracking-wider">
            {activeTab === "pdf" ? "61" : activeTab === "word" ? "32" : "60"} tools
          </p>
        </div>
      </section>

      {/* Text tools */}
      {textTools.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-12">
          <SectionLabel label="Text Tools" count={textTools.length} />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {textTools.map((tool, i) => (
              <ToolCard key={tool.slug} tool={tool} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Cross-format tools */}
      {crossTools.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-12">
          <SectionLabel label="Cross-Format" count={crossTools.length} />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {crossTools.map((tool, i) => (
              <ToolCard key={tool.slug} tool={tool} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Tool Sections */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 sm:pb-28">
        {sections.map((subCat) => {
          const sectionTools = tools.filter((t) => t.subCategory === subCat);
          if (sectionTools.length === 0) return null;
          return (
            <div key={subCat} className="mb-10 sm:mb-12">
              <SectionLabel label={SUB_CATEGORY_LABELS[subCat]} count={sectionTools.length} />
              <div className={`grid gap-3 ${
                activeTab === "pdf"
                  ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              }`}>
                {sectionTools.map((tool, i) => (
                  <ToolCard key={tool.slug} tool={tool} index={i} />
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* Bottom trust strip */}
      <section className="border-t-2 border-border-strong bg-bg-surface">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h2 className="heading-lg text-text-primary mb-3">
            Everything runs locally
          </h2>
          <p className="body-md text-text-secondary max-w-md mx-auto mb-8">
            Your files never leave your device. Every operation runs
            in your browser using WebAssembly and JavaScript.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-text-tertiary">
            <span className="flex items-center gap-2 px-3 py-1.5 bg-bg-surface border-2 border-border-strong">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" className="text-success">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              No uploads
            </span>
            <span className="flex items-center gap-2 px-3 py-1.5 bg-bg-surface border-2 border-border-strong">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" className="text-success">
                <rect x="3" y="11" width="18" height="11" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              No accounts
            </span>
            <span className="flex items-center gap-2 px-3 py-1.5 bg-bg-surface border-2 border-border-strong">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" className="text-success">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              No tracking
            </span>
            <span className="flex items-center gap-2 px-3 py-1.5 bg-bg-surface border-2 border-border-strong">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" className="text-success">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Open source
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionLabel({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="w-3 h-3 bg-accent shrink-0" />
      <h2 className="text-[13px] font-extrabold uppercase tracking-widest text-text-secondary">
        {label}
      </h2>
      <div className="flex-1 border-b-2 border-border-base" />
      <span className="text-[10px] font-bold text-text-secondary bg-bg-surface border-2 border-border-strong px-2 py-0.5">
        {count}
      </span>
    </div>
  );
}
