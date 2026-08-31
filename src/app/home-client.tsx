"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ToolCard } from "@/components/tool-card";
import { SectionIcon } from "@/components/icon";
import { searchTools, getCategoryColor } from "@/lib/search";
import { ToolIcon } from "@/components/icon";
import { SUB_CATEGORY_LABELS, type ToolDef, type SubCategory } from "@/lib/catalog";

interface HomeClientProps {
  pdfTools: ToolDef[];
  wordTools: ToolDef[];
  imageTools: ToolDef[];
  crossTools: ToolDef[];
}

const PDF_SECTIONS: SubCategory[] = ["organize", "convert", "edit", "security", "sign", "form", "image", "info", "utility", "batch"];
const WORD_SECTIONS: SubCategory[] = ["organize", "convert", "edit", "security", "sign", "image", "info", "utility"];
const IMAGE_SECTIONS: SubCategory[] = ["convert", "crop", "rotate", "filters", "adjust", "effects", "annotate", "info", "utility"];

export function HomeClient({ pdfTools, wordTools, imageTools, crossTools }: HomeClientProps) {
  const [activeTab, setActiveTab] = useState<"pdf" | "word" | "image">("pdf");
  const [mounted, setMounted] = useState(false);
  const [heroQuery, setHeroQuery] = useState("");
  const [heroResults, setHeroResults] = useState<Array<{ tool: ToolDef; score: number }>>([]);
  const [heroSelectedIdx, setHeroSelectedIdx] = useState(0);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <div className="grid-bg">
      {/* Hero with mesh gradient orbs */}
      <section className="relative art-bg pt-16 sm:pt-24 pb-12 sm:pb-16">
        {/* Animated mesh gradient orbs */}
        <div className="mesh-gradient" aria-hidden="true">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-surface/80 backdrop-blur-sm border border-border-base text-xs font-medium text-text-secondary mb-6 transition-all duration-500 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            100% client-side processing
          </div>

          {/* Headline */}
          <h1
            className={`heading-xl text-text-primary mb-4 transition-all duration-500 delay-75 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Free{" "}
            <span className="gradient-text">PDF & Word</span>
            <br />
            Tools in Your Browser
          </h1>

          {/* Subtitle */}
          <p
            className={`body-lg text-text-secondary max-w-xl mx-auto mb-8 transition-all duration-500 delay-150 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Merge, split, compress, convert, and edit documents.
            100% free. No upload. No account. No tracking.
          </p>

          {/* Search Bar */}
          <div
            className={`relative max-w-lg mx-auto mb-6 transition-all duration-500 delay-150 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-surface/80 backdrop-blur-sm border border-border-base focus-within:border-accent/50 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary shrink-0">
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
                placeholder="Search 100+ tools... (merge, compress, convert)"
                className="flex-1 bg-transparent text-text-primary text-sm placeholder:text-text-tertiary outline-none"
              />
              <kbd className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-bg-elevated border border-border-base text-[10px] text-text-tertiary font-mono">
                Ctrl+K
              </kbd>
            </div>

            {/* Hero search results dropdown */}
            {heroResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-bg-surface border border-border-strong shadow-2xl overflow-hidden z-50 animate-fade-in-up">
                <div className="py-1">
                  {heroResults.map((result, i) => (
                    <button
                      key={result.tool.slug}
                      onClick={() => router.push(`/tools/${result.tool.slug}`)}
                      onMouseEnter={() => setHeroSelectedIdx(i)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        i === heroSelectedIdx ? "bg-accent-subtle" : "hover:bg-bg-hover"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-bg-elevated border border-border-base shrink-0">
                        <ToolIcon name={result.tool.slug} size={16} className="text-text-secondary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-[13px] font-semibold ${i === heroSelectedIdx ? "text-accent" : "text-text-primary"}`}>
                          {result.tool.name}
                        </span>
                        <p className="text-[11px] text-text-tertiary truncate">{result.tool.description}</p>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${getCategoryColor(result.tool.category)}`}>
                        {result.tool.category.toUpperCase()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tab Switcher */}
          <div
            className={`inline-flex items-center p-1 rounded-xl bg-bg-surface/80 backdrop-blur-sm border border-border-base transition-all duration-500 delay-200 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >            {(["pdf", "word", "image"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={
                  `relative px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200
                  ${activeTab === tab
                    ? "text-text-on-accent bg-accent shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                  }`
                }
              >
                {tab === "pdf" ? "PDF Tools" : tab === "word" ? "Word Tools" : "Image Tools"}
              </button>
            ))}
          </div>

          {/* Tool count */}
          <p className={`mt-5 text-xs text-text-tertiary transition-all duration-500 delay-300 ${
            mounted ? "opacity-100" : "opacity-0"
          }`}>
            {activeTab === "pdf" ? "61" : activeTab === "word" ? "32" : "60"} tools available
          </p>
        </div>
      </section>

      {/* Cross-format tools */}
      {crossTools.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-12">
          <div className="flex items-center gap-3 mb-5">
            <SectionIcon name="convert" size={14} className="text-text-tertiary" />
            <h2 className="caption font-semibold text-text-tertiary uppercase tracking-wider">
              Cross-Format
            </h2>
            <div className="flex-1 h-px bg-border-base" />
            <span className="text-[10px] text-text-tertiary bg-bg-elevated px-2 py-0.5 rounded">
              {crossTools.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 stagger">
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
            <div key={subCat} className="mb-10 sm:mb-14">
              {/* Section Header */}
              <div className="flex items-center gap-3 mb-4">
                <SectionIcon name={subCat} size={14} className="text-text-tertiary" />
                <h2 className="caption font-semibold text-text-tertiary uppercase tracking-wider">
                  {SUB_CATEGORY_LABELS[subCat]}
                </h2>
                <div className="flex-1 h-px bg-border-base" />
                <span className="text-[10px] text-text-tertiary bg-bg-elevated px-2 py-0.5 rounded">
                  {sectionTools.length}
                </span>
              </div>

              {/* Tool Grid */}
              <div className={`grid gap-3 ${
                activeTab === "pdf"
                  ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              } stagger`}>
                {sectionTools.map((tool, i) => (
                  <ToolCard key={tool.slug} tool={tool} index={i} />
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* Bottom trust strip */}
      <section className="relative border-t border-border-base bg-bg-surface/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
          <h2 className="heading-lg text-text-primary mb-3">
            Everything runs locally
          </h2>
          <p className="body-md text-text-secondary max-w-md mx-auto mb-6">
            Your files never touch our servers. Every operation happens
            in your browser using WebAssembly and JavaScript.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-text-tertiary">
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              No uploads
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              No accounts
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              No tracking
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
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
