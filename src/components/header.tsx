"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "@/lib/theme-provider";
import { SearchModal } from "@/components/search-modal";
import { ToolIcon } from "@/components/icon";
import { CATEGORY_MENUS, type CategoryMenu } from "@/lib/mega-menu";
import { CATEGORY_COUNTS } from "@/lib/catalog";
import { useI18n } from "@/lib/i18n";

const TRANSFER_HREF = "/transfer";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [openSection, setOpenSection] = useState<number | null>(0);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const { t } = useI18n();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close menus on navigation — React's "adjust state during render" pattern.
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setMobileOpen(false);
    setOpenMenu(null);
  }

  // Hairline border appears only once the page scrolls (spec: sticky 64px,
  // border on scroll — no glass/blur).
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 2);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ⌘K / Ctrl+K toggles the palette; Esc closes menus and the drawer.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Click outside closes the mega menu.
  useEffect(() => {
    if (openMenu === null) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest?.("[data-mega]")) setOpenMenu(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [openMenu]);

  // Lock background scroll behind the full-screen drawer.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const openMega = useCallback((index: number) => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpenMenu(index);
  }, []);

  // Short delay before closing so the pointer can cross into the panel.
  const scheduleMegaClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), 160);
  }, []);

  return (
    <>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <header
        className={`sticky top-0 z-40 bg-bg-surface border-b transition-[border-color] duration-150 ${
          scrolled ? "border-border-base" : "border-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo — mascot + wordmark (public/headerlogo.png, optimized
                to a 384×128 / ~10 KB copy). Dark mode sits the dark
                artwork on a light .logo-plate chip; no-op in light. */}
            <Link
              href="/"
              className="flex items-center shrink-0"
              aria-label="FilesWow.com — Home"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized 10 KB asset; next/image adds nothing on a static export */}
              <img
                src="/headerlogo-sm.png"
                alt="FilesWow"
                width={384}
                height={128}
                className="logo-plate h-8 sm:h-9 w-auto"
              />
            </Link>

            {/* Desktop nav — each category opens its mega menu */}
            <nav className="hidden lg:flex items-center gap-0.5" aria-label="Main">
              {CATEGORY_MENUS.map((menu, i) => (
                <NavItem
                  key={menu.category}
                  menu={menu}
                  index={i}
                  active={openMenu === i}
                  current={pathname === menu.href || pathname.startsWith(`${menu.href}/`)}
                  onOpen={() => openMega(i)}
                  onCloseSchedule={scheduleMegaClose}
                />
              ))}
            </nav>

            {/* Right cluster */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="hidden lg:flex items-center gap-2 h-9 px-3 text-[13px] font-medium text-text-tertiary bg-bg-input border border-border-strong rounded-lg hover:border-text-tertiary/60 hover:text-text-secondary transition-colors cursor-text"
                aria-label="Search tools (Ctrl+K)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span className="text-left">{t("nav.search")}</span>
                <kbd className="ml-auto">⌘K</kbd>
              </button>

              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="lg:hidden icon-btn min-w-11 min-h-11"
                aria-label="Search tools"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>

              <button
                type="button"
                onClick={(e) => toggle({ x: e.clientX, y: e.clientY })}
                className="icon-btn min-w-11 min-h-11 hidden sm:inline-flex"
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                {theme === "dark" ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>

              <Link
                href={TRANSFER_HREF}
                className="btn-primary hidden sm:inline-flex h-9 px-4 py-0 text-[13px]"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                {t("nav.transfer")}
              </Link>

              <button
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                className="lg:hidden icon-btn min-w-11 min-h-11"
                aria-label="Open menu"
                aria-expanded={mobileOpen}
                aria-controls="mobile-drawer"
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
        </div>

        {/* Mobile drawer — full-screen, accordion sections */}
        {mobileOpen && (
          <div
            id="mobile-drawer"
            className="lg:hidden fixed inset-x-0 top-16 bottom-0 z-40 bg-bg-surface overflow-y-auto overscroll-contain"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="pb-10">
              {CATEGORY_MENUS.map((menu, i) => {
                const expanded = openSection === i;
                return (
                  <div key={menu.category} className="border-b border-border-base">
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={`drawer-${menu.category}`}
                      onClick={() => setOpenSection(expanded ? null : i)}
                      className="flex w-full items-center justify-between gap-3 px-4 sm:px-6 py-4 text-left"
                    >
                      <span className="font-heading text-[15px] font-semibold text-text-primary">
                        {menu.label}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="badge badge-mono">{CATEGORY_COUNTS[menu.category]}</span>
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
                          className={`text-text-tertiary transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </span>
                    </button>
                    <div id={`drawer-${menu.category}`} hidden={!expanded} className="px-4 sm:px-6 pb-5">
                      <DrawerGroups menu={menu} />
                      <Link
                        href={menu.href}
                        className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent"
                        onClick={() => setMobileOpen(false)}
                      >
                        {t("nav.viewAll")} {menu.label}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                );
              })}

              <div className="px-4 sm:px-6 py-5 space-y-2">
                <Link
                  href={TRANSFER_HREF}
                  onClick={() => setMobileOpen(false)}
                  className="btn-primary w-full h-11 py-0 text-[14px]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  {t("nav.transfer")}
                </Link>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      setSearchOpen(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 h-11 rounded-lg text-[14px] font-semibold text-text-secondary bg-bg-input border border-border-strong"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    {t("nav.search")}
                  </button>
                  <button
                    type="button"
                    onClick={(e) =>
                      toggle({ x: e.clientX || window.innerWidth - 24, y: e.clientY || window.innerHeight - 60 })
                    }
                    className="flex-1 flex items-center justify-center gap-2 h-11 rounded-lg text-[14px] font-semibold text-text-secondary bg-bg-input border border-border-strong"
                  >
                    {theme === "dark" ? t("nav.lightMode") : t("nav.darkMode")}
                  </button>
                </div>
                <Link
                  href="/blog"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center h-11 rounded-lg text-[14px] font-semibold text-text-secondary bg-bg-input border border-border-strong"
                >
                  {t("nav.blogGuides")}
                </Link>
                <p className="pt-2 text-[12px] leading-relaxed text-text-tertiary text-center">
                  {t("nav.privacyNote")}
                </p>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}

