// Shared category tints for icon tiles and labels.
// Kept in one place so cards, tool shells, and hub pages stay consistent.

export const CATEGORY_TILE: Record<string, string> = {
  pdf: "bg-cat-pdf/10 text-cat-pdf ring-cat-pdf/20",
  word: "bg-cat-word/10 text-cat-word ring-cat-word/20",
  image: "bg-cat-image/10 text-cat-image ring-cat-image/20",
  text: "bg-cat-text/10 text-cat-text ring-cat-text/20",
  cross: "bg-bg-elevated text-text-secondary ring-border-strong",
};

export const CATEGORY_TEXT: Record<string, string> = {
  pdf: "text-cat-pdf",
  word: "text-cat-word",
  image: "text-cat-image",
  text: "text-cat-text",
  cross: "text-text-tertiary",
};

export function categoryTile(category: string): string {
  return CATEGORY_TILE[category] || CATEGORY_TILE.cross;
}

export function categoryText(category: string): string {
  return CATEGORY_TEXT[category] || CATEGORY_TEXT.cross;
}
