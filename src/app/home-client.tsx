"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ToolCard } from "@/components/tool-card";
import { Accordion } from "@/components/ui/accordion";
import { searchTools } from "@/lib/search";
import { ToolIcon } from "@/components/icon";
import { ALL_TOOLS, CATEGORY_COUNTS, type ToolDef, type ToolCategory } from "@/lib/catalog";
import { POPULAR_DEFAULT_SLUGS } from "@/lib/usage";
import { useReveal } from "@/lib/use-reveal";
import { AdSlot } from "@/components/ad-unit";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { BLOG_POSTS } from "@/lib/blog";

/* Curated popular order first, then everything else — the base list the
   filter chips slice. Never rendered in full on the homepage. */
const CURATED_POPULAR = new Set(POPULAR_DEFAULT_SLUGS);
const ORDERED_TOOLS: ToolDef[] = [
  ...ALL_TOOLS.filter((t) => CURATED_POPULAR.has(t.slug)),
  ...ALL_TOOLS.filter((t) => !CURATED_POPULAR.has(t.slug)),
];

const TOOL_BY_SLUG = new Map(ALL_TOOLS.map((t) => [t.slug, t]));

/* Quick actions under the hero search — real tools, real names */
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

/* Category cards — counts come from the catalog, never hardcoded */
interface CategoryCardSpec {
  category: ToolCategory;
  label: string;
  href: string;
  blurb: string;
  featured: string[];
  wide?: boolean;
  /** Bottom-row filler so the bento grid closes without an empty cell */
  span2?: boolean;
}

const CATEGORY_CARDS: CategoryCardSpec[] = [
  {
    category: "pdf",
    label: "PDF Tools",
    href: "/pdf-tools",
    blurb: "Merge, split, compress, sign and convert PDFs — page-level control without uploading a thing.",
    /* The wide card spans two rows, so it carries more featured rows to fill
       the extra height instead of leaving a void under the blurb. */
    featured: [
      "merge-pdf",
      "compress-pdf",
      "split-pdf",
      "pdf-to-word",
      "jpg-to-pdf",
      "pdf-to-jpg",
      "rotate-pdf",
      "watermark-pdf",
      "sign-pdf",
    ],
    wide: true,
  },
  {
    category: "word",
    label: "Word Tools",
    href: "/word-tools",
    blurb: "Convert, clean and secure DOCX files.",
    featured: ["word-to-pdf", "merge-word", "split-word", "word-to-text"],
  },
  {
    category: "image",
    label: "Image Tools",
    href: "/image-tools",
    blurb: "Convert, resize and retouch pictures.",
    featured: ["compress-image", "background-remove-image", "resize-image", "crop-image"],
  },
  {
    category: "text",
    span2: true,
    label: "Text Tools",
    href: "/text-tools",
    blurb: "Send text straight between two devices.",
    featured: ["p2p-text"],
  },
];

/* Popular-tool filter chips */
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

