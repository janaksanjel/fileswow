"use client";

import React from "react";
import Link from "next/link";
import type { ToolDef } from "@/lib/catalog";
import { WORKFLOW_CONFIGS, type WorkflowCategory } from "@/lib/workflow-config";
import { WorkflowWorkspace } from "./workflow-workspace";
import { HowItWorksSection } from "./how-it-works";
import { PopularToolsSection } from "./popular-tools";
import { FAQSection } from "./faq-section";
import { RelatedCategoriesSection } from "./related-categories";
import { AdSlot } from "@/components/ad-unit";

export interface CategoryHubPageProps {
  category: WorkflowCategory;
  tools: ToolDef[];
  categories?: readonly string[] | string[];
  categoryLabels?: Record<string, string>;
}

export function CategoryHubPage({
  category,
  tools,
  categories,
  categoryLabels,
}: CategoryHubPageProps) {
  const config = WORKFLOW_CONFIGS[category] || WORKFLOW_CONFIGS.pdf;

  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      {/* ─── 1. HERO & CATEGORY HEADER ─── */}
      <section className="pt-8 pb-10 sm:pt-12 sm:pb-14 border-b border-border-base/60 bg-gradient-to-b from-bg-surface/60 to-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs font-semibold text-text-tertiary">
            <Link href="/" className="hover:text-text-primary transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-text-secondary">{config.title}</span>
          </nav>

          <div className="text-center max-w-3xl mx-auto space-y-4">
            {/* Category Suite Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-extrabold tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              {config.badge}
            </div>

            {/* Main Headline */}
            <h1 className="heading-xl text-text-primary tracking-tight font-extrabold sm:text-4xl md:text-5xl">
              {config.title}
            </h1>

            {/* Subtitle / Description */}
            <p className="body-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
              {config.subtitle}
            </p>

            {/* Privacy & Browser Guarantee Badge */}
            <div className="pt-2 flex items-center justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-bg-surface border border-border-base shadow-xs text-xs font-semibold text-text-secondary">
                <span className="text-success font-bold">🔒 Private & Secure</span>
                <span className="text-text-tertiary">•</span>
                <span>Your files are processed in your browser</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. WORKFLOW WORKSPACE (3-STEP PIPELINE) ─── */}
      <section className="py-8 sm:py-12" aria-label="Tool Processing Pipeline">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <WorkflowWorkspace config={config} />
        </div>
      </section>

      {/* ─── 3. MID-PAGE AD SLOT ─── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 my-6 sm:my-8">
        <AdSlot slot="category" label="Category Workspace Banner" />
      </div>

      {/* ─── 4. HOW IT WORKS ─── */}
      <HowItWorksSection config={config} />

      {/* ─── 5. POPULAR & ALL CATEGORY TOOLS CATALOG ─── */}
      <PopularToolsSection
        tools={tools}
        categories={categories}
        categoryLabels={categoryLabels}
        categoryTitle={config.title}
      />

      {/* ─── 6. PRIVACY & SECURITY HIGHLIGHT ─── */}
      <section className="py-12 sm:py-16 border-t border-border-base bg-bg-surface/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl border border-border-base bg-bg-surface p-8 sm:p-10 shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-success/15 border border-success/30 text-success flex items-center justify-center shrink-0 shadow-sm">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-success bg-success/10 px-3 py-0.5 rounded-full border border-success/20 inline-block">
                  Zero Server Uploads
                </span>
                <h3 className="heading-md text-text-primary">
                  100% Client-Side Privacy Standard
                </h3>
                <p className="body-sm text-text-secondary leading-relaxed">
                  Unlike traditional cloud conversion websites that upload your confidential files to remote servers, FilesWow executes all calculations directly on your CPU using modern WebAssembly, HTML5 Canvas, and browser sandbox engines. Your documents never touch external storage and are permanently wiped from browser memory when you close this window.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. FREQUENTLY ASKED QUESTIONS ─── */}
      <FAQSection config={config} />

      {/* ─── 8. PRE-FOOTER AD SLOT ─── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 my-6 sm:my-8">
        <AdSlot slot="category" label="Category Footer Banner" />
      </div>

      {/* ─── 9. RELATED TOOL CATEGORIES ─── */}
      <RelatedCategoriesSection currentCategory={category} />
    </div>
  );
}

