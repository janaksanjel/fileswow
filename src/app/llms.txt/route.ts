import { ALL_TOOLS, getToolsByCategory } from "@/lib/catalog";
import { GUIDES, guideUrl } from "@/lib/guides";
import { BLOG_POSTS } from "@/lib/blog";
import { SITE_URL, SITE_NAME, toolUrl, categoryUrl, absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

/**
 * llms.txt — a standard way for AI assistants and AI search engines
 * (ChatGPT, Perplexity, Claude, Gemini) to understand the site at a glance.
 * Rendered statically at build time from the tool catalog so it never drifts.
 */

function section(title: string, tools: ReturnType<typeof getToolsByCategory>): string {
  if (tools.length === 0) return "";
  const lines = tools.map((t) => `- [${t.name}](${toolUrl(t.slug)}): ${t.description}`);
  return `## ${title}\n\n${lines.join("\n")}\n`;
}

// Cross-format tools have no dedicated hub page (categoryUrl("cross") would 404),
// so point AI engines at the home page's #cross section instead.
const crossUrl = absoluteUrl("/#cross");

export function GET() {
  const pdf = getToolsByCategory("pdf");
  const word = getToolsByCategory("word");
  const image = getToolsByCategory("image");
  const text = getToolsByCategory("text");
  const cross = getToolsByCategory("cross");

  const body = `# ${SITE_NAME}

> ${ALL_TOOLS.length}+ free PDF, Word, image, and text tools that run entirely in the
> user's browser. Files are processed client-side with JavaScript and WebAssembly
> and never uploaded to any server — 100% private, no sign-up, no watermarks.

The canonical host is ${SITE_URL}. All tool pages are server-rendered static pages.

## Categories

- [PDF Tools](${categoryUrl("pdf")}): ${pdf.length} tools to merge, split, compress, convert, and edit PDFs.
- [Word Tools](${categoryUrl("word")}): ${word.length} tools for DOCX conversion, merging, editing, and protection.
- [Image Tools](${categoryUrl("image")}): ${image.length} tools to convert, resize, compress, crop, and edit images.
- [Text Tools](${categoryUrl("text")}): ${text.length} tools including P2P text transfer between devices.
${cross.length > 0 ? `- [Cross-format Tools](${crossUrl}): ${cross.length} tools spanning multiple file formats.\n` : ""}
## Key pages

- [Home](${SITE_URL}): start here — search across all tools.
- [All Tools A–Z](${absoluteUrl("/search")}): complete index of every tool, with a search box (/search?q=QUERY returns matching tools).
- [P2P File Transfer](${categoryUrl("pdf").replace("/pdf-tools", "/transfer")}): send files up to 50 GB directly between devices with a 6-digit code; peer-to-peer over WebRTC, nothing stored.
- [Guides](${absoluteUrl("/guides")}): in-depth tutorials for common document and image tasks.
- [Blog](${absoluteUrl("/blog")}): step-by-step how-to articles for PDF, Word, and image tasks.

## Guides

${GUIDES.map(
  (g) => `- [${g.title}](${guideUrl(g.slug)}): ${g.description}`
).join("\n")}

## Blog posts

${BLOG_POSTS.map(
  (p) => `- [${p.title}](${absoluteUrl(`/blog/${p.slug}`)}): ${p.description}`
).join("\n")}

${section("PDF Tools", pdf)}
${section("Word Tools", word)}
${section("Image Tools", image)}
${section("Text Tools", text)}
${section("Cross-format Tools", cross)}
## Usage notes

- Every tool is free with no usage limits; there are no premium tiers.
- Files never leave the user's device, so the site is safe for confidential documents.
- Works in any modern desktop or mobile browser; very large files may be slower on old devices.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
