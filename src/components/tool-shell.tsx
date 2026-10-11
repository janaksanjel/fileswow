"use client";

import Link from "next/link";
import type { ToolDef } from "@/lib/catalog";
import type { ToolGuide } from "@/lib/content";
import { ToolCard } from "./tool-card";
import { ToolIcon } from "./icon";
import { AdSlot } from "./ad-unit";
import { Accordion } from "./ui/accordion";
import { categoryTile } from "@/lib/category-style";

interface ToolShellProps {
  tool: ToolDef;
  relatedTools?: ToolDef[];
  guide?: ToolGuide | null;
  faq?: { q: string; a: string }[];
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
export function ToolShell({ tool, relatedTools = [], guide = null, faq, children }: ToolShellProps) {
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-medium text-text-tertiary mb-6" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-accent transition-colors">
          Home
        </Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <Link href={categoryHref} className="hover:text-accent transition-colors">
          {categoryLabel}
        </Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="text-text-secondary truncate">{tool.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start gap-4">
          <span
            className={`w-12 h-12 rounded-xl ring-1 ring-inset flex items-center justify-center shrink-0 ${categoryTile(
              tool.category
            )}`}
          >
            <ToolIcon name={tool.slug} size={24} />
          </span>
          <div className="min-w-0 pt-0.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="heading-lg text-text-primary">{tool.name}</h1>
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
            <p className="body-md text-text-secondary mt-1.5 max-w-xl">{tool.description}</p>

            {/* Small, calm privacy indicator — on every tool */}
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary">
              <span className="inline-flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-success" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                Processed on your device
              </span>
              <span aria-hidden="true">·</span>
              <span>No upload</span>
              <span aria-hidden="true">·</span>
              <span>Free</span>
            </p>
          </div>
        </div>
      </div>

      {/* Responsible-use notice for tools that interact with protections/markings */}
      {RESPONSIBLE_USE_SLUGS.has(tool.slug) && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-warning/[0.06] border border-warning/25 flex items-start gap-3">
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
      <div className="panel p-4 sm:p-6 mb-8">{children}</div>

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
        <section className="mb-9 max-w-[68ch]" aria-labelledby="how-to-heading">
          <h2 id="how-to-heading" className="heading-md text-text-primary mb-4">
            How to use it
          </h2>
          <ol className="space-y-3">
            {tool.howItWorks.map((step, i) => (
              <li key={i} className="flex items-start gap-3.5">
                <span className="font-mono text-[11px] text-text-tertiary w-6 shrink-0 pt-1">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-[14.5px] text-text-secondary leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Editorial guide — substantial hand-written content for this tool. */}
      {guide && guide.paragraphs.length > 0 && (
        <section className="mb-9 max-w-[68ch]" aria-labelledby="guide-heading">
          <h2 id="guide-heading" className="heading-md text-text-primary mb-4">
            Guide: {tool.name}
          </h2>
          <div className="space-y-4">
            {guide.paragraphs.map((paragraph, i) => (
              <p key={i} className="text-[14.5px] leading-relaxed text-text-secondary">
                {paragraph}
              </p>
            ))}
          </div>
        </section>
      )}

      {/* FAQ — content mirrors the FAQPage JSON-LD emitted in page.tsx */}
      {(() => {
        const items = faq ?? tool.faq;
        if (items.length === 0) return null;
        return (
          <section className="mb-9 max-w-[68ch]" aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="heading-md text-text-primary mb-4">
              FAQ
            </h2>
            <Accordion items={items} defaultOpen={0} />
          </section>
        );
      })()}

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {relatedTools.slice(0, 6).map((related) => (
              <ToolCard key={related.slug} tool={related} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
