/**
 * Core flagship tool slugs included in sitemap.xml and marked indexable.
 * Focusing crawl budget on ~29 high-intent tools + hubs + guides + blog posts
 * prevents Google from holding 190+ thin/niche utility URLs in
 * "Discovered – currently not indexed".
 */
export const CORE_INDEXED_TOOL_SLUGS = new Set<string>([
  // Flagship PDF tools
  "merge-pdf",
  "split-pdf",
  "compress-pdf",
  "pdf-to-word",
  "word-to-pdf",
  "jpg-to-pdf",
  "pdf-to-jpg",
  "sign-pdf",
  "watermark-pdf",
  "protect-pdf",
  "unlock-pdf",
  "organize-pdf",
  "rotate-pdf",
  "delete-pdf-pages",
  "extract-pdf-pages",
  "add-page-numbers-pdf",
  "edit-pdf",
  "ocr-pdf",
  // Flagship Word tools
  "merge-word",
  "split-word",
  "word-to-text",
  "compress-word",
  // Flagship Image tools
  "compress-image",
  "resize-image",
  "crop-image",
  "background-remove-image",
  "jpg-to-png",
  "png-to-jpg",
  "webp-to-jpg",
  // Flagship Text & Cross-format tools
  "text-to-pdf",
  "p2p-text",
  "side-by-side-diff",
]);
