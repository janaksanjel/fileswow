"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme-provider";
import { SearchModal } from "@/components/search-modal";
import { ToolIcon } from "@/components/icon";
import { Footer } from "@/components/footer";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ALL_TOOLS, type ToolCategory } from "@/lib/catalog";

const SIDEBAR_CATEGORIES: Array<{
  category: ToolCategory;
  label: string;
  href: string;
  tools: Array<{ slug: string; name: string }>;
}> = [
  {
    category: "pdf",
    label: "PDF Tools",
    href: "/pdf-tools",
    tools: [
      { slug: "merge-pdf", name: "Merge PDF" },
      { slug: "split-pdf", name: "Split PDF" },
      { slug: "compress-pdf", name: "Compress PDF" },
      { slug: "pdf-to-word", name: "PDF to Word" },
      { slug: "jpg-to-pdf", name: "JPG to PDF" },
      { slug: "sign-pdf", name: "Sign PDF" },
    ],
  },
  {
    category: "word",
    label: "Word Tools",
    href: "/word-tools",
    tools: [
      { slug: "word-to-pdf", name: "Word to PDF" },
      { slug: "merge-word", name: "Merge Word" },
      { slug: "split-word", name: "Split Word" },
      { slug: "word-to-text", name: "Word to Text" },
      { slug: "word-to-html", name: "Word to HTML" },
      { slug: "protect-word", name: "Protect Word" },
    ],
  },
  {
    category: "image",
    label: "Image Tools",
    href: "/image-tools",
    tools: [
      { slug: "compress-image", name: "Compress Image" },
      { slug: "background-remove-image", name: "Remove Background" },
      { slug: "resize-image", name: "Resize Image" },
      { slug: "crop-image", name: "Crop Image" },
      { slug: "jpg-to-png", name: "JPG to PNG" },
      { slug: "png-to-jpg", name: "PNG to JPG" },
    ],
  },
  {
    category: "text",
    label: "Text Tools",
    href: "/text-tools",
    tools: [
      { slug: "p2p-text", name: "P2P Text & Chat" },
      { slug: "text-to-pdf", name: "Text to PDF" },
      { slug: "side-by-side-diff", name: "Side-by-Side Diff" },
      { slug: "file-info", name: "File Info" },
      { slug: "universal-converter", name: "Universal Converter" },
    ],
  },
];

