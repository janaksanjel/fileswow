"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme-provider";
import { SearchModal } from "@/components/search-modal";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Global Ctrl+K / Cmd+K shortcut
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
    <header
      className={`sticky top-0 z-40 transition-all duration-200 ${
        scrolled
          ? "bg-bg-surface/80 backdrop-blur-xl border-b border-border-base shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-accent shadow-sm">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <span className="text-[15px] font-bold tracking-tight text-text-primary hidden sm:inline">
              Files<span className="text-accent">Wow</span>.com
            </span>
            <span className="text-[15px] font-bold tracking-tight text-text-primary sm:hidden">
              FW
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/pdf-tools"
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                isActive("/pdf-tools")
                  ? "text-text-primary bg-accent-subtle"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
              }`}
            >
              PDF Tools
            </Link>
            <Link
              href="/word-tools"
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                isActive("/word-tools")
                  ? "text-text-primary bg-accent-subtle"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
              }`}
            >
              Word Tools
            </Link>
            <Link
              href="/image-tools"
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                isActive("/image-tools")
                  ? "text-text-primary bg-accent-subtle"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
              }`}
            >
              Image Tools
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Search button (single, works on all sizes) */}
            <button
              onClick={() => setSearchOpen(true)}
              className="btn-ghost w-8 h-8 p-0 flex items-center justify-center"
              aria-label="Search tools"
              title="Search tools (Ctrl+K)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {/* Theme toggle — desktop */}
            <button
              onClick={toggle}
              className="hidden md:flex btn-ghost w-8 h-8 p-0"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
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

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden btn-ghost w-8 h-8 p-0"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border-base bg-bg-surface/95 backdrop-blur-xl animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            <Link
              href="/pdf-tools"
              className="block px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors"
            >
              PDF Tools
            </Link>
            <Link
              href="/word-tools"
              className="block px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors"
            >
              Word Tools
            </Link>
            <Link
              href="/image-tools"
              className="block px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors"
            >
              Image Tools
            </Link>
            <div className="pt-2 mt-2 border-t border-border-base">
              <button
                onClick={() => { setMobileOpen(false); setSearchOpen(true); }}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Search Tools
              </button>
              <button
                onClick={toggle}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors"
              >
                {theme === "dark" ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                    </svg>
                    Switch to Light Mode
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                    Switch to Dark Mode
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
