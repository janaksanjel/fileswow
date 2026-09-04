// Shared category tints for icon tiles and labels.
// Kept in one place so cards, tool shells, and hub pages stay consistent.

export const CATEGORY_TILE: Record<string, string> = {
  pdf: "bg-accent/10 text-accent ring-accent/15",
  word: "bg-warning/10 text-warning ring-warning/15",
  image: "bg-accent-blue/10 text-accent-blue ring-accent-blue/15",
  text: "bg-success/10 text-success ring-success/15",
  cross: "bg-bg-elevated text-text-secondary ring-border-strong",
};

export const CATEGORY_TEXT: Record<string, string> = {
  pdf: "text-accent",
  word: "text-warning",
  image: "text-accent-blue",
  text: "text-success",
  cross: "text-text-tertiary",
};

export function categoryTile(category: string): string {
  return CATEGORY_TILE[category] || CATEGORY_TILE.cross;
}

export function categoryText(category: string): string {
  return CATEGORY_TEXT[category] || CATEGORY_TEXT.cross;
}
