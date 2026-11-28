"use client";

import Link from "next/link";
import type { ToolDef } from "@/lib/catalog";
import type { ToolGuide } from "@/lib/content";
import { ToolCard } from "./tool-card";
import { ToolIcon } from "./icon";
import { AdSlot } from "./ad-unit";
import { Accordion } from "./ui/accordion";
import { categoryTile } from "@/lib/category-style";
import { getToolOperationalDetails } from "@/lib/tool-details";
import { ShareButtons } from "./share-buttons";
import { toolUrl } from "@/lib/site";

interface ToolShellProps {
  tool: ToolDef;
  relatedTools?: ToolDef[];
  guide?: ToolGuide | null;
  faq?: { q: string; a: string }[];
  relatedPost?: {
    slug: string;
    title: string;
    description: string;
  } | null;
  relatedGuide?: {
    slug: string;
    title: string;
    description: string;
  } | null;
  children: React.ReactNode;
}

/**
 * Tools that sit near Google's "enabling dishonest behavior" policy line
 * (bypassing protection / rights markings). They're legitimate when used on
 * documents you own — the banner makes the acceptable-use boundary explicit,
 * visible to both users and any policy reviewer.
 */
const RESPONSIBLE_USE_SLUGS = new Set([
  "remove-watermark-pdf",
  "remove-watermark-word",
  "remove-watermark-image",
  "unlock-pdf",
]);

/**
 * The shared template behind every /tools/[slug] page:
 * breadcrumb → header (icon, H1, one-line description, "Processed on your
 * device" indicator) → tool workbench → how-to / guide / FAQ / related
 * tools at a readable ~68ch measure.
 */