function CategoryIcon({ category }: { category: ToolCategory }) {
  if (category === "pdf") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    );
  }
  if (category === "word") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="13" y2="17" />
      </svg>
    );
  }
  if (category === "image") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="8.5" cy="9.5" r="1.5" />
        <path d="m21 16-5-5-9 9" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="10" x2="20" y2="10" />
      <line x1="4" y1="14" x2="16" y2="14" />
      <line x1="4" y1="18" x2="12" y2="18" />
    </svg>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Determine active tool/category so its submenu starts open
  const activeTool = pathname.startsWith("/tools/")
    ? ALL_TOOLS.find((t) => t.slug === pathname.slice("/tools/".length).split("/")[0])
    : undefined;

  const activeCategory: ToolCategory | null = activeTool
    ? activeTool.category
    : pathname.startsWith("/pdf-tools")
      ? "pdf"
      : pathname.startsWith("/word-tools")
        ? "word"
        : pathname.startsWith("/image-tools")
          ? "image"
          : pathname.startsWith("/text-tools")
            ? "text"
            : null;

  // All category menus start collapsed; only the single clicked category opens.
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  // Close mobile drawer on route change
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setMobileOpen(false);
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleCategory = (cat: string) => {
    if (collapsed) {
      setCollapsed(false);
      setOpenCategory(cat);
      return;
    }
    setOpenCategory((prev) => (prev === cat ? null : cat));
  };

  const sidebarContent = (isMobile: boolean) => (
    <div className="flex flex-col h-full bg-bg-surface">
      {/* Brand Bar */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-border-base shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2 min-w-0 logo-plate"
          aria-label="FilesWow — Home"
        >
          {collapsed && !isMobile ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src="/favicon.png" alt="FilesWow" width={36} height={36} className="w-9 h-9 object-contain" />
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/headerlogo-sm.png" alt="FilesWow" width={210} height={56} className="logo-light h-11 sm:h-12 w-auto object-contain" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/headerlogo-dark.png" alt="FilesWow" width={210} height={56} className="logo-dark h-11 sm:h-12 w-auto object-contain" />
            </>
          )}
        </Link>
        {isMobile && (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:bg-bg-elevated"
            aria-label="Close navigation"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Scrollable Menu + Sub-menus */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5" aria-label="Workspace navigation">
        {/* Core Workspace */}
        <div className="space-y-0.5">
          {(!collapsed || isMobile) && (
            <p className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
              Workspace
            </p>
          )}
          <SidebarLink
            href="/"
            label="All Tools Home"
            active={pathname === "/"}
            collapsed={collapsed && !isMobile}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
            }
          />
          <SidebarLink
            href="/transfer"
            label="File Transfer (50 GB)"
            active={pathname.startsWith("/transfer")}
            collapsed={collapsed && !isMobile}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            }
          />
          <SidebarLink
            href="/search"
            label={`Directory (${ALL_TOOLS.length})`}
            active={pathname.startsWith("/search")}
            collapsed={collapsed && !isMobile}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            }
          />
        </div>

        {/* Tools Menu & Sub-menus */}
        <div className="space-y-1">
          {(!collapsed || isMobile) && (
            <p className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
              Tools
            </p>
          )}

          {SIDEBAR_CATEGORIES.map((menu) => {
            const isOpen = openCategory === menu.category;
            const isCatActive = activeCategory === menu.category;

            return (
              <div key={menu.category}>
                <button
                  type="button"
                  onClick={() => toggleCategory(menu.category)}
                  aria-expanded={isOpen}
                  title={collapsed && !isMobile ? menu.label : undefined}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13.5px] font-medium transition-colors cursor-pointer ${
                    isCatActive
                      ? "bg-accent-subtle text-accent-ink"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                  } ${collapsed && !isMobile ? "justify-center" : ""}`}
                >
                  <span style={{ color: isCatActive ? "var(--accent)" : `var(--cat-${menu.category})` }}>
                    <CategoryIcon category={menu.category} />
                  </span>
                  {(!collapsed || isMobile) && (
                    <>
                      <span className="flex-1 text-left truncate">{menu.label}</span>
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`text-text-tertiary transition-transform duration-150 ${isOpen ? "rotate-90" : ""}`}
                        aria-hidden="true"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </>
                  )}
                </button>

                {/* Scrollable list of ALL tools in this category */}
                {isOpen && (!collapsed || isMobile) && (
                  <div className="mt-1 ml-3 pl-3 border-l border-border-base py-1">
                    <div className="max-h-64 overflow-y-auto space-y-0.5 pr-1">
                      {ALL_TOOLS.filter((t) =>
                        menu.category === "text"
                          ? t.category === "text" || t.slug.includes("text")
                          : t.category === menu.category
                      ).map((tool) => {
                        const href = `/tools/${tool.slug}`;
                        const active = pathname === href;
                        return (
                          <Link
                            key={tool.slug}
                            href={href}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12.5px] transition-colors ${
                              active
                                ? "bg-bg-elevated text-text-primary font-semibold"
                                : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated/60"
                            }`}
                          >
                            <ToolIcon name={tool.slug} size={14} className="shrink-0" />
                            <span className="truncate">{tool.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Resources */}
        <div className="space-y-0.5">
          {(!collapsed || isMobile) && (
            <p className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
              Resources
            </p>
          )}
          <SidebarLink
            href="/guides"
            label="Guides"
            active={pathname.startsWith("/guides")}
            collapsed={collapsed && !isMobile}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            }
          />
          <SidebarLink
            href="/blog"
            label="Blog & Tutorials"
            active={pathname.startsWith("/blog")}
            collapsed={collapsed && !isMobile}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            }
          />
        </div>
      </nav>

      {/* Sidebar Bottom — Trust Links (no login) */}
      {(!collapsed || isMobile) && (
        <div className="p-3 border-t border-border-base flex items-center justify-between text-[12px] text-text-tertiary shrink-0">
          <Link href="/about" className="hover:text-text-primary transition-colors">About</Link>
          <Link href="/contact" className="hover:text-text-primary transition-colors">Contact</Link>
          <Link href="/privacy" className="hover:text-text-primary transition-colors">Privacy</Link>
        </div>
      )}
    </div>
  );

  return (
    <>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      <div className="min-h-screen flex bg-bg-base">
        {/* Desktop Persistent Collapsible Sidebar */}
        <aside
          className={`hidden lg:block shrink-0 border-r border-border-base bg-bg-surface sticky top-0 h-screen transition-[width] duration-200 ${
            collapsed ? "w-[68px]" : "w-64"
          }`}
        >
          {sidebarContent(false)}
        </aside>

        {/* Mobile Slide-Over Sidebar Drawer */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <aside
              className="relative w-72 max-w-[85vw] h-full bg-bg-surface border-r border-border-base shadow-[var(--elevation-xl)] z-10"
              role="dialog"
              aria-modal="true"
              aria-label="Tools menu"
            >
              {sidebarContent(true)}
            </aside>
          </div>
        )}

        {/* Right Workspace Column: Top Bar + Main + Footer */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="sticky top-0 z-30 h-16 bg-bg-surface/85 backdrop-blur-xl border-b border-border-base px-4 sm:px-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Mobile drawer button */}
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden w-10 h-10 -ml-2 rounded-lg flex items-center justify-center text-text-primary hover:bg-bg-elevated transition-colors"
                aria-label="Open menu"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </svg>
              </button>

              {/* Desktop sidebar collapse toggle */}
              <button
                type="button"
                onClick={() => setCollapsed((v) => !v)}
                className="hidden lg:inline-flex w-9 h-9 -ml-1 rounded-lg items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                </svg>
              </button>

              {/* Mobile logo */}
              <Link href="/" className="lg:hidden flex items-center shrink-0" aria-label="FilesWow — Home">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/headerlogo-sm.png" alt="FilesWow" width={185} height={50} className="logo-light h-10 sm:h-11 w-auto object-contain" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/headerlogo-dark.png" alt="FilesWow" width={185} height={50} className="logo-dark h-10 sm:h-11 w-auto object-contain" />
              </Link>
            </div>

            {/* Top Bar Right: Search + Trust Links + Language + Theme */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="inline-flex items-center gap-2 h-9 px-3 sm:w-56 text-[13px] text-text-secondary bg-bg-elevated hover:bg-bg-hover rounded-lg border border-border-base transition-colors cursor-pointer"
                aria-label="Search tools (Ctrl+K)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary shrink-0" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span className="hidden sm:inline flex-1 text-left">Search tools…</span>
                <kbd className="hidden md:inline-flex">⌘K</kbd>
              </button>

              <nav className="hidden xl:flex items-center gap-1" aria-label="Company">
                <Link href="/about" className="px-2.5 py-1.5 rounded-lg text-[13px] font-medium text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors">
                  About
                </Link>
                <Link href="/contact" className="px-2.5 py-1.5 rounded-lg text-[13px] font-medium text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors">
                  Contact
                </Link>
              </nav>

              <LanguageSwitcher direction="down" compact />

              <button
                type="button"
                onClick={(e) => toggle({ x: e.clientX, y: e.clientY })}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer"
                aria-label={`Toggle theme (currently ${theme})`}
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                {theme === "dark" ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0" id="main-content">
            {children}
          </main>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </>
  );
}

function SidebarLink({
  href,
  label,
  active,
  collapsed,
  icon,
}: {
  href: string;
  label: string;
  active: boolean;
  collapsed: boolean;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13.5px] font-medium transition-colors ${
        active
          ? "bg-accent-subtle text-accent-ink font-semibold"
          : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
      } ${collapsed ? "justify-center" : ""}`}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}
