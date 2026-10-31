// lib/usage.ts — Tool usage tracking via localStorage
// Records every tool visit and exposes "recently used" + "popular tools" lists.
// Snapshots are cached so they can be used with useSyncExternalStore (stable references
// between store updates, no setState-in-effect cascades).

import { getToolBySlug, type ToolDef } from "./catalog";

const STORAGE_KEY = "tool-usage";
const RECENT_SNAPSHOT_MAX = 20;
const POPULAR_SNAPSHOT_COUNT = 8;

interface UsageEntry {
  slug: string;
  count: number;
  lastUsed: number; // epoch ms
}

type UsageMap = Record<string, UsageEntry>;

export interface RecentToolEntry {
  tool: ToolDef;
  lastUsed: number;
}

// ─── Store plumbing ─────────────────────────────────────────────────

const listeners = new Set<() => void>();
const EMPTY_TOOLS: ToolDef[] = [];
const EMPTY_ENTRIES: RecentToolEntry[] = [];

let recentToolsCache: ToolDef[] | null = null;
let popularToolsCache: ToolDef[] | null = null;
let recentEntriesCache: RecentToolEntry[] | null = null;
let personalHistoryFlagCache: boolean | null = null;

function invalidateCaches(): void {
  recentToolsCache = null;
  popularToolsCache = null;
  recentEntriesCache = null;
  personalHistoryFlagCache = null;
}

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

/** Subscribe to usage-store changes. For useSyncExternalStore. */
export function subscribeUsage(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// ─── Read / write ───────────────────────────────────────────────────

function readUsage(): UsageMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as UsageMap;
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed;
  } catch {
    return {};
  }
}

function writeUsage(map: UsageMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // localStorage full or unavailable — tracking is best-effort
  }
  invalidateCaches();
  notifyListeners();
}

/** Record a tool visit. Throttled to 1 write per slug per minute. */
export function recordToolVisit(slug: string): void {
  if (typeof window === "undefined") return;
  if (!getToolBySlug(slug)) return;

  const map = readUsage();
  const now = Date.now();
  const entry = map[slug];

  // Throttle: don't spam timestamps when the user reloads rapidly
  if (entry && now - entry.lastUsed < 60_000) return;

  map[slug] = {
    slug,
    count: (entry?.count ?? 0) + 1,
    lastUsed: now,
  };
  writeUsage(map);
}

/** Erase all usage history from this browser (used by the "Clear" button). */
export function clearUsageHistory(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable — nothing to clear
  }
  invalidateCaches();
  notifyListeners();
}

// ─── Query helpers (uncached, for one-off reads) ────────────────────

/** Most recently used tools (newest first). */
export function getRecentTools(max: number): ToolDef[] {
  return getRecentEntries()
    .slice(0, max)
    .map((e) => e.tool);
}

/** Most popular tools: first by visit count, then by recency. Padded with curated defaults. */
export function getPopularTools(count: number): ToolDef[] {
  const map = readUsage();
  const used = Object.values(map)
    .sort((a, b) => b.count - a.count || b.lastUsed - a.lastUsed)
    .map((e) => getToolBySlug(e.slug))
    .filter(Boolean) as ToolDef[];

  // Pad with curated defaults so the section is never empty for new visitors
  if (used.length >= count) return used.slice(0, count);
  const usedSlugs = new Set(used.map((t) => t.slug));
  const defaults = POPULAR_DEFAULT_SLUGS.filter((s) => !usedSlugs.has(s))
    .map(getToolBySlug)
    .filter(Boolean) as ToolDef[];
  return [...used, ...defaults].slice(0, count);
}

// ─── Personalized "Top Tools" ranking ──────────────────────────────

// Half-life of a visit's value: after 3 days a visit is worth half as much.
const RECENCY_HALF_LIFE_MS = 3 * 24 * 60 * 60 * 1000;
// How strongly personal usage (vs the curated defaults) influences the ranking.
const PERSONAL_WEIGHT = 2.5;

