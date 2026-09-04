import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { FloatingActionButton } from "@/components/fab";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0f15" },
    { media: "(prefers-color-scheme: light)", color: "#f5f7fa" },
  ],
};

const SITE_URL = "https://fileswow.com";
const SITE_NAME = "FilesWow.com";
const OG_IMAGE = `${SITE_URL}/og-image.png`;

export const metadata: Metadata = {
  title: {
    default: "FilesWow.com — Free PDF, Word & Image Tools Online",
    template: "%s | FilesWow.com",
  },
  description:
    "100+ free PDF, Word, and image tools. Merge, split, compress, convert, edit, and transform documents — entirely in your browser. No upload required. 100% private.",
  keywords: [
    "free PDF tools",
    "online PDF editor",
    "merge PDF free",
    "split PDF online",
    "compress PDF",
    "PDF to Word",
    "Word to PDF",
    "free online PDF converter",
    "no upload PDF tools",
    "client-side PDF editor",
    "private PDF tools no server",
    "free Word document converter",
    "online image editor free",
    "convert JPG to PDF online",
    "PDF watermark free online",
    "OCR PDF free browser",
    "remove background image free",
    "FilesWow",
    "FilesWow.com",
    "fileswow free tools",
    "free document tools online",
    "PDF tools no registration",
    "Word to HTML converter",
    "image compress online free",
    "batch file converter free",
  ],
  authors: [{ name: "FilesWow.com" }],
  creator: "FilesWow.com",
  publisher: "FilesWow.com",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "FilesWow.com — Free PDF, Word & Image Tools Online",
    description:
      "100+ free PDF, Word, and image tools. Your files never leave your device. No upload. No account. No tracking.",
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "FilesWow.com — Free PDF & Word Tools Online",
        type: "image/png",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "FilesWow.com — Free PDF, Word & Image Tools Online",
    description:
      "100+ free PDF, Word, and image tools. No upload required. 100% private.",
    images: [OG_IMAGE],
    creator: "@fileswow",
    site: "@fileswow",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "FilesWow.com",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      "Free PDF, Word, and image tools that run entirely in your browser. No uploads, no accounts, no tracking.",
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      availableLanguage: "English",
    },
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "FilesWow.com",
    url: SITE_URL,
    description: "100+ free PDF, Word, and image tools. Processed entirely in your browser.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "FilesWow.com",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web Browser",
    url: SITE_URL,
    description: "100+ free PDF, Word, and image processing tools. Client-side, private, no upload required.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "1250",
      bestRating: "5",
      worstRating: "1",
    },
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t)}else if(window.matchMedia&&window.matchMedia('(prefers-color-scheme:dark)').matches){document.documentElement.setAttribute('data-theme','dark')}}catch(e){}})()`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-RGZ4FLC926" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-RGZ4FLC926');`,
          }}
        />
      </head>
      <body className="min-h-screen bg-bg-base text-text-primary antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-bg-surface focus:text-text-primary focus:ring-2 focus:ring-accent"
        >
          Skip to content
        </a>
        <ThemeProvider>
          <Header />
          <main className="min-h-[calc(100vh-3rem)]" id="main-content">{children}</main>
          <Footer />
          <FloatingActionButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
