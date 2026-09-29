"use client";

import Link from "next/link";
import type { ToolDef } from "@/lib/catalog";
import type { ToolGuide } from "@/lib/content";
import { ToolCard } from "./tool-card";
import { ToolIcon } from "./icon";
import { AdSlot } from "./ad-unit";

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

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
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

      {/* Tool Header */}
      <div className="mb-6">
        <div className="flex items-start gap-4">
          <span className="w-14 h-14 rounded-2xl bg-bg-elevated ring-1 ring-inset ring-border-base flex items-center justify-center shrink-0 shadow-sm">
            <ToolIcon name={tool.slug} size={28} />
          </span>
          <div className="min-w-0 pt-0.5">
            <h1 className="heading-lg text-text-primary">{tool.name}</h1>
            <p className="body-md text-text-secondary mt-1 max-w-xl">{tool.description}</p>
          </div>
        </div>
      </div>

      {/* Responsible-use notice for tools that interact with protections/markings */}
      {RESPONSIBLE_USE_SLUGS.has(tool.slug) && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-warning/[0.06] border border-warning/25 flex items-start gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning mt-0.5 shrink-0" aria-hidden="true">
            <path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          </svg>
          <p className="text-[13px] leading-relaxed text-text-secondary">
            <strong className="text-text-primary font-semibold">Use only on documents you own or are authorized to modify.</strong>{" "}
            Watermarks and password protection often assert legal rights — removing them from someone else&apos;s work may infringe copyright. See our{" "}
            <Link href="/terms" className="font-semibold text-text-primary underline decoration-warning underline-offset-2 hover:opacity-80 transition-opacity">
              Terms of Service
            </Link>
            .
          </p>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-xl bg-success/[0.05] border border-success/20">
        <span className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </span>
        <p className="text-[13px] font-medium text-text-primary">
          Processed in your browser — <span className="text-success font-semibold">nothing is uploaded</span>
        </p>
      </div>

      {/* Tool UI */}
      <div className="panel p-4 sm:p-6 mb-10">
        {children}
      </div>

      {/* Tier notice for Tier 3 tools */}
      {tool.tier === 3 && (
        <div className="mb-8 p-4 rounded-xl bg-warning/[0.06] border border-warning/25">
          <div className="flex items-start gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning mt-0.5 shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <p className="text-[13px] font-semibold text-warning mb-0.5">Best-effort conversion</p>
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
        <section className="mb-10">
          <h2 className="heading-md text-text-primary mb-4">How it works</h2>
          <ol className="space-y-3">
            {tool.howItWorks.map((step, i) => (
              <li key={i} className="flex items-start gap-3.5">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-accent/10 text-accent text-[12px] font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="body-md text-text-secondary leading-relaxed pt-0.5">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Editorial guide — substantial hand-written content for this tool. */}
      {guide && guide.paragraphs.length > 0 && (
        <section className="mb-10" aria-labelledby="guide-heading">
          <h2 id="guide-heading" className="heading-md text-text-primary mb-4">
            Guide: {tool.name}
          </h2>
          <div className="space-y-4">
            {guide.paragraphs.map((paragraph, i) => (
              <p key={i} className="body-md text-text-secondary leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </section>
      )}

      {/* FAQ — merged list: catalog FAQ first, then editorial FAQ (deduped).
          Matches the FAQPage JSON-LD emitted in page.tsx. */}
      {(() => {
        const items = faq ?? tool.faq;
        if (items.length === 0) return null;
        return (
          <section className="mb-10">
            <h2 className="heading-md text-text-primary mb-4">FAQ</h2>
            <div className="space-y-2.5">
              {items.map((item, i) => (
              <details
                key={i}
                className="group bg-bg-surface border border-border-base rounded-xl px-4 sm:px-5 [&_summary::-webkit-details-marker]:hidden"
                open={i === 0}
              >
                <summary className="flex items-center justify-between gap-3 py-3.5 cursor-pointer list-none select-none">
                  <h3 className="text-[13.5px] font-semibold text-text-primary">{item.q}</h3>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-text-tertiary shrink-0 transition-transform duration-200 group-open:rotate-180"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </summary>
                <p className="body-md text-text-secondary leading-relaxed pb-4 -mt-1">{item.a}</p>
              </details>
              ))}
            </div>
          </section>
        );
      })()}

      {/* Ad — between tool content and related tools.
          Renders nothing (no gap) when no ad slot is configured. */}
      <AdSlot slot="tool" label="in-article (tool)" className="mb-10" />

      {/* Related Tools */}
      {tool.relatedSlugs.length > 0 && relatedTools.length > 0 && (
        <section>
          <h2 className="heading-md text-text-primary mb-4">Related tools</h2>
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
