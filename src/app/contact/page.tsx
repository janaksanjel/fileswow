import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl, jsonLdProps } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact FilesWow.com — questions, bug reports, feedback, privacy requests, or business inquiries. We reply to most messages within 1–2 business days.",
  alternates: {
    canonical: absoluteUrl("/contact"),
    languages: {
      "x-default": absoluteUrl("/contact"),
    },
  },
  openGraph: {
    title: "Contact FilesWow.com",
    description:
      "Questions, bug reports, feedback, or business inquiries — get in touch with the FilesWow.com team.",
    url: absoluteUrl("/contact"),
    type: "website",
  },
};

const CONTACT_CARDS: Array<{
  title: string;
  description: string;
  email: string;
  subject: string;
  icon: React.ReactNode;
}> = [
  {
    title: "General & Support",
    description:
      "Questions about how a tool works, something not behaving as expected, or feedback on the site. Most messages get a reply within 1–2 business days.",
    email: "support@fileswow.com",
    subject: "General question",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    title: "Bug Reports",
    description:
      "Found a tool that failed on a specific file? Tell us the tool name, your browser, and what happened — a screenshot or the error message helps us fix it fast.",
    email: "support@fileswow.com",
    subject: "Bug report",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="8" y="6" width="8" height="14" rx="4" />
        <path d="M19 7l-3 2M5 7l3 2M19 19l-3-2M5 19l3-2M12 20v-4" />
        <path d="M8 6a4 4 0 0 1 8 0" />
      </svg>
    ),
  },
  {
    title: "Privacy Requests",
    description:
      "Questions or requests about personal data under GDPR/CCPA — including access, correction, or deletion requests. See the Privacy Policy for what little we collect.",
    email: "privacy@fileswow.com",
    subject: "Privacy request",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Legal & Copyright",
    description:
      "Terms-of-service questions, DMCA takedown notices, or intellectual-property concerns. We take copyright seriously and respond to valid notices promptly.",
    email: "legal@fileswow.com",
    subject: "Legal inquiry",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3v18M5 7c4-3 10-3 14 0M5 17c4 3 10 3 14 0" />
        <path d="M4 21h16" opacity="0.4" />
      </svg>
    ),
  },
];

export default function ContactPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact FilesWow.com",
    description: "Contact options for FilesWow.com — support, privacy, and legal.",
    url: absoluteUrl("/contact"),
  };

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "FilesWow.com",
    url: absoluteUrl("/"),
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "support@fileswow.com",
        availableLanguage: "English",
      },
      {
        "@type": "ContactPoint",
        contactType: "legal",
        email: "legal@fileswow.com",
        availableLanguage: "English",
      },
    ],
  };

  return (
    <>
      <script {...jsonLdProps(jsonLd)} />
      <script {...jsonLdProps(orgJsonLd)} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <nav className="flex items-center gap-1.5 text-xs text-text-tertiary mb-8">
          <Link href="/" className="hover:text-text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-text-secondary">Contact</span>
        </nav>

        <div className="flex items-start gap-4 mb-6">
          <span
            className="hidden sm:block w-1.5 self-stretch rounded-full bg-gradient-to-b from-accent-light to-accent shrink-0"
            aria-hidden="true"
          />
          <h1 className="heading-xl text-text-primary">Contact us</h1>
        </div>

        <p className="body-lg text-text-secondary max-w-xl mb-10">
          FilesWow is built and maintained by a small team. Whether it&apos;s a
          question, a bug, a privacy request, or a business inquiry — we read
          every message and reply to most within 1–2 business days.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 mb-10">
          {CONTACT_CARDS.map((card) => (
            <a
              key={card.title}
              href={`mailto:${card.email}?subject=${encodeURIComponent(`[FilesWow] ${card.subject}`)}`}
              className="group card p-5 hover:border-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="w-10 h-10 rounded-xl bg-accent-subtle text-accent flex items-center justify-center shrink-0">
                  {card.icon}
                </span>
                <h2 className="text-[15px] font-bold text-text-primary">{card.title}</h2>
              </div>
              <p className="text-[13px] leading-relaxed text-text-secondary mb-3">
                {card.description}
              </p>
              <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent group-hover:underline underline-offset-2">
                {card.email}
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </a>
          ))}
        </div>

        <section className="mb-10 p-5 sm:p-6 rounded-2xl bg-bg-surface border border-border-base">
          <h2 className="heading-md text-text-primary mb-3">Before you write</h2>
          <ul className="space-y-2.5 body-md text-text-secondary">
            <li className="flex items-start gap-2.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent shrink-0 mt-1" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>
                <strong className="text-text-primary">We can&apos;t see your files.</strong>{" "}
                Everything runs in your browser — there is no server copy of
                your document, so we can&apos;t recover a file or see what you
                processed. If a tool failed, we&apos;ll ask for the tool name,
                browser, and what you saw.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent shrink-0 mt-1" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>
                <strong className="text-text-primary">Check the FAQ</strong> on
                the tool&apos;s page first — most how-does-this-work questions
                are answered right there.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent shrink-0 mt-1" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>
                <strong className="text-text-primary">Copyright notices:</strong>{" "}
                send DMCA notices to{" "}
                <a href="mailto:legal@fileswow.com" className="font-semibold text-text-primary underline decoration-accent underline-offset-2 hover:bg-accent-subtle transition-colors">
                  legal@fileswow.com
                </a>{" "}
                with the work&apos;s identification, the URL in question, and
                your contact details.
              </span>
            </li>
          </ul>
        </section>

        <p className="text-[13px] text-text-secondary">
          Prefer the policies? Read the{" "}
          <Link href="/privacy" className="font-semibold text-accent hover:underline underline-offset-2">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className="font-semibold text-accent hover:underline underline-offset-2">
            Terms of Service
          </Link>
          .
        </p>
      </div>
    </>
  );
}
