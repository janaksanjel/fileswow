import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl, jsonLdProps } from "@/lib/site";

export const metadata: Metadata = {
  title: "Disclaimer",
  description:
    "Disclaimer for FilesWow.com. Understand the limitations of automated browser-based document tools and your responsibility to verify important output.",
  alternates: {
    canonical: absoluteUrl("/disclaimer"),
    languages: {
      "x-default": absoluteUrl("/disclaimer"),
    },
  },
  openGraph: {
    title: "Disclaimer — FilesWow.com",
    description:
      "Limitations of automated browser-based document tools and user verification responsibilities.",
    url: absoluteUrl("/disclaimer"),
    type: "website",
  },
};

export default function DisclaimerPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Disclaimer — FilesWow.com",
    description:
      "Disclaimer for FilesWow.com covering automated document-processing limitations and output verification.",
    url: absoluteUrl("/disclaimer"),
    dateModified: "2026-11-12",
  };

  return (
    <>
      <script {...jsonLdProps(jsonLd)} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <nav
          className="flex items-center gap-1.5 text-xs text-text-tertiary mb-8"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-text-secondary">Disclaimer</span>
        </nav>

        <h1 className="heading-xl text-text-primary mb-6">Disclaimer</h1>

        <div className="space-y-6 body-md text-text-secondary leading-relaxed">
          <p>
            <em>Last updated: November 12, 2026</em>
          </p>

          <h2 className="heading-md text-text-primary pt-4">
            Automated Document-Processing Limitations
          </h2>
          <p>
            FilesWow.com provides free, automated, browser-based utilities for
            working with PDF, Word (DOCX), image, and text files. While we test
            and maintain these tools for everyday reliability, automated format
            conversions, compression, and layout edits are best-effort
            operations. Complex layouts, embedded fonts, tables, vector
            graphics, scanned documents, or non-standard files may shift, lose
            formatting, or produce unexpected results.
          </p>

          <h2 className="heading-md text-text-primary pt-4">
            Verify Important Output Before Use
          </h2>
          <p>
            You are solely responsible for reviewing and verifying any output
            file before relying on it, printing it, submitting it to an
            organization, or sharing it with others. Always keep a backup copy
            of your original files before modifying, compressing, redacting, or
            converting them.
          </p>
          <p>
            In particular, for legal contracts, tax filings, medical records,
            academic submissions, or high-resolution print production, inspect
            every page of the generated file carefully to confirm that text,
            numbers, signatures, redactions, and margins remain accurate and
            complete.
          </p>

          <h2 className="heading-md text-text-primary pt-4">
            Not Legal, Financial, or Professional Advice
          </h2>
          <p>
            The educational articles, guides, and FAQs published on
            FilesWow.com are provided for general informational purposes only.
            Nothing on this website constitutes legal, compliance, security, or
            professional advice. For example, electronic signature tools and
            redaction utilities help you modify PDFs, but whether a document
            meets a specific jurisdiction&apos;s legal or regulatory standard
            depends on your own requirements and professional counsel.
          </p>

          <h2 className="heading-md text-text-primary pt-4">
            Browser &amp; Device Constraints
          </h2>
          <p>
            Because processing runs inside your web browser, performance and
            maximum file size depend on your device&apos;s available memory,
            CPU, and browser version. Very large files or multi-hundred-page
            scans may slow down or fail on memory-constrained devices.
          </p>

          <h2 className="heading-md text-text-primary pt-4">
            External Links &amp; Third-Party Services
          </h2>
          <p>
            FilesWow.com may include links to external websites or use
            third-party services (such as Google Analytics, Google AdSense, or
            PeerJS WebRTC signaling for P2P transfer). We do not control and are
            not responsible for the content, availability, or practices of
            external sites.
          </p>

          <div className="pt-4 flex flex-wrap gap-4 text-[13.5px]">
            <Link
              href="/terms"
              className="font-semibold text-accent hover:underline underline-offset-2"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="font-semibold text-accent hover:underline underline-offset-2"
            >
              Privacy Policy
            </Link>
            <Link
              href="/contact"
              className="font-semibold text-accent hover:underline underline-offset-2"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
