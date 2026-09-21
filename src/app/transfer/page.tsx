import type { Metadata } from "next";
import { absoluteUrl, jsonLdProps } from "@/lib/site";

const SITE_URL = absoluteUrl("/");
import { TransferClient } from "./transfer-client";

const PAGE_URL = absoluteUrl("/transfer");
const SITE_NAME = "FilesWow.com";

// Primary keyword cluster: "send files online / file transfer" head terms,
// plus long-tails for "without app", "large files", "phone to PC" intent.
const TITLE = "Send Files Online Free — P2P File Transfer Up to 50 GB, No Upload";
const DESCRIPTION =
  "Free file transfer up to 50 GB. Send files directly between devices with a 6-digit code or QR — peer-to-peer, end-to-end encrypted, no upload, no sign-up, no app. Works on phone, tablet & PC.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    // Head terms
    "file transfer",
    "send files online",
    "send files free",
    "share files online",
    // High-intent / feature long-tails
    "send large files free",
    "transfer files up to 50gb",
    "send files without uploading",
    "send files without app",
    "p2p file transfer",
    "webrtc file sharing",
    "direct file transfer device to device",
    // Use-case long-tails
    "transfer files from phone to pc",
    "send files from android to iphone",
    "send photos from phone to computer",
    "transfer videos without losing quality",
    // Trust / comparison modifiers
    "encrypted file transfer",
    "secure file sharing free",
    "no sign up file transfer",
    "send files with code",
    "send files qr code",
    "send anywhere alternative",
    "wetransfer alternative free",
    "fileswow transfer",
  ],
  alternates: {
    canonical: PAGE_URL,
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
  category: "technology",
  openGraph: {
    title: `${TITLE} | ${SITE_NAME}`,
    description: DESCRIPTION,
    url: PAGE_URL,
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    // Inherits the site-wide generated OG image from src/app/opengraph-image.tsx
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const webAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "FilesWow File Transfer",
  url: PAGE_URL,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  description: DESCRIPTION,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  browserRequirements: "Requires a modern web browser with WebRTC support",
  featureList: [
    "Peer-to-peer transfer up to 50 GB",
    "6-digit pairing code that expires in 10 minutes",
    "QR code and shareable invite link",
    "End-to-end encrypted (DTLS) — files never touch a server",
    "Streaming to disk for files larger than RAM",
    "Works across Android, iPhone, Windows, Mac and Linux",
  ],
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: SITE_URL,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "File Transfer",
      item: PAGE_URL,
    },
  ],
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to send files online without uploading them",
  description: DESCRIPTION,
  totalTime: "PT2M",
  tool: [{ "@type": "HowToTool", name: "A web browser on each device" }],
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Add files",
      text: "Click the upload area (or drag & drop) and pick the files you want to send — up to 50 GB total.",
      url: `${PAGE_URL}#send`,
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Share the 6-digit code",
      text: "A 6-digit code, QR code, and invite link appear. Share them with the receiving device by any channel.",
      url: `${PAGE_URL}#send`,
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Receive on the other device",
      text: "On the receiving device, open this page, enter the 6-digit code, choose where to save, and the files transfer directly — device to device.",
      url: `${PAGE_URL}#receive`,
    },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Are my files uploaded to a server?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Files travel directly between the two devices over an encrypted peer-to-peer connection. The only thing our infrastructure handles is the one-time handshake that introduces the two devices — file bytes never touch any server and nothing is ever stored.",
      },
    },
    {
      "@type": "Question",
      name: "How large can the files be?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Up to 50 GB per transfer when the receiving browser supports streaming to disk (Chrome, Edge, Opera). Browsers without the File System Access API buffer in memory, which limits practical size to available RAM.",
      },
    },
    {
      "@type": "Question",
      name: "How long is the 6-digit code valid?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "10 minutes, or until the transfer completes — whichever comes first. When it expires you can generate a fresh code in one click.",
      },
    },
    {
      "@type": "Question",
      name: "Is the transfer secure?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. WebRTC data channels are always encrypted with DTLS 1.2+, so the bytes are unreadable to the signaling broker, network operators, and anyone in between. Only someone holding the 6-digit code can pair with your device.",
      },
    },
    {
      "@type": "Question",
      name: "Do both devices need to be online at the same time?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. This is a direct device-to-device transfer, not a cloud upload. Both devices must keep the page open until the transfer finishes; closing the page ends the transfer.",
      },
    },
    {
      "@type": "Question",
      name: "Can I transfer files from my phone to my PC?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — that's one of the most common uses. Open fileswow.com/transfer in a browser on both devices, add files on the phone, and enter the 6-digit code on the PC. No cables, no apps, and no accounts are needed.",
      },
    },
  ],
};

export default function TransferPage() {
  return (
    <>
      <script {...jsonLdProps(webAppJsonLd)} />
      <script {...jsonLdProps(breadcrumbJsonLd)} />
      <script {...jsonLdProps(howToJsonLd)} />
      <script {...jsonLdProps(faqJsonLd)} />
      <TransferClient />
    </>
  );
}
