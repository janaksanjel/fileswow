// lib/content/types.ts — shared shape for per-tool editorial content.

export interface ToolGuide {
  /** Unique editorial paragraphs shown as the tool's written guide. */
  paragraphs: string[];
  /** Additional Q&A pairs appended to the tool's catalog FAQ. */
  faq?: { q: string; a: string }[];
}

export type ToolGuideMap = Record<string, ToolGuide>;
