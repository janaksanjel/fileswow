// lib/content/index.ts
//
// Barrel for per-tool editorial content. Merges the per-category guide maps
// into one lookup and exposes helpers used by tool pages.
//
// In development builds, coverage is validated against the catalog: a tool
// without content throws at startup, so missing content is caught the moment
// a tool is added — not by reviewers months later.

import { ALL_TOOLS } from "../catalog";
import type { ToolGuide, ToolGuideMap } from "./types";
import PDF_GUIDES_A from "./pdf-a";
import PDF_GUIDES_B from "./pdf-b";
import WORD_GUIDES from "./word-cross";
import IMAGE_GUIDES_A from "./image-a";
import IMAGE_GUIDES_B from "./image-b";
import TEXT_GUIDES from "./text-tools";

export type { ToolGuide, ToolGuideMap } from "./types";

export const TOOL_GUIDES: ToolGuideMap = {
  ...PDF_GUIDES_A,
  ...PDF_GUIDES_B,
  ...WORD_GUIDES,
  ...IMAGE_GUIDES_A,
  ...IMAGE_GUIDES_B,
  ...TEXT_GUIDES,
};

/** Look up the editorial content for a tool by slug. Returns null if absent. */
export function getToolGuide(slug: string): ToolGuide | null {
  return TOOL_GUIDES[slug] ?? null;
}

/**
 * FAQ list for a tool: the catalog's FAQ first, then the editorial FAQ
 * (deduped by question, case-insensitive) — used for both the visible
 * accordion and the FAQPage JSON-LD so they always match.
 */
export function getToolFaq(
  slug: string,
  catalogFaq: { q: string; a: string }[]
): { q: string; a: string }[] {
  const merged = [...catalogFaq];
  const seen = new Set(catalogFaq.map((f) => f.q.trim().toLowerCase()));
  for (const item of TOOL_GUIDES[slug]?.faq ?? []) {
    const key = item.q.trim().toLowerCase();
    if (!seen.has(key)) {
      merged.push(item);
      seen.add(key);
    }
  }
  return merged;
}

// ── Coverage validation (development only) ───────────────────────────
if (process.env.NODE_ENV !== "production") {
  const missing = ALL_TOOLS.filter((t) => !TOOL_GUIDES[t.slug]).map((t) => t.slug);
  if (missing.length > 0) {
    throw new Error(
      `[content] Missing editorial content for ${missing.length} tool(s): ${missing.join(", ")}`
    );
  }
  const known = new Set(ALL_TOOLS.map((t) => t.slug));
  const stale = Object.keys(TOOL_GUIDES).filter((slug) => !known.has(slug));
  if (stale.length > 0) {
    throw new Error(
      `[content] Editorial content exists for unknown tool slug(s): ${stale.join(", ")}`
    );
  }
}
