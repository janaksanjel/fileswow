import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";
import HomePage from "../page";

export const metadata: Metadata = {
  title: "FilesWow.com — Ferramentas gratuitas de PDF, Word e imagens online",
  description:
    "180+ ferramentas gratuitas de PDF, Word e imagens. Junte, divida, comprima e converta documentos sem enviar ficheiros. 100% privado no navegador.",
  alternates: {
    canonical: absoluteUrl("/pt"),
  },
  openGraph: {
    title: "FilesWow.com — Ferramentas gratuitas de PDF, Word e imagens",
    description: "Os seus ficheiros nunca saem do seu dispositivo. 100% privado, grátis e no seu navegador.",
    url: absoluteUrl("/pt"),
    locale: "pt_PT",
  },
};

export default HomePage;

