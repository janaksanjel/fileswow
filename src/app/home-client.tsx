"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ToolCard } from "@/components/tool-card";
import { Accordion } from "@/components/ui/accordion";
import { searchTools } from "@/lib/search";
import { ToolIcon } from "@/components/icon";
import { ALL_TOOLS, CATEGORY_COUNTS, type ToolDef, type ToolCategory } from "@/lib/catalog";
import {
  POPULAR_DEFAULT_SLUGS,
  subscribeUsage,
  getTopToolsSnapshot,
  getRecentToolsSnapshot,
  getEmptyToolsSnapshot,
  hasPersonalHistorySnapshot,
} from "@/lib/usage";
import { useReveal } from "@/lib/use-reveal";
import { AdSlot } from "@/components/ad-unit";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { BLOG_POSTS } from "@/lib/blog";

const CURATED_POPULAR = new Set(POPULAR_DEFAULT_SLUGS);
const ORDERED_TOOLS: ToolDef[] = [
  ...ALL_TOOLS.filter((t) => CURATED_POPULAR.has(t.slug)),
  ...ALL_TOOLS.filter((t) => !CURATED_POPULAR.has(t.slug)),
];

const TOOL_BY_SLUG = new Map(ALL_TOOLS.map((t) => [t.slug, t]));

const QUICK_SLUGS = [
  "merge-pdf",
  "compress-pdf",
  "pdf-to-word",
  "jpg-to-pdf",
  "sign-pdf",
  "split-pdf",
  "word-to-pdf",
  "background-remove-image",
];

interface WorkbenchTabSpec {
  id: ToolCategory;
  label: string;
  href: string;
  count: number;
  tools: string[];
}

const WORKBENCH_TABS: WorkbenchTabSpec[] = [
  {
    id: "pdf",
    label: "PDF",
    href: "/pdf-tools",
    count: CATEGORY_COUNTS.pdf,
    tools: ["merge-pdf", "compress-pdf", "split-pdf", "pdf-to-word", "sign-pdf"],
  },
  {
    id: "word",
    label: "Word",
    href: "/word-tools",
    count: CATEGORY_COUNTS.word,
    tools: ["word-to-pdf", "merge-word", "split-word", "word-to-text", "compress-word"],
  },
  {
    id: "image",
    label: "Image",
    href: "/image-tools",
    count: CATEGORY_COUNTS.image,
    tools: ["compress-image", "background-remove-image", "resize-image", "crop-image", "jpg-to-pdf"],
  },
  {
    id: "text",
    label: "Text & P2P",
    href: "/transfer",
    count: CATEGORY_COUNTS.text,
    tools: ["p2p-text"],
  },
];

type ChipId = "all" | "organize" | "convert" | "edit" | "optimize" | "security" | "image";

const CHIPS: Array<{ id: ChipId; label: string; match: (t: ToolDef) => boolean }> = [
  { id: "all", label: "All", match: () => true },
  { id: "organize", label: "Organize", match: (t) => t.subCategory === "organize" || t.subCategory === "batch" },
  { id: "convert", label: "Convert", match: (t) => t.subCategory === "convert" },
  { id: "edit", label: "Edit", match: (t) => ["edit", "form", "annotate"].includes(t.subCategory) },
  { id: "optimize", label: "Optimize", match: (t) => t.subCategory === "utility" || t.slug.startsWith("compress-") },
  { id: "security", label: "Security", match: (t) => ["security", "sign"].includes(t.subCategory) },
  { id: "image", label: "Image", match: (t) => t.category === "image" },
];

const CHIP_LABEL_KEYS: Record<ChipId, MessageKey> = {
  all: "home.chipAll",
  organize: "home.chipOrganize",
  convert: "home.chipConvert",
  edit: "home.chipEdit",
  optimize: "home.chipOptimize",
  security: "home.chipSecurity",
  image: "home.chipImage",
};

const DEFAULT_VISIBLE = 12;
const MAX_VISIBLE = 48;

