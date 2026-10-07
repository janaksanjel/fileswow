// lib/mega-menu.ts
//
// Curated navigation data for the header "All Tools" mega menu.
// Referenced from premium PDF-suite IA (organize / convert / edit / secure),
// adapted to FilesWow's own categories and tool names. Every entry must
// exist in the catalog — the links point at real tool pages so the menu
// doubles as sitewide internal linking for SEO.

import { ALL_TOOLS, type ToolDef } from "./catalog";

export interface MegaMenuTool {
  slug: string;
  name: string;
  description: string;
}

export interface MegaMenuGroup {
  title: string;
  /** Category hub the group title links to. */
  href: string;
  tools: MegaMenuTool[];
}

/** Curated slug order per group — money tools first, 4–5 per group. */
const GROUPS: Array<{
  title: string;
  href: string;
  slugs: string[];
}> = [
  {
    title: "Organize PDF",
    href: "/pdf-tools",
    slugs: ["merge-pdf", "split-pdf", "organize-pdf", "delete-pdf-pages", "rotate-pdf", "add-page-numbers-pdf"],
  },
  {
    title: "Optimize & Secure",
    href: "/pdf-tools",
    slugs: ["compress-pdf", "protect-pdf", "unlock-pdf", "sign-pdf", "watermark-pdf", "ocr-pdf"],
  },
  {
    title: "Convert Documents",
    href: "/word-tools",
    slugs: ["pdf-to-word", "word-to-pdf", "pdf-to-excel", "excel-to-pdf", "powerpoint-to-pdf", "pdf-to-jpg"],
  },
  {
    title: "Word Tools",
    href: "/word-tools",
    slugs: ["merge-word", "split-word", "word-page-numbers", "word-page-setup", "remove-watermark-word", "word-to-text"],
  },
  {
    title: "Image Tools",
    href: "/image-tools",
    slugs: ["compress-image", "resize-image", "rotate-image", "jpg-to-pdf", "images-to-pdf", "background-remove-image"],
  },
  {
    title: "Text & Share",
    href: "/text-tools",
    slugs: ["text-to-pdf", "text-to-word", "pdf-to-text", "word-to-text", "p2p-text"],
  },
];

function pick(tool: ToolDef): MegaMenuTool {
  return { slug: tool.slug, name: tool.name, description: tool.description };
}

export const MEGA_MENU: MegaMenuGroup[] = GROUPS.map(({ title, href, slugs }) => ({
  title,
  href,
  tools: slugs
    .map((slug) => ALL_TOOLS.find((t) => t.slug === slug))
    .filter((t): t is ToolDef => Boolean(t))
    .map(pick),
})).filter((group) => group.tools.length > 0);
