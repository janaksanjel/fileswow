import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border-base bg-bg-surface/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Top: brand + tagline */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md flex items-center justify-center bg-accent">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <span className="text-sm font-bold text-text-primary">
              Files<span className="text-accent">Wow</span>.com
            </span>
          </div>
          <p className="body-sm text-text-secondary max-w-md leading-relaxed">
            Free PDF and Word tools that run entirely in your browser.
            No uploads. No accounts. No tracking.
          </p>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12 mb-10">
          <div>
            <h3 className="caption font-semibold text-text-tertiary uppercase tracking-wider mb-3">
              PDF Tools
            </h3>
            <ul className="space-y-2">
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
            <h3 className="caption font-semibold text-text-tertiary uppercase tracking-wider mb-3">
              Word Tools
            </h3>
            <ul className="space-y-2">
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
            <h3 className="caption font-semibold text-text-tertiary uppercase tracking-wider mb-3">
              Convert
            </h3>
            <ul className="space-y-2">
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
            <h3 className="caption font-semibold text-text-tertiary uppercase tracking-wider mb-3">
              Resources
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="body-sm text-text-secondary hover:text-text-primary transition-colors">
                  About Us
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
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="body-sm text-text-secondary hover:text-text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-border-base flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="caption text-text-tertiary">
            &copy; {new Date().getFullYear()} FilesWow.com. All processing happens in your browser.
          </p>
          <div className="flex items-center gap-4">
            <span className="caption text-text-tertiary flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
