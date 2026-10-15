import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";
import HomePage from "../page";

export const metadata: Metadata = {
  title: "FilesWow.com — Free PDF, Word & Image Tools Online",
  description:
    "180+ free PDF, Word, and image tools. Merge, split, compress, convert, edit, and transform documents — entirely in your browser. No upload required. 100% private.",
  alternates: {
    canonical: absoluteUrl("/en"),
  },
  openGraph: {
    title: "FilesWow.com — Free PDF, Word & Image Tools Online",
    description: "Your files never leave your device. No upload. No account. No tracking.",
    url: absoluteUrl("/en"),
    locale: "en_US",
  },
};

export default HomePage;

