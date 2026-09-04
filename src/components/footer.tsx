import Link from "next/link";
import { ALL_TOOLS } from "@/lib/catalog";

const COLUMNS: Array<{ heading: string; links: Array<[string, string]> }> = [
  {
    heading: "PDF Tools",
    links: [
      ["Merge PDF", "/tools/merge-pdf"],
      ["Split PDF", "/tools/split-pdf"],
      ["Compress PDF", "/tools/compress-pdf"],
      ["PDF to Word", "/tools/pdf-to-word"],
      ["Watermark PDF", "/tools/watermark-pdf"],
      ["Protect PDF", "/tools/protect-pdf"],
    ],
  },
  {
    heading: "Word Tools",
    links: [
      ["Word to PDF", "/tools/word-to-pdf"],
      ["Merge Word", "/tools/merge-word"],
      ["Word to Text", "/tools/word-to-text"],
      ["Word to HTML", "/tools/word-to-html"],
      ["Protect Word", "/tools/protect-word"],
    ],
  },
  {
    heading: "Image Tools",
    links: [
      ["Compress Image", "/tools/compress-image"],
      ["Resize Image", "/tools/resize-image"],
      ["Crop Image", "/tools/crop-image"],
      ["JPG to PNG", "/tools/jpg-to-png"],
      ["Remove Background", "/tools/background-remove-image"],
    ],
  },
  {
    heading: "Convert",
    links: [
      ["PDF to JPG", "/tools/pdf-to-jpg"],
      ["JPG to PDF", "/tools/jpg-to-pdf"],
      ["HTML to PDF", "/tools/html-to-pdf"],
      ["PDF to Text", "/tools/pdf-to-text"],
      ["Word to Markdown", "/tools/word-to-markdown"],
    ],
  },
  {
    heading: "Company",
    links: [
      ["About", "/about"],
      ["All PDF Tools", "/pdf-tools"],
      ["All Word Tools", "/word-tools"],
      ["All Image Tools", "/image-tools"],
      ["All Text Tools", "/text-tools"],
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
            {ALL_TOOLS.length} free PDF, Word &amp; image tools. Your files never leave your device.
          </p>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-8 gap-y-10">
          {COLUMNS.map((col) => (
            <div key={col.heading} className={col.heading === "Company" ? "col-span-2 sm:col-span-1" : ""}>
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
