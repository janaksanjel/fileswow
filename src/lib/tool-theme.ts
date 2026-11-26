export interface ToolGradientTheme {
  /** Vibrant gradient for accent bars, pills, and highlights */
  gradient: string;
  /** Soft translucent gradient wash for the website header so text & logo stay crisp */
  softGradient: string;
  accentHex: string;
}

const TOOL_GRADIENTS: ToolGradientTheme[] = [
  // Sunset Orange
  {
    gradient: "linear-gradient(135deg, #EA580C 0%, #FC5B00 55%, #FB923C 100%)",
    softGradient: "linear-gradient(135deg, rgba(252, 91, 0, 0.14) 0%, rgba(251, 146, 60, 0.08) 100%)",
    accentHex: "#FC5B00",
  },
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
  // Crimson Rose
  {
    gradient: "linear-gradient(135deg, #BE123C 0%, #E11D48 55%, #F43F5E 100%)",
    softGradient: "linear-gradient(135deg, rgba(225, 29, 72, 0.14) 0%, rgba(244, 63, 94, 0.08) 100%)",
    accentHex: "#E11D48",
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
  // Magenta Plum
  {
    gradient: "linear-gradient(135deg, #A21CAF 0%, #C026D3 55%, #EC4899 100%)",
    softGradient: "linear-gradient(135deg, rgba(192, 38, 211, 0.14) 0%, rgba(236, 72, 153, 0.08) 100%)",
    accentHex: "#C026D3",
  },
  // Forest Mint
  {
    gradient: "linear-gradient(135deg, #15803D 0%, #16A34A 55%, #0D9488 100%)",
    softGradient: "linear-gradient(135deg, rgba(22, 163, 74, 0.14) 0%, rgba(13, 148, 136, 0.08) 100%)",
    accentHex: "#16A34A",
  },
  // Amber Coral
  {
    gradient: "linear-gradient(135deg, #B45309 0%, #D97706 55%, #EA580C 100%)",
    softGradient: "linear-gradient(135deg, rgba(217, 119, 6, 0.15) 0%, rgba(234, 88, 12, 0.08) 100%)",
    accentHex: "#D97706",
  },
  // Midnight Slate
  {
    gradient: "linear-gradient(135deg, #0F172A 0%, #1E293B 55%, #334155 100%)",
    softGradient: "linear-gradient(135deg, rgba(30, 41, 59, 0.14) 0%, rgba(71, 85, 105, 0.08) 100%)",
    accentHex: "#334155",
  },
  // Electric Cyan
  {
    gradient: "linear-gradient(135deg, #0E7490 0%, #0891B2 55%, #2563EB 100%)",
    softGradient: "linear-gradient(135deg, rgba(8, 145, 178, 0.14) 0%, rgba(37, 99, 235, 0.08) 100%)",
    accentHex: "#0891B2",
  },
];

export const DEFAULT_HEADER_THEME: ToolGradientTheme = {
  gradient: "linear-gradient(135deg, #EA580C 0%, #FC5B00 55%, #FB923C 100%)",
  softGradient: "linear-gradient(135deg, rgba(252, 91, 0, 0.12) 0%, rgba(251, 146, 60, 0.06) 100%)",
  accentHex: "#FC5B00",
};

/**
 * Deterministic pro gradient palette for each tool slug so every tool header
 * has a distinct, cohesive visual identity.
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
