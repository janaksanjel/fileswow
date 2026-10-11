"use client";

import { useState, useId, type ReactNode } from "react";

/**
 * Accordion — one accessible disclosure list, reused by the homepage FAQ,
 * tool-page FAQ and any drawer sections.
 *
 * Semantics: each row is a <button aria-expanded aria-controls> inside a
 * heading; each panel is a labelled region. Answers stay in the DOM
 * (hidden only while collapsed) so assistive tech and crawlers keep them.
 */

export interface AccordionItem {
  q: string;
  a: ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  /** Index open on first render; null = all collapsed */
  defaultOpen?: number | null;
  /** Allow collapsing the open row by clicking it again */
  collapsible?: boolean;
  className?: string;
}

export function Accordion({
  items,
  defaultOpen = 0,
  collapsible = true,
  className = "",
}: AccordionProps) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const uid = useId();

  return (
    <div className={`divide-y divide-border-base border border-border-base rounded-xl bg-bg-surface overflow-hidden ${className}`}>
      {items.map((item, i) => {
        const isOpen = open === i;
        const buttonId = `${uid}-button-${i}`;
        const panelId = `${uid}-panel-${i}`;
        return (
          <div key={item.q}>
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen && collapsible ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-4 sm:px-5 py-3.5 text-left cursor-pointer hover:bg-bg-hover transition-colors"
              >
                <span className="text-[15px] font-semibold text-text-primary">{item.q}</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className={`shrink-0 text-text-tertiary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="px-4 sm:px-5"
            >
              <p className="pb-4 -mt-0.5 text-[14px] leading-relaxed text-text-secondary max-w-[68ch]">
                {item.a}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
