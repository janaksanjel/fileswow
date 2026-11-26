"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/lib/theme-provider";
import { SearchModal } from "@/components/search-modal";
import { ToolIcon } from "@/components/icon";
import { CATEGORY_MENUS, type CategoryMenu } from "@/lib/mega-menu";
import { ALL_TOOLS } from "@/lib/catalog";

const ALL_TOOLS_COLUMNS = [
  {
    title: "Convert to PDF",
    tools: [
      { name: "JPG to PDF", slug: "jpg-to-pdf", href: "/tools/jpg-to-pdf" },
      { name: "Word to PDF", slug: "word-to-pdf", href: "/tools/word-to-pdf" },
      { name: "Excel to PDF", slug: "excel-to-pdf", href: "/tools/excel-to-pdf" },
      { name: "HTML to PDF", slug: "html-to-pdf", href: "/tools/html-to-pdf" },
      { name: "Text to PDF", slug: "text-to-pdf", href: "/tools/text-to-pdf" },
    ],
  },
  {
    title: "Convert from PDF",
    tools: [
      { name: "PDF to JPG", slug: "pdf-to-jpg", href: "/tools/pdf-to-jpg" },
      { name: "PDF to Word", slug: "pdf-to-word", href: "/tools/pdf-to-word" },
      { name: "PDF to Excel", slug: "pdf-to-excel", href: "/tools/pdf-to-excel" },
      { name: "PDF to Text", slug: "pdf-to-text", href: "/tools/pdf-to-text" },
      { name: "PDF to HTML", slug: "pdf-to-html", href: "/tools/pdf-to-html" },
    ],
  },
  {
    title: "Organize & Edit",
    tools: [
      { name: "Merge PDF", slug: "merge-pdf", href: "/tools/merge-pdf" },
      { name: "Split PDF", slug: "split-pdf", href: "/tools/split-pdf" },
      { name: "Compress PDF", slug: "compress-pdf", href: "/tools/compress-pdf" },
      { name: "Rotate PDF", slug: "rotate-pdf", href: "/tools/rotate-pdf" },
      { name: "Sign PDF", slug: "sign-pdf", href: "/tools/sign-pdf" },
    ],
  },
];

