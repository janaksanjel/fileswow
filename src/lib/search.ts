// lib/search.ts — Fuzzy search with ranking algorithm
// Scores matches by: exact > starts-with > contains > fuzzy-character

import { ALL_TOOLS, type ToolDef } from "./catalog";

export interface SearchResult {
  tool: ToolDef;
  score: number;
  matchType: "exact" | "starts-with" | "contains" | "fuzzy";
}

/**
 * Calculate fuzzy match score between query and target string.
 * Returns a score from 0 (no match) to 100 (perfect match).
 */
function fuzzyScore(query: string, target: string): { score: number; type: SearchResult["matchType"] } {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();

  if (!q) return { score: 0, type: "fuzzy" };

  // Exact match — highest score
  if (q === t) return { score: 100, type: "exact" };

  // Starts with — very high score
  if (t.startsWith(q)) {
    const ratio = q.length / t.length;
    return { score: 85 + ratio * 15, type: "starts-with" };
  }

  // Contains as whole word
  const wordRegex = new RegExp(`\\b${escapeRegex(q)}\\b`, "i");
  if (wordRegex.test(t)) {
    return { score: 75, type: "contains" };
  }

  // Contains substring
  if (t.includes(q)) {
    const idx = t.indexOf(q);
    const ratio = q.length / t.length;
    // Earlier position = higher score
    const positionBonus = Math.max(0, 1 - idx / t.length) * 10;
    return { score: 60 + ratio * 20 + positionBonus, type: "contains" };
  }

  // Fuzzy character matching
  let qi = 0;
  let consecutiveBonus = 0;
  let lastMatchIdx = -2;
  let matchCount = 0;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      matchCount++;
      // Consecutive character bonus
      if (ti === lastMatchIdx + 1) {
        consecutiveBonus += 5;
      }
      lastMatchIdx = ti;
      qi++;
    }
  }

  // All characters matched?
  if (qi === q.length) {
    const matchRatio = matchCount / q.length;
    const lengthPenalty = Math.max(0, 1 - (t.length - q.length) / t.length);
    const score = 30 + matchRatio * 30 + lengthPenalty * 20 + Math.min(consecutiveBonus, 20);
    return { score: Math.min(score, 59), type: "fuzzy" };
  }

  return { score: 0, type: "fuzzy" };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Search tools with a query string.
 * Returns results sorted by score (best first), limited to maxResults.
 */
export function searchTools(query: string, maxResults: number = 12): SearchResult[] {
  const q = query.trim();
  if (!q) return [];

  const results: SearchResult[] = [];

  for (const tool of ALL_TOOLS) {
    // Score against name (highest weight)
    const nameMatch = fuzzyScore(q, tool.name);

    // Score against slug
    const slugMatch = fuzzyScore(q, tool.slug.replace(/-/g, " "));

    // Score against description (lower weight)
    const descMatch = fuzzyScore(q, tool.description);

    // Score against category
    const catMatch = fuzzyScore(q, tool.subCategory);

    // Combine scores with weights
    const bestScore = Math.max(
      nameMatch.score * 1.0,       // Name is most important
      slugMatch.score * 0.8,       // Slug is second
      descMatch.score * 0.5,       // Description is third
      catMatch.score * 0.3         // Category is least
    );

    const bestType: SearchResult["matchType"] =
      nameMatch.score >= slugMatch.score && nameMatch.score >= descMatch.score
        ? nameMatch.type
        : slugMatch.score >= descMatch.score
        ? slugMatch.type
        : descMatch.type;

    if (bestScore > 15) {
      results.push({
        tool,
        score: Math.round(bestScore),
        matchType: bestType,
      });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, maxResults);
}

/**
 * Get category display info
 */
export function getCategoryColor(category: string): string {
  switch (category) {
    case "pdf": return "bg-accent/10 text-accent";
    case "word": return "bg-warning/10 text-warning";
    case "image": return "bg-accent-blue/10 text-accent-blue";
    case "text": return "bg-success/10 text-success";
    case "cross": return "bg-text-tertiary/10 text-text-tertiary";
    default: return "bg-text-tertiary/10 text-text-tertiary";
  }
}
