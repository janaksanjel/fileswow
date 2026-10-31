"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/lib/theme-provider";
import { SearchModal } from "@/components/search-modal";
import { ToolIcon } from "@/components/icon";
import { CATEGORY_MENUS, type CategoryMenu } from "@/lib/mega-menu";
import { ALL_TOOLS } from "@/lib/catalog";
import { getHeaderSmartTools, DEFAULT_HEADER_TOOLS, subscribeUsage } from "@/lib/usage";
import { useI18n } from "@/lib/i18n";

const TRANSFER_HREF = "/transfer";

// Smart dynamic tools loaded via getHeaderSmartTools()

/* Structured sections matching the user's uploaded reference image */
const ALL_TOOLS_COLUMNS = [
  {
    title: "CONVERT TO PDF",
    tools: [
      { name: "JPG to PDF", slug: "jpg-to-pdf", href: "/tools/jpg-to-pdf" },
      { name: "WORD to PDF", slug: "word-to-pdf", href: "/tools/word-to-pdf" },
      { name: "EXCEL to PDF", slug: "excel-to-pdf", href: "/tools/excel-to-pdf" },
      { name: "HTML to PDF", slug: "html-to-pdf", href: "/tools/html-to-pdf" },
      { name: "TEXT to PDF", slug: "text-to-pdf", href: "/tools/text-to-pdf" },
    ],
  },
  {
    title: "CONVERT FROM PDF",
    tools: [
      { name: "PDF to JPG", slug: "pdf-to-jpg", href: "/tools/pdf-to-jpg" },
      { name: "PDF to WORD", slug: "pdf-to-word", href: "/tools/pdf-to-word" },
      { name: "PDF to EXCEL", slug: "pdf-to-excel", href: "/tools/pdf-to-excel" },
      { name: "PDF to TEXT", slug: "pdf-to-text", href: "/tools/pdf-to-text" },
      { name: "PDF to HTML", slug: "pdf-to-html", href: "/tools/pdf-to-html" },
    ],
  },
  {
    title: "ORGANIZE & EDIT",
    tools: [
      { name: "MERGE PDF", slug: "merge-pdf", href: "/tools/merge-pdf" },
      { name: "SPLIT PDF", slug: "split-pdf", href: "/tools/split-pdf" },
      { name: "COMPRESS PDF", slug: "compress-pdf", href: "/tools/compress-pdf" },
      { name: "ROTATE PDF", slug: "rotate-pdf", href: "/tools/rotate-pdf" },
      { name: "SIGN PDF", slug: "sign-pdf", href: "/tools/sign-pdf" },
    ],
  },
];

