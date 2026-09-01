export const dynamic = "force-static";

import type { MetadataRoute } from "next";
import { ALL_TOOLS } from "@/lib/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://fileswow.com";
  const now = new Date();

  // Static pages with high priority
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${base}/pdf-tools`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/word-tools`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/image-tools`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${base}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${base}/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // Tool pages — tier 1 tools get higher priority
  const toolPages: MetadataRoute.Sitemap = ALL_TOOLS.map((tool) => ({
    url: `${base}/tools/${tool.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: tool.tier === 1 ? 0.8 : tool.tier === 2 ? 0.6 : 0.4,
  }));

  return [...staticPages, ...toolPages];
}
