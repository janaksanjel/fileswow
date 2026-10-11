// lib/mega-menu.ts
//
// Navigation data for the header's per-category mega menus.
// Every entry must exist in the catalog — links point at real tool pages,
// so the menu doubles as sitewide internal linking for SEO.
// Columns are grouped by task (Organize / Convert / Edit / Secure …),
// 3–4 groups per category, money tools first.

import { ALL_TOOLS, type ToolDef, type ToolCategory } from "./catalog";

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

export interface CategoryMenu {
  category: ToolCategory;
  label: string;
  href: string;
  groups: MegaMenuGroup[];
}

interface GroupSpec {
  title: string;
  slugs: string[];
}

const MENU_SPECS: Array<{
  category: ToolCategory;
  label: string;
  href: string;
  groups: GroupSpec[];
}> = [
  {
    category: "pdf",
    label: "PDF Tools",
    href: "/pdf-tools",
    groups: [
      { title: "Organize", slugs: ["merge-pdf", "split-pdf", "organize-pdf", "delete-pdf-pages", "rotate-pdf", "add-page-numbers-pdf"] },
      { title: "Convert", slugs: ["pdf-to-word", "pdf-to-jpg", "pdf-to-excel", "html-to-pdf", "word-to-pdf"] },
      { title: "Edit & Sign", slugs: ["edit-pdf", "sign-pdf", "watermark-pdf", "crop-pdf", "fill-pdf-form"] },
      { title: "Optimize & Secure", slugs: ["compress-pdf", "protect-pdf", "unlock-pdf", "ocr-pdf", "redact-pdf"] },
    ],
  },
  {
    category: "word",
    label: "Word Tools",
    href: "/word-tools",
    groups: [
      { title: "Organize", slugs: ["merge-word", "split-word", "word-page-numbers", "word-page-setup", "word-toc-generator"] },
      { title: "Edit", slugs: ["word-find-replace", "word-track-changes", "word-style-cleaner", "remove-watermark-word", "watermark-word"] },
      { title: "Convert", slugs: ["word-to-text", "text-to-word", "word-to-html", "html-to-word", "word-to-markdown"] },
      { title: "Secure", slugs: ["protect-word", "unlock-word", "redact-word"] },
    ],
  },
  {
    category: "image",
    label: "Image Tools",
    href: "/image-tools",
    groups: [
      { title: "Convert", slugs: ["jpg-to-png", "png-to-jpg", "jpg-to-webp", "svg-to-png", "heic-to-jpg"] },
      { title: "Crop & Resize", slugs: ["resize-image", "crop-image", "smart-crop", "rotate-image", "flip-image"] },
      { title: "Adjust & Filters", slugs: ["brightness-contrast", "blur-image", "grayscale-image", "saturation-adjust", "sharpen-image"] },
      { title: "Enhance & Clean", slugs: ["background-remove-image", "compress-image", "change-bg-color", "watermark-image", "strip-metadata-image"] },
    ],
  },
  {
    category: "text",
    label: "Text Tools",
    href: "/text-tools",
    groups: [
      { title: "Send & Chat", slugs: ["p2p-text"] },
      { title: "Text to Documents", slugs: ["text-to-pdf", "text-to-word", "pdf-to-text", "word-to-text"] },
      { title: "Inspect & Compare", slugs: ["side-by-side-diff", "file-info", "universal-converter"] },
    ],
  },
];

function pick(tool: ToolDef | undefined): MegaMenuTool | null {
  if (!tool) return null;
  return { slug: tool.slug, name: tool.name, description: tool.description };
}

export const CATEGORY_MENUS: CategoryMenu[] = MENU_SPECS.map(({ category, label, href, groups }) => ({
  category,
  label,
  href,
  groups: groups
    .map((group) => ({
      title: group.title,
      href,
      tools: group.slugs
        .map((slug) => ALL_TOOLS.find((t) => t.slug === slug))
        .map(pick)
        .filter((t): t is MegaMenuTool => t !== null),
    }))
    .filter((group) => group.tools.length > 0),
}));