export function HomeClient() {
  const rootRef = useRef<HTMLDivElement>(null);
  useReveal(rootRef);
  const { t } = useI18n();

  const [heroQuery, setHeroQuery] = useState("");
  const [heroResults, setHeroResults] = useState<ToolDef[]>([]);
  const [heroSelectedIdx, setHeroSelectedIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<ToolCategory>("pdf");
  const router = useRouter();

  const heroQueryEmpty = heroQuery.trim() === "";
  useEffect(() => {
    if (heroQueryEmpty) return;
    const timer = setTimeout(() => {
      setHeroResults(searchTools(heroQuery, 8).map((r) => r.tool));
      setHeroSelectedIdx(0);
    }, 100);
    return () => clearTimeout(timer);
  }, [heroQuery, heroQueryEmpty]);

  const hasPersonalHistory = useSyncExternalStore(
    subscribeUsage,
    hasPersonalHistorySnapshot,
    () => false
  );
  const topTools = useSyncExternalStore(
    subscribeUsage,
    getTopToolsSnapshot,
    getEmptyToolsSnapshot
  );
  const recentTools = useSyncExternalStore(
    subscribeUsage,
    getRecentToolsSnapshot,
    getEmptyToolsSnapshot
  );

  const smartQuickTools = useMemo(() => {
    const defaultList = QUICK_SLUGS.map((s) => TOOL_BY_SLUG.get(s)).filter(Boolean) as ToolDef[];
    if (!hasPersonalHistory) {
      return defaultList.map((tool) => ({ tool, kind: "default" as const }));
    }

    const seen = new Set<string>();
    const items: Array<{ tool: ToolDef; kind: "top" | "recent" | "related" | "default" }> = [];

    for (const tool of topTools.slice(0, 5)) {
      if (seen.has(tool.slug)) continue;
      seen.add(tool.slug);
      items.push({ tool, kind: "top" });
    }
    for (const tool of recentTools.slice(0, 3)) {
      if (seen.has(tool.slug)) continue;
      seen.add(tool.slug);
      items.push({ tool, kind: "recent" });
    }
    for (const { tool } of items.slice(0, 3)) {
      for (const relSlug of tool.relatedSlugs ?? []) {
        if (seen.has(relSlug)) continue;
        const rel = TOOL_BY_SLUG.get(relSlug);
        if (rel) {
          seen.add(rel.slug);
          items.push({ tool: rel, kind: "related" });
          break;
        }
      }
      if (items.length >= 10) break;
    }
    for (const tool of defaultList) {
      if (items.length >= 10) break;
      if (seen.has(tool.slug)) continue;
      seen.add(tool.slug);
      items.push({ tool, kind: "default" });
    }
    return items.slice(0, 10);
  }, [hasPersonalHistory, topTools, recentTools]);

  const currentTab = WORKBENCH_TABS.find((tab) => tab.id === activeTab) ?? WORKBENCH_TABS[0];

  return (
    <div ref={rootRef}>
      {/* ─── 1. Asymmetric Product Hero ───────────────────────────── */}
      <section className="bg-bg-surface border-b border-border-base py-12 sm:py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left: Direct Headline, Search & Smart Quick Tools */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 text-[12.5px] font-medium text-text-secondary mb-4">
              <span className="w-2 h-2 rounded-full bg-success" aria-hidden="true" />
              <span>{ALL_TOOLS.length} browser-based tools · No uploads · Free</span>
            </div>

            <h1 className="heading-xl text-text-primary mb-4 [text-wrap:balance]">
              {t("home.heroTitle")}
            </h1>

            <p className="body-lg text-text-secondary max-w-xl mb-7">
              {t("home.heroSubtitle")}
            </p>

            {/* Spotlight Search */}
            <div className="relative max-w-xl mb-5">
              <div className="flex items-center gap-3 h-13 px-4 bg-bg-input border border-border-base rounded-2xl transition-[border-color,background-color,box-shadow] duration-150 focus-within:bg-bg-surface focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-subtle)]">
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
                      router.push(`/tools/${heroResults[heroSelectedIdx].slug}`);
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
                  placeholder={t("home.searchPlaceholder").replace("{count}", String(ALL_TOOLS.length))}
                  className="flex-1 bg-transparent h-full text-text-primary text-[15px] placeholder:text-text-tertiary outline-none min-w-0"
                  aria-label="Search tools"
                />
                <kbd className="hidden sm:inline-flex shrink-0">⌘K</kbd>
              </div>

              {!heroQueryEmpty && heroResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-bg-surface rounded-2xl border border-border-base shadow-[var(--elevation-xl)] overflow-hidden z-50 text-left animate-fade-in-up">
                  <div className="py-1.5 max-h-[360px] overflow-y-auto">
                    {heroResults.map((tool, i) => (
                      <button
                        key={tool.slug}
                        onClick={() => router.push(`/tools/${tool.slug}`)}
                        onMouseEnter={() => setHeroSelectedIdx(i)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          i === heroSelectedIdx ? "bg-accent-subtle" : "hover:bg-bg-elevated"
                        }`}
                      >
                        <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-bg-elevated">
                          <ToolIcon name={tool.slug} size={17} />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className={`block text-[14px] font-medium truncate ${i === heroSelectedIdx ? "text-accent-ink" : "text-text-primary"}`}>
                            {tool.name}
                          </span>
                          <span className="block text-[12px] text-text-secondary truncate">{tool.description}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Smart Personalized Quick Actions (auto-ranked by usage & recency) */}
            <nav aria-label="Quick tools" className="flex flex-wrap gap-2">
              {smartQuickTools.map(({ tool }) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="hero-chip"
                >
                  <ToolIcon name={tool.slug} size={14} />
                  <span>{tool.name}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: Interactive Format Launcher Panel */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-border-base bg-bg-warm p-4 sm:p-5 shadow-[var(--elevation-sm)]">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="inline-flex p-1 rounded-xl bg-bg-elevated border border-border-base w-full">
                  {WORKBENCH_TABS.map((tab) => {
                    const active = tab.id === activeTab;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-[12.5px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                          active
                            ? "bg-bg-surface text-text-primary shadow-[var(--elevation-sm)]"
                            : "text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <ul className="rounded-xl border border-border-base bg-bg-surface divide-y divide-border-base overflow-hidden">
                {currentTab.tools.map((slug) => {
                  const tool = TOOL_BY_SLUG.get(slug);
                  if (!tool) return null;
                  return (
                    <li key={slug}>
                      <Link
                        href={`/tools/${slug}`}
                        className="group flex items-center gap-3 px-3.5 py-3 hover:bg-bg-elevated/60 transition-colors"
                      >
                        <ToolIcon name={slug} size={18} />
                        <div className="min-w-0 flex-1">
                          <span className="block text-[13.5px] font-medium text-text-primary group-hover:text-accent transition-colors truncate">
                            {tool.name}
                          </span>
                          <span className="block text-[11.5px] text-text-tertiary truncate">
                            {tool.description}
                          </span>
                        </div>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0" aria-hidden="true">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </Link>
                    </li>
                  );
                })}
                {currentTab.id === "text" && (
                  <li>
                    <Link
                      href="/transfer"
                      className="group flex items-center gap-3 px-3.5 py-3 hover:bg-bg-elevated/60 transition-colors"
                    >
                      <span className="w-[18px] h-[18px] flex items-center justify-center text-accent shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="block text-[13.5px] font-medium text-text-primary group-hover:text-accent transition-colors">
                          P2P File Transfer
                        </span>
                        <span className="block text-[11.5px] text-text-tertiary truncate">
                          Send files directly between devices over WebRTC
                        </span>
                      </div>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0" aria-hidden="true">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                  </li>
                )}
              </ul>

              <div className="mt-3.5 flex items-center justify-between px-1 text-[12.5px]">
                <span className="text-text-tertiary tabular-nums">
                  {currentTab.count} tools in {currentTab.label}
                </span>
                <Link href={currentTab.href} className="font-medium text-accent-ink hover:underline underline-offset-2">
                  Open {currentTab.label} hub →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. Popular Tools (Toolbar + Compact Grid) ───────────── */}
      <PopularTools />

      {/* Ad — renders nothing when no slot is configured */}
      <AdSlot slot="home" label="leaderboard (home)" className="max-w-6xl mx-auto px-4 sm:px-6 py-6" />

      {/* ─── 3. How It Works & Local Architecture (Unified Band) ─── */}
      <section className="border-t border-border-base bg-bg-surface" aria-labelledby="architecture-heading">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <div className="lg:col-span-6">
            <h2 id="architecture-heading" className="heading-lg text-text-primary mb-3">
              {t("home.privacyTitle")}
            </h2>
            <p className="body-md text-text-secondary mb-8 max-w-[52ch]">
              {t("home.privacyIntro")}
            </p>

            <ol className="space-y-5 border-t border-border-base pt-6">
              {[
                { num: "01", title: t("home.step1Title"), desc: t("home.step1Desc") },
                { num: "02", title: t("home.step2Title"), desc: t("home.step2Desc") },
                { num: "03", title: t("home.step3Title"), desc: t("home.step3Desc") },
              ].map((step) => (
                <li key={step.num} className="flex items-start gap-4">
                  <span className="font-mono text-[12px] font-medium text-accent-ink pt-0.5 shrink-0">
                    {step.num}
                  </span>
                  <div>
                    <h3 className="text-[15px] font-semibold text-text-primary">{step.title}</h3>
                    <p className="text-[13.5px] text-text-secondary leading-relaxed mt-0.5">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <figure className="rounded-2xl border border-border-base bg-bg-warm p-5">
              <figcaption className="text-[12px] font-semibold text-text-tertiary mb-3.5">
                {t("home.otherSites")}
              </figcaption>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <DiagramNode label={t("home.yourFile")} glyph={GLYPH_FILE} />
                <DiagramArrow />
                <DiagramNode label={t("home.theirServer")} glyph={GLYPH_SERVER} tone="muted" />
                <DiagramArrow />
                <DiagramNode label={t("home.result")} glyph={GLYPH_FILE} />
              </div>
              <p className="mt-3.5 text-[13px] text-text-secondary leading-relaxed">
                {t("home.otherCaption")}
              </p>
            </figure>

            <figure className="rounded-2xl border border-border-strong bg-bg-surface p-5 shadow-[var(--elevation-sm)]">
              <figcaption className="text-[12px] font-semibold text-accent-ink mb-3.5">
                {t("home.filesWow")}
              </figcaption>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <DiagramNode label={t("home.yourFile")} glyph={GLYPH_FILE} />
                <DiagramArrow />
                <DiagramNode label={t("home.thisBrowser")} glyph={GLYPH_BROWSER} tone="accent" />
                <DiagramArrow />
                <DiagramNode label={t("home.result")} glyph={GLYPH_FILE} tone="accent" />
              </div>
              <p className="mt-3.5 text-[13px] text-text-secondary leading-relaxed">
                {t("home.ourCaption")}
                <span className="font-semibold text-accent-ink">{t("home.ourCaptionAccent")}</span>.
              </p>
            </figure>
          </div>
        </div>
      </section>

      {/* ─── 4. Editorial Guides & Tutorials ─────────────────────── */}
      <section className="border-t border-border-base bg-bg-base" aria-labelledby="guides-heading">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="flex flex-wrap items-baseline justify-between gap-4 mb-8">
            <h2 id="guides-heading" className="heading-lg text-text-primary">
              {t("home.blogTitle")}
            </h2>
            <div className="flex items-center gap-5 text-[13.5px] font-medium">
              <Link href="/guides" className="text-text-secondary hover:text-text-primary transition-colors">
                Reference Guides
              </Link>
              <Link href="/blog" className="text-accent-ink hover:underline underline-offset-2">
                {t("home.allPosts")} →
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-border-base bg-bg-surface divide-y divide-border-base overflow-hidden">
            {BLOG_POSTS.slice(0, 4).map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 hover:bg-bg-elevated/50 transition-colors"
              >
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold text-text-primary group-hover:text-accent transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-[13px] text-text-secondary line-clamp-1 mt-0.5">
                    {post.description}
                  </p>
                </div>
                <span className="text-[13px] font-medium text-accent-ink shrink-0">
                  {t("home.readGuide")} →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. FAQ (2-column split) ─────────────────────────────── */}
      <section id="faq" className="border-t border-border-base bg-bg-surface" aria-labelledby="faq-heading">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-4">
            <h2 id="faq-heading" className="heading-lg text-text-primary mb-2">
              {t("home.faqTitle")}
            </h2>
            <p className="text-[14px] text-text-secondary leading-relaxed">
              Common questions about browser processing, privacy, and supported formats.
            </p>
          </div>
          <div className="lg:col-span-8">
            <Accordion items={FAQ_ITEMS} defaultOpen={null} />
          </div>
        </div>
      </section>
    </div>
  );
}

function PopularTools() {
  const { t } = useI18n();
  const [chip, setChip] = useState<ChipId>("all");
  const [showAll, setShowAll] = useState(false);

  const matched = useMemo(() => {
    const active = CHIPS.find((c) => c.id === chip) ?? CHIPS[0];
    return ORDERED_TOOLS.filter(active.match);
  }, [chip]);

  const visible = showAll ? matched.slice(0, MAX_VISIBLE) : matched.slice(0, DEFAULT_VISIBLE);

  return (
    <section className="py-14 sm:py-18" aria-labelledby="popular-heading">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-7">
          <div>
            <h2 id="popular-heading" className="heading-lg text-text-primary">
              {t("home.popularTitle")}
            </h2>
            <p className="text-[13.5px] text-text-secondary mt-1">
              {t("home.popularSub").replace("{count}", String(matched.length))}
            </p>
          </div>

          <div className="inline-flex flex-wrap gap-1 p-1 rounded-xl bg-bg-elevated border border-border-base self-start" role="group" aria-label="Filter popular tools">
            {CHIPS.map((c) => {
              const active = chip === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setChip(c.id);
                    setShowAll(false);
                  }}
                  className={`px-3 py-1.5 min-h-8 rounded-lg text-[12.5px] font-medium transition-all cursor-pointer ${
                    active
                      ? "bg-bg-surface text-text-primary shadow-[var(--elevation-sm)]"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {t(CHIP_LABEL_KEYS[c.id])}
                </button>
              );
            })}
          </div>
        </div>

        <div
          key={chip}
          className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in-up"
        >
          {visible.map((tool, i) => (
            <ToolCard key={tool.slug} tool={tool} index={i} />
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border-base pt-5">
          <p className="text-[13px] text-text-secondary">
            {t("home.showing")
              .replace("{n}", String(visible.length))
              .replace("{m}", String(matched.length))}
          </p>
          <div className="flex items-center gap-4">
            {!showAll && matched.length > DEFAULT_VISIBLE && (
              <button type="button" className="btn-secondary text-[13.5px]" onClick={() => setShowAll(true)}>
                {t("home.showAll").replace("{count}", String(Math.min(matched.length, MAX_VISIBLE)))}
              </button>
            )}
            <Link href="/search" className="text-[13.5px] font-medium text-accent-ink hover:underline underline-offset-2">
              {t("home.browseAllCount").replace("{count}", String(ALL_TOOLS.length))} →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function DiagramNode({ label, glyph, tone = "default" }: { label: string; glyph: React.ReactNode; tone?: "default" | "accent" | "muted" }) {
  const toneClass =
    tone === "accent"
      ? "border-accent/30 bg-accent-subtle text-text-primary"
      : tone === "muted"
        ? "border-dashed border-border-strong text-text-secondary"
        : "border-border-base bg-bg-elevated text-text-primary";
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[13px] font-medium ${toneClass}`}>
      <span className={tone === "accent" ? "text-accent" : "text-text-tertiary"} aria-hidden="true">
        {glyph}
      </span>
      {label}
    </span>
  );
}

function DiagramArrow({ className = "" }: { className?: string }) {
  return (
    <svg width="24" height="12" viewBox="0 0 30 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-text-tertiary ${className}`} aria-hidden="true">
      <line x1="1" y1="6" x2="25" y2="6" />
      <polyline points="20 1.5 25.5 6 20 10.5" />
    </svg>
  );
}

const GLYPH_FILE = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" />
    <path d="M13 3v6h6" />
  </svg>
);

const GLYPH_SERVER = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="7" rx="1.5" />
    <rect x="3" y="13" width="18" height="7" rx="1.5" />
    <line x1="7" y1="7.5" x2="7.01" y2="7.5" />
    <line x1="7" y1="16.5" x2="7.01" y2="16.5" />
  </svg>
);

const GLYPH_BROWSER = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="6.5" y1="6.5" x2="6.51" y2="6.5" />
  </svg>
);

const FAQ_ITEMS = [
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
    a: `FilesWow covers PDF, Word (DOCX), images (JPG, PNG, WebP, SVG), and plain text formats — ${ALL_TOOLS.length} tools across these categories, all running in your browser.`,
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
