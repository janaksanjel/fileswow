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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <nav className="flex items-center gap-1.5 text-xs text-text-tertiary mb-8">
          <Link href="/" className="hover:text-text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-text-secondary">About</span>
        </nav>

        <h1 className="heading-xl text-text-primary mb-8">
          About FilesWow.com
        </h1>

        <div className="space-y-6 body-md text-text-secondary leading-relaxed">
          <p>
            <strong className="text-text-primary">FilesWow.com</strong> is a
            free suite of {TOOL_COUNT} document and image processing tools designed to
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
              <strong className="text-text-primary">Browser-Based Processing</strong> — For
              our PDF, Word, and image editing tools, files are processed locally
              in your browser rather than uploaded to a FilesWow storage server.
              (For P2P File Transfer, a public signaling broker helps pair two
              devices before data flows peer-to-peer; AI background removal
              downloads model assets on first use.)
            </li>
            <li>
              <strong className="text-text-primary">No Account Required</strong>{" "}
              — Use any tool instantly without signing up or sharing personal
              contact details.
            </li>
            <li>
              <strong className="text-text-primary">Free to Use</strong> — No
              paywalls, forced watermarks, or subscription tiers.
            </li>
            <li>
              <strong className="text-text-primary">{TOOL_COUNT} Tools in One Place</strong> — PDF,
              Word (DOCX), image, and text utilities organized by task, plus
              step-by-step educational guides.
            </li>
          </ul>

          <h2 className="heading-md text-text-primary pt-4">
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

          <h2 className="heading-md text-text-primary pt-4">
            Our Mission
          </h2>
          <p>
            We believe everyone deserves access to powerful document tools
            without compromising their privacy. FilesWow exists to prove that
            privacy and functionality can coexist — that you don&apos;t need to
            upload your files to a server to get things done.
          </p>

          <div className="pt-4 flex flex-wrap gap-3">
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
