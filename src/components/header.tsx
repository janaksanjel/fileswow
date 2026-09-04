"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme-provider";
import { SearchModal } from "@/components/search-modal";

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

  const navLink = (href: string, label: string) => (
    <Link
      key={href}
      href={href}
      className={`px-1.5 py-1 text-[13px] font-semibold border-b-[3px] transition-colors ${
        isActive(href)
          ? "text-text-primary border-accent"
          : "text-text-secondary border-transparent hover:text-text-primary hover:border-text-tertiary"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <header className="sticky top-0 z-40 bg-bg-surface border-b-2 border-border-strong">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <span className="relative w-8 h-8 flex items-center justify-center bg-accent border-2 border-border-strong shadow-[2px_2px_0_var(--shadow-color)] group-hover:-translate-y-px transition-transform">
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  {/* Paper sheet with folded corner */}
                  <path d="M5.5 2h7l5 5v14h-12z" fill="#fdfaf3" />
                  <path d="M12.5 2v5h5z" fill="#e6ddc9" />
                  {/* Ink text lines */}
                  <rect x="7.8" y="10.2" width="7.4" height="1.6" rx="0.3" fill="#1c1915" opacity="0.85" />
                  <rect x="7.8" y="13" width="5.4" height="1.6" rx="0.3" fill="#1c1915" opacity="0.55" />
                  <rect x="7.8" y="15.8" width="6.4" height="1.6" rx="0.3" fill="#1c1915" opacity="0.85" />
                </svg>
              </span>
              <span className="hidden sm:inline text-[15px] font-extrabold tracking-tight text-text-primary">
                FilesWow<span className="text-accent">.com</span>
              </span>
              <span className="sm:hidden text-[14px] font-extrabold tracking-tight text-text-primary">
                FW<span className="text-accent">.com</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-5">
              {navLink("/pdf-tools", "PDF Tools")}
              {navLink("/word-tools", "Word Tools")}
              {navLink("/image-tools", "Image Tools")}
              {navLink("/text-tools", "Text Tools")}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSearchOpen(true)}
                className="btn-ghost w-9 h-9 p-0 flex items-center justify-center"
                aria-label="Search tools"
                title="Search (Ctrl+K)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>

              <button
                onClick={toggle}
                className="hidden md:flex btn-ghost w-9 h-9 p-0"
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                {theme === "dark" ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden btn-ghost w-9 h-9 p-0"
                aria-label="Toggle menu"
              >
                {mobileOpen ? (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                ) : (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
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
          <div className="md:hidden border-t-2 border-border-strong bg-bg-surface">
            <div className="px-4 py-2 space-y-0.5">
              {[
                ["/pdf-tools", "PDF Tools"],
                ["/word-tools", "Word Tools"],
                ["/image-tools", "Image Tools"],
                ["/text-tools", "Text Tools"],
              ].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className={`block px-3 py-2.5 text-sm font-semibold border-l-4 ${
                    isActive(href)
                      ? "text-text-primary border-accent bg-accent-subtle"
                      : "text-text-secondary border-transparent hover:text-text-primary"
                  }`}
                >
                  {label}
                </Link>
              ))}
              <div className="pt-2 mt-2 border-t-2 border-border-strong">
                <button
                  onClick={() => { setMobileOpen(false); setSearchOpen(true); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-semibold text-text-secondary hover:text-text-primary"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  Search Tools
                </button>
                <button
                  onClick={toggle}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-semibold text-text-secondary hover:text-text-primary"
                >
                  {theme === "dark" ? (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                      </svg>
                      Light Mode
                    </>
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
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
