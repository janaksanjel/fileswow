import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getToolBySlug } from "@/lib/catalog";
import { GUIDES, getGuideBySlug, guideUrl, readingMinutes } from "@/lib/guides";
import { absoluteUrl, jsonLdProps, toolUrl } from "@/lib/site";
import { AdSlot } from "@/components/ad-unit";

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return {};

  return {
    title: guide.title,
    description: guide.description,
    keywords: [
      guide.title,
      `${guide.title} guide`,
      "file tools guide",
      "free online tools tutorial",
    ],
    openGraph: {
      title: guide.title,
      description: guide.description,
      url: guideUrl(guide.slug),
      type: "article",
      siteName: "FilesWow.com",
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description: guide.description,
    },
    alternates: {
      canonical: guideUrl(guide.slug),
      languages: { "x-default": guideUrl(guide.slug) },
    },
  };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const relatedTools = guide.related
    .map((s) => getToolBySlug(s))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  const minutes = readingMinutes(guide);
  const updatedLabel = new Date(guide.updated).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    dateModified: guide.updated,
    datePublished: guide.updated,
    mainEntityOfPage: { "@type": "WebPage", "@id": guideUrl(guide.slug) },
    author: { "@type": "Organization", name: "FilesWow.com", url: absoluteUrl("/") },
    publisher: { "@type": "Organization", name: "FilesWow.com", url: absoluteUrl("/") },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Guides", item: absoluteUrl("/guides") },
      { "@type": "ListItem", position: 3, name: guide.title, item: guideUrl(guide.slug) },
    ],
  };

  return (
    <>
      <script {...jsonLdProps(articleJsonLd)} />
      <script {...jsonLdProps(faqJsonLd)} />
      <script {...jsonLdProps(breadcrumbJsonLd)} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-2 text-xs font-medium text-text-tertiary mb-6"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-accent transition-colors">
            Home
          </Link>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <Link href="/guides" className="hover:text-accent transition-colors">
            Guides
          </Link>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="text-text-secondary truncate max-w-[200px] sm:max-w-none">{guide.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide bg-accent/10 text-accent">
              Guide
            </span>
            <span className="text-[11.5px] font-medium text-text-tertiary">
              Updated {updatedLabel} · {minutes} min read
            </span>
          </div>
          <h1 className="heading-xl text-text-primary mb-4 [text-wrap:balance]">{guide.title}</h1>
          <p className="body-lg text-text-secondary">{guide.description}</p>
        </header>

        {/* Intro */}
        {guide.intro.map((p, i) => (
          <p key={i} className="body-md text-text-secondary leading-relaxed mb-4">
            {p}
          </p>
        ))}

        {/* Sections */}
        {guide.sections.map((section) => (
          <section key={section.h2} className="mt-10" aria-labelledby={sectionSlug(section.h2)}>
            <h2 id={sectionSlug(section.h2)} className="heading-lg text-text-primary mb-4">
              {section.h2}
            </h2>
            {section.paragraphs.map((p, i) => (
              <p key={i} className="body-md text-text-secondary leading-relaxed mb-4">
                {p}
              </p>
            ))}
            {section.bullets && (
              <ul className="space-y-2 my-4">
                {section.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-accent shrink-0 mt-1"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="body-md text-text-secondary leading-relaxed">{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        {/* Ad — mid-article */}
        <AdSlot slot="tool" label="in-article (guide)" className="my-10" />

        {/* FAQ */}
        <section className="mt-12" aria-labelledby="guide-faq-heading">
          <h2 id="guide-faq-heading" className="heading-lg text-text-primary mb-5">
            Frequently asked questions
          </h2>
          <div className="space-y-2.5">
            {guide.faq.map((f, i) => (
              <details
                key={i}
                className="group bg-bg-surface border border-border-base rounded-xl px-4 sm:px-5 [&_summary::-webkit-details-marker]:hidden"
                open={i === 0}
              >
                <summary className="flex items-center justify-between gap-3 py-3.5 cursor-pointer list-none select-none">
                  <h3 className="text-[13.5px] font-semibold text-text-primary">{f.q}</h3>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-text-tertiary shrink-0 transition-transform duration-200 group-open:rotate-180"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </summary>
                <p className="body-md text-text-secondary leading-relaxed pb-4 -mt-1">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Related tools */}
        {relatedTools.length > 0 && (
          <section className="mt-12" aria-labelledby="guide-tools-heading">
            <h2 id="guide-tools-heading" className="heading-lg text-text-primary mb-2">
              Tools for this job
            </h2>
            <p className="body-sm text-text-secondary mb-4">
              Everything runs locally in your browser — no upload, no sign-up, free.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedTools.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="card p-4 hover:border-border-strong transition-colors group"
                >
                  <p className="text-[14px] font-semibold text-text-primary group-hover:text-accent transition-colors">
                    {tool.name}
                  </p>
                  <p className="text-[12.5px] text-text-secondary mt-0.5 leading-relaxed">
                    {tool.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* More guides */}
        <section className="mt-12" aria-labelledby="more-guides-heading">
          <h2 id="more-guides-heading" className="heading-md text-text-primary mb-4">
            More guides
          </h2>
          <div className="space-y-2">
            {GUIDES.filter((g) => g.slug !== guide.slug)
              .slice(0, 4)
              .map((g) => (
                <Link
                  key={g.slug}
                  href={`/guides/${g.slug}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-bg-surface border border-border-base hover:border-border-strong transition-colors group"
                >
                  <span className="text-[13.5px] font-semibold text-text-primary group-hover:text-accent transition-colors">
                    {g.title}
                  </span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-text-tertiary shrink-0"
                    aria-hidden="true"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              ))}
          </div>
        </section>
      </article>
    </>
  );
}

/** Stable DOM id for a section heading (keeps aria-labelledby wired). */
function sectionSlug(h2: string): string {
  return (
    "s-" +
    h2
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}