export function ToolShell({
  tool,
  relatedTools = [],
  guide = null,
  faq,
  relatedPost,
  relatedGuide,
  children,
}: ToolShellProps) {
  const details = getToolOperationalDetails(tool);
  const categoryHref =
    tool.category === "pdf"
      ? "/pdf-tools"
      : tool.category === "word"
      ? "/word-tools"
      : tool.category === "text"
      ? "/text-tools"
      : "/image-tools";
  const categoryLabel =
    tool.category === "pdf"
      ? "PDF Tools"
      : tool.category === "word"
      ? "Word Tools"
      : tool.category === "text"
      ? "Text Tools"
      : "Image Tools";

  const tierLabel = tool.tier === 2 ? "WASM" : tool.tier === 3 ? "BETA" : null;

  return (
    <div className="max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs font-medium text-text-tertiary mb-4 sm:mb-5" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-accent transition-colors">
          Home
        </Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <Link href={categoryHref} className="hover:text-accent transition-colors">
          {categoryLabel}
        </Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="text-text-secondary truncate max-w-[200px] sm:max-w-none">{tool.name}</span>
      </nav>

      {/* Unified System Tool Window (Header + Workbench in one cohesive frame) */}
      <div className="rounded-2xl border border-border-base bg-bg-surface shadow-[var(--elevation-sm)] overflow-hidden mb-7 sm:mb-10">
        <div className="px-3.5 sm:px-7 py-4 sm:py-5 border-b border-border-base bg-bg-warm flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0">
            <span
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ${categoryTile(
                tool.category
              )}`}
            >
              <ToolIcon name={tool.slug} size={20} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[18px] sm:heading-md font-semibold text-text-primary leading-snug">{tool.name}</h1>
                {tierLabel && (
                  <span
                    className={`badge badge-mono ${
                      tool.tier === 2 ? "badge-accent" : ""
                    }`}
                  >
                    {tierLabel}
                  </span>
                )}
              </div>
              <p className="text-[13.5px] text-text-secondary mt-0.5">{tool.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[12px] font-medium text-text-secondary shrink-0">
            <span className="inline-flex items-center gap-1.5 text-success">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              {tool.slug === "p2p-text" ? "Peer-to-peer WebRTC" : "Browser-based"}
            </span>
            {tool.slug !== "p2p-text" && tool.slug !== "pdf-create-from-url" && (
              <>
                <span className="text-text-tertiary" aria-hidden="true">·</span>
                <span>No upload</span>
              </>
            )}
          </div>
        </div>

        {/* Responsible-use notice for tools that interact with protections/markings */}
        {RESPONSIBLE_USE_SLUGS.has(tool.slug) && (
          <div className="mx-5 sm:mx-7 mt-5 px-4 py-3 rounded-xl bg-warning/[0.06] border border-warning/25 flex items-start gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning mt-0.5 shrink-0" aria-hidden="true">
              <path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            </svg>
            <p className="text-[13px] leading-relaxed text-text-secondary">
              <strong className="text-text-primary font-semibold">
                Use only on documents you own or are authorized to modify.
              </strong>{" "}
              Watermarks and password protection often assert legal rights — removing them
              from someone else&apos;s work may infringe copyright. See our{" "}
              <Link
                href="/terms"
                className="font-semibold text-text-primary underline decoration-warning underline-offset-2 hover:opacity-80 transition-opacity"
              >
                Terms of Service
              </Link>
              .
            </p>
          </div>
        )}

        {/* Tool workbench */}
        <div className="relative min-h-[260px] p-3.5 sm:p-7">{children}</div>
      </div>

      {/* Share bar — 7 popular social platforms + copy link */}
      <div className="mb-7 sm:mb-9 px-3.5 sm:px-5 py-3.5 rounded-2xl border border-border-base bg-bg-surface">
        <ShareButtons
          url={toolUrl(tool.slug)}
          title={`${tool.name} — Free Online Tool on FilesWow.com`}
          label={`Share ${tool.name}`}
        />
      </div>

      {/* Tier notice for Tier 3 tools */}
      {tool.tier === 3 && (
        <div className="mb-8 p-4 rounded-xl bg-warning/[0.06] border border-warning/25">
          <div className="flex items-start gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning mt-0.5 shrink-0" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <p className="text-[13px] font-semibold text-warning mb-0.5">
                Best-effort conversion
              </p>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                Complex layouts, tables, and tracked changes may shift. This is a
                limitation of all client-side approaches.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* How It Works */}
      {tool.howItWorks.length > 0 && (
        <section className="mb-8 sm:mb-9" aria-labelledby="how-to-heading">
          <h2 id="how-to-heading" className="heading-md text-text-primary mb-4">
            How to use it
          </h2>
          <ol className="space-y-3 max-w-[72ch]">
            {tool.howItWorks.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="font-mono text-[11px] text-text-tertiary w-6 shrink-0 pt-1">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-[14px] sm:text-[14.5px] text-text-secondary leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Editorial guide — substantial hand-written content for this tool. */}
      {guide && guide.paragraphs.length > 0 && (
        <section className="mb-8 sm:mb-9" aria-labelledby="guide-heading">
          <h2 id="guide-heading" className="heading-md text-text-primary mb-4">
            About {tool.name}
          </h2>
          <div className="space-y-4 max-w-[72ch]">
            {guide.paragraphs.map((paragraph, i) => (
              <p key={i} className="text-[14px] sm:text-[14.5px] leading-relaxed text-text-secondary">
                {paragraph}
              </p>
            ))}
          </div>
        </section>
      )}

      {/* Supported Formats, Use Cases, Limitations & Privacy Handling */}
      <section className="mb-8 sm:mb-9 grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4" aria-label="Tool specifications and handling">
        <div className="p-4 sm:p-5 rounded-xl bg-bg-surface border border-border-base">
          <h2 className="text-[14px] font-bold text-text-primary mb-3">Supported Formats</h2>
          <div className="space-y-2.5 text-[13px] text-text-secondary">
            <div>
              <span className="font-semibold text-text-primary">Input: </span>
              <span>{details.inputFormats.join(", ")}</span>
            </div>
            <div>
              <span className="font-semibold text-text-primary">Output: </span>
              <span>{details.outputFormats.join(", ")}</span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-bg-surface border border-border-base">
          <h2 className="text-[14px] font-bold text-text-primary mb-3">Privacy &amp; File Handling</h2>
          <p className="text-[13px] leading-relaxed text-text-secondary">
            {details.privacySummary}
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-bg-surface border border-border-base">
          <h2 className="text-[14px] font-bold text-text-primary mb-3">Practical Use Cases</h2>
          <ul className="space-y-1.5 text-[13px] leading-relaxed text-text-secondary list-disc list-inside">
            {details.useCases.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-bg-surface border border-border-base">
          <h2 className="text-[14px] font-bold text-text-primary mb-3">Limitations</h2>
          <ul className="space-y-1.5 text-[13px] leading-relaxed text-text-secondary list-disc list-inside">
            {details.limitations.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ — content mirrors the FAQPage JSON-LD emitted in page.tsx */}
      {(() => {
        const items = faq ?? tool.faq;
        if (items.length === 0) return null;
        return (
          <section className="mb-8 sm:mb-9" aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="heading-md text-text-primary mb-4">
              FAQ
            </h2>
            <Accordion items={items} defaultOpen={0} />
          </section>
        );
      })()}

      {/* In-depth blog guide / tutorial cross-links */}
      {(relatedPost || relatedGuide) && (
        <section
          className="mb-8 sm:mb-9 grid grid-cols-1 md:grid-cols-2 gap-4"
          aria-labelledby="deep-guide-heading"
        >
          {relatedPost && (
            <div className="rounded-2xl border border-accent/20 bg-accent/[0.04] p-5 sm:p-6">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-accent mb-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                In-Depth Guide &amp; Tutorial
              </div>
              <h3 id="deep-guide-heading" className="text-base sm:text-lg font-bold text-text-primary mb-2">
                <Link href={`/blog/${relatedPost.slug}`} className="hover:text-accent transition-colors">
                  {relatedPost.title}
                </Link>
              </h3>
              <p className="text-[13.5px] leading-relaxed text-text-secondary mb-4">
                {relatedPost.description}
              </p>
              <Link
                href={`/blog/${relatedPost.slug}`}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent hover:underline"
              >
                Read the complete step-by-step tutorial →
              </Link>
            </div>
          )}

          {relatedGuide && (
            <div className="rounded-2xl border border-border-base bg-bg-surface p-5 sm:p-6">
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary mb-1.5">
                Related Reference Guide
              </div>
              <h3 className="text-base font-bold text-text-primary mb-1.5">
                <Link href={`/guides/${relatedGuide.slug}`} className="hover:text-accent transition-colors">
                  {relatedGuide.title}
                </Link>
              </h3>
              <p className="text-[13px] leading-relaxed text-text-secondary mb-3">
                {relatedGuide.description}
              </p>
              <Link
                href={`/guides/${relatedGuide.slug}`}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent hover:underline"
              >
                Read reference guide →
              </Link>
            </div>
          )}
        </section>
      )}

      {/* Ad — between tool content and related tools.
          Renders nothing (no gap) when no ad slot is configured. */}
      <AdSlot slot="tool" label="in-article (tool)" className="mb-9" />

      {/* Related tools */}
      {tool.relatedSlugs.length > 0 && relatedTools.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-[13px] font-bold uppercase tracking-widest text-text-secondary whitespace-nowrap">
              Continue with
            </h2>
            <div className="flex-1 h-px bg-border-base" aria-hidden="true" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {relatedTools.slice(0, 6).map((related) => (
              <ToolCard key={related.slug} tool={related} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
