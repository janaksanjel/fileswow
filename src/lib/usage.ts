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

function invalidateCaches(): void {
  recentToolsCache = null;
  popularToolsCache = null;
  recentEntriesCache = null;
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
