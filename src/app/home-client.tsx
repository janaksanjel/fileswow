"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ToolCard } from "@/components/tool-card";
import { searchTools, getCategoryColor } from "@/lib/search";
import { ToolIcon } from "@/components/icon";
import { SUB_CATEGORY_LABELS, TEXT_SUB_CATEGORIES, type ToolDef, type SubCategory } from "@/lib/catalog";

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
const TEXT_SECTIONS: SubCategory[] = TEXT_SUB_CATEGORIES;

const CATEGORY_TABS = [
  { key: "pdf", label: "PDF" },
  { key: "word", label: "Word" },
  { key: "image", label: "Image" },
  { key: "text", label: "Text" },
] as const;

export function HomeClient({ pdfTools, wordTools, imageTools, textTools, crossTools }: HomeClientProps) {
  const [activeTab, setActiveTab] = useState<"pdf" | "word" | "image" | "text">("pdf");
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

  const tools = activeTab === "pdf" ? pdfTools : activeTab === "word" ? wordTools : activeTab === "image" ? imageTools : textTools;
  const sections = activeTab === "pdf" ? PDF_SECTIONS : activeTab === "word" ? WORD_SECTIONS : activeTab === "image" ? IMAGE_SECTIONS : TEXT_SECTIONS;
  const toolCount = activeTab === "pdf" ? pdfTools.length : activeTab === "word" ? wordTools.length : activeTab === "image" ? imageTools.length : textTools.length;

  return (
    <div>
      {/* Hero */}
      <section className="hero-glow pt-16 sm:pt-24 pb-14 sm:pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-surface border border-border-base shadow-sm text-[12px] font-semibold text-text-secondary mb-7">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-50 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            Files processed locally — never uploaded
          </div>

          {/* Headline */}
          <h1 className="heading-xl text-text-primary mb-5">
            Free <span className="text-accent">PDF &amp; Word</span> tools
            <br className="hidden sm:block" /> that respect your privacy
          </h1>

          {/* Subtitle */}
          <p className="body-lg text-text-secondary max-w-xl mx-auto mb-10">
            Merge, split, compress, convert, and edit documents.
            Free forever. No upload. No account.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto mb-8">
            <div className="flex items-center gap-3 px-4 sm:px-5 bg-bg-surface border border-border-strong rounded-2xl shadow-md transition-all duration-200 focus-within:border-accent/60 focus-within:ring-4 focus-within:ring-accent/10">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary shrink-0" aria-hidden="true">
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
                placeholder="Search all tools…"
                className="flex-1 bg-transparent h-13 py-3.5 text-text-primary text-[15px] font-medium placeholder:text-text-tertiary outline-none min-w-0"
                aria-label="Search tools"
              />
              <kbd className="hidden sm:flex shrink-0">Ctrl K</kbd>
            </div>

            {/* Hero search results dropdown */}
            {heroResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2.5 bg-bg-surface rounded-2xl shadow-xl ring-1 ring-border-base overflow-hidden z-50 text-left animate-fade-in-up">
                <div className="py-1.5 max-h-[360px] overflow-y-auto">
                  {heroResults.map((result, i) => (
                    <button
                      key={result.tool.slug}
                      onClick={() => router.push(`/tools/${result.tool.slug}`)}
                      onMouseEnter={() => setHeroSelectedIdx(i)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors ${
                        i === heroSelectedIdx ? "bg-accent-subtle" : "hover:bg-bg-hover"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-lg bg-bg-elevated flex items-center justify-center shrink-0 ring-1 ring-inset ring-border-strong">
                        <ToolIcon name={result.tool.slug} size={17} className="text-text-secondary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`block text-[13.5px] font-semibold truncate ${i === heroSelectedIdx ? "text-accent" : "text-text-primary"}`}>
                          {result.tool.name}
                        </span>
                        <p className="text-[11.5px] text-text-tertiary truncate">{result.tool.description}</p>
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${getCategoryColor(result.tool.category)}`}>
                        {result.tool.category}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tab Switcher */}
          <div className="inline-flex items-center rounded-2xl bg-bg-elevated border border-border-base p-1 gap-1 shadow-sm">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 sm:px-6 h-10 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  activeTab === tab.key
                    ? "text-text-primary bg-bg-surface shadow-sm ring-1 ring-border-base"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tool count */}
          <p className="mt-4 text-xs font-semibold text-text-tertiary">
            {toolCount} {toolCount === 1 ? "tool" : "tools"} · free forever · no account needed
          </p>
        </div>
      </section>

      {/* Text tools — hidden while the Text tab is active, since those tools are shown in the main grid below */}
      {textTools.length > 0 && activeTab !== "text" && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-12">
          <SectionLabel label="Text Tools" count={textTools.length} />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
            <div key={subCat} className="mb-12 sm:mb-14">
              <SectionLabel label={SUB_CATEGORY_LABELS[subCat]} count={sectionTools.length} />
              <div className={`grid gap-4 ${
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
      <section className="border-t border-border-base bg-bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <h2 className="heading-lg text-text-primary mb-3">
              Everything runs locally
            </h2>
            <p className="body-md text-text-secondary max-w-md mx-auto">
              Your files never leave your device. Every operation runs
              in your browser using WebAssembly and JavaScript.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <TrustItem
              icon={
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              }
              title="No uploads"
              caption="Nothing ever leaves this device"
            />
            <TrustItem
              icon={
                <>
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </>
              }
              title="No accounts"
              caption="Start working in seconds"
            />
            <TrustItem
              icon={
                <>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              }
              title="No tracking"
              caption="Private by design"
            />
            <TrustItem
              icon={
                <polyline points="20 6 9 17 4 12" />
              }
              title="Free forever"
              caption="No hidden premium tiers"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionLabel({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <h2 className="text-[13px] font-bold uppercase tracking-widest text-text-secondary whitespace-nowrap">
        {label}
      </h2>
      <div className="flex-1 h-px bg-border-base" />
      <span className="text-[11px] font-bold text-text-tertiary bg-bg-elevated px-2 py-0.5 rounded-full whitespace-nowrap">
        {count}
      </span>
    </div>
  );
}

function TrustItem({
  icon,
  title,
  caption,
}: {
  icon: React.ReactNode;
  title: string;
  caption: string;
}) {
  return (
    <div className="bg-bg-surface border border-border-base rounded-2xl p-5 text-center hover:border-border-strong transition-colors">
      <span className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center mx-auto mb-3">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {icon}
        </svg>
      </span>
      <p className="text-[13.5px] font-semibold text-text-primary mb-0.5">{title}</p>
      <p className="text-[11.5px] text-text-tertiary leading-relaxed">{caption}</p>
    </div>
  );
}
