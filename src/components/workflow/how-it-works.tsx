"use client";

import React from "react";
import type { WorkflowCategoryConfig } from "@/lib/workflow-config";

export function HowItWorksSection({ config }: { config: WorkflowCategoryConfig }) {
  return (
    <section className="py-12 sm:py-16 border-t border-border-base" aria-labelledby="how-it-works-heading">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-accent bg-accent/10 px-3 py-1 rounded-full border border-accent/20 inline-block mb-3">
            Simple 3-Step Process
          </span>
          <h2 id="how-it-works-heading" className="heading-lg text-text-primary mb-3">
            How {config.title} Work
          </h2>
          <p className="body-md text-text-secondary">
            Process, convert, and manage your documents directly in your browser with zero installation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {config.howItWorks.map((item, idx) => (
            <div
              key={item.step}
              className="relative p-6 sm:p-7 rounded-3xl bg-bg-surface border border-border-base shadow-xs hover:shadow-md hover:border-accent/40 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="w-10 h-10 rounded-2xl bg-accent text-white flex items-center justify-center text-sm font-extrabold shadow-sm">
                    {item.step}
                  </span>

                  <span className="w-11 h-11 rounded-2xl bg-bg-elevated border border-border-base text-accent flex items-center justify-center transition-transform group-hover:scale-110">
                    {idx === 0 ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    ) : idx === 1 ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    )}
                  </span>
                </div>

                <h3 className="heading-md text-text-primary mb-2 group-hover:text-accent transition-colors">
                  {item.title}
                </h3>

                <p className="body-sm text-text-secondary leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-border-base/70 flex items-center text-[11px] font-semibold text-text-tertiary">
                <span>Phase {item.step} of 03</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

