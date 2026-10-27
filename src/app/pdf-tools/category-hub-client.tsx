"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ToolCard } from "@/components/tool-card";
import { categoryTile } from "@/lib/category-style";
import { CATEGORY_COUNTS, type ToolDef, type ToolCategory, type SubCategory } from "@/lib/catalog";
import { AdSlot } from "@/components/ad-unit";
import { useReveal } from "@/lib/use-reveal";
import { Accordion } from "@/components/ui/accordion";
import { BLOG_POSTS } from "@/lib/blog";
import {
  subscribeUsage,
  getTopToolsSnapshot,
  getEmptyToolsSnapshot,
  hasPersonalHistorySnapshot,
  POPULAR_DEFAULT_SLUGS,
} from "@/lib/usage";

/* Category-to-category navigation lives in the header mega-menu and footer;
   the hub page itself stays focused on ONE shelf (no switcher pills). */
const CATEGORY_NAMES: Record<ToolCategory, string> = {
  pdf: "PDF",
  word: "Word",
  image: "Image",
  text: "Text",
  cross: "Cross-Format",
};

/* One quiet glyph per category for the page header */
const CATEGORY_GLYPHS: Record<ToolCategory, React.ReactNode> = {
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
  cross: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
};

interface CategoryEditorial {
  title: string;
  description: string;
  paragraphs: string[];
  faq: { q: string; a: string }[];
}

const CATEGORY_EDITORIAL: Record<ToolCategory, CategoryEditorial> = {
  pdf: {
    title: "About FilesWow Free In-Browser PDF Tools",
    description: "Complete browser-based PDF suite for merging, splitting, converting, annotating, and protecting documents without server uploads.",
    paragraphs: [
      "FilesWow provides a complete suite of professional PDF utilities designed to run directly in your web browser. Powered by modern client-side technologies (WebAssembly and pdf-lib), every PDF operation takes place entirely in your local device memory. Your documents never transit through or get stored on any external server, guaranteeing total privacy for sensitive contracts, personal invoices, and legal filings.",
      "Whether you need to combine multiple PDFs into a single file, compress large scans to meet email attachment limits, convert JPG photos to PDF, or stamp page numbers, FilesWow delivers fast results without daily file quotas, subscription fees, or watermarks.",
      "Because processing happens on your local hardware, you avoid slow upload times when dealing with large document batches. Once loaded, you can even continue working without an active internet connection.",
    ],
    faq: [
      {
        q: "Are FilesWow PDF tools really 100% free?",
        a: "Yes. Every PDF tool on FilesWow is completely free with no hidden fees, no limits on the number of files you can process, and no watermarks added.",
      },
      {
        q: "Are my PDF documents safe when using this site?",
        a: "Yes. Files are never uploaded to any remote server. All parsing, rendering, and modifications happen locally inside your web browser.",
      },
      {
        q: "How do I merge or split PDF files online?",
        a: "Simply navigate to Merge PDF or Split PDF from the list above, select your documents, arrange the pages or files, and download your final document instantly.",
      },
      {
        q: "Can I use these PDF tools on mobile phones?",
        a: "Yes. FilesWow is fully responsive and works on modern mobile browsers including Safari on iOS and Chrome on Android.",
      },
    ],
  },
  word: {
    title: "About FilesWow Word & DOCX Tools",
    description: "In-browser Microsoft Word (DOCX) tools for converting, merging, formatting, and inspecting documents privately.",
    paragraphs: [
      "FilesWow provides high-fidelity Word document processing right in your browser. Convert Word documents to PDF, merge multiple DOCX files, extract text and embedded images, or convert DOCX to clean HTML and Markdown.",
      "Unlike conventional converters that require sending company memos and proprietary reports to third-party cloud servers, FilesWow works with client-side document parsers. Your DOCX structure, text, and styles are analyzed locally without transmitting a single byte over the wire.",
    ],
    faq: [
      {
        q: "Can I convert Word (DOCX) files to PDF without Microsoft Office?",
        a: "Yes. You can convert any DOCX document to a clean PDF directly in your browser without needing Microsoft Office installed.",
      },
      {
        q: "Are my Word documents kept confidential?",
        a: "Yes. Processing runs entirely in your browser. No files are uploaded, saved, or logged anywhere.",
      },
      {
        q: "Does FilesWow support both .doc and .docx?",
        a: "Modern .docx (Office Open XML) is natively supported. For older binary .doc files, we recommend saving them as .docx first for the highest conversion fidelity.",
      },
    ],
  },
  image: {
    title: "About FilesWow Image Tools",
    description: "Fast, private image editor and converter for JPG, PNG, WebP, SVG, and GIFs.",
    paragraphs: [
      "FilesWow image tools let you convert, resize, crop, optimize, and edit photos and graphics without installing photo editing software. Convert JPG to PDF, remove backgrounds, compress photos for the web, or convert between formats (JPG, PNG, WebP, SVG) in seconds.",
      "All pixel manipulation occurs using the browser's Canvas API and WebAssembly image decoders. Your private photographs, personal ID scans, and creative assets never leave your device.",
    ],
    faq: [
      {
        q: "How do I convert JPG images to PDF?",
        a: "Select the JPG to PDF tool, drop your photos into the editor, order them as desired, choose paper size (A4 or Letter), and download your combined PDF.",
      },
      {
        q: "Will compressing images reduce visual quality?",
        a: "FilesWow uses smart optimization algorithms that strip excess metadata and optimize encoding without noticeable loss of image quality.",
      },
      {
        q: "Is background removal free?",
        a: "Yes. Our background remover runs locally and produces transparent PNG cutouts for free without limits.",
      },
    ],
  },
  text: {
    title: "About FilesWow Text Tools",
    description: "Handy developer and writer utilities for formatting, diffing, counting, and transforming text.",
    paragraphs: [
      "FilesWow text tools include line counters, diff comparators, JSON formatters, text cleaners, case converters, and encoding utilities designed for developers, writers, and students. Everything processes in real-time right inside your browser window.",
    ],
    faq: [
      {
        q: "Is my text data stored or shared?",
        a: "No. Any text entered into FilesWow tools stays solely in your browser memory and is never logged or sent to any server.",
      },
      {
        q: "Can I process large code or text files?",
        a: "Yes. Because computations run on your machine, our text tools handle large logs, code snippets, and essays with zero latency.",
      },
    ],
  },
  cross: {
    title: "About FilesWow Cross-Format Tools",
    description: "Convert and transfer documents across different document and image file types.",
    paragraphs: [
      "Our cross-format utilities allow seamless transitions between document types: convert images into PDFs, extract text from documents, or bundle multiple file types into unified archives.",
    ],
    faq: [
      {
        q: "Are cross-format conversions private?",
        a: "Yes. Every conversion runs on your device with no cloud server involvement.",
      },
    ],
  },
};

