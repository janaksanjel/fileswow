export const dynamic = "force-static";

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * robots.txt — allow EVERYONE: all search engines and all AI crawlers.
 * The goal is maximum discoverability: Google, Bing, and AI answer engines
 * (ChatGPT, Perplexity, Claude, Gemini, Copilot, Grok…) must be able to read
 * every tool page so they can index and recommend the tools.
 *
 * Only SEO scrapers (Ahrefs/Semrush/DotBot) and obviously abusive bots are
 * blocked, plus private/API paths.
 */

const AI_CRAWLERS = [
  // OpenAI — ChatGPT browsing, search, and training
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  // Anthropic — Claude
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  // Perplexity — answer engine
  "PerplexityBot",
  "Perplexity-User",
  // Google — Gemini / AI training (Googlebot itself is covered by *)
  "Google-Extended",
  "Applebot",
  "Applebot-Extended",
  // Meta — Llama / Meta AI
  "FacebookBot",
  "meta-externalagent",
  "meta-externalfetcher",
  // ByteDance — Doubao
  "Bytespider",
  // Other AI / answer engines
  "YouBot",
  "cohere-ai",
  "MistralAI-User",
  "MistralAI-Training",
  "DuckAssistBot",
  "CCBot",
  "Amazonbot",
  "Diffbot",
];

const PRIVATE_PATHS = ["/api/", "/_next/", "/admin/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Every crawler not named below: full access
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
      {
        // Explicitly welcome every known AI crawler (some ignore "*")
        userAgent: AI_CRAWLERS,
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: ["AhrefsBot", "SemrushBot", "DotBot"],
        disallow: "/",
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