/* ─── Desktop nav item + full-width mega panel ─────────────────── */

interface NavItemProps {
  menu: CategoryMenu;
  index: number;
  active: boolean;
  current: boolean;
  onOpen: () => void;
  onCloseSchedule: () => void;
}

function NavItem({ menu, active, current, onOpen, onCloseSchedule }: NavItemProps) {
  const { t } = useI18n();
  return (
    <div data-mega className="relative" onMouseEnter={onOpen} onMouseLeave={onCloseSchedule}>
      <Link
        href={menu.href}
        onFocus={onOpen}
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13.5px] font-medium transition-colors ${
          current
            ? "text-accent bg-accent-subtle"
            : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
        }`}
      >
        {menu.label}
      </Link>

      {/* Full-bleed band under the header: anchored to the viewport so wide
          menus never overflow. Inert while closed (keeps tab order sane) but
          present in the DOM for crawlers. */}
      <div
        id={`mega-${menu.category}`}
        role="region"
        aria-label={`${menu.label} menu`}
        inert={!active}
        className={`fixed left-0 right-0 top-16 z-40 bg-bg-surface border-b border-border-base shadow-[var(--elevation-md)] transition-[opacity,transform] duration-150 ${
          active
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-1 pointer-events-none"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
            {menu.groups.map((group) => (
              <div key={group.title}>
                <div className="flex items-center gap-2 mb-3">
                  <Link
                    href={group.href}
                    className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-tertiary hover:text-accent transition-colors"
                    tabIndex={active ? 0 : -1}
                  >
                    {group.title}
                  </Link>
                  <span className="flex-1 h-px bg-border-base" aria-hidden="true" />
                </div>
                <ul className="space-y-0.5">
                  {group.tools.map((tool) => (
                    <li key={tool.slug}>
                      <Link
                        href={`/tools/${tool.slug}`}
                        tabIndex={active ? 0 : -1}
                        className="group flex items-start gap-3 rounded-lg p-2 -mx-2 hover:bg-bg-hover transition-colors"
                      >
                        <span className="w-8 h-8 rounded-lg bg-bg-elevated ring-1 ring-inset ring-border-base flex items-center justify-center shrink-0">
                          <ToolIcon name={tool.slug} size={16} className="text-text-secondary group-hover:text-accent transition-colors" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[13px] font-semibold text-text-primary leading-tight group-hover:text-accent transition-colors">
                            {tool.name}
                          </span>
                          <span className="block text-[12px] text-text-tertiary leading-snug line-clamp-1 mt-0.5">
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

          <div className="mt-6 pt-4 border-t border-border-base flex flex-wrap items-center justify-between gap-3">
            <p className="text-[12px] text-text-tertiary">
              {t("nav.privacyNote")}
            </p>
            <div className="flex items-center gap-5">
              <Link href="/blog" tabIndex={active ? 0 : -1} className="text-[13px] font-medium text-text-secondary hover:text-accent transition-colors">
                Blog
              </Link>
              <Link
                href={menu.href}
                tabIndex={active ? 0 : -1}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent hover:gap-2.5 transition-all"
              >
                {t("nav.viewAll")} {menu.label}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Grouped tool links — shared by the mobile drawer sections */
function DrawerGroups({ menu }: { menu: CategoryMenu }) {
  return (
    <div className="space-y-4">
      {menu.groups.map((group) => (
        <div key={group.title}>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-tertiary mb-1.5">
            {group.title}
          </p>
          <ul className="grid grid-cols-1 gap-0.5">
            {group.tools.map((tool) => (
              <li key={tool.slug}>
                <Link
                  href={`/tools/${tool.slug}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2.5 -mx-2 hover:bg-bg-hover transition-colors"
                >
                  <span className="w-8 h-8 rounded-lg bg-bg-elevated ring-1 ring-inset ring-border-base flex items-center justify-center shrink-0">
                    <ToolIcon name={tool.slug} size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-semibold text-text-primary leading-tight">
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
