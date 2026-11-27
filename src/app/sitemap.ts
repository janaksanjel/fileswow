export const dynamic = "force-static";

import type { MetadataRoute } from "next";
import { ALL_TOOLS } from "@/lib/catalog";
import { GUIDES } from "@/lib/guides";
import { BLOG_POSTS } from "@/lib/blog";
import { SITE_URL, absoluteUrl } from "@/lib/site";
import { CORE_INDEXED_TOOL_SLUGS } from "@/lib/seo-index";

/**
 * Keep lastmod accurate and bump only when tool/content pages actually change.
 */
const CONTENT_LAST_UPDATED = "2026-11-27";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL;
  const contentDate = new Date(CONTENT_LAST_UPDATED);

  // Core landing, category hub, and trust pages (/search, /privacy, /terms, /disclaimer omitted from sitemap)
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: contentDate,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: absoluteUrl("/pdf-tools"),
      lastModified: contentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/word-tools"),
      lastModified: contentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/image-tools"),
      lastModified: contentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/text-tools"),
      lastModified: contentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/transfer"),
      lastModified: contentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/guides"),
      lastModified: contentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/blog"),
      lastModified: contentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/about"),
      lastModified: contentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: absoluteUrl("/contact"),
      lastModified: contentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Focus crawl budget on curated flagship tools so Google indexes core pages fast
  const toolPages: MetadataRoute.Sitemap = ALL_TOOLS.filter((tool) =>
    CORE_INDEXED_TOOL_SLUGS.has(tool.slug)
  ).map((tool) => ({
    url: absoluteUrl(`/tools/${tool.slug}`),
    lastModified: contentDate,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  // Editorial guides — dated by their actual last-updated date
  const guidePages: MetadataRoute.Sitemap = GUIDES.map((guide) => ({
    url: absoluteUrl(`/guides/${guide.slug}`),
    lastModified: new Date(guide.updated),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Blog posts — dated by their actual last-updated date
  const blogPages: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: new Date(post.updated),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...toolPages, ...guidePages, ...blogPages];
}
