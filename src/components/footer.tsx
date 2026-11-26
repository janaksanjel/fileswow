"use client";

import Link from "next/link";
import { BLOG_POSTS } from "@/lib/blog";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";

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
  const year = new Date().getFullYear();

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
    <footer className="bg-bg-warm border-t border-border-base text-text-secondary">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-8">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
          {/* Brand + language */}
          <div className="lg:w-[260px] shrink-0">
            <Link href="/" className="inline-flex items-baseline gap-px group" aria-label="FilesWow.com — Home">
              <span className="font-heading text-[18px] font-semibold tracking-[-0.02em] text-text-primary group-hover:text-accent transition-colors">
                FilesWow
              </span>
              <span className="font-heading text-[18px] font-semibold tracking-[-0.02em] text-accent">.com</span>
            </Link>
            <p className="mt-2.5 text-[13px] leading-relaxed text-text-secondary max-w-xs">
              {t("footer.tagline")}
            </p>

            <div className="mt-5">
              <LanguageSwitcher />
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
        <div className="mt-12 pt-6 border-t border-border-base flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="order-2 sm:order-1 text-[12.5px] text-text-tertiary">
            &copy; {year} FilesWow.com — {t("footer.rights")}
          </p>
          <span className="order-1 sm:order-2 inline-flex items-center gap-2 text-[12px] font-medium text-text-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-success" aria-hidden="true" />
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
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-tertiary mb-3.5">
        {heading}
      </h3>
      <ul className="space-y-2">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link
              href={href}
              className="text-[13px] text-text-secondary hover:text-text-primary transition-colors"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