/* Chip labels resolve through the i18n dictionary at render time */
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
  const router = useRouter();

  // Debounced live search over the catalog
  const heroQueryEmpty = heroQuery.trim() === "";
  useEffect(() => {
    if (heroQueryEmpty) return;
    const timer = setTimeout(() => {
      setHeroResults(searchTools(heroQuery, 8).map((r) => r.tool));
      setHeroSelectedIdx(0);
    }, 100);
    return () => clearTimeout(timer);
  }, [heroQuery, heroQueryEmpty]);

  return (
    <div ref={rootRef}>
      {/* ─── 1. Hero — search-first, left-aligned ─────────────────
           Brand warm-white band (#FFF7ED via --bg-warm) */}
      <section className="bg-bg-warm border-b border-border-base pt-12 sm:pt-20 pb-12 sm:pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-accent mb-4">
              {t("home.heroEyebrow")}
            </p>
            <h1 className="heading-xl text-text-primary mb-4 [text-wrap:balance]">
              {t("home.heroTitle")}
            </h1>
            <p className="body-lg text-text-secondary max-w-xl mb-7">
              {t("home.heroSubtitle")}
            </p>

            {/* Search */}
            <div className="relative max-w-xl mb-3.5">
              <div className="flex items-center gap-3 h-14 px-4 sm:px-5 bg-bg-surface border border-border-strong rounded-xl shadow-sm transition-[border-color,box-shadow] duration-150 focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-subtle)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary shrink-0" aria-hidden="true">
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
                  className="flex-1 bg-transparent h-full text-text-primary text-[15px] font-medium placeholder:text-text-tertiary outline-none min-w-0"
                  aria-label="Search tools"
                />
                <kbd className="hidden sm:inline-flex shrink-0">⌘K</kbd>
              </div>

              {/* Live results */}
              {!heroQueryEmpty && heroResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-bg-surface rounded-xl border border-border-base shadow-[var(--elevation-xl)] overflow-hidden z-50 text-left animate-fade-in-up">
                  <div className="py-1.5 max-h-[360px] overflow-y-auto">
                    {heroResults.map((tool, i) => (
                      <button
                        key={tool.slug}
                        onClick={() => router.push(`/tools/${tool.slug}`)}
                        onMouseEnter={() => setHeroSelectedIdx(i)}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors ${
                          i === heroSelectedIdx ? "bg-accent-subtle" : "hover:bg-bg-hover"
                        }`}
                      >
                        <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ring-1 ring-inset ring-border-base bg-bg-elevated">
                          <ToolIcon name={tool.slug} size={17} />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className={`block text-[13.5px] font-semibold truncate ${i === heroSelectedIdx ? "text-accent" : "text-text-primary"}`}>
                            {tool.name}
                          </span>
                          <span className="block text-[12px] text-text-tertiary truncate">{tool.description}</span>
                        </span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary shrink-0" aria-hidden="true">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <p className="text-[12.5px] text-text-tertiary mb-6">
              {t("home.noUpload")}
            </p>

            {/* Quick actions */}
            <nav aria-label="Popular actions" className="flex flex-wrap gap-2">
              {QUICK_SLUGS.map((slug) => {
                const tool = TOOL_BY_SLUG.get(slug);
                if (!tool) return null;
                return (
                  <Link key={slug} href={`/tools/${slug}`} className="hero-chip">
                    <ToolIcon name={slug} size={13} />
                    {tool.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </section>

      {/* ─── 2. Category cards — real counts, one card wider ─────── */}
      <section className="pb-14 sm:pb-20" aria-labelledby="categories-heading">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-accent mb-2">
                {t("home.categoriesEyebrow")}
              </p>
              <h2 id="categories-heading" className="heading-lg text-text-primary">
                {t("home.categoriesTitle")}
              </h2>
              <p className="body-sm text-text-secondary mt-2">
                {t("home.categoriesSub").replace("{count}", String(ALL_TOOLS.length))}
              </p>
            </div>
            <Link href="/search" className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent hover:gap-2.5 transition-all">
              {t("home.browseAll")}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CATEGORY_CARDS.map((card) => (
              <CategoryCard key={card.category} spec={card} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3. Popular tools — filter chips ─────────────────────── */}
      <PopularTools />

      {/* Ad — renders nothing (no gap) when no slot is configured */}
      <AdSlot slot="home" label="leaderboard (home)" className="max-w-6xl mx-auto px-4 sm:px-6 py-10" />

      {/* ─── 4. How it works — horizontal sequence ───────────────── */}
      <section className="border-t border-border-base" aria-labelledby="how-heading">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="max-w-2xl mb-12">
            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-accent mb-2">
              {t("home.howEyebrow")}
            </p>
            <h2 id="how-heading" className="heading-lg text-text-primary mb-3">
              {t("home.howTitle")}
            </h2>
            <p className="body-md text-text-secondary max-w-[56ch]">
              {t("home.howIntro")}
            </p>
          </div>

          <ol className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 relative">
            {/* Hairline connecting the three steps (desktop) */}
            <span
              className="hidden md:block absolute left-[24px] right-[calc(33.33%-24px)] top-6 h-px bg-border-base"
              aria-hidden="true"
            />
            <HowStep
              icon={
                <>
                  <path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" />
                  <path d="M13 3v6h6" />
                  <path d="M12 13v4" />
                  <path d="m10 15.5 2 2 2-2" />
                </>
              }
              step="01"
              title={t("home.step1Title")}
              description={t("home.step1Desc")}
            />
            <HowStep
              icon={
                <>
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <circle cx="9" cy="7" r="2.2" />
                  <line x1="4" y1="13" x2="20" y2="13" />
                  <circle cx="15" cy="13" r="2.2" />
                  <line x1="4" y1="19" x2="20" y2="19" />
                  <circle cx="8" cy="19" r="2.2" />
                </>
              }
              step="02"
              title={t("home.step2Title")}
              description={t("home.step2Desc")}
            />
            <HowStep
              icon={
                <>
                  <path d="M12 4v9" />
                  <path d="m8.5 10.5 3.5 3 3.5-3" />
                  <path d="M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
                </>
              }
              step="03"
              title={t("home.step3Title")}
              description={t("home.step3Desc")}
            />
          </ol>
        </div>
      </section>

      {/* ─── 5. Privacy — the diagram ────────────────────────────── */}
      <PrivacySection />

      {/* ─── 6. Latest guides ────────────────────────────────────── */}
      <section className="border-t border-border-base" aria-labelledby="guides-heading">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-accent mb-2">
              {t("home.blogEyebrow")}
            </p>
              <h2 id="guides-heading" className="heading-lg text-text-primary">
                {t("home.blogTitle")}
              </h2>
            </div>
            <Link href="/blog" className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent hover:gap-2.5 transition-all">
              {t("home.allPosts")}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
            {BLOG_POSTS.slice(0, 3).map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group flex flex-col border-t border-border-strong pt-4">
                <h3 className="heading-sm text-text-primary mb-2 group-hover:text-accent transition-colors">
                  {post.title}
                </h3>
                <p className="text-[13.5px] leading-relaxed text-text-secondary line-clamp-3">
                  {post.description}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-accent">
                  {t("home.readGuide")}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 7. FAQ ─────────────────────────────────────────────── */}
      <section id="faq" className="border-t border-border-base" aria-labelledby="faq-heading">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-accent mb-2">
            FAQ
          </p>
          <h2 id="faq-heading" className="heading-lg text-text-primary mb-8">
            {t("home.faqTitle")}
          </h2>
          <Accordion items={FAQ_ITEMS} defaultOpen={null} />
        </div>
      </section>

      {/* ─── 8. Final CTA ───────────────────────────────────────── */}
      <section className="border-t border-border-base bg-bg-warm" aria-labelledby="cta-heading">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h2 id="cta-heading" className="heading-lg text-text-primary">
              {t("home.ctaTitle")}
            </h2>
            <p className="body-md text-text-secondary mt-1.5">
              {t("home.ctaSub")}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/search" className="btn-secondary px-6 py-3 text-[15px]">
              {t("home.ctaExplore")}
            </Link>
            <Link href="/tools/merge-pdf" className="btn-primary px-6 py-3 text-[15px]">
              {t("home.ctaTry")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─── Category card — one link, one tint, real counts ──────────── */

/* One quiet glyph per category — identity, not decoration */
const CATEGORY_GLYPHS: Record<string, React.ReactNode> = {
  pdf: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </>
  ),
  word: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m21 16-5-5-9 9" />
    </>
  ),
  text: (
    <>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="10" x2="20" y2="10" />
      <line x1="4" y1="14" x2="16" y2="14" />
      <line x1="4" y1="18" x2="12" y2="18" />
    </>
  ),
};

function CategoryCard({ spec }: { spec: CategoryCardSpec }) {
  const count = CATEGORY_COUNTS[spec.category];
  const featured = spec.featured.map((slug) => TOOL_BY_SLUG.get(slug)).filter(Boolean) as ToolDef[];

  return (
    <Link
      href={spec.href}
      className={`card card-interactive group p-5 sm:p-6 flex flex-col ${
        spec.wide
          ? "sm:col-span-2 lg:col-span-2 lg:row-span-2"
          : spec.span2
            ? "sm:col-span-2 lg:col-span-2"
            : ""
      }`}
    >
      <div className="flex items-start gap-3.5 mb-5">
        <span
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ring-1 ring-inset"
          style={{ background: `color-mix(in srgb, var(--cat-${spec.category}) 10%, transparent)` }}
        >
          <span style={{ color: `var(--cat-${spec.category})` }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {CATEGORY_GLYPHS[spec.category]}
            </svg>
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="heading-sm text-text-primary group-hover:text-accent transition-colors">
            {spec.label}
          </h3>
          <p className="text-[13px] leading-snug text-text-secondary mt-1 line-clamp-2">
            {spec.blurb}
          </p>
        </div>
        {/* Count — quiet neutral pill, top right */}
        <span className="text-[12px] font-bold text-text-secondary bg-bg-elevated border border-border-base rounded-md px-2 py-0.5 tabular-nums shrink-0 mt-0.5" aria-hidden="true">
          {count}
        </span>
      </div>

      {/* Featured index — name left, one-line description right, hairline rows */}
      <ul className="mt-auto border-t border-border-base divide-y divide-border-base">
        {featured.map((tool) => (
          <li key={tool.slug} className="flex items-center gap-3 py-2.5 text-[13.5px] leading-snug">
            <span className="font-medium text-text-primary group-hover:text-accent transition-colors truncate">
              {tool.name}
            </span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="ml-auto text-text-tertiary opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 shrink-0"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </li>
        ))}
      </ul>
    </Link>
  );
}

/* ─── Popular tools with filter chips ──────────────────────────── */

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
    <section className="border-t border-border-base bg-bg-surface" aria-labelledby="popular-heading">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="max-w-2xl mb-6">
          <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-accent mb-2">
            {t("home.popularEyebrow")}
          </p>
          <h2 id="popular-heading" className="heading-lg text-text-primary mb-2">
            {t("home.popularTitle")}
          </h2>
          <p className="body-md text-text-secondary">
            {t("home.popularSub").replace("{count}", String(matched.length))}
          </p>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 mb-7" role="group" aria-label="Filter popular tools">
          {CHIPS.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={chip === c.id}
              onClick={() => {
                setChip(c.id);
                setShowAll(false);
              }}
              className="chip"
            >
              {t(CHIP_LABEL_KEYS[c.id])}
            </button>
          ))}
        </div>

        {/* Grid — remounts on chip change for a smooth 8px reflow */}
        <div
          key={chip}
          className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in-up"
        >
          {visible.map((tool, i) => (
            <ToolCard key={tool.slug} tool={tool} index={i} />
          ))}
        </div>

        <div className="mt-7 flex flex-col items-center gap-3">
          {!showAll && matched.length > DEFAULT_VISIBLE && (
            <button type="button" className="btn-secondary px-6" onClick={() => setShowAll(true)}>
              {t("home.showAll").replace("{count}", String(Math.min(matched.length, MAX_VISIBLE)))}
            </button>
          )}
          <p className="text-[13px] text-text-tertiary">
            {t("home.showing")
              .replace("{n}", String(visible.length))
              .replace("{m}", String(matched.length))} ·{" "}
            <Link href="/search" className="font-semibold text-accent hover:underline underline-offset-2">
              {t("home.browseAllCount").replace("{count}", String(ALL_TOOLS.length))}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── How-it-works step ────────────────────────────────────────── */

function HowStep({
  icon,
  step,
  title,
  description,
}: {
  icon: React.ReactNode;
  step: string;
  title: string;
  description: string;
}) {
  return (
    <li className="relative">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-12 h-12 rounded-full bg-bg-surface border border-border-base flex items-center justify-center text-text-secondary relative z-10">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {icon}
          </svg>
        </span>
        <span className="font-mono text-[11px] tracking-[0.14em] text-text-tertiary relative z-10 bg-bg-base pr-2">
          {step}
        </span>
      </div>
      <h3 className="heading-sm text-text-primary mb-1.5">{title}</h3>
      <p className="text-[13.5px] leading-relaxed text-text-secondary max-w-[36ch]">
        {description}
      </p>
    </li>
  );
}

/* ─── Privacy diagram ──────────────────────────────────────────── */

function DiagramNode({ label, glyph, tone = "default" }: { label: string; glyph: React.ReactNode; tone?: "default" | "accent" | "muted" }) {
  const toneClass =
    tone === "accent"
      ? "border-accent/40 bg-accent-subtle text-text-primary"
      : tone === "muted"
        ? "border-dashed border-border-strong text-text-secondary"
        : "border-border-strong bg-bg-surface text-text-primary";
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-[13px] font-medium ${toneClass}`}>
      <span className={tone === "accent" ? "text-accent" : "text-text-tertiary"} aria-hidden="true">
        {glyph}
      </span>
      {label}
    </span>
  );
}

function DiagramArrow({ className = "" }: { className?: string }) {
  return (
    <svg width="30" height="12" viewBox="0 0 30 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-text-tertiary ${className}`} aria-hidden="true">
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

function PrivacySection() {
  const { t } = useI18n();
  return (
    <section className="border-t border-border-base bg-bg-surface" aria-labelledby="privacy-heading">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 grid md:grid-cols-2 gap-10 md:gap-16 items-start">
        <div className="reveal">
          <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-accent mb-2">
            {t("home.privacyEyebrow")}
          </p>
          <h2 id="privacy-heading" className="heading-lg text-text-primary mb-3">
            {t("home.privacyTitle")}
          </h2>
          <p className="body-md text-text-secondary max-w-[54ch] mb-5">
            {t("home.privacyIntro")}
          </p>
          <ul className="space-y-2.5">
            {[t("home.bulletOffline"), t("home.bulletNothing"), t("home.bulletNoAccount")].map((line) => (
              <li key={line} className="flex items-center gap-2.5 text-[13.5px] text-text-secondary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent shrink-0" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {line}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4 reveal">
          {/* Other sites */}
          <figure className="card p-5">
            <figcaption className="text-[12px] font-bold uppercase tracking-[0.08em] text-accent mb-4">
              {t("home.otherSites")}
            </figcaption>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <DiagramNode label={t("home.yourFile")} glyph={GLYPH_FILE} />
              <DiagramArrow />
              <DiagramNode label={t("home.theirServer")} glyph={GLYPH_SERVER} tone="muted" />
              <DiagramArrow />
              <DiagramNode label={t("home.result")} glyph={GLYPH_FILE} />
            </div>
            <p className="mt-4 text-[12.5px] text-text-tertiary leading-relaxed">
              {t("home.otherCaption")}
            </p>
          </figure>

          {/* FilesWow */}
          <figure className="card p-5">
            <figcaption className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent mb-4">
              {t("home.filesWow")}
            </figcaption>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <DiagramNode label={t("home.yourFile")} glyph={GLYPH_FILE} />
              <DiagramArrow />
              <DiagramNode label={t("home.thisBrowser")} glyph={GLYPH_BROWSER} tone="accent" />
              <DiagramArrow />
              <DiagramNode label={t("home.result")} glyph={GLYPH_FILE} tone="accent" />
            </div>
            <p className="mt-4 text-[12.5px] text-text-secondary leading-relaxed">
              {t("home.ourCaption")}
              <span className="font-semibold text-accent">{t("home.ourCaptionAccent")}</span>.
            </p>
          </figure>
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ — copy mirrors the FAQPage JSON-LD in page.tsx ───────── */

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