const NAV_LINKS = [
  { label: "Transfer", href: "/transfer" },
  { label: "Guides", href: "/guides" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const CATEGORY_LINKS = [
  { label: "PDF Tools", href: "/pdf-tools" },
  { label: "Word Tools", href: "/word-tools" },
  { label: "Image Tools", href: "/image-tools" },
  { label: "Text Tools", href: "/text-tools" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [allToolsOpen, setAllToolsOpen] = useState(false);
  const [openSection, setOpenSection] = useState<number | null>(0);
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setMobileOpen(false);
    setAllToolsOpen(false);
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setMobileOpen(false);
        setAllToolsOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const handleOpenDropdown = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setAllToolsOpen(true);
  };

  const handleCloseSchedule = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setAllToolsOpen(false), 160);
  };

  return (
    <>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <header className="sticky top-0 z-40 w-full bg-bg-surface/80 backdrop-blur-xl border-b border-border-base">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Left: Brand + Primary Navigation */}
          <div className="flex items-center gap-6 min-w-0">
            <Link
              href="/"
              className="flex items-center shrink-0 hover:opacity-85 transition-opacity logo-plate"
              aria-label="FilesWow — Home"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/headerlogo-sm.png"
                alt="FilesWow"
                width={132}
                height={36}
                className="h-5 sm:h-6 w-auto object-contain"
              />
            </Link>

            <nav className="hidden md:flex items-center gap-1" aria-label="Main">
              {/* Tools dropdown */}
              <div
                className="relative"
                onMouseEnter={handleOpenDropdown}
                onMouseLeave={handleCloseSchedule}
              >
                <button
                  type="button"
                  onClick={() => setAllToolsOpen((v) => !v)}
                  aria-expanded={allToolsOpen}
                  className={`inline-flex items-center gap-1 h-9 px-3 text-[13.5px] font-medium rounded-lg transition-colors whitespace-nowrap ${
                    allToolsOpen
                      ? "text-accent bg-accent-subtle"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                  }`}
                >
                  <span>Tools</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform duration-150 ${allToolsOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {allToolsOpen && (
                  <div className="absolute top-full left-0 pt-2 z-50">
                    <div className="rounded-2xl bg-bg-surface border border-border-base shadow-[var(--elevation-xl)] p-5 w-[640px] max-w-[calc(100vw-2rem)] animate-fade-in-up">
                      {/* Category Pills */}
                      <div className="flex flex-wrap items-center gap-1.5 pb-4 mb-4 border-b border-border-base">
                        {CATEGORY_LINKS.map((cat) => (
                          <Link
                            key={cat.href}
                            href={cat.href}
                            onClick={() => setAllToolsOpen(false)}
                            className="px-3 py-1.5 rounded-lg text-[12.5px] font-medium text-text-secondary bg-bg-elevated hover:text-text-primary hover:bg-bg-hover transition-colors"
                          >
                            {cat.label}
                          </Link>
                        ))}
                      </div>

                      <div className="grid grid-cols-3 gap-5">
                        {ALL_TOOLS_COLUMNS.map((col) => (
                          <div key={col.title}>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-2.5 px-2">
                              {col.title}
                            </p>
                            <ul className="space-y-0.5">
                              {col.tools.map((tool) => (
                                <li key={tool.slug}>
                                  <Link
                                    href={tool.href}
                                    onClick={() => setAllToolsOpen(false)}
                                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-bg-elevated transition-colors group"
                                  >
                                    <span className="w-5 h-5 flex items-center justify-center shrink-0">
                                      <ToolIcon name={tool.slug} size={17} />
                                    </span>
                                    <span className="text-[13px] font-medium text-text-primary group-hover:text-accent transition-colors whitespace-nowrap">
                                      {tool.name}
                                    </span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 pt-3 border-t border-border-base flex items-center justify-between text-[12px] text-text-tertiary">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                          Processed locally in your browser
                        </span>
                        <Link
                          href="/search"
                          onClick={() => setAllToolsOpen(false)}
                          className="font-medium text-accent hover:underline flex items-center gap-1"
                        >
                          View all {ALL_TOOLS.length} tools
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {NAV_LINKS.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center h-9 px-3 text-[13.5px] font-medium rounded-lg transition-colors whitespace-nowrap ${
                      isActive
                        ? "text-accent bg-accent-subtle"
                        : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Search, Theme Toggle, Mobile Drawer */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden sm:inline-flex items-center gap-2 h-9 px-3 text-[13px] text-text-secondary bg-bg-elevated hover:bg-bg-hover rounded-lg border border-border-base transition-colors cursor-pointer"
              aria-label="Search tools (Ctrl+K)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span className="hidden lg:inline">Search</span>
              <kbd>⌘K</kbd>
            </button>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="sm:hidden w-11 h-11 -mr-1 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Search tools"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            <button
              type="button"
              onClick={(e) => toggle({ x: e.clientX, y: e.clientY })}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer"
              aria-label={`Toggle theme (currently ${theme})`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden w-11 h-11 -mr-2 rounded-lg flex items-center justify-center text-text-primary hover:bg-bg-elevated transition-colors"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div
            id="mobile-drawer"
            className="md:hidden fixed inset-x-0 top-14 bottom-0 z-40 bg-bg-surface overflow-y-auto overscroll-contain border-t border-border-base"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="pb-10">
              <div className="p-4 grid grid-cols-2 gap-2 border-b border-border-base">
                <Link
                  href="/search"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center min-h-11 px-3 rounded-xl bg-bg-elevated text-[13px] font-medium text-text-primary hover:bg-bg-hover transition-colors"
                >
                  All Tools ({ALL_TOOLS.length})
                </Link>
                {NAV_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center min-h-11 px-3 rounded-xl bg-bg-elevated text-[13px] font-medium text-text-primary hover:bg-bg-hover transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              {CATEGORY_MENUS.map((menu, i) => {
                const expanded = openSection === i;
                return (
                  <div key={menu.category} className="border-b border-border-base">
                    <button
                      type="button"
                      onClick={() => setOpenSection(expanded ? null : i)}
                      className="w-full flex items-center justify-between px-5 py-3.5 text-left text-[14px] font-semibold text-text-primary hover:bg-bg-elevated transition-colors"
                      aria-expanded={expanded}
                    >
                      <span>{menu.label}</span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`text-text-tertiary transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {expanded && (
                      <div className="px-5 pb-4 bg-bg-base/50">
                        <DrawerGroups menu={menu} onNavigate={() => setMobileOpen(false)} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </header>
    </>
  );
}

function DrawerGroups({ menu, onNavigate }: { menu: CategoryMenu; onNavigate: () => void }) {
  return (
    <div className="space-y-3.5 pt-2">
      {menu.groups.map((group) => (
        <div key={group.title}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">
            {group.title}
          </p>
          <ul className="grid grid-cols-1 gap-0.5">
            {group.tools.map((tool) => (
              <li key={tool.slug}>
                <Link
                  href={`/tools/${tool.slug}`}
                  onClick={onNavigate}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 -mx-1 hover:bg-bg-surface transition-colors"
                >
                  <span className="w-7 h-7 rounded-lg bg-bg-surface border border-border-base flex items-center justify-center shrink-0">
                    <ToolIcon name={tool.slug} size={15} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-medium text-text-primary leading-tight">
                      {tool.name}
                    </span>
                    <span className="block text-[12px] text-text-tertiary leading-snug line-clamp-1">
                      {tool.description}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
