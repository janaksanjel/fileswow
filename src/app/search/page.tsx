import type { Metadata } from "next";
import Link from "next/link";
import { ALL_TOOLS, type ToolDef } from "@/lib/catalog";
import { absoluteUrl, jsonLdProps } from "@/lib/site";
import { SearchClient } from "./search-client";

export const metadata: Metadata = {
  title: "Search All Tools — A to Z Index of 200+ Free File Tools",
  description:
    "Search every FilesWow.com tool: PDF merge, split, compress, convert; Word to PDF; image converters and 200+ more. Full A–Z tool index — free, no upload, 100% private.",
  keywords: [
    "file tools search",
    "all file tools",
    "PDF tools index",
    "free document tools A-Z",
    "tool directory",
    "search free online tools",
  ],
  alternates: {
    canonical: absoluteUrl("/search"),
    languages: {
      "x-default": absoluteUrl("/search"),
    },
  },
  openGraph: {
    title: "Search All FilesWow.com Tools",
    description:
      "Search or browse the full A–Z index of 200+ free PDF, Word, image, and text tools — all in-browser, no upload.",
    url: absoluteUrl("/search"),
    type: "website",
  },
};

/** Group tools A–Z by the first letter of their name for the static index. */
function groupByLetter(tools: ToolDef[]): Array<[string, ToolDef[]]> {
  const groups = new Map<string, ToolDef[]>();
  for (const tool of [...tools].sort((a, b) => a.name.localeCompare(b.name))) {
    const letter = tool.name[0]?.toUpperCase() ?? "#";
    const key = /[A-Z]/.test(letter) ? letter : "#";
    const list = groups.get(key) ?? [];
    list.push(tool);
    groups.set(key, list);
  }
  return [...groups.entries()].sort(([a], [b]) =>
    a === "#" ? 1 : b === "#" ? -1 : a.localeCompare(b)
  );
}

const CATEGORY_LABEL: Record<string, string> = {
  pdf: "PDF",
  word: "Word",
  image: "Image",
  text: "Text",
  cross: "Cross-format",
};

export default function SearchPage() {
  const groups = groupByLetter(ALL_TOOLS);
  const letters = groups.map(([letter]) => letter);

  // CollectionPage + complete ItemList — a crawler-visible sitemap-in-page
  // that passes internal links to every tool from one URL.
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "All Tools A–Z — FilesWow.com",
    description: `Complete index of all ${ALL_TOOLS.length} free file tools on FilesWow.com.`,
    url: absoluteUrl("/search"),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: ALL_TOOLS.length,
      itemListElement: ALL_TOOLS.map((tool, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: tool.name,
        description: tool.description,
        url: absoluteUrl(`/tools/${tool.slug}`),
      })),
    },
  };

  return (
    <>
      <script {...jsonLdProps(collectionJsonLd)} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <header className="mb-8">
          <nav className="flex items-center gap-1.5 text-xs text-text-tertiary mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-accent transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-text-secondary">Search</span>
          </nav>
          <h1 className="heading-xl text-text-primary mb-3 [text-wrap:balance]">
            Search <span className="text-gradient">all tools</span>
          </h1>
          <p className="body-lg text-text-secondary max-w-2xl">
            Type what you need — &ldquo;merge pdf&rdquo;, &ldquo;word to
            pdf&rdquo;, &ldquo;compress image&rdquo; — or browse the full
            A–Z index of all {ALL_TOOLS.length} tools below.
          </p>
        </header>

        {/* Interactive search (client) */}
        <SearchClient />

        {/* Static A–Z index — fully crawler-visible internal links */}
        <section className="mt-12" aria-labelledby="az-index-heading">
          <h2 id="az-index-heading" className="heading-lg text-text-primary mb-2">
            All tools A–Z
          </h2>
          <p className="body-sm text-text-secondary mb-5">
            {ALL_TOOLS.length} tools · updated regularly
          </p>

          {/* Letter jump nav */}
          <nav
            className="flex flex-wrap gap-1.5 mb-8 p-3 rounded-xl bg-bg-surface border border-border-base"
            aria-label="Jump to letter"
          >
            {letters.map((letter) => (
              <a
                key={letter}
                href={`#letter-${letter}`}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[12px] font-bold text-text-secondary hover:text-accent hover:bg-accent-subtle transition-colors"
              >
                {letter}
              </a>
            ))}
          </nav>

          <div className="space-y-8">
            {groups.map(([letter, tools]) => (
              <section key={letter} aria-labelledby={`letter-${letter}`}>
                <h3
                  id={`letter-${letter}`}
                  className="text-[15px] font-extrabold text-text-primary mb-3 flex items-center gap-3 scroll-mt-24"
                >
                  <span className="w-8 h-8 rounded-lg bg-accent-subtle text-accent flex items-center justify-center text-[13px]">
                    {letter}
                  </span>
                  <span className="sr-only">Tools starting with {letter}</span>
                  <span className="h-px flex-1 bg-border-base" aria-hidden="true" />
                  <span className="text-[11px] font-semibold text-text-tertiary">
                    {tools.length}
                  </span>
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5">
                  {tools.map((tool) => (
                    <li key={tool.slug}>
                      <Link
                        href={`/tools/${tool.slug}`}
                        className="group flex items-baseline gap-2 py-1 rounded-md"
                      >
                        <span className="text-[13.5px] font-medium text-text-secondary group-hover:text-accent transition-colors truncate">
                          {tool.name}
                        </span>
                        <span className="text-[10px] uppercase tracking-wide font-bold text-text-tertiary/70 shrink-0">
                          {CATEGORY_LABEL[tool.category] ?? tool.category}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
