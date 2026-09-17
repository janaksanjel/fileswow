"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ToolCard } from "@/components/tool-card";
import { searchTools, getCategoryColor } from "@/lib/search";
import { categoryTile } from "@/lib/category-style";
import { ToolIcon } from "@/components/icon";
import { SUB_CATEGORY_LABELS, TEXT_SUB_CATEGORIES, type ToolDef, type SubCategory } from "@/lib/catalog";
import {
  subscribeUsage,
  getRecentToolsSnapshot,
  getTopToolsSnapshot,
  getEmptyToolsSnapshot,
  clearUsageHistory,
  hasPersonalHistorySnapshot,
} from "@/lib/usage";
import { AdSlot } from "@/components/ad-unit";

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

export function HomeClient({ pdfTools, wordTools, imageTools, textTools, crossTools }: HomeClientProps) {
  const [heroQuery, setHeroQuery] = useState("");
  const [heroResults, setHeroResults] = useState<Array<{ tool: ToolDef; score: number }>>([]);
  const [heroSelectedIdx, setHeroSelectedIdx] = useState(0);
  const router = useRouter();

  // Recently used + popular — read via the usage store (localStorage-backed).
  // Server snapshot is empty to avoid hydration mismatch; the client snapshot
  // kicks in immediately after hydration.
  const recentTools = useSyncExternalStore(
    subscribeUsage,
    getRecentToolsSnapshot,
    getEmptyToolsSnapshot
  );
  const popularTools = useSyncExternalStore(
    subscribeUsage,
    getTopToolsSnapshot,
    getEmptyToolsSnapshot
  );
  // True once the visitor has used at least one tool — flips "Popular Tools" to "Top Tools For You"
  const hasPersonalHistory = useSyncExternalStore(
    subscribeUsage,
    hasPersonalHistorySnapshot,
    () => false
  );

  const handleClearHistory = useCallback(() => {
    clearUsageHistory();
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

  return (
    <div>
      {/* Hero */}
      <section className="hero-glow hero-grid pt-16 sm:pt-24 pb-14 sm:pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-bg-surface/70 backdrop-blur border border-border-base shadow-sm text-[12px] font-semibold text-text-secondary mb-7">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-50 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            Files processed locally — never uploaded
          </div>

          {/* Headline */}
          <h1 className="heading-xl text-text-primary mb-5 [text-wrap:balance]">
            Free <span className="text-gradient">PDF, Word &amp; Image</span> tools online
          </h1>

          {/* Subtitle */}
          <p className="body-lg text-text-secondary max-w-xl mx-auto mb-10">
            Merge, split, compress and convert files directly in your browser —
            no uploads, no sign-up, no watermarks.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto mb-9">
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
                placeholder="Search 100+ tools — try “merge pdf”…"
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
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ring-1 ring-inset ${categoryTile(result.tool.category)}`}>
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

          {/* Quick links to the category groups below */}
          <nav aria-label="Tool categories" className="flex flex-wrap items-center justify-center gap-2">
            <CategoryPill href="#pdf" label="PDF Tools" />
            <CategoryPill href="#word" label="Word Tools" />
            <CategoryPill href="#image" label="Image Tools" />
            <CategoryPill href="#text" label="Text Tools" />
          </nav>
        </div>
      </section>

      {/* Top tools — personalized: blends the user's own usage (frequency × recency decay)
          with the curated site-wide popularity order. */}
      {popularTools.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-12">
          <SectionLabel label={hasPersonalHistory ? "Top Tools For You" : "Popular Tools"} count={popularTools.length} icon={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-warning" aria-hidden="true">
              <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.2-6.3-4.5-6.3 4.5L8 14l-6-4.6h7.6z" />
            </svg>
          } />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {popularTools.map((tool, i) => (
              <ToolCard key={tool.slug} tool={tool} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Recently used — appears once the user has actually used a tool */}
      {recentTools.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-12">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-[13px] font-bold uppercase tracking-widest text-text-secondary whitespace-nowrap flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Recently Used
            </h2>
            <div className="flex-1 h-px bg-border-base" />
            <span className="text-[11px] font-bold text-text-tertiary bg-bg-elevated px-2 py-0.5 rounded-full whitespace-nowrap">
              {recentTools.length}
            </span>
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-text-tertiary hover:text-danger bg-bg-elevated hover:bg-danger/10 ring-1 ring-border-base hover:ring-danger/30 transition-colors whitespace-nowrap"
              aria-label="Clear recently used tools history"
              title="Clear history"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h18" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              </svg>
              Clear
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {recentTools.map((tool, i) => (
              <ToolCard key={tool.slug} tool={tool} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Ad — between the discovery sections and the category groups.
          Renders nothing (no gap) when no ad slot is configured. */}
      <AdSlot slot="home" label="leaderboard (home)" className="max-w-6xl mx-auto px-4 sm:px-6 mb-12" />

      {/* Category groups — every category on one page, anchor-linked from the hero */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-4">
        <CategoryGroup id="pdf" title="PDF Tools" tools={pdfTools} sections={PDF_SECTIONS} />
        <CategoryGroup id="word" title="Word Tools" tools={wordTools} sections={WORD_SECTIONS} />
        <CategoryGroup id="image" title="Image Tools" tools={imageTools} sections={IMAGE_SECTIONS} />
        <CategoryGroup id="text" title="Text Tools" tools={textTools} sections={TEXT_SECTIONS} />
        {crossTools.length > 0 && (
          <CategoryGroup id="cross" title="Cross-Format Tools" tools={crossTools} sections={[]} />
        )}
      </div>

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
          {/* Social-proof strip */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] font-medium text-text-tertiary">
            <span className="inline-flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="text-warning" aria-hidden="true">
                <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.2-6.3-4.5-6.3 4.5L8 14l-6-4.6h7.6z" />
              </svg>
              100+ free tools
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success" aria-hidden="true">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Works offline after first visit
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-blue" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              No sign-up, no watermarks
            </span>
          </div>
        </div>
      </section>

      {/* FAQ — accordion with FAQPage schema (server-rendered in page.tsx) */}
      <section id="faq" aria-labelledby="faq-heading" className="border-t border-border-base bg-bg-base">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="text-center mb-10">
            <h2 id="faq-heading" className="heading-lg text-text-primary mb-3">
              Frequently asked questions
            </h2>
            <p className="body-md text-text-secondary max-w-md mx-auto">
              Everything you need to know about using FilesWow.
            </p>
          </div>
          <FaqAccordion items={FAQ_ITEMS} />
        </div>
      </section>
    </div>
  );
}

/* ─── Shared section bits ─────────────────────────────────── */

function SectionLabel({ label, count, icon }: { label: string; count: number; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <h3 className="text-[12.5px] font-bold uppercase tracking-widest text-text-secondary whitespace-nowrap flex items-center gap-1.5">
        {icon}
        {label}
      </h3>
      <div className="flex-1 h-px bg-border-base" />
      <span className="text-[10.5px] font-bold text-text-tertiary bg-bg-elevated ring-1 ring-inset ring-border-base px-2 py-0.5 rounded-full whitespace-nowrap">
        {count}
      </span>
    </div>
  );
}

/* Anchor chip in the hero linking to a category group */
function CategoryPill({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="hero-chip">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="9 18 15 12 9 6" />
      </svg>
      {label}
    </a>
  );
}

/* One full category: heading row, then tools grouped by sub-category */
function CategoryGroup({
  id,
  title,
  tools,
  sections,
}: {
  id: string;
  title: string;
  tools: ToolDef[];
  sections: SubCategory[];
}) {
  if (tools.length === 0) return null;
  return (
    <section id={id} className="scroll-mt-24 mb-14">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="heading-md text-text-primary whitespace-nowrap">{title}</h2>
        <div className="flex-1 h-px bg-border-base" />
        <span className="text-[11px] font-bold text-text-tertiary bg-bg-elevated ring-1 ring-inset ring-border-base px-2 py-0.5 rounded-full whitespace-nowrap">
          {tools.length}
        </span>
      </div>
      <div className="space-y-10">
        {sections.map((subCat) => {
          const sectionTools = tools.filter((t) => t.subCategory === subCat);
          if (sectionTools.length === 0) return null;
          return (
            <div key={subCat}>
              <SectionLabel label={SUB_CATEGORY_LABELS[subCat]} count={sectionTools.length} />
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {sectionTools.map((tool, i) => (
                  <ToolCard key={tool.slug} tool={tool} index={i} />
                ))}
              </div>
            </div>
          );
        })}
        {/* Fallback for tools whose subCategory isn't in the sections list */}
        {sections.length > 0 && (() => {
          const others = tools.filter((t) => !sections.includes(t.subCategory));
          if (others.length === 0) return null;
          return (
            <div>
              <SectionLabel label="More Tools" count={others.length} />
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {others.map((tool, i) => (
                  <ToolCard key={tool.slug} tool={tool} index={i} />
                ))}
              </div>
            </div>
          );
        })()}
        {/* Category with no sub-sections (e.g. Cross-Format) */}
        {sections.length === 0 && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {tools.map((tool, i) => (
              <ToolCard key={tool.slug} tool={tool} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
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

/* ─── FAQ data — copy mirrors the FAQPage JSON-LD in page.tsx ── */
const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: "Are these tools really free?",
    a: "Yes. Every tool on FilesWow is completely free with no usage limits, no watermarks, and no hidden premium tiers.",
  },
  {
    q: "Are my files uploaded to a server?",
    a: "No. All processing happens locally in your browser using JavaScript and WebAssembly. Your files never leave your device.",
  },
  {
    q: "Do I need to create an account?",
    a: "No account or email is required. Open a tool, add your file, and get the result — that's it.",
  },
  {
    q: "What file types are supported?",
    a: "FilesWow covers PDF, Word (DOCX), images (JPG, PNG, WebP, SVG), and plain text formats — over 100 tools across these categories.",
  },
  {
    q: "Is it safe to use with confidential documents?",
    a: "Yes. Because files are processed on your own device and never uploaded, confidential documents stay private — nothing is stored or logged anywhere.",
  },
  {
    q: "Does it work on mobile?",
    a: "Yes. The site works in any modern mobile or desktop browser. Files are processed on your device, so very large files may take longer on older phones.",
  },
];

function FaqAccordion({ items }: { items: Array<{ q: string; a: string }> }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="card overflow-hidden">
            <h3>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${i}`}
                id={`faq-button-${i}`}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer"
              >
                <span className="text-[14.5px] font-semibold text-text-primary">{item.q}</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className={`shrink-0 text-text-tertiary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </h3>
            <div
              id={`faq-panel-${i}`}
              role="region"
              aria-labelledby={`faq-button-${i}`}
              hidden={!isOpen}
            >
              <p className="px-5 pb-4 text-[13.5px] leading-relaxed text-text-secondary">
                {item.a}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
