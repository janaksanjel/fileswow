/**
 * Central site configuration — the single source of truth for SEO URLs.
 *
 * IMPORTANT: The site is deployed at www.fileswow.com (see CNAME file at repo
 * root). Every canonical, sitemap entry, and JSON-LD URL MUST use this exact
 * host so Google sees one consistent canonical host. Never hardcode URLs.
 */
export const SITE_URL = "https://www.fileswow.com";

export const SITE_NAME = "FilesWow.com";

export const SITE_DESCRIPTION =
  "100+ free PDF, Word, and image tools. Merge, split, compress, convert, edit, and transform documents — entirely in your browser. No upload required. 100% private.";

/** Build an absolute URL from a path starting with "/" */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path === "/" ? "" : path}`;
}

/** URL to a tool page */
export function toolUrl(slug: string): string {
  return absoluteUrl(`/tools/${slug}`);
}

/** URL to a category hub page */
export function categoryUrl(category: string): string {
  return absoluteUrl(`/${category}-tools`);
}

/** Shared JSON-LD script component props */
export function jsonLdProps(data: unknown) {
  return {
    type: "application/ld+json" as const,
    dangerouslySetInnerHTML: { __html: JSON.stringify(data) },
  };
}
