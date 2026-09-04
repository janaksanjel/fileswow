import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t-2 border-border-strong bg-bg-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Links grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12 mb-10">
          <div>
            <h3 className="caption font-extrabold text-text-secondary uppercase tracking-wider mb-3">
              PDF Tools
            </h3>
            <ul className="space-y-1.5">
              {[
                ["Merge PDF", "/tools/merge-pdf"],
                ["Split PDF", "/tools/split-pdf"],
                ["Compress PDF", "/tools/compress-pdf"],
                ["PDF to Word", "/tools/pdf-to-word"],
                ["Watermark PDF", "/tools/watermark-pdf"],
                ["Protect PDF", "/tools/protect-pdf"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="body-sm text-text-secondary hover:text-text-primary transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="caption font-extrabold text-text-secondary uppercase tracking-wider mb-3">
              Word Tools
            </h3>
            <ul className="space-y-1.5">
              {[
                ["Word to PDF", "/tools/word-to-pdf"],
                ["Merge Word", "/tools/merge-word"],
                ["Word to Text", "/tools/word-to-text"],
                ["Word to HTML", "/tools/word-to-html"],
                ["Protect Word", "/tools/protect-word"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="body-sm text-text-secondary hover:text-text-primary transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="caption font-extrabold text-text-secondary uppercase tracking-wider mb-3">
              Convert
            </h3>
            <ul className="space-y-1.5">
              {[
                ["PDF to JPG", "/tools/pdf-to-jpg"],
                ["JPG to PDF", "/tools/jpg-to-pdf"],
                ["HTML to PDF", "/tools/html-to-pdf"],
                ["PDF to Text", "/tools/pdf-to-text"],
                ["Word to Markdown", "/tools/word-to-markdown"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="body-sm text-text-secondary hover:text-text-primary transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="caption font-extrabold text-text-secondary uppercase tracking-wider mb-3">
              Company
            </h3>
            <ul className="space-y-1.5">
              <li>
                <Link href="/about" className="body-sm text-text-secondary hover:text-text-primary transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/pdf-tools" className="body-sm text-text-secondary hover:text-text-primary transition-colors">
                  All PDF Tools
                </Link>
              </li>
              <li>
                <Link href="/word-tools" className="body-sm text-text-secondary hover:text-text-primary transition-colors">
                  All Word Tools
                </Link>
              </li>
              <li>
                <Link href="/image-tools" className="body-sm text-text-secondary hover:text-text-primary transition-colors">
                  All Image Tools
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="body-sm text-text-secondary hover:text-text-primary transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="body-sm text-text-secondary hover:text-text-primary transition-colors">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-5 border-t-2 border-border-strong flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="caption font-medium text-text-tertiary">
            &copy; {new Date().getFullYear()} FilesWow.com
          </p>
          <div className="flex items-center gap-3">
            <span className="caption font-medium text-text-tertiary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success border-2 border-border-strong" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
