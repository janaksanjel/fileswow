"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ToolCard } from "@/components/tool-card";
import { Accordion } from "@/components/ui/accordion";
import { searchTools } from "@/lib/search";
import { ToolIcon } from "@/components/icon";
import { ALL_TOOLS, type ToolDef } from "@/lib/catalog";
import {
  POPULAR_DEFAULT_SLUGS,
  subscribeUsage,
  getTopToolsSnapshot,
  getRecentToolsSnapshot,
  getEmptyToolsSnapshot,
} from "@/lib/usage";
import { useReveal } from "@/lib/use-reveal";
import { AdSlot } from "@/components/ad-unit";
import { useI18n, type MessageKey } from "@/lib/i18n";

const PINNED_STORAGE_KEY = "fileswow-pinned-tools";
const MAX_QUICK_TOOLS = 12;

const CURATED_POPULAR = new Set(POPULAR_DEFAULT_SLUGS);
const ORDERED_TOOLS: ToolDef[] = [
  ...ALL_TOOLS.filter((t) => CURATED_POPULAR.has(t.slug)),
  ...ALL_TOOLS.filter((t) => !CURATED_POPULAR.has(t.slug)),
];

const TOOL_BY_SLUG = new Map(ALL_TOOLS.map((t) => [t.slug, t]));

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

  return (
    <div ref={rootRef}>
      {/* ─── 1. Quick Shortcuts (Custom Pinned + Most Useful) ─────── */}
      <QuickShortcutsSection />

      {/* ─── 2. Most Useful Tools (Toolbar + Compact Grid) ───────── */}
      <PopularTools />

      {/* Ad — renders nothing when no slot is configured */}
      <AdSlot slot="home" label="leaderboard (home)" className="max-w-6xl mx-auto px-4 sm:px-6 py-6" />

      {/* ─── 3. How It Works & Local Architecture ────────────────── */}
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

      {/* ─── 4. FAQ (2-column split) ─────────────────────────────── */}
      <section id="faq" className="border-t border-border-base bg-bg-base" aria-labelledby="faq-heading">
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

/* ─── Customizable Quick Shortcuts (localStorage + Most Useful) ─── */

function QuickShortcutsSection() {
  const [pinnedSlugs, setPinnedSlugs] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [draggedSlug, setDraggedSlug] = useState<string | null>(null);
  const [dragOverSlug, setDragOverSlug] = useState<string | null>(null);
  const pickerInputRef = useRef<HTMLInputElement>(null);

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

  // Load saved custom shortcuts from localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PINNED_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setPinnedSlugs(
            parsed.filter((s) => typeof s === "string" && TOOL_BY_SLUG.has(s)).slice(0, MAX_QUICK_TOOLS)
          );
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Save custom shortcuts to localStorage
  const savePinned = (next: string[]) => {
    setPinnedSlugs(next);
    try {
      window.localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage errors
    }
  };

  useEffect(() => {
    if (pickerOpen) {
      const timer = setTimeout(() => pickerInputRef.current?.focus(), 80);
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setPickerOpen(false);
      };
      window.addEventListener("keydown", onKey);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("keydown", onKey);
      };
    }
  }, [pickerOpen]);

  // Order:
  // 1. Last used tool(s) automatically go first
  // 2. User's custom pinned tools (preserving drag-and-drop order)
  // 3. Most useful / top tools to fill up to 7 cards (max 12 total)
  const displayShortcuts = useMemo(() => {
    const seen = new Set<string>();
    const items: Array<{ tool: ToolDef; badge: "Recent" | "Pinned" | "Popular"; isPinned: boolean }> = [];

    // 1. Last used tool goes first automatically
    for (const tool of recentTools.slice(0, 2)) {
      if (seen.has(tool.slug)) continue;
      seen.add(tool.slug);
      items.push({
        tool,
        badge: "Recent",
        isPinned: pinnedSlugs.includes(tool.slug),
      });
    }

    // 2. Custom pinned tools
    for (const slug of pinnedSlugs) {
      if (seen.has(slug)) continue;
      const tool = TOOL_BY_SLUG.get(slug);
      if (tool) {
        seen.add(slug);
        items.push({ tool, badge: "Pinned", isPinned: true });
      }
    }

    // 3. Most useful / popular fallback
    const fallbackTools =
      topTools.length > 0
        ? topTools
        : (POPULAR_DEFAULT_SLUGS.slice(0, 7).map((s) => TOOL_BY_SLUG.get(s)).filter(Boolean) as ToolDef[]);

    for (const tool of fallbackTools) {
      if (items.length >= 7) break;
      if (seen.has(tool.slug)) continue;
      seen.add(tool.slug);
      items.push({ tool, badge: "Popular", isPinned: false });
    }

    return items.slice(0, MAX_QUICK_TOOLS);
  }, [pinnedSlugs, recentTools, topTools]);

  const togglePin = (slug: string) => {
    if (pinnedSlugs.includes(slug)) {
      savePinned(pinnedSlugs.filter((s) => s !== slug));
    } else if (pinnedSlugs.length < MAX_QUICK_TOOLS && displayShortcuts.length < MAX_QUICK_TOOLS) {
      savePinned([...pinnedSlugs, slug]);
    }
  };

  // Drag-and-drop reorder handler — persists full custom order to localStorage
  const handleDropOnCard = (targetSlug: string) => {
    if (!draggedSlug || draggedSlug === targetSlug) {
      setDraggedSlug(null);
      setDragOverSlug(null);
      return;
    }
    const currentOrder = displayShortcuts.map((d) => d.tool.slug);
    const fromIdx = currentOrder.indexOf(draggedSlug);
    const toIdx = currentOrder.indexOf(targetSlug);
    if (fromIdx === -1 || toIdx === -1) return;

    const reordered = [...currentOrder];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    savePinned(reordered);
    setDraggedSlug(null);
    setDragOverSlug(null);
  };

  const pickerResults = useMemo(() => {
    if (!pickerQuery.trim()) return ORDERED_TOOLS.slice(0, 24);
    return searchTools(pickerQuery, 24).map((r) => r.tool);
  }, [pickerQuery]);

  return (
    <section className="border-b border-border-base bg-bg-warm py-6 sm:py-8" aria-label="Quick tools">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <h1 className="heading-md text-text-primary">Quick Tools</h1>
            <span className="text-[12px] text-text-tertiary hidden sm:inline">
              · Drag to reorder
            </span>
          </div>

          {pinnedSlugs.length > 0 && (
            <button
              type="button"
              onClick={() => savePinned([])}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold text-text-secondary hover:text-danger bg-bg-surface hover:bg-danger/10 border border-border-base hover:border-danger/30 transition-colors cursor-pointer"
              title="Clear all pinned quick tools"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
              </svg>
              <span>Clear all</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {displayShortcuts.map(({ tool, badge, isPinned }) => {
            const isOver = dragOverSlug === tool.slug && draggedSlug !== tool.slug;
            return (
              <div
                key={tool.slug}
                draggable
                onDragStart={(e) => {
                  setDraggedSlug(tool.slug);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", tool.slug);
                  try {
                    e.dataTransfer.setDragImage(e.currentTarget, 24, 24);
                  } catch {
                    // Ignore in browsers that restrict setDragImage
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (dragOverSlug !== tool.slug) setDragOverSlug(tool.slug);
                }}
                onDragLeave={() => {
                  if (dragOverSlug === tool.slug) setDragOverSlug(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDropOnCard(tool.slug);
                }}
                onDragEnd={() => {
                  setDraggedSlug(null);
                  setDragOverSlug(null);
                }}
                className={`group relative rounded-xl select-none transition-all ${
                  isOver ? "ring-2 ring-accent scale-[1.02]" : ""
                } ${draggedSlug === tool.slug ? "opacity-45 scale-[0.98]" : ""}`}
              >
                <Link
                  href={`/tools/${tool.slug}`}
                  draggable={false}
                  className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-bg-surface border border-border-base hover:border-accent/40 hover:shadow-[var(--elevation-sm)] transition-all cursor-grab active:cursor-grabbing select-none"
                >
                  <span className="w-9 h-9 rounded-lg bg-bg-elevated flex items-center justify-center shrink-0">
                    <ToolIcon name={tool.slug} size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-semibold text-text-primary group-hover:text-accent transition-colors truncate pr-4">
                      {tool.name}
                    </span>
                    <span className="block text-[11.5px] text-text-tertiary truncate">
                      {badge}
                    </span>
                  </span>
                </Link>

                {isPinned && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      togglePin(tool.slug);
                    }}
                    title={`Remove ${tool.name} from quick tools`}
                    aria-label={`Remove ${tool.name}`}
                    className="absolute top-2 right-2 w-6 h-6 rounded-md flex items-center justify-center text-text-tertiary opacity-0 group-hover:opacity-100 hover:text-danger hover:bg-bg-elevated transition-all cursor-pointer"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}

          {/* + Add Custom Shortcut Tile (hidden once max 12 tools reached) */}
          {displayShortcuts.length < MAX_QUICK_TOOLS && (
            <button
              type="button"
              onClick={() => {
                setPickerQuery("");
                setPickerOpen(true);
              }}
              className="flex items-center justify-center gap-2 p-3 sm:p-3.5 rounded-xl border border-dashed border-border-strong bg-bg-surface/50 hover:bg-bg-surface hover:border-accent/60 text-text-secondary hover:text-accent transition-all cursor-pointer min-h-[62px]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span className="text-[13.5px] font-medium">Add tool</span>
            </button>
          )}
        </div>
      </div>

      {/* Custom Tool Picker Modal */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setPickerOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Add custom quick tools"
            className="relative w-full max-w-lg rounded-2xl bg-bg-surface border border-border-base shadow-[var(--elevation-xl)] overflow-hidden z-10 animate-fade-in-up"
          >
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-base">
              <h2 className="text-[15px] font-semibold text-text-primary">
                Customize Quick Tools
              </h2>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-bg-elevated cursor-pointer"
                aria-label="Close"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-3 border-b border-border-base">
              <input
                ref={pickerInputRef}
                type="text"
                value={pickerQuery}
                onChange={(e) => setPickerQuery(e.target.value)}
                placeholder={`Search ${ALL_TOOLS.length} tools to pin…`}
                className="input h-10 text-[14px]"
              />
            </div>

            <ul className="max-h-80 overflow-y-auto divide-y divide-border-base">
              {pickerResults.map((tool) => {
                const pinned = pinnedSlugs.includes(tool.slug);
                const atLimit = displayShortcuts.length >= MAX_QUICK_TOOLS || pinnedSlugs.length >= MAX_QUICK_TOOLS;
                return (
                  <li key={tool.slug}>
                    <button
                      type="button"
                      disabled={!pinned && atLimit}
                      onClick={() => togglePin(tool.slug)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-bg-elevated/60 disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <ToolIcon name={tool.slug} size={18} className="shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="block text-[13.5px] font-medium text-text-primary truncate">
                          {tool.name}
                        </span>
                        <span className="block text-[11.5px] text-text-tertiary truncate">
                          {tool.description}
                        </span>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[11.5px] font-medium shrink-0 ${
                          pinned
                            ? "bg-accent text-text-on-accent"
                            : "bg-bg-elevated text-text-secondary"
                        }`}
                      >
                        {pinned ? "Pinned" : "+ Add"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="px-4 py-3 border-t border-border-base bg-bg-warm flex items-center justify-between text-[12px] text-text-tertiary">
              <span>Saved locally in your browser</span>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="btn-primary !min-h-8 px-4 py-1 text-[12.5px]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
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
    <section className="py-10 sm:py-14" aria-labelledby="popular-heading">
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
