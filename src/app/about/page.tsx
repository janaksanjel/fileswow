import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About FilesWow.com — Free Private Document Tools",
  description:
    "Learn about FilesWow.com — 100+ free PDF, Word, and image tools that run entirely in your browser. Your files never leave your device.",
  alternates: {
    canonical: "https://fileswow.com/about",
  },
  openGraph: {
    title: "About FilesWow.com",
    description: "Free, private document tools. Your files never leave your device.",
    url: "https://fileswow.com/about",
    type: "website",
  },
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About FilesWow.com",
    description:
      "FilesWow.com provides 100+ free PDF, Word, and image processing tools that run entirely in the browser.",
    url: "https://fileswow.com/about",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-text-tertiary mb-8">
          <Link href="/" className="hover:text-text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-text-secondary">About</span>
        </nav>

        <h1 className="heading-xl text-text-primary mb-6">
          About FilesWow.com
        </h1>

        <div className="space-y-6 body-md text-text-secondary leading-relaxed">
          <p>
            <strong className="text-text-primary">FilesWow.com</strong> is a
            free suite of 100+ document and image processing tools designed to
            work entirely in your web browser. We built FilesWow with one core
            principle: <strong className="text-text-primary">your files should
            never leave your device</strong>.
          </p>

          <h2 className="heading-md text-text-primary pt-4">
            Why Client-Side Processing?
          </h2>
          <p>
            Most online document tools require you to upload files to their
            servers. This creates privacy concerns, especially when dealing with
            sensitive documents like contracts, financial records, or personal
            photos. FilesWow takes a different approach — every operation, from
            merging PDFs to removing image backgrounds, runs directly in your
            browser using modern web technologies like WebAssembly and the Canvas
            API.
          </p>

          <h2 className="heading-md text-text-primary pt-4">
            What Makes FilesWow Different?
          </h2>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong className="text-text-primary">100% Private</strong> — No
              files are ever uploaded to any server. Processing happens locally.
            </li>
            <li>
              <strong className="text-text-primary">No Account Required</strong>{" "}
              — Use any tool instantly without signing up.
            </li>
            <li>
              <strong className="text-text-primary">Free Forever</strong> — No
              hidden fees, no premium tiers, no limitations.
            </li>
            <li>
              <strong className="text-text-primary">180+ Tools</strong> — PDF,
              Word, and image processing tools all in one place.
            </li>
            <li>
              <strong className="text-text-primary">Works Offline</strong> — Once
              loaded, tools can work without an internet connection.
            </li>
          </ul>

          <h2 className="heading-md text-text-primary pt-4">
            Our Technology
          </h2>
          <p>
            FilesWow is built with Next.js, React, and TypeScript. We leverage
            industry-standard libraries like pdf-lib, Mammoth.js, SheetJS, and
            Tesseract.js to provide reliable document processing. All processing
            happens client-side, using WebAssembly modules and JavaScript APIs
            that modern browsers support natively.
          </p>

          <h2 className="heading-md text-text-primary pt-4">
            Our Mission
          </h2>
          <p>
            We believe everyone deserves access to powerful document tools
            without compromising their privacy. FilesWow exists to prove that
            privacy and functionality can coexist — that you don&apos;t need to
            upload your files to a server to get things done.
          </p>

          <div className="pt-6 flex flex-wrap gap-3">
            <Link href="/pdf-tools" className="btn-primary">
              Browse PDF Tools
            </Link>
            <Link href="/word-tools" className="btn-secondary">
              Browse Word Tools
            </Link>
            <Link href="/image-tools" className="btn-secondary">
              Browse Image Tools
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
