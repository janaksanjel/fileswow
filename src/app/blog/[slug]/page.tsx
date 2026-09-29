import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getToolBySlug } from "@/lib/catalog";
import { BLOG_POSTS, getBlogPostBySlug, blogUrl, blogIndexUrl, blogReadingMinutes } from "@/lib/blog";
import { absoluteUrl, jsonLdProps, toolUrl } from "@/lib/site";
import { AdSlot } from "@/components/ad-unit";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    keywords: [post.keyword, ...post.keywords],
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.description,
      url: blogUrl(post.slug),
      type: "article",
      siteName: "FilesWow.com",
      publishedTime: post.published,
      modifiedTime: post.updated,
      authors: [post.author],
      tags: [post.keyword, ...post.keywords],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
    alternates: {
      canonical: blogUrl(post.slug),
      languages: { "x-default": blogUrl(post.slug) },
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) notFound();

  const relatedTools = post.related
    .map((s) => getToolBySlug(s))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  const minutes = blogReadingMinutes(post);
  const publishedLabel = new Date(post.published).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const updatedLabel = new Date(post.updated).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // BlogPosting schema — the richest article markup for a tutorial post
  const blogPostingJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    keywords: [post.keyword, ...post.keywords].join(", "),
    datePublished: post.published,
    dateModified: post.updated,
    mainEntityOfPage: { "@type": "WebPage", "@id": blogUrl(post.slug) },
    author: { "@type": "Organization", name: post.author, url: absoluteUrl("/") },
    publisher: {
      "@type": "Organization",
      name: "FilesWow.com",
      url: absoluteUrl("/"),
    },
    inLanguage: "en",
    isAccessibleForFree: true,
  };

  // HowTo schema — mirrors the visible numbered steps
  const steps = post.sections.flatMap((s) => s.steps ?? []);
  const howToJsonLd =
    steps.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: post.title,
          description: post.description,
          totalTime: "PT5M",
          step: steps.map((text, i) => ({
            "@type": "HowToStep",
            position: i + 1,
            name: `Step ${i + 1}`,
            text,
          })),
        }
      : null;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: post.faq.map((f) => ({
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
      { "@type": "ListItem", position: 2, name: "Blog", item: blogIndexUrl() },
      { "@type": "ListItem", position: 3, name: post.title, item: blogUrl(post.slug) },
    ],
  };

  // SuggestedWebPage/WebPage schema isn't needed; but mark up sections for jump links
  const toc = post.sections.map((s) => ({
    id: sectionSlug(s.h2),
    label: s.h2,
  }));

  const idx = BLOG_POSTS.findIndex((p) => p.slug === post.slug);
  const prev = idx > 0 ? BLOG_POSTS[idx - 1] : null;
  const next = idx >= 0 && idx < BLOG_POSTS.length - 1 ? BLOG_POSTS[idx + 1] : null;

  return (
    <>
      <script {...jsonLdProps(blogPostingJsonLd)} />
      {howToJsonLd && <script {...jsonLdProps(howToJsonLd)} />}
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
          <Link href="/blog" className="hover:text-accent transition-colors">
            Blog
          </Link>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="text-text-secondary truncate max-w-[200px] sm:max-w-none">{post.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide bg-accent/10 text-accent">
              Tutorial
            </span>
            <span className="text-[11.5px] font-medium text-text-tertiary">
              Published {publishedLabel} · Updated {updatedLabel} · {minutes} min read
            </span>
          </div>
          <h1 className="heading-xl text-text-primary mb-4 [text-wrap:balance]">{post.title}</h1>
          <p className="body-lg text-text-secondary">{post.description}</p>
        </header>

        {/* Table of contents — only when the post has enough structure */}
        {toc.length > 1 && (
          <nav
            aria-label="Table of contents"
            className="mb-8 p-4 sm:p-5 rounded-2xl bg-bg-surface border border-border-base"
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary mb-2.5">
              In this guide
            </p>
            <ol className="space-y-1.5">
              {toc.map((item, i) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="flex items-baseline gap-2.5 text-[13.5px] text-text-secondary hover:text-accent transition-colors"
                  >
                    <span className="text-[11px] font-bold text-text-tertiary tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Intro */}
        {post.intro.map((p, i) => (
          <p key={i} className="body-md text-text-secondary leading-relaxed mb-4">
            {p}
          </p>
        ))}

        {/* Sections */}
        {post.sections.map((section) => (
          <section key={section.h2} className="mt-10" aria-labelledby={sectionSlug(section.h2)}>
            <h2 id={sectionSlug(section.h2)} className="heading-lg text-text-primary mb-4">
              {section.h2}
            </h2>
            {section.paragraphs.map((p, i) => (
              <p key={i} className="body-md text-text-secondary leading-relaxed mb-4">
                {p}
              </p>
            ))}
            {section.steps && (
              <ol className="space-y-3 my-5">
                {section.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3.5">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-accent/10 text-accent text-[12px] font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="body-md text-text-secondary leading-relaxed pt-0.5">{step}</p>
                  </li>
                ))}
              </ol>
            )}
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
        <AdSlot slot="tool" label="in-article (blog)" className="my-10" />

        {/* FAQ */}
        <section className="mt-12" aria-labelledby="blog-faq-heading">
          <h2 id="blog-faq-heading" className="heading-lg text-text-primary mb-5">
            Frequently asked questions
          </h2>
          <div className="space-y-2.5">
            {post.faq.map((f, i) => (
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

        {/* Tools used in this guide */}
        {relatedTools.length > 0 && (
          <section className="mt-12" aria-labelledby="blog-tools-heading">
            <h2 id="blog-tools-heading" className="heading-lg text-text-primary mb-2">
              Tools used in this guide
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

        {/* Prev / next navigation */}
        <nav
          className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-3"
          aria-label="More blog posts"
        >
          {prev && (
            <Link
              href={`/blog/${prev.slug}`}
              className="group card p-4 hover:border-border-strong transition-colors"
            >
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-text-tertiary block mb-1">
                ← Newer post
              </span>
              <span className="text-[13.5px] font-semibold text-text-primary group-hover:text-accent transition-colors">
                {prev.title}
              </span>
            </Link>
          )}
          {next && (
            <Link
              href={`/blog/${next.slug}`}
              className="group card p-4 hover:border-border-strong transition-colors sm:text-right"
            >
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-text-tertiary block mb-1">
                Older post →
              </span>
              <span className="text-[13.5px] font-semibold text-text-primary group-hover:text-accent transition-colors">
                {next.title}
              </span>
            </Link>
          )}
        </nav>

        {/* More from the blog */}
        <section className="mt-12" aria-labelledby="more-blog-heading">
          <h2 id="more-blog-heading" className="heading-md text-text-primary mb-4">
            More from the blog
          </h2>
          <div className="space-y-2">
            {BLOG_POSTS.filter((p) => p.slug !== post.slug)
              .slice(0, 4)
              .map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-bg-surface border border-border-base hover:border-border-strong transition-colors group"
                >
                  <span className="text-[13.5px] font-semibold text-text-primary group-hover:text-accent transition-colors">
                    {p.title}
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
