import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl, jsonLdProps, TOOL_COUNT } from "@/lib/site";

export const metadata: Metadata = {
  title: "About — Free Private Document Tools",
  description:
    `Learn about FilesWow.com — ${TOOL_COUNT} free PDF, Word, and image tools that run entirely in your browser. Your files never leave your device.`,
  alternates: {
    canonical: absoluteUrl("/about"),
    languages: {
      "x-default": absoluteUrl("/about"),
    },
  },
  openGraph: {
    title: "About FilesWow.com",
    description: "Free, private document tools. Your files never leave your device.",
    url: absoluteUrl("/about"),
    type: "website",
  },
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About FilesWow.com",
    description:
      `FilesWow.com provides ${TOOL_COUNT} free PDF, Word, and image processing tools that run entirely in the browser.`,
    url: absoluteUrl("/about"),
  };

  return (
    <>
      <script {...jsonLdProps(jsonLd)} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <nav className="flex items-center gap-1.5 text-xs text-text-tertiary mb-5">
          <Link href="/" className="hover:text-text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-text-secondary">About</span>
        </nav>

        <header className="mb-8 pb-6 border-b border-border-base">
          <h1 className="heading-lg text-text-primary mb-2">
            About FilesWow.com
          </h1>
          <p className="body-md text-text-secondary max-w-2xl">
            A free suite of {TOOL_COUNT} document and image tools built on one core
            principle: your files should never leave your device.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6 body-md text-text-secondary leading-relaxed">
            <section>
              <h2 className="heading-md text-text-primary mb-2">
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
            </section>

            <section>
              <h2 className="heading-md text-text-primary mb-2">
                Our Technology
              </h2>
              <p>
                FilesWow is built with Next.js, React, and TypeScript. Document and
                image operations are powered by established open-source client-side
                libraries including pdf-lib, pdf.js, jsPDF, Mammoth.js, docx,
                SheetJS, JSZip, and the HTML5 Canvas API. Because processing happens
                on your device, speed and maximum file size depend on your browser
                and available memory.
              </p>
            </section>

            <section>
              <h2 className="heading-md text-text-primary mb-2">
                Our Mission
              </h2>
              <p>
                We believe everyone deserves access to powerful document tools
                without compromising their privacy. FilesWow exists to prove that
                privacy and functionality can coexist — that you don&apos;t need to
                upload your files to a server to get things done.
              </p>
            </section>
          </div>

          <aside className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-border-base bg-bg-surface p-5 space-y-4">
              <h2 className="heading-sm text-text-primary">
                What Makes FilesWow Different
              </h2>
              <ul className="space-y-3 text-[13.5px] text-text-secondary leading-relaxed">
                <li>
                  <strong className="text-text-primary block">Browser-Based Processing</strong>
                  Files are processed locally in your browser rather than uploaded to a
                  FilesWow storage server. (P2P Transfer pairs devices via a public
                  signaling broker before data flows directly; AI background removal
                  downloads model assets on first use.)
                </li>
                <li>
                  <strong className="text-text-primary block">No Account Required</strong>
                  Use any tool instantly without signing up or sharing contact details.
                </li>
                <li>
                  <strong className="text-text-primary block">Free to Use</strong>
                  No paywalls, forced watermarks, or subscription tiers.
                </li>
                <li>
                  <strong className="text-text-primary block">{TOOL_COUNT} Tools &amp; Guides</strong>
                  PDF, Word (DOCX), image, and text utilities plus step-by-step guides.
                </li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <Link href="/pdf-tools" className="btn-primary text-[13.5px]">
                PDF Tools
              </Link>
              <Link href="/word-tools" className="btn-secondary text-[13.5px]">
                Word Tools
              </Link>
              <Link href="/image-tools" className="btn-secondary text-[13.5px]">
                Image Tools
              </Link>
              <Link href="/contact" className="btn-secondary text-[13.5px]">
                Contact
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
