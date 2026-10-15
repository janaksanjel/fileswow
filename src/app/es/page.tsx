import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";
import HomePage from "../page";

export const metadata: Metadata = {
  title: "FilesWow.com — Herramientas gratuitas para PDF, Word e imágenes en línea",
  description:
    "180+ herramientas gratuitas para PDF, Word e imágenes. Une, divide, comprime y convierte documentos sin subir archivos. 100% privado en tu navegador.",
  alternates: {
    canonical: absoluteUrl("/es"),
  },
  openGraph: {
    title: "FilesWow.com — Herramientas gratuitas para PDF, Word e imágenes",
    description: "Tus archivos nunca salen de tu dispositivo. 100% privado, gratis y en tu navegador.",
    url: absoluteUrl("/es"),
    locale: "es_ES",
  },
};

export default HomePage;

