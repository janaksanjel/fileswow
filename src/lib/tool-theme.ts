export interface ToolGradientTheme {
  /** Vibrant gradient for accent bars, pills, and highlights */
  gradient: string;
  /** Soft translucent gradient wash */
  softGradient: string;
  accentHex: string;
}

export const DEFAULT_HEADER_THEME: ToolGradientTheme = {
  gradient: "linear-gradient(135deg, #047857 0%, #059669 55%, #14B8A6 100%)",
  softGradient: "linear-gradient(135deg, rgba(5, 150, 105, 0.14) 0%, rgba(20, 184, 166, 0.08) 100%)",
  accentHex: "#059669",
};

const TOOL_GRADIENTS: ToolGradientTheme[] = [
  // Royal Indigo
  {
    gradient: "linear-gradient(135deg, #4338CA 0%, #6366F1 55%, #818CF8 100%)",
    softGradient: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(129, 140, 248, 0.08) 100%)",
    accentHex: "#6366F1",
  },
  // Ocean Sapphire
  {
    gradient: "linear-gradient(135deg, #0369A1 0%, #0284C7 55%, #06B6D4 100%)",
    softGradient: "linear-gradient(135deg, rgba(2, 132, 199, 0.14) 0%, rgba(6, 182, 212, 0.08) 100%)",
    accentHex: "#0284C7",
  },
  // Emerald Teal
  {
    gradient: "linear-gradient(135deg, #047857 0%, #059669 55%, #14B8A6 100%)",
    softGradient: "linear-gradient(135deg, rgba(5, 150, 105, 0.14) 0%, rgba(20, 184, 166, 0.08) 100%)",
    accentHex: "#059669",
  },
  // Deep Violet
  {
    gradient: "linear-gradient(135deg, #6D28D9 0%, #7C3AED 55%, #A855F7 100%)",
    softGradient: "linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(168, 85, 247, 0.08) 100%)",
    accentHex: "#7C3AED",
  },
  // Cobalt Blue
  {
    gradient: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 55%, #3B82F6 100%)",
    softGradient: "linear-gradient(135deg, rgba(37, 99, 235, 0.14) 0%, rgba(59, 130, 246, 0.08) 100%)",
    accentHex: "#2563EB",
  },
  // Electric Cyan
  {
    gradient: "linear-gradient(135deg, #0E7490 0%, #0891B2 55%, #2563EB 100%)",
    softGradient: "linear-gradient(135deg, rgba(8, 145, 178, 0.14) 0%, rgba(37, 99, 235, 0.08) 100%)",
    accentHex: "#0891B2",
  },
  // Teal Indigo
  {
    gradient: "linear-gradient(135deg, #0F766E 0%, #0D9488 55%, #2563EB 100%)",
    softGradient: "linear-gradient(135deg, rgba(13, 148, 136, 0.14) 0%, rgba(37, 99, 235, 0.08) 100%)",
    accentHex: "#0D9488",
  },
  // Berry Plum
  {
    gradient: "linear-gradient(135deg, #7E22CE 0%, #9333EA 55%, #DB2777 100%)",
    softGradient: "linear-gradient(135deg, rgba(147, 51, 234, 0.14) 0%, rgba(219, 39, 119, 0.08) 100%)",
    accentHex: "#9333EA",
  },
  // Deep Navy Blue
  {
    gradient: "linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 55%, #0284C7 100%)",
    softGradient: "linear-gradient(135deg, rgba(29, 78, 216, 0.15) 0%, rgba(2, 132, 199, 0.08) 100%)",
    accentHex: "#1D4ED8",
  },
  // Forest Mint
  {
    gradient: "linear-gradient(135deg, #15803D 0%, #16A34A 55%, #0D9488 100%)",
    softGradient: "linear-gradient(135deg, rgba(22, 163, 74, 0.14) 0%, rgba(13, 148, 136, 0.08) 100%)",
    accentHex: "#16A34A",
  },
  // Crimson Berry
  {
    gradient: "linear-gradient(135deg, #9D174D 0%, #BE185D 55%, #EC4899 100%)",
    softGradient: "linear-gradient(135deg, rgba(190, 24, 93, 0.14) 0%, rgba(236, 72, 153, 0.08) 100%)",
    accentHex: "#BE185D",
  },
  // Indigo Cyan
  {
    gradient: "linear-gradient(135deg, #3730A3 0%, #4F46E5 55%, #06B6D4 100%)",
    softGradient: "linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(6, 182, 212, 0.08) 100%)",
    accentHex: "#4F46E5",
  },
];

/**
 * Returns a default pro gradient theme that rotates automatically every 1 hour.
 */
export function getHourlyDefaultTheme(nowMs: number = Date.now()): ToolGradientTheme {
  const hourBucket = Math.floor(nowMs / 3_600_000);
  return TOOL_GRADIENTS[hourBucket % TOOL_GRADIENTS.length];
}

/**
 * Deterministic pro gradient palette for each tool slug so every tool header
 * has a distinct, cohesive visual identity that keeps the FilesWow logo crisp.
 */
export function getToolGradient(slug: string): ToolGradientTheme {
  let hash = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    hash ^= slug.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const index = Math.abs(hash) % TOOL_GRADIENTS.length;
  return TOOL_GRADIENTS[index];
}