interface CategoryHubClientProps {
  tools: ToolDef[];
  title: string;
  subtitle: string;
  categories: SubCategory[];
  categoryLabels: Record<SubCategory, string>;
}

export function CategoryHubClient({
  tools,
  title,
  subtitle,
  categories,
  categoryLabels,
}: CategoryHubClientProps) {
  const category: ToolCategory = tools[0]?.category ?? "pdf";
  const tile = categoryTile(category);
  const count = CATEGORY_COUNTS[category];
  const categoryName = CATEGORY_NAMES[category] ?? "Category";
  const rootRef = useRef<HTMLDivElement>(null);
  useReveal(rootRef);

  const [query, setQuery] = useState("");

  // Search within this category — flat results replace the grouped sections.
  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!q) return null;
    return tools.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.slug.includes(q) ||
        categoryLabels[t.subCategory]?.toLowerCase().includes(q)
    );
  }, [q, tools, categoryLabels]);

  const topTools = useSyncExternalStore(
    subscribeUsage,
    getTopToolsSnapshot,
    getEmptyToolsSnapshot
  );
  const hasPersonalHistory = useSyncExternalStore(
    subscribeUsage,
    hasPersonalHistorySnapshot,
    () => false
  );

  const popularTools = useMemo(() => {
    if (!tools || tools.length === 0) return [];

    const toolMap = new Map(tools.map((t) => [t.slug, t]));
    const result: ToolDef[] = [];
    const seen = new Set<string>();

    // 1. Personalized top tools in this category
    for (const t of topTools) {
      if (toolMap.has(t.slug) && !seen.has(t.slug)) {
        seen.add(t.slug);
        result.push(toolMap.get(t.slug)!);
      }
    }

    // 2. Curated popular defaults for this category
    for (const slug of POPULAR_DEFAULT_SLUGS) {
      if (toolMap.has(slug) && !seen.has(slug)) {
        seen.add(slug);
        result.push(toolMap.get(slug)!);
      }
    }

    // 3. Fallback: pad with tier 1 tools of this category
    const targetCount = Math.min(tools.length, 8);
    if (result.length < targetCount) {
      const sorted = [...tools].sort((a, b) => a.tier - b.tier);
      for (const t of sorted) {
        if (!seen.has(t.slug)) {
          seen.add(t.slug);
          result.push(t);
          if (result.length >= targetCount) break;
        }
      }
    }

    return result.slice(0, targetCount);
  }, [tools, topTools]);

  // Sections that actually have tools (drives the sticky jump bar)
  const sections = categories
    .map((subCat) => ({
      subCat,
      label: categoryLabels[subCat],
      tools: tools.filter((t) => t.subCategory === subCat),
    }))
    .filter((s) => s.tools.length > 0);

  return (
    <div ref={rootRef}>
      {/* ─── Page header ─────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-medium text-text-tertiary mb-7" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-accent transition-colors">
            Home
          </Link>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="text-text-secondary">{title}</span>
        </nav>

        <div className="flex items-start gap-4 sm:gap-5">
          <span className={`hidden sm:flex w-14 h-14 rounded-xl ring-1 ring-inset items-center justify-center shrink-0 mt-1 ${tile}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {CATEGORY_GLYPHS[category]}
            </svg>
          </span>
          <div className="min-w-0">
            <h1 className="heading-xl text-text-primary mb-2.5">{title}</h1>
            <p className="body-md text-text-secondary max-w-2xl">{subtitle}</p>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="badge badge-accent">
                {count} {count === 1 ? "tool" : "tools"}
              </span>
              <span className="badge">Runs in your browser</span>
              <span className="badge">Free forever</span>
            </div>
          </div>
        </div>

        {/* Search within category (visible below md; sticky bar owns it above) */}
        <div className="mt-7 md:hidden">
          <label className="sr-only" htmlFor="hub-search-mobile">
            Search {title}
          </label>
          <input
            id="hub-search-mobile"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search among ${count} ${categoryName.toLowerCase()} tools…`}
            className="input h-11"
          />
        </div>
      </div>

      {/* ─── Sticky sub-nav: group jump links + search ───────────── */}
      <nav
        aria-label="Sections"
        className="sticky top-16 z-30 bg-bg-surface border-y border-border-base"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 h-12 overflow-x-auto">
            {sections.map((s) => (
              <a
                key={s.subCat}
                href={`#sec-${s.subCat}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover whitespace-nowrap transition-colors"
              >
                {s.label}
                <span className="font-mono text-[11px] text-text-tertiary">{s.tools.length}</span>
              </a>
            ))}

            <div className="hidden md:flex items-center gap-2 ml-auto pl-3">
              <label className="sr-only" htmlFor="hub-search">
                Search {title}
              </label>
              <input
                id="hub-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search this category…"
                className="input h-9 w-52 !py-1.5 text-[13px]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-[12px] font-semibold text-text-tertiary hover:text-danger transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ─── Content ─────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        {/* Search results replace the grouped sections */}
        {results !== null ? (
          <section aria-label="Search results">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-[13px] font-bold uppercase tracking-widest text-text-secondary whitespace-nowrap">
                {results.length} {results.length === 1 ? "match" : "matches"}
              </h2>
              <div className="flex-1 h-px bg-border-base" />
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-[12px] font-semibold text-accent hover:underline underline-offset-2"
              >
                Clear search
              </button>
            </div>
            {results.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.map((tool, i) => (
                  <ToolCard key={tool.slug} tool={tool} index={i} />
                ))}
              </div>
            ) : (
              <div className="card p-8 text-center">
                <p className="text-[15px] font-semibold text-text-primary mb-1">
                  No tools match “{query}”
                </p>
                <p className="text-[13px] text-text-secondary">
                  Try a shorter word, or search all {tools.length} tools from the
                  command palette (⌘K).
                </p>
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Popular */}
            {popularTools.length > 0 && (
              <section className="mb-12 sm:mb-14 reveal" aria-labelledby="popular-category-tools">
                <div className="flex items-center gap-3 mb-5">
                  <h2
                    id="popular-category-tools"
                    className="text-[13px] font-bold uppercase tracking-widest text-text-secondary whitespace-nowrap flex items-center gap-2"
                  >
                    <span className="w-5 h-5 rounded-md bg-accent/10 text-accent flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.2-6.3-4.5-6.3 4.5L8 14l-6-4.6h7.6z" />
                      </svg>
                    </span>
                    {hasPersonalHistory
                      ? `Top ${categoryName} tools for you`
                      : `Popular ${categoryName} tools`}
                  </h2>
                  <div className="flex-1 h-px bg-border-base" />
                  <span className="badge badge-mono shrink-0">
                    {popularTools.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {popularTools.map((tool, i) => (
                    <ToolCard key={tool.slug} tool={tool} index={i} />
                  ))}
                </div>
              </section>
            )}

            {/* Ad — top of the listing. Renders nothing when not configured. */}
            <AdSlot slot="category" label="billboard (category top)" className="mb-12 sm:mb-14" />

            {/* Grouped sections — ad after every 2nd section */}
            {sections.map((section, catIdx) => (
              <div key={section.subCat}>
                <section
                  id={`sec-${section.subCat}`}
                  className="mb-12 sm:mb-14 scroll-mt-28 reveal"
                  aria-labelledby={`sec-label-${section.subCat}`}
                >
                  <div className="flex items-center gap-3 mb-5">
                    <h2
                      id={`sec-label-${section.subCat}`}
                      className="text-[13px] font-bold uppercase tracking-widest text-text-secondary whitespace-nowrap"
                    >
                      {section.label}
                    </h2>
                    <div className="flex-1 h-px bg-border-base" />
                    <span className="badge badge-mono shrink-0">
                      {section.tools.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {section.tools.map((tool, i) => (
                      <ToolCard key={tool.slug} tool={tool} index={i} />
                    ))}
                  </div>
                </section>
                {catIdx > 0 && (catIdx + 1) % 2 === 0 && (
                  <AdSlot slot="category" label="in-feed (category)" className="-mt-4 mb-12 sm:mb-14" />
                )}
              </div>
            ))}

            {/* Category In-Depth Overview & Editorial Guide (E-E-A-T & AdSense quality) */}
            {CATEGORY_EDITORIAL[category] && (
              <section className="mt-16 pt-12 border-t border-border-base max-w-3xl" aria-labelledby="cat-editorial-heading">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-accent mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Guide & Overview
                </div>
                <h2 id="cat-editorial-heading" className="heading-lg text-text-primary mb-4">
                  {CATEGORY_EDITORIAL[category].title}
                </h2>
                <div className="space-y-4 body-md text-text-secondary leading-relaxed mb-10">
                  {CATEGORY_EDITORIAL[category].paragraphs.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>

                {/* Category FAQ */}
                {CATEGORY_EDITORIAL[category].faq.length > 0 && (
                  <div className="mb-12">
                    <h3 className="heading-md text-text-primary mb-4">
                      Frequently Asked Questions
                    </h3>
                    <Accordion items={CATEGORY_EDITORIAL[category].faq} defaultOpen={0} />
                  </div>
                )}

                {/* Relevant Guides / Blog Posts for this Category */}
                {(() => {
                  const categoryPosts = BLOG_POSTS.filter((p) => p.category === category).slice(0, 3);
                  if (categoryPosts.length === 0) return null;
                  return (
                    <div className="rounded-2xl border border-border-base bg-bg-surface/50 p-6">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-4">
                        Step-by-Step {categoryName} Tutorials & Guides
                      </h3>
                      <div className="space-y-3">
                        {categoryPosts.map((post) => (
                          <div key={post.slug} className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4">
                            <Link
                              href={`/blog/${post.slug}`}
                              className="text-[14.5px] font-medium text-text-primary hover:text-accent transition-colors"
                            >
                              {post.title}
                            </Link>
                            <span className="text-xs text-text-tertiary shrink-0">Read guide →</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