/**
 * Score a usage entry by frequency with exponential recency decay:
 *   score = visits × 2^(−age / halfLife)
 * A tool used 5 times this week outranks one used 10 times two months ago.
 */
function personalizedScore(entry: UsageEntry, now: number): number {
  const age = Math.max(0, now - entry.lastUsed);
  const recency = Math.pow(2, -age / RECENCY_HALF_LIFE_MS);
  return (entry.count || 1) * recency;
}

/**
 * Personalized "Top Tools": blends the user's own usage score with the
 * site-wide curated popularity order. Early on (little history) it looks like
 * the curated list; the more the user works, the more it reflects their habits.
 */
export function getTopTools(count: number): ToolDef[] {
  const map = readUsage();
  const now = Date.now();

  const scored = Object.values(map)
    .map((entry) => ({ entry, score: personalizedScore(entry, now) }))
    .filter((s) => s.score > 0.01)
    .sort((a, b) => b.score - a.score);

  // Normalize personal scores to [0, 1]
  const maxScore = scored[0]?.score ?? 0;
  const personalRank = new Map<string, number>();
  scored.forEach((s, i) => {
    // Rank position (0-based), lightly smoothed by score so near-ties keep their order
    personalRank.set(s.entry.slug, i);
  });

  // Build candidate list: personal picks first (weighted), then curated defaults
  const candidates: Array<{ slug: string; weight: number }> = [];
  scored.forEach((s) => {
    const normalized = maxScore > 0 ? s.score / maxScore : 0;
    candidates.push({ slug: s.entry.slug, weight: PERSONAL_WEIGHT + normalized });
  });
  POPULAR_DEFAULT_SLUGS.forEach((slug, i) => {
    candidates.push({ slug, weight: 1 - i / (POPULAR_DEFAULT_SLUGS.length * 2) });
  });

  // Stable sort by weight, keep best `count`, dedupe
  candidates.sort((a, b) => b.weight - a.weight);
  const seen = new Set<string>();
  const result: ToolDef[] = [];
  for (const c of candidates) {
    if (seen.has(c.slug)) continue;
    seen.add(c.slug);
    const tool = getToolBySlug(c.slug);
    if (tool) result.push(tool);
    if (result.length >= count) break;
  }
  return result;
}

function getRecentEntries(): RecentToolEntry[] {
  const map = readUsage();
  return Object.values(map)
    .sort((a, b) => b.lastUsed - a.lastUsed)
    .map((e) => {
      const tool = getToolBySlug(e.slug);
      return tool ? { tool, lastUsed: e.lastUsed } : null;
    })
    .filter(Boolean) as RecentToolEntry[];
}

// ─── Cached snapshots (stable refs for useSyncExternalStore) ────────

export function getRecentToolsSnapshot(): ToolDef[] {
  if (recentToolsCache === null) recentToolsCache = getRecentTools(RECENT_SNAPSHOT_MAX);
  return recentToolsCache;
}

export function getPopularToolsSnapshot(): ToolDef[] {
  if (popularToolsCache === null) popularToolsCache = getPopularTools(POPULAR_SNAPSHOT_COUNT);
  return popularToolsCache;
}

/** Personalized top tools (frequency × recency, blended with curated defaults). */
export function getTopToolsSnapshot(): ToolDef[] {
  if (popularToolsCache === null) popularToolsCache = getTopTools(POPULAR_SNAPSHOT_COUNT);
  return popularToolsCache;
}

/** Whether this visitor has any recorded tool usage (drives the "For You" label). */
export function hasPersonalHistorySnapshot(): boolean {
  if (personalHistoryFlagCache === null) {
    personalHistoryFlagCache = Object.keys(readUsage()).length > 0;
  }
  return personalHistoryFlagCache;
}

export function getRecentEntriesSnapshot(): RecentToolEntry[] {
  if (recentEntriesCache === null) recentEntriesCache = getRecentEntries();
  return recentEntriesCache;
}

