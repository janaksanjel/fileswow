"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme-provider";
import { SearchModal } from "@/components/search-modal";

const NAV_ITEMS = [
  { href: "/pdf-tools", label: "PDF Tools" },
  { href: "/word-tools", label: "Word Tools" },
  { href: "/image-tools", label: "Image Tools" },
  { href: "/text-tools", label: "Text Tools" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const isActive = (href: string) => pathname === href;

  return (
    <>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <header className="sticky top-0 z-40 bg-bg-surface/80 backdrop-blur-xl border-b border-border-base">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group shrink-0" aria-label="FilesWow.com — Home">
              <span className="relative w-8 h-8 rounded-[10px] bg-gradient-to-b from-accent-light to-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_2px_rgba(16,24,40,0.12)] ring-1 ring-black/5 transition-transform group-hover:scale-105 duration-150 flex items-center justify-center">
                {/* Paper sheet with folded corner */}
                <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true" className="drop-shadow-sm">
                  <path d="M5.5 2.5h7.2L19 8.3V21.5H5.5z" fill="#ffffff" />
                  <path d="M12.7 2.5v5.8H19z" fill="var(--accent-hover)" opacity="0.55" />
                  {/* Ink text lines */}
                  <rect x="7.9" y="10.4" width="6.6" height="1.5" rx="0.75" fill="var(--accent-hover)" />
                  <rect x="7.9" y="13" width="4.8" height="1.5" rx="0.75" fill="var(--accent-hover)" opacity="0.55" />
                  <rect x="7.9" y="15.6" width="5.6" height="1.5" rx="0.75" fill="var(--accent-hover)" />
                </svg>
              </span>
              <span className="text-[16px] font-extrabold tracking-tight text-text-primary">
                FilesWow<span className="text-accent">.com</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 text-[13px] font-semibold rounded-full transition-colors ${
                    isActive(item.href)
                      ? "text-accent bg-accent-subtle"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Search trigger (desktop) */}
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden lg:flex items-center gap-2 h-9 w-44 px-3 text-[13px] font-medium text-text-tertiary bg-bg-input border border-border-strong rounded-lg hover:border-text-tertiary/50 hover:text-text-secondary transition-colors cursor-text"
                aria-label="Search tools"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span className="flex-1 text-left">Search tools</span>
                <kbd>⌘K</kbd>
              </button>

              {/* Search trigger (tablet) */}
              <button
                onClick={() => setSearchOpen(true)}
                className="lg:hidden icon-btn"
                aria-label="Search tools"
                title="Search (Ctrl+K)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>

              {/* Theme toggle */}
              <button
                onClick={toggle}
                className="hidden md:flex icon-btn"
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                {theme === "dark" ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden icon-btn"
                aria-label="Toggle menu"
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="7" x2="20" y2="7" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="17" x2="20" y2="17" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border-base bg-bg-surface/95 backdrop-blur-xl">
            <div className="px-4 py-3 space-y-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive(item.href)
                      ? "text-accent bg-accent-subtle"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="flex items-center gap-2 pt-3 mt-2 border-t border-border-base">
                <button
                  onClick={() => { setMobileOpen(false); setSearchOpen(true); }}
                  className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-semibold text-text-secondary bg-bg-input border border-border-strong"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  Search Tools
                </button>
                <button
                  onClick={toggle}
                  className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-semibold text-text-secondary bg-bg-input border border-border-strong"
                >
                  {theme === "dark" ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                      </svg>
                      Light Mode
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      </svg>
                      Dark Mode
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
