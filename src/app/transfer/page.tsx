import type { Metadata } from "next";
import { TransferClient } from "./transfer-client";

const SITE_URL = "https://fileswow.com";
const PAGE_URL = `${SITE_URL}/transfer`;
const TITLE = "P2P File Transfer — Send Files Up to 50 GB Free";
const DESCRIPTION =
  "Send files directly between devices with a 6-digit code or QR. Peer-to-peer, end-to-end encrypted, up to 50 GB. No uploads, no accounts — files never touch a server.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "file transfer",
    "send files online",
    "p2p file transfer",
    "send large files free",
    "transfer files 50GB",
    "send files with code",
    "webrtc file sharing",
    "send files qr code",
    "no upload file transfer",
    "encrypted file transfer",
    "alternative to send anywhere",
    "fileswow transfer",
  ],
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    title: `${TITLE} | FilesWow.com`,
    description: DESCRIPTION,
    url: PAGE_URL,
    type: "website",
    siteName: "FilesWow.com",
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
  ],
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to send files with a 6-digit code",
  description: DESCRIPTION,
  totalTime: "PT2M",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Add files",
      text: "Click the upload area (or drag & drop) and pick the files you want to send — up to 50 GB total.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Share the 6-digit code",
      text: "A 6-digit code, QR code, and invite link appear. Share them with the receiving device by any channel.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Receive on the other device",
      text: "On the receiving device, open this page, enter the 6-digit code below, choose where to save, and the files transfer directly — device to device.",
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
  ],
};

export default function TransferPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <TransferClient />
    </>
  );
}
