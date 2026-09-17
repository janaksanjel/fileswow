import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy policy for FilesWow.com. All file processing happens in your browser — files never leave your device. Learn about analytics and advertising cookies.",
  alternates: {
    canonical: "https://fileswow.com/privacy",
  },
};

export default function PrivacyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Privacy Policy — FilesWow.com",
    description: "Privacy policy for FilesWow.com. All file processing happens client-side.",
    url: "https://fileswow.com/privacy",
    dateModified: "2026-09-17",
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
          <span className="text-text-secondary">Privacy Policy</span>
        </nav>

        <div className="flex items-start gap-4 mb-6">
          <span className="hidden sm:block w-1.5 self-stretch rounded-full bg-gradient-to-b from-accent-light to-accent shrink-0" aria-hidden="true" />
          <h1 className="heading-xl text-text-primary">Privacy Policy</h1>
        </div>

        <div className="space-y-6 body-md text-text-secondary leading-relaxed">
          <p>
            <em>Last updated: September 17, 2026</em>
          </p>

          <h2 className="heading-md text-text-primary pt-4">Overview</h2>
          <p>
            FilesWow.com is built with privacy as its foundation. Our tools
            process all files directly in your web browser —{" "}
            <strong className="text-text-primary">
              your files never leave your device
            </strong>
            . We have designed the service to collect as little data as possible.
          </p>

          <h2 className="heading-md text-text-primary pt-4">
            File Processing
          </h2>
          <p>
            All file operations (merging, splitting, converting, compressing,
            editing, etc.) are performed entirely within your browser using
            client-side JavaScript and WebAssembly. Files are not uploaded to our
            servers at any point during processing.
          </p>

          <h2 className="heading-md text-text-primary pt-4">
            Data We Collect
          </h2>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong className="text-text-primary">No file data</strong> — We
              never see, store, or access your files.
            </li>
            <li>
              <strong className="text-text-primary">No personal information</strong>{" "}
              — We don&apos;t require accounts, email addresses, or any
              personally identifiable information.
            </li>
            <li>
              <strong className="text-text-primary">Local storage only</strong>{" "}
              — Settings like theme preference and your recently used tools are
              stored in your browser&apos;s localStorage, which never leaves
              your device.
            </li>
          </ul>

          <h2 className="heading-md text-text-primary pt-4">
            Third-Party Services
          </h2>
          <p>
            We use a small number of third-party services to operate and improve
            the site. These services may collect information such as your IP
            address, browser type, and pages visited.
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong className="text-text-primary">Google Analytics</strong> —
              We use Google Analytics to understand aggregate usage of the site
              (for example, which tool pages are visited). Google Analytics
              collects anonymous statistics and does not receive your files.
            </li>
            <li>
              <strong className="text-text-primary">Google AdSense</strong> —
              We display ads served by Google AdSense (publisher ID
              ca-pub-5534909600353741) to keep the site free. Google, as a
              third-party vendor, uses cookies (including the DART cookie) to
              serve ads based on your prior visits to this and other websites.
              Google&apos;s use of advertising cookies enables it and its
              partners to serve ads to you based on your visit to our site
              and/or other sites on the Internet.
            </li>
          </ul>
          <p>
            You may opt out of personalized advertising by visiting{" "}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-text-primary underline decoration-accent decoration-[3px] underline-offset-2 hover:bg-accent-subtle transition-colors"
            >
              Google Ads Settings
            </a>
            , and you can opt out of third-party vendor cookies for personalized
            advertising at{" "}
            <a
              href="https://www.aboutads.info/choices/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-text-primary underline decoration-accent decoration-[3px] underline-offset-2 hover:bg-accent-subtle transition-colors"
            >
              www.aboutads.info
            </a>
            . For more details on how Google uses data from sites that use its
            services, see{" "}
            <a
              href="https://policies.google.com/technologies/partner-sites"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-text-primary underline decoration-accent decoration-[3px] underline-offset-2 hover:bg-accent-subtle transition-colors"
            >
              Google&apos;s Privacy &amp; Terms
            </a>
            .
          </p>

          <h2 className="heading-md text-text-primary pt-4">Cookies</h2>
          <p>
            FilesWow.com itself does not set advertising or tracking cookies.
            All your preferences and tool history are stored locally in your
            browser using localStorage.
          </p>
          <p>
            However, third-party services we use — Google AdSense and Google
            Analytics — may set their own cookies in your browser when you visit
            this site. These cookies are governed by Google&apos;s privacy
            policy, not ours. You can block or delete these cookies through your
            browser settings; the tools on this site will continue to work
            normally without them.
          </p>

          <h2 className="heading-md text-text-primary pt-4">
            Changes to This Policy
          </h2>
          <p>
            We may update this privacy policy from time to time. Any changes
            will be reflected on this page with an updated date.
          </p>

          <h2 className="heading-md text-text-primary pt-4">Contact</h2>
          <p>
            If you have questions about this privacy policy, please contact us
            at{" "}
            <a
              href="mailto:privacy@fileswow.com"
              className="font-bold text-text-primary underline decoration-accent decoration-[3px] underline-offset-2 hover:bg-accent-subtle transition-colors"
            >
              privacy@fileswow.com
            </a>
            .
          </p>
        </div>
      </div>
    </>
  );
}
