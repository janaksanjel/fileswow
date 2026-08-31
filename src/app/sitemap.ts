import type { MetadataRoute } from "next";
import { ALL_TOOLS } from "@/lib/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://fileswow.com";

  const toolPages = ALL_TOOLS.map((tool) => ({
    url: `${base}/tools/${tool.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/pdf-tools`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/word-tools`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/image-tools`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...toolPages,
  ];
}
