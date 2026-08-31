import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { FloatingActionButton } from "@/components/fab";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "FilesWow.com — Free PDF & Word Tools Online",
    template: "%s | FilesWow.com",
  },
  description:
    "100+ free PDF and Word tools. Merge, split, compress, convert, and edit documents — entirely in your browser. No upload required. 100% private and secure.",
  keywords: [
    "PDF tools",
    "Word tools",
    "merge PDF",
    "split PDF",
    "compress PDF",
    "PDF to Word",
    "Word to PDF",
    "free online PDF editor",
    "no upload PDF tools",
    "client-side PDF",
    "FilesWow",
    "FilesWow.com",
    "free document tools",
    "online PDF converter",
  ],
  openGraph: {
    title: "FilesWow.com — Free PDF & Word Tools Online",
    description:
      "100+ free PDF and Word tools. Your files never leave your device.",
    type: "website",
    siteName: "FilesWow.com",
    url: "https://fileswow.com",
  },
  metadataBase: new URL("https://fileswow.com"),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t)}else if(window.matchMedia&&window.matchMedia('(prefers-color-scheme:light)').matches){document.documentElement.setAttribute('data-theme','light')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-screen bg-bg-base text-text-primary antialiased">
        <ThemeProvider>
          <Header />
          <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
          <Footer />
          <FloatingActionButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
