"use client";

import React, { useState } from "react";
import type { WorkflowCategoryConfig } from "@/lib/workflow-config";

export function FAQSection({ config }: { config: WorkflowCategoryConfig }) {
  // Track open states for multiple accordion items, default opening first item
  const [openIndices, setOpenIndices] = useState<number[]>([0]);

  const toggleIndex = (index: number) => {
    setOpenIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: config.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <section className="py-12 sm:py-16 border-t border-border-base" aria-labelledby="faq-heading">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-accent bg-accent/10 px-3 py-1 rounded-full border border-accent/20 inline-block mb-3">
            Help & Answers
          </span>
          <h2 id="faq-heading" className="heading-lg text-text-primary mb-3">
            Frequently Asked Questions
          </h2>
          <p className="body-md text-text-secondary">
            Everything you need to know about processing {config.title} securely in your browser.
          </p>
        </div>

        <div className="space-y-3">
          {config.faqs.map((faq, index) => {
            const isOpen = openIndices.includes(index);
            const contentId = `faq-content-${config.category}-${index}`;
            const buttonId = `faq-btn-${config.category}-${index}`;

            return (
              <div
                key={faq.q}
                className="rounded-2xl border border-border-base bg-bg-surface overflow-hidden transition-all duration-200 hover:border-accent/40 shadow-xs"
              >
                <button
                  id={buttonId}
                  type="button"
                  onClick={() => toggleIndex(index)}
                  aria-expanded={isOpen}
                  aria-controls={contentId}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left text-[15px] font-bold text-text-primary hover:text-accent transition-colors cursor-pointer select-none"
                >
                  <span className="flex-1 pr-2">{faq.q}</span>
                  <span
                    className={`w-7 h-7 rounded-xl bg-bg-elevated border border-border-base flex items-center justify-center shrink-0 text-text-secondary transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-accent bg-accent/10 border-accent/20" : ""
                    }`}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </button>

                {isOpen && (
                  <div
                    id={contentId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="px-5 pb-5 text-sm text-text-secondary leading-relaxed border-t border-border-base/50 pt-3 animate-fade-in"
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

