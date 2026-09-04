"use client";

import Link from "next/link";
import type { ToolDef } from "@/lib/catalog";
import { ToolCard } from "./tool-card";
import { ToolIcon } from "./icon";

interface ToolShellProps {
  tool: ToolDef;
  relatedTools?: ToolDef[];
  children: React.ReactNode;
}

export function ToolShell({ tool, relatedTools = [], children }: ToolShellProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-text-tertiary mb-5">
        <Link href="/" className="hover:text-text-primary transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link
          href={tool.category === "pdf" ? "/pdf-tools" : tool.category === "word" ? "/word-tools" : tool.category === "text" ? "/text-tools" : "/image-tools"}
          className="hover:text-text-primary transition-colors"
        >
          {tool.category === "pdf" ? "PDF Tools" : tool.category === "word" ? "Word Tools" : tool.category === "text" ? "Text Tools" : "Image Tools"}
        </Link>
        <span>/</span>
        <span className="text-text-secondary">{tool.name}</span>
      </nav>

      {/* Tool Header */}
      <div className="mb-5">
        <div className="flex items-center gap-3.5 mb-2">
          <div className="w-12 h-12 flex items-center justify-center bg-accent-subtle border-2 border-accent shadow-[3px_3px_0_var(--shadow-color)]">
            <ToolIcon name={tool.slug} size={24} className="text-accent" />
          </div>
          <div>
            <h1 className="heading-lg text-text-primary">
              {tool.name}
            </h1>
            <p className="body-sm text-text-secondary mt-0.5">
              {tool.description}
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="flex items-center gap-2.5 mb-5 px-3 py-2.5 bg-bg-surface border-2 border-success shadow-[3px_3px_0_var(--shadow-color)]">
        <span className="w-5 h-5 flex items-center justify-center bg-success shrink-0">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--bg-surface)" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </span>
        <p className="text-[12px] font-semibold text-text-primary">
          Processed in your browser — nothing is uploaded
        </p>
      </div>

      {/* Tool UI */}
      <div className="bg-bg-surface border-2 border-border-strong shadow-[4px_4px_0_var(--shadow-color)] p-4 sm:p-5 mb-8">
        {children}
      </div>

      {/* Tier notice for Tier 3 tools */}
      {tool.tier === 3 && (
        <div className="mb-8 p-3 bg-bg-surface border-2 border-warning shadow-[3px_3px_0_var(--shadow-color)]">
          <div className="flex items-start gap-2.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning mt-0.5 shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <p className="text-[12px] font-semibold text-warning mb-0.5">Best-effort conversion</p>
              <p className="text-[12px] text-text-secondary leading-relaxed">
                Complex layouts, tables, and tracked changes may shift. This is a
                limitation of all client-side approaches.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* How It Works */}
      {tool.howItWorks.length > 0 && (
        <section className="mb-8">
          <h2 className="heading-md text-text-primary mb-3">How it works</h2>
          <ol className="space-y-2.5">
            {tool.howItWorks.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 bg-accent border-2 border-border-strong text-text-on-accent text-[11px] font-extrabold shrink-0 shadow-[2px_2px_0_var(--shadow-color)]">
                  {i + 1}
                </span>
                <p className="body-sm text-text-secondary leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* FAQ */}
      {tool.faq.length > 0 && (
        <section className="mb-8">
          <h2 className="heading-md text-text-primary mb-3">FAQ</h2>
          <div className="space-y-2">
            {tool.faq.map((item, i) => (
              <div key={i} className="p-3.5 bg-bg-surface border-2 border-border-strong shadow-[3px_3px_0_var(--shadow-color)]">
                <h3 className="text-[13px] font-semibold text-text-primary mb-0.5">
                  {item.q}
                </h3>
                <p className="body-sm text-text-secondary leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related Tools */}
      {tool.relatedSlugs.length > 0 && relatedTools.length > 0 && (
        <section>
          <h2 className="heading-md text-text-primary mb-3">Related tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {relatedTools.slice(0, 6).map((related) => (
              <ToolCard key={related.slug} tool={related} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