export function getEmptyToolsSnapshot(): ToolDef[] {
  return EMPTY_TOOLS;
}

export function getEmptyEntriesSnapshot(): RecentToolEntry[] {
  return EMPTY_ENTRIES;
}

/** Curated fallback ordering, inspired by what's popular on similar tool sites (iLovePDF, iLoveIMG…). */
export const POPULAR_DEFAULT_SLUGS: string[] = [
  "merge-pdf",
  "compress-pdf",
  "remove-watermark-image",
  "remove-watermark-pdf",
  "remove-watermark-word",
  "pdf-to-word",
  "word-to-pdf",
  "split-pdf",
  "pdf-to-jpg",
  "jpg-to-pdf",
  "edit-pdf",
  "sign-pdf",
  "protect-pdf",
  "excel-to-pdf",
  "pdf-to-excel",
  "rotate-pdf",
  "unlock-pdf",
  "watermark-pdf",
  "resize-image",
];

export interface HeaderToolItem {
  slug: string;
  name: string;
  href: string;
  isRecommendation?: boolean;
}

export const DEFAULT_HEADER_TOOLS: HeaderToolItem[] = [
  { slug: "merge-pdf", name: "Merge PDF", href: "/tools/merge-pdf" },
  { slug: "compress-pdf", name: "Compress PDF", href: "/tools/compress-pdf" },
  { slug: "pdf-to-word", name: "PDF to Word", href: "/tools/pdf-to-word", isRecommendation: true },
];

/**
 * Top 3 tools for the header:
 * - 1st & 2nd: User's top 2 most-used/clicked tools from local storage (recency-weighted algorithm)
 * - 3rd: Contextual match recommendation based on related tools & category
 */
export function getHeaderSmartTools(): HeaderToolItem[] {
  if (typeof window === "undefined") return DEFAULT_HEADER_TOOLS;

  const topTools = getTopTools(6);
  if (!topTools || topTools.length === 0) return DEFAULT_HEADER_TOOLS;

  const tool1 = topTools[0] || getToolBySlug("merge-pdf");
  const tool2 = topTools[1] || getToolBySlug("compress-pdf");

  const chosenSlugs = new Set<string>([tool1.slug, tool2.slug]);

  // 3rd tool: Smart match recommendation based on relatedSlugs or category
  let recTool: ToolDef | undefined;

  // 1) Check relatedSlugs of top 2 tools
  for (const t of [tool1, tool2]) {
    if (t?.relatedSlugs) {
      for (const relSlug of t.relatedSlugs) {
        if (!chosenSlugs.has(relSlug)) {
          const cand = getToolBySlug(relSlug);
          if (cand) {
            recTool = cand;
            break;
          }
        }
      }
    }
    if (recTool) break;
  }

  // 2) If none found from relatedSlugs, check subsequent top tools
  if (!recTool) {
    for (let i = 2; i < topTools.length; i++) {
      if (!chosenSlugs.has(topTools[i].slug)) {
        recTool = topTools[i];
        break;
      }
    }
  }

  // 3) Fallback
  if (!recTool) {
    const fallbackSlugs = ["pdf-to-word", "word-to-pdf", "split-pdf", "background-remove-image"];
    for (const fb of fallbackSlugs) {
      if (!chosenSlugs.has(fb)) {
        recTool = getToolBySlug(fb);
        if (recTool) break;
      }
    }
  }

  return [
    { slug: tool1.slug, name: tool1.name, href: `/tools/${tool1.slug}` },
    { slug: tool2.slug, name: tool2.name, href: `/tools/${tool2.slug}` },
    {
      slug: recTool ? recTool.slug : "pdf-to-word",
      name: recTool ? recTool.name : "PDF to Word",
      href: `/tools/${recTool ? recTool.slug : "pdf-to-word"}`,
      isRecommendation: true,
    },
  ];
}
