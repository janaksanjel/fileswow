import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — FilesWow.com",
  description:
    "Terms of service for FilesWow.com. Learn about the usage terms for our free online document tools.",
  alternates: {
    canonical: "https://fileswow.com/terms",
  },
};

export default function TermsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Terms of Service — FilesWow.com",
    description: "Terms of service for FilesWow.com.",
    url: "https://fileswow.com/terms",
    dateModified: "2025-01-01",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <nav className="flex items-center gap-1.5 text-xs text-text-tertiary mb-8">
          <Link href="/" className="hover:text-text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-text-secondary">Terms of Service</span>
        </nav>

        <div className="flex items-start gap-4 mb-6">
          <span className="hidden sm:flex w-4 self-stretch bg-accent border-2 border-border-strong shadow-[3px_3px_0_var(--shadow-color)] shrink-0" aria-hidden="true" />
          <h1 className="heading-xl text-text-primary">
            Terms of Service
          </h1>
        </div>

        <div className="space-y-6 body-md text-text-secondary leading-relaxed">
          <p>
            <em>Last updated: January 1, 2025</em>
          </p>

          <h2 className="heading-md text-text-primary pt-4">
            Acceptance of Terms
          </h2>
          <p>
            By accessing or using FilesWow.com, you agree to be bound by these
            Terms of Service. If you do not agree, do not use the service.
          </p>

          <h2 className="heading-md text-text-primary pt-4">
            Description of Service
          </h2>
          <p>
            FilesWow.com provides free, client-side document and image
            processing tools that run entirely in your web browser. All
            processing happens locally on your device.
          </p>

          <h2 className="heading-md text-text-primary pt-4">
            Acceptable Use
          </h2>
          <p>You agree not to:</p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              Use the service for any illegal purpose or in violation of any
              applicable laws.
            </li>
            <li>
              Attempt to reverse-engineer, decompile, or extract the source code
              of the service.
            </li>
            <li>
              Use automated systems or bots to access or use the service.
            </li>
            <li>
              Interfere with or disrupt the service or its infrastructure.
            </li>
          </ul>

          <h2 className="heading-md text-text-primary pt-4">
            Intellectual Property
          </h2>
          <p>
            The FilesWow.com website, including its design, code, and content,
            is protected by copyright and other intellectual property laws. The
            tool functionality and processing libraries used are open-source and
            subject to their respective licenses.
          </p>

          <h2 className="heading-md text-text-primary pt-4">
            Disclaimer of Warranties
          </h2>
          <p>
            FilesWow.com is provided &quot;as is&quot; and &quot;as
            available&quot; without warranties of any kind, either express or
            implied. We do not guarantee that the service will be uninterrupted,
            error-free, or completely secure.
          </p>

          <h2 className="heading-md text-text-primary pt-4">
            Limitation of Liability
          </h2>
          <p>
            In no event shall FilesWow.com be liable for any indirect,
            incidental, special, consequential, or punitive damages arising out
            of or related to your use of the service.
          </p>

          <h2 className="heading-md text-text-primary pt-4">
            Changes to Terms
          </h2>
          <p>
            We reserve the right to modify these terms at any time. Changes
            will be effective upon posting. Continued use of the service after
            changes constitutes acceptance of the updated terms.
          </p>

          <h2 className="heading-md text-text-primary pt-4">Contact</h2>
          <p>
            Questions about these terms? Contact us at{" "}
            <a
              href="mailto:legal@fileswow.com"
              className="font-bold text-text-primary underline decoration-accent decoration-[3px] underline-offset-2 hover:bg-accent-subtle transition-colors"
            >
              legal@fileswow.com
            </a>
            .
          </p>
        </div>
      </div>
    </>
  );
}
