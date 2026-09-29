import Link from "next/link";
import { ALL_TOOLS } from "@/lib/catalog";
import { BLOG_POSTS } from "@/lib/blog";

const COLUMNS: Array<{ heading: string; links: Array<[string, string]> }> = [
  {
    heading: "Popular PDF Tools",
    links: [
      ["Merge PDF", "/tools/merge-pdf"],
      ["Split PDF", "/tools/split-pdf"],
      ["Compress PDF", "/tools/compress-pdf"],
      ["PDF to Word", "/tools/pdf-to-word"],
      ["Word to PDF", "/tools/word-to-pdf"],
      ["Sign PDF", "/tools/sign-pdf"],
      ["Edit PDF", "/tools/edit-pdf"],
    ],
  },
  {
    heading: "Convert & Edit",
    links: [
      ["JPG to PDF", "/tools/jpg-to-pdf"],
      ["PDF to JPG", "/tools/pdf-to-jpg"],
      ["PDF to Excel", "/tools/pdf-to-excel"],
      ["HTML to PDF", "/tools/html-to-pdf"],
      ["Word to Text", "/tools/word-to-text"],
      ["OCR PDF", "/tools/ocr-pdf"],
      ["All 100+ Tools", "/search"],
    ],
  },
  {
    heading: "Image Tools",
    links: [
      ["Compress Image", "/tools/compress-image"],
      ["Resize Image", "/tools/resize-image"],
      ["Crop Image", "/tools/crop-image"],
      ["Remove Background", "/tools/background-remove-image"],
      ["JPG to WebP", "/tools/jpg-to-webp"],
      ["All Image Tools", "/image-tools"],
    ],
  },
  {
    heading: "Popular Guides",
    links: [
      ["Merge PDFs Free", "/blog/how-to-merge-pdf-files-online-free"],
      ["Compress to a Size Limit", "/blog/compress-pdf-to-specific-size"],
      ["PDF to Word (Editable)", "/blog/convert-pdf-to-word-editable"],
      ["Sign PDFs Online", "/blog/how-to-sign-a-pdf-online"],
      ["JPG to PDF", "/blog/jpg-to-pdf-converter-guide"],
      ["Split PDF Files", "/blog/split-pdf-into-multiple-files"],
      ["All Guides", "/guides"],
    ],
  },
  {
    heading: "Blog",
    links: BLOG_POSTS.slice(0, 7).map(
      (p) => [p.shortTitle, `/blog/${p.slug}`] as [string, string]
    ),
  },
  {
    heading: "Company",
    links: [
      ["All PDF Tools", "/pdf-tools"],
      ["All Word Tools", "/word-tools"],
      ["All Image Tools", "/image-tools"],
      ["All Text Tools", "/text-tools"],
      ["P2P File Transfer", "/transfer"],
      ["About", "/about"],
      ["Contact", "/contact"],
      ["Privacy", "/privacy"],
      ["Terms", "/terms"],
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border-base bg-bg-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Brand row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-b from-accent-light to-accent flex items-center justify-center shadow-sm">
              <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5.5 2.5h7.2L19 8.3V21.5H5.5z" fill="#fff" />
                <path d="M12.7 2.5v5.8H19z" fill="var(--accent-hover)" opacity="0.5" />
              </svg>
            </span>
            <p className="text-[15px] font-extrabold tracking-tight text-text-primary">
              FilesWow<span className="text-accent">.com</span>
            </p>
          </div>
          <p className="text-[13px] text-text-secondary max-w-md sm:text-right">
            {ALL_TOOLS.length} free PDF, Word &amp; image tools that run in your
            browser — <Link href="/transfer" className="underline decoration-border-strong underline-offset-2 hover:text-accent transition-colors">transfer files</Link> up to 50 GB device-to-device,{" "}
            <Link href="/blog" className="underline decoration-border-strong underline-offset-2 hover:text-accent transition-colors">read the blog</Link> for step-by-step tutorials, or{" "}
            <Link href="/contact" className="underline decoration-border-strong underline-offset-2 hover:text-accent transition-colors">contact us</Link> anytime.
          </p>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-8 gap-y-10">
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="caption font-bold text-text-tertiary uppercase tracking-wider mb-3.5">
                {col.heading}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-[13px] text-text-secondary hover:text-accent transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-7 mt-10 border-t border-border-base flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="caption font-medium text-text-tertiary">
            &copy; {new Date().getFullYear()} FilesWow.com — All rights reserved
          </p>
          <div className="flex items-center gap-3">
            <a
              href="https://www.producthunt.com/products/fileswow-com?embed=true&amp;utm_source=badge-featured&amp;utm_medium=badge&amp;utm_campaign=badge-fileswow-com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="FilesWow.com on Product Hunt"
            >
              <img
                alt="FilesWow.com - 100+ Free File Tools. No Uploads. 100% Private. | Product Hunt"
                width={250}
                height={54}
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1255284&amp;theme=light&amp;t=1789957273599"
                loading="lazy"
              />
            </a>
            <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold text-text-secondary bg-bg-elevated">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-60 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
              </span>
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