// Simple monochrome outline icon matching File Transfer navigation style
function SimpleNavIcon({ slug }: { slug: string }) {
  if (slug.includes("merge")) {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    );
  }
  if (slug.includes("compress")) {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="7 14 12 18 17 14" />
        <line x1="12" y1="9" x2="12" y2="18" />
      </svg>
    );
  }
  if (slug.includes("split")) {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <line x1="2" y1="12" x2="22" y2="12" />
      </svg>
    );
  }
  if (slug.includes("to-")) {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    );
  }
  if (slug.includes("sign")) {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      </svg>
    );
  }
  if (slug.includes("image") || slug.includes("jpg") || slug.includes("png")) {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    );
  }
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [allToolsOpen, setAllToolsOpen] = useState(false);
  const [openSection, setOpenSection] = useState<number | null>(0);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const { t } = useI18n();
  const [navTools, setNavTools] = useState(DEFAULT_HEADER_TOOLS);

  // Sync smart top 2 tools + 1 recommendation from local storage algorithm
  useEffect(() => {
    setNavTools(getHeaderSmartTools());
    return subscribeUsage(() => {
      setNavTools(getHeaderSmartTools());
    });
  }, []);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close mobile drawer and dropdown on navigation
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setMobileOpen(false);
    setAllToolsOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ⌘K / Ctrl+K toggles the palette; Esc closes drawer and popups
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

  const isTransferActive = pathname === TRANSFER_HREF || pathname.startsWith(TRANSFER_HREF + "/");

  return (
    <>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <header className="sticky top-0 z-40 w-full py-1.5 sm:py-2 px-3 sm:px-6 pointer-events-none">
        <div className="max-w-6xl mx-auto pointer-events-auto">
          {/* Sleek capsule header bar */}
          <div className="h-10 sm:h-11 rounded-xl sm:rounded-2xl bg-bg-surface border border-white/80 dark:border-white/10 shadow-[3px_3px_10px_var(--neu-shadow-dark),-3px_-3px_10px_var(--neu-shadow-light)] flex items-center justify-between px-3 sm:px-4 relative select-none">
            
            {/* Left cluster: ONLY LOGO + Split PDF, Text to PDF, and All Tools hover dropdown */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0 min-w-0">
              <Link
                href="/"
                className="flex items-center pr-2 hover:opacity-90 transition-opacity shrink-0"
                aria-label="FilesWow — Home"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/headerlogo-sm.png"
                  alt="FilesWow"
                  width={140}
                  height={40}
                  className="h-5 sm:h-6 w-auto object-contain"
                />
              </Link>

              {/* Text navigation links: Top 2 most used + 1 match recommendation */}
              <nav className="hidden sm:flex items-center gap-1 lg:gap-1.5" aria-label="Main">
                {navTools.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-1.5 h-7 px-2.5 text-[11.5px] sm:text-[12px] rounded-lg transition-all whitespace-nowrap ${
                        isActive
                          ? "text-[#ff5500] font-bold bg-[#ff5500]/10"
                          : "font-semibold text-text-secondary hover:text-[#ff5500] hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                      title={item.isRecommendation ? "Recommended match based on your activity" : undefined}
                    >
                      <SimpleNavIcon slug={item.slug} />
                      <span>{item.name}</span>
                      {item.isRecommendation && (
                        <span className="hidden xl:inline-flex text-[8.5px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25">
                          For you
                        </span>
                      )}
                    </Link>
                  );
                })}

                {/* All Tools with Hover Dropdown (Matching Reference Image) */}
                <div
                  className="relative"
                  onMouseEnter={handleOpenDropdown}
                  onMouseLeave={handleCloseSchedule}
                >
                  <button
                    type="button"
                    onClick={() => setAllToolsOpen((v) => !v)}
                    className={`flex items-center gap-1 h-7 px-2.5 text-[11.5px] sm:text-[12px] rounded-lg transition-all whitespace-nowrap ${
                      allToolsOpen
                        ? "text-[#ff5500] font-bold bg-[#ff5500]/10"
                        : "font-semibold text-text-secondary hover:text-[#ff5500] hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    <span>All Tools</span>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`transition-transform duration-150 ${allToolsOpen ? "rotate-180 text-[#ff5500]" : ""}`}
                      aria-hidden="true"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {/* The Floating All Tools Card Dropdown matching reference image */}
                  {allToolsOpen && (
                    <div className="absolute top-full left-0 pt-2 z-50">
                      {/* Floating card */}
                      <div className="relative rounded-2xl bg-bg-surface border border-white/80 dark:border-white/10 shadow-[0_20px_48px_rgba(0,0,0,0.18)] p-5 w-auto max-w-[calc(100vw-2rem)] min-w-[300px] sm:min-w-[520px] lg:min-w-[620px] animate-fade-in-up">
                        {/* Top arrow pointer matching reference */}
                        <div className="absolute -top-1.5 left-7 w-3 h-3 bg-bg-surface border-t border-l border-white/80 dark:border-white/10 transform rotate-45" />

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 relative z-10">
                          {ALL_TOOLS_COLUMNS.map((col) => (
                            <div key={col.title}>
                              <p className="text-[10.5px] font-black uppercase tracking-wider text-text-tertiary mb-3 select-none">
                                {col.title}
                              </p>
                              <ul className="space-y-1">
                                {col.tools.map((tool) => (
                                  <li key={tool.slug}>
                                    <Link
                                      href={tool.href}
                                      onClick={() => setAllToolsOpen(false)}
                                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                                    >
                                      <span className="w-5 h-5 flex items-center justify-center shrink-0">
                                        <ToolIcon name={tool.slug} size={18} />
                                      </span>
                                      <span className="font-bold text-[11.5px] tracking-wide text-text-primary group-hover:text-[#ff5500] uppercase whitespace-nowrap transition-colors">
                                        {tool.name}
                                      </span>
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>

                        {/* Footer bar */}
                        <div className="mt-4 pt-3 border-t border-border-base flex items-center justify-between text-[11.5px] text-text-tertiary">
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                            100% Free & Private — client-side
                          </span>
                          <Link
                            href="/search"
                            onClick={() => setAllToolsOpen(false)}
                            className="font-bold text-[#ff5500] hover:underline flex items-center gap-1"
                          >
                            View all {ALL_TOOLS.length} tools
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </nav>
            </div>

            {/* Right cluster: File Transfer, Search pill, and the Orange physical toggle switch */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* File Transfer text link */}
              <Link
                href={TRANSFER_HREF}
                className={`hidden sm:flex items-center gap-1.5 h-7 px-2.5 text-[11px] sm:text-[11.5px] rounded-lg transition-all whitespace-nowrap ${
                  isTransferActive
                    ? "text-[#ff5500] font-bold bg-[#ff5500]/10"
                    : "font-semibold text-text-secondary hover:text-[#ff5500] hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                <span>File Transfer</span>
              </Link>

              {/* Search button */}
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="hidden md:flex items-center gap-1.5 h-7 px-2 text-[11px] font-medium text-text-tertiary bg-bg-input rounded-lg border border-white/40 shadow-[inset_1px_1px_2px_var(--neu-shadow-dark),inset_-1px_-1px_2px_var(--neu-shadow-light)] hover:text-text-secondary transition-all cursor-text"
                aria-label="Search tools (Ctrl+K)"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span className="font-mono text-[10px]">⌘K</span>
              </button>

              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="md:hidden w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
                aria-label="Search tools"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>

              {/* The Orange Physical Rocker / Slide Toggle Switch */}
              <button
                type="button"
                onClick={(e) => toggle({ x: e.clientX, y: e.clientY })}
                className="group relative flex items-center shrink-0 cursor-pointer p-0.5 select-none focus:outline-none"
                aria-label={`Toggle theme (currently ${theme})`}
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                <div className="w-8.5 h-4.5 sm:w-9.5 sm:h-5 rounded-full bg-black/15 dark:bg-black/50 shadow-[inset_1px_1px_2.5px_rgba(0,0,0,0.4),inset_-0.5px_-0.5px_1.5px_rgba(255,255,255,0.4)] flex items-center p-0.5 transition-colors">
                  <div
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-gradient-to-b from-[#ff6e1a] to-[#ff4500] shadow-[0_1.5px_3px_rgba(0,0,0,0.4),inset_0_0.8px_0.8px_rgba(255,255,255,0.7)] transition-transform duration-200 ease-out flex items-center justify-center ${
                      theme === "dark" ? "translate-x-4 sm:translate-x-4.5" : "translate-x-0"
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-white/50 block" />
                  </div>
                </div>
              </button>

              {/* Mobile drawer trigger */}
              <button
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                className="sm:hidden w-7 h-7 rounded-lg flex items-center justify-center text-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                aria-label="Open menu"
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="4" y1="7" x2="20" y2="7" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="17" x2="20" y2="17" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile drawer — full-screen, accordion sections for all tools */}
        {mobileOpen && (
          <div
            id="mobile-drawer"
            className="sm:hidden fixed inset-x-0 top-[52px] bottom-0 z-40 bg-bg-surface overflow-y-auto overscroll-contain shadow-2xl pointer-events-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="pb-10 pt-2">
              {/* Quick access items */}
              <div className="p-4 grid grid-cols-2 gap-2 border-b border-border-base">
                <Link
                  href={TRANSFER_HREF}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-bg-elevated text-[12px] font-bold text-text-primary hover:text-[#ff5500] transition-colors text-center"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  <span>File Transfer</span>
                </Link>
                {navTools.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-bg-elevated text-[12px] font-bold text-text-primary hover:text-[#ff5500] transition-colors text-center"
                  >
                    <SimpleNavIcon slug={item.slug} />
                    <span>{item.name}</span>
                    {item.isRecommendation && (
                      <span className="text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-accent/15 text-accent">
                        For you
                      </span>
                    )}
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
                      className="w-full flex items-center justify-between px-5 py-3 text-left text-[13.5px] font-bold text-text-primary hover:bg-bg-hover transition-colors"
                      aria-expanded={expanded}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        {menu.label}
                      </span>
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {expanded && (
                      <div className="px-5 pb-4 bg-bg-base/40">
                        <DrawerGroups menu={menu} />
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

function DrawerGroups({ menu }: { menu: CategoryMenu }) {
  return (
    <div className="space-y-3.5">
      {menu.groups.map((group) => (
        <div key={group.title}>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-text-tertiary mb-1">
            {group.title}
          </p>
          <ul className="grid grid-cols-1 gap-0.5">
            {group.tools.map((tool) => (
              <li key={tool.slug}>
                <Link
                  href={`/tools/${tool.slug}`}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-2 -mx-1 hover:bg-bg-hover transition-colors"
                >
                  <span className="w-7 h-7 rounded-lg bg-bg-elevated ring-1 ring-inset ring-border-base flex items-center justify-center shrink-0">
                    <ToolIcon name={tool.slug} size={15} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-text-primary leading-tight">
                      {tool.name}
                    </span>
                    <span className="block text-[11.5px] text-text-tertiary leading-snug line-clamp-1">
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
