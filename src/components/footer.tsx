"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BLOG_POSTS } from "@/lib/blog";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ALL_TOOLS } from "@/lib/catalog";
import { DEFAULT_HEADER_THEME, getHourlyDefaultTheme, getToolGradient, type ToolGradientTheme } from "@/lib/tool-theme";

const POPULAR_TOOLS: Array<[string, string]> = [
  ["Merge PDF", "/tools/merge-pdf"],
  ["Compress PDF", "/tools/compress-pdf"],
  ["Split PDF", "/tools/split-pdf"],
  ["PDF to Word", "/tools/pdf-to-word"],
  ["Word to PDF", "/tools/word-to-pdf"],
  ["JPG to PDF", "/tools/jpg-to-pdf"],
  ["PDF to JPG", "/tools/pdf-to-jpg"],
];

export function Footer() {
  const { t } = useI18n();
  const pathname = usePathname();
  const year = new Date().getFullYear();

  const [hourlyTheme, setHourlyTheme] = useState<ToolGradientTheme>(DEFAULT_HEADER_THEME);

  useEffect(() => {
    const syncTheme = () => setHourlyTheme(getHourlyDefaultTheme());
    syncTheme();
    const msUntilNextHour = 3_600_000 - (Date.now() % 3_600_000);
    let intervalId: number | null = null;
    const timeoutId = window.setTimeout(() => {
      syncTheme();
      intervalId = window.setInterval(syncTheme, 3_600_000);
    }, msUntilNextHour);
    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId !== null) window.clearInterval(intervalId);
    };
  }, []);

  const activeTool = pathname.startsWith("/tools/")
    ? ALL_TOOLS.find((tool) => tool.slug === pathname.slice("/tools/".length).split("/")[0])
    : undefined;
  const footerTheme = activeTool ? getToolGradient(activeTool.slug) : hourlyTheme;

  const categoryLinks: Array<[string, string]> = [
    [t("footer.pdfTools"), "/pdf-tools"],
    [t("footer.wordTools"), "/word-tools"],
    [t("footer.imageTools"), "/image-tools"],
    [t("footer.textTools"), "/text-tools"],
    [t("footer.transfer"), "/transfer"],
    [t("footer.allTools"), "/search"],
  ];

  const legalLinks: Array<[string, string]> = [
    [t("footer.about"), "/about"],
    [t("footer.contact"), "/contact"],
    [t("footer.privacy"), "/privacy"],
    [t("footer.terms"), "/terms"],
    ["Disclaimer", "/disclaimer"],
    [t("footer.sitemap"), "/sitemap.xml"],
  ];

  return (
    <footer
      className="border-t border-white/15 text-white/85 transition-all duration-300"
      style={{ background: footerTheme.gradient }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-8">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
          {/* Brand + language */}
          <div className="lg:w-[260px] shrink-0">
            <Link href="/" className="inline-flex items-center group" aria-label="FilesWow.com — Home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/headerlogo-dark.png" alt="FilesWow" width={190} height={50} className="h-10 w-auto object-contain" />
            </Link>
            <p className="mt-3 text-[13px] leading-relaxed text-white/80 max-w-xs">
              {t("footer.tagline")}
            </p>

            <div className="mt-5">
              <LanguageSwitcher onGradient />
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-8 flex-1">
            <FooterColumn heading={t("footer.otherTools")} links={POPULAR_TOOLS} />
            <FooterColumn heading="Categories" links={categoryLinks} />
            <FooterColumn
              heading={t("footer.guides")}
              links={[
                ...BLOG_POSTS.slice(0, 4).map(
                  (p) => [p.shortTitle, `/blog/${p.slug}`] as [string, string],
                ),
                [t("footer.allGuides"), "/guides"],
                [t("footer.blog"), "/blog"],
              ]}
            />
            <FooterColumn heading="Company & Legal" links={legalLinks} />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="order-2 sm:order-1 text-[12.5px] text-white/70">
            &copy; {year} FilesWow.com — {t("footer.rights")}
          </p>
          <span className="order-1 sm:order-2 inline-flex items-center gap-2 text-[12px] font-medium text-white/90 px-3 py-1 rounded-full bg-white/15 border border-white/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" aria-hidden="true" />
            {t("footer.systems")}
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  heading,
  links,
}: {
  heading: string;
  links: Array<[string, string]>;
}) {
  return (
    <nav aria-label={heading}>
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/65 mb-3.5">
        {heading}
      </h3>
      <ul className="space-y-2">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link
              href={href}
              className="text-[13px] text-white/85 hover:text-white transition-colors"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
