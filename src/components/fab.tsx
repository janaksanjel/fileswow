"use client";

import { useState } from "react";
import { useTheme } from "@/lib/theme-provider";
import Link from "next/link";

export function FloatingActionButton() {
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();

  const quickLinks = [
    { label: "Merge PDF", href: "/tools/merge-pdf", icon: "📑" },
    { label: "Split PDF", href: "/tools/split-pdf", icon: "✂️" },
    { label: "PDF to Word", href: "/tools/pdf-to-word", icon: "📝" },
    { label: "Compress PDF", href: "/tools/compress-pdf", icon: "📦" },
  ];

  return (
    <div className="fab">
      {/* Quick links when open */}
      {open && (
        <div className="flex flex-col gap-2 animate-fade-in-up">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-text-primary bg-bg-surface border border-border-base rounded-lg shadow-lg hover:bg-bg-elevated hover:border-border-accent transition-all whitespace-nowrap"
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <div className="flex flex-col gap-2 items-center">
        {/* Theme toggle mini button */}
        <button
          onClick={toggle}
          className="w-10 h-10 rounded-full bg-bg-surface border border-border-base shadow-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {/* Main trigger */}
        <button
          onClick={() => setOpen(!open)}
          className="w-12 h-12 rounded-full bg-accent shadow-lg flex items-center justify-center text-white hover:bg-accent-light transition-all"
          aria-label="Quick tools"
          style={{
            boxShadow: "0 4px 14px rgba(230, 57, 70, 0.4)",
          }}
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
