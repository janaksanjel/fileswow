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
      <nav className="flex items-center gap-1.5 text-xs text-text-tertiary mb-6 animate-fade-in">
        <Link href="/" className="hover:text-text-primary transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link
          href={tool.category === "pdf" ? "/pdf-tools" : tool.category === "word" ? "/word-tools" : "/pdf-tools"}
          className="hover:text-text-primary transition-colors"
        >
          {tool.category === "pdf" ? "PDF Tools" : tool.category === "word" ? "Word Tools" : "Tools"}
        </Link>
        <span>/</span>
        <span className="text-text-secondary">{tool.name}</span>
      </nav>

      {/* Tool Header */}
      <div className="mb-6 animate-fade-in-up">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-bg-surface border border-border-base">
            <ToolIcon name={tool.slug} size={34} className="text-accent" />
          </div>
          <div>
            <h1 className="heading-lg text-text-primary">
              {tool.name}
            </h1>
            <p className="body-md text-text-secondary mt-1">
              {tool.description}
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-lg bg-success/[0.04] border border-success/10">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success shrink-0">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <p className="text-xs text-text-secondary">
          Processed entirely in your browser — nothing is uploaded
        </p>
      </div>

      {/* Tool UI */}
      <div className="rounded-xl bg-bg-surface border border-border-base p-4 sm:p-6 mb-10 animate-fade-in-up">
        {children}
      </div>

      {/* Tier notice for Tier 3 tools */}
      {tool.tier === 3 && (
        <div className="mb-8 p-4 rounded-lg bg-warning/[0.04] border border-warning/10">
          <div className="flex items-start gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning mt-0.5 shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-warning mb-1">Best-effort conversion</p>
              <p className="text-xs text-text-secondary leading-relaxed">
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
          <h2 className="heading-md text-text-primary mb-4">How it works</h2>
          <ol className="space-y-3">
            {tool.howItWorks.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-accent-subtle text-accent text-[11px] font-semibold shrink-0 mt-0.5">
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
          <h2 className="heading-md text-text-primary mb-4">FAQ</h2>
          <div className="space-y-3">
            {tool.faq.map((item, i) => (
              <div key={i} className="p-4 rounded-lg bg-bg-surface border border-border-base">
                <h3 className="text-[13px] font-semibold text-text-primary mb-1">
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
          <h2 className="heading-md text-text-primary mb-4">Related tools</h2>
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
