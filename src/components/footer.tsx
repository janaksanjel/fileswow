"use client";

import Link from "next/link";
import { BLOG_POSTS } from "@/lib/blog";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";

/**
 * Site footer — an always-dark band (like the reference design), built from
 * fixed dark colors rather than theme tokens so it reads the same in light
 * and dark mode. Layout: brand + language switcher on the left, four link
 * columns on the right, centered copyright bar at the bottom.
 */

/* Popular tools — the "Other tools" column. Tool names stay in English
   (they match the catalog and every tool page). */
const OTHER_TOOLS: Array<[string, string]> = [
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

  const quickLinks: Array<[string, string]> = [
    [t("footer.allTools"), "/search"],
    [t("footer.blog"), "/blog"],
    [t("footer.transfer"), "/transfer"],
    [t("footer.about"), "/about"],
    [t("footer.contact"), "/contact"],
  ];

  const resourceLinks: Array<[string, string]> = [
    [t("footer.pdfTools"), "/pdf-tools"],
    [t("footer.wordTools"), "/word-tools"],
    [t("footer.imageTools"), "/image-tools"],
    [t("footer.textTools"), "/text-tools"],
    [t("footer.privacy"), "/privacy"],
    [t("footer.terms"), "/terms"],
    [t("footer.sitemap"), "/sitemap.xml"],
  ];

  return (
    <footer className="bg-[#10182b] text-[#cbd5e1]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 sm:pt-16 pb-8">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
          {/* Brand + language */}
          <div className="lg:w-[280px] shrink-0">
            <Link href="/" className="inline-flex items-baseline gap-px group" aria-label="FilesWow.com — Home">
              <span className="font-heading text-[18px] font-bold tracking-[-0.02em] text-white group-hover:text-[#ff9a24] transition-colors">
                FilesWow
              </span>
              <span className="font-heading text-[18px] font-bold tracking-[-0.02em] text-[#ff9a24]">.com</span>
            </Link>
            <p className="mt-3 text-[13px] leading-relaxed text-[#9aa3b7] max-w-xs">
              {t("footer.tagline")}
            </p>

            <div className="mt-6">
              <LanguageSwitcher />
            </div>

            {/* Product Hunt — dark badge variant to sit on the dark band */}
            <a
              href="https://www.producthunt.com/products/fileswow-com?embed=true&amp;utm_source=badge-featured&amp;utm_medium=badge&amp;utm_campaign=badge-fileswow-com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="FilesWow.com on Product Hunt"
              className="mt-7 inline-block opacity-90 hover:opacity-100 transition-opacity"
            >
              <img
                alt="FilesWow.com - Free File Tools. No Uploads. Private. | Product Hunt"
                width={250}
                height={54}
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1255284&amp;theme=dark&amp;t=1789957273599"
                loading="lazy"
                className="h-6 w-auto"
              />
            </a>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-9 flex-1">
            <FooterColumn heading={t("footer.otherTools")} links={OTHER_TOOLS} />
            <FooterColumn heading={t("footer.quickLinks")} links={quickLinks} />
            <FooterColumn
              heading={t("footer.guides")}
              links={[
                ...BLOG_POSTS.slice(0, 4).map(
                  (p) => [p.shortTitle, `/blog/${p.slug}`] as [string, string],
                ),
                [t("footer.allGuides"), "/guides"],
              ]}
            />
            <FooterColumn heading={t("footer.resources")} links={resourceLinks} />
          </div>
        </div>

        {/* Bottom bar — centered copyright */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="order-2 sm:order-1 text-[12.5px] text-[#7d8698]">
            &copy; {year} FilesWow.com — {t("footer.rights")}
          </p>
          <span className="order-1 sm:order-2 inline-flex items-center gap-2 text-[12px] font-medium text-[#9aa3b7]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" aria-hidden="true" />
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
      <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8a93a8] mb-4">
        {heading}
      </h3>
      <ul className="space-y-2.5">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link
              href={href}
              className="text-[13.5px] text-[#cbd5e1] hover:text-[#ff9a24] transition-colors"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
