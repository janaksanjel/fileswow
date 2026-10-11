"use client";

/**
 * Lightweight client-side i18n for the site chrome.
 *
 * Scope (phase 1): header, footer, and homepage section headings/copy.
 * Tool names, tool descriptions, and FAQ answers stay in English — they
 * live in the catalog and would need a far bigger translation pass.
 *
 * Dictionaries are partial for non-English locales; any missing key falls
 * back to English so a locale is never "half broken".
 *
 * Interpolation: values may contain {tokens}; call t("key")
 * .replace("{token}", value) at the call site.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Locale = "en" | "es" | "pt";

export const LOCALES: ReadonlyArray<{ code: Locale; label: string; flag: string }> = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
];

/* ─── English base — the source of truth for keys ─────────────── */

const en = {
  // Header
  "nav.search": "Search",
  "nav.transfer": "Transfer Files",
  "nav.blogGuides": "Blog & guides",
  "nav.viewAll": "View all",
  "nav.privacyNote": "Every tool runs in your browser — files never upload.",
  "nav.lightMode": "Light mode",
  "nav.darkMode": "Dark mode",

  // Footer
  "footer.tagline":
    "Your files never leave your device — every tool runs in your browser. No uploads, no accounts, no tracking.",
  "footer.otherTools": "Other tools",
  "footer.quickLinks": "Quick links",
  "footer.guides": "Guides",
  "footer.resources": "Resources",
  "footer.pdfTools": "PDF tools",
  "footer.wordTools": "Word tools",
  "footer.imageTools": "Image tools",
  "footer.textTools": "Text tools",
  "footer.allTools": "All tools",
  "footer.blog": "Blog",
  "footer.allGuides": "All guides",
  "footer.transfer": "P2P file transfer",
  "footer.about": "About",
  "footer.contact": "Contact",
  "footer.privacy": "Privacy policy",
  "footer.terms": "Terms & conditions",
  "footer.sitemap": "Sitemap",
  "footer.selectLanguage": "Select language",
  "footer.rights": "All rights reserved",
  "footer.systems": "All systems operational",

  // Homepage — hero
  "home.heroEyebrow": "Free · Private · In-browser",
  "home.heroTitle": "File tasks, done privately in your browser.",
  "home.heroSubtitle":
    "Merge, split, compress and convert PDFs, Word documents and images — nothing is uploaded, nothing is stored, nothing to sign up for.",
  "home.noUpload": "No upload · No sign-up · No watermark",
  "home.searchPlaceholder": "Search {count} tools — try \"merge pdf\"…",

  // Homepage — categories
  "home.categoriesEyebrow": "Categories",
  "home.categoriesTitle": "Everything in its place",
  "home.categoriesSub": "{count} tools across PDF, Word, Image and Text — pick a shelf.",
  "home.browseAll": "Browse all tools",

  // Homepage — popular
  "home.popularEyebrow": "Popular",
  "home.popularTitle": "What people reach for first",
  "home.popularSub": "The everyday jobs, filtered by task. {count} tools in this view.",
  "home.chipAll": "All",
  "home.chipOrganize": "Organize",
  "home.chipConvert": "Convert",
  "home.chipEdit": "Edit",
  "home.chipOptimize": "Optimize",
  "home.chipSecurity": "Security",
  "home.chipImage": "Image",
  "home.showAll": "Show all {count} tools",
  "home.showing": "Showing {n} of {m}",
  "home.browseAllCount": "Browse all {count} tools",

  // Homepage — how it works
  "home.howEyebrow": "How it works",
  "home.howTitle": "Three steps, no waiting room",
  "home.howIntro":
    "Every tool works the same way. There is no queue, no upload progress bar, and no account standing between you and the result.",
  "home.step1Title": "Add your file",
  "home.step1Desc": "Drop it in or pick it from your device. The file opens right here in the tab.",
  "home.step2Title": "Choose what to do",
  "home.step2Desc": "Pick an option — page range, quality, format. Sensible defaults if you'd rather not.",
  "home.step3Title": "Download the result",
  "home.step3Desc": "The finished file is generated in seconds — right on your machine, ready to save.",

  // Homepage — privacy
  "home.privacyEyebrow": "Privacy",
  "home.privacyTitle": "Your files never leave your device.",
  "home.privacyIntro":
    "Most file tools upload your document to a server, work on it there, and leave a copy behind. FilesWow runs the whole job inside this browser tab — so contracts, passports and homework stay with you.",
  "home.bulletOffline": "Works offline after the first visit",
  "home.bulletNothing": "Nothing is stored, nothing is logged",
  "home.bulletNoAccount": "No account, ever",
  "home.otherSites": "Other file sites",
  "home.filesWow": "FilesWow",
  "home.yourFile": "Your file",
  "home.theirServer": "Their server",
  "home.thisBrowser": "This browser",
  "home.result": "Result",
  "home.otherCaption":
    "Your document leaves the device, sits on a machine you don't control, then comes back.",
  "home.ourCaption": "Everything happens in the tab. The file is read, processed and saved right here — ",
  "home.ourCaptionAccent": "nothing is uploaded",

  // Homepage — blog
  "home.blogEyebrow": "From the blog",
  "home.blogTitle": "Latest guides",
  "home.allPosts": "All posts",
  "home.readGuide": "Read guide",

  // Homepage — FAQ
  "home.faqTitle": "Questions, answered plainly",

  // Homepage — CTA
  "home.ctaTitle": "Ready when you are.",
  "home.ctaSub": "Pick a task and it's done before the kettle boils. No sign-up, ever.",
  "home.ctaExplore": "Explore all tools",
  "home.ctaTry": "Try Merge PDF",
} satisfies Record<string, string>;

export type MessageKey = keyof typeof en;

/* ─── Spanish ─────────────────────────────────────────────────── */

const es: Partial<Record<MessageKey, string>> = {
  "nav.search": "Buscar",
  "nav.transfer": "Transferir archivos",
  "nav.blogGuides": "Blog y guías",
  "nav.viewAll": "Ver todo",
  "nav.privacyNote": "Cada herramienta funciona en tu navegador — tus archivos nunca se suben.",
  "nav.lightMode": "Modo claro",
  "nav.darkMode": "Modo oscuro",

  "footer.tagline":
    "Tus archivos nunca salen de tu dispositivo — cada herramienta funciona en tu navegador. Sin subidas, sin cuentas, sin rastreo.",
  "footer.otherTools": "Otras herramientas",
  "footer.quickLinks": "Enlaces rápidos",
  "footer.guides": "Guías",
  "footer.resources": "Recursos",
  "footer.pdfTools": "Herramientas PDF",
  "footer.wordTools": "Herramientas Word",
  "footer.imageTools": "Herramientas de imagen",
  "footer.textTools": "Herramientas de texto",
  "footer.allTools": "Todas las herramientas",
  "footer.blog": "Blog",
  "footer.allGuides": "Todas las guías",
  "footer.transfer": "Transferencia P2P",
  "footer.about": "Acerca de",
  "footer.contact": "Contacto",
  "footer.privacy": "Política de privacidad",
  "footer.terms": "Términos y condiciones",
  "footer.sitemap": "Mapa del sitio",
  "footer.selectLanguage": "Seleccionar idioma",
  "footer.rights": "Todos los derechos reservados",
  "footer.systems": "Todos los sistemas en funcionamiento",

  "home.heroEyebrow": "Gratis · Privado · En el navegador",
  "home.heroTitle": "Tareas con archivos, hechas con privacidad en tu navegador.",
  "home.heroSubtitle":
    "Combina, divide, comprime y convierte PDFs, documentos Word e imágenes — nada se sube, nada se guarda, sin registros.",
  "home.noUpload": "Sin subidas · Sin registro · Sin marcas de agua",
  "home.searchPlaceholder": "Busca entre {count} herramientas — prueba \"combinar pdf\"…",

  "home.categoriesEyebrow": "Categorías",
  "home.categoriesTitle": "Todo en su lugar",
  "home.categoriesSub": "{count} herramientas de PDF, Word, imagen y texto — elige un estante.",
  "home.browseAll": "Ver todas las herramientas",

  "home.popularEyebrow": "Popular",
  "home.popularTitle": "Lo que la gente busca primero",
  "home.popularSub": "Las tareas de cada día, filtradas por objetivo. {count} herramientas en esta vista.",
  "home.chipAll": "Todo",
  "home.chipOrganize": "Organizar",
  "home.chipConvert": "Convertir",
  "home.chipEdit": "Editar",
  "home.chipOptimize": "Optimizar",
  "home.chipSecurity": "Seguridad",
  "home.chipImage": "Imagen",
  "home.showAll": "Ver las {count} herramientas",
  "home.showing": "Mostrando {n} de {m}",
  "home.browseAllCount": "Ver las {count} herramientas",

  "home.howEyebrow": "Cómo funciona",
  "home.howTitle": "Tres pasos, sin sala de espera",
  "home.howIntro":
    "Todas las herramientas funcionan igual. No hay colas, ni barras de subida, ni cuentas entre tú y el resultado.",
  "home.step1Title": "Añade tu archivo",
  "home.step1Desc": "Arrástralo o elígelo desde tu dispositivo. El archivo se abre aquí mismo en la pestaña.",
  "home.step2Title": "Elige qué hacer",
  "home.step2Desc": "Selecciona una opción — rango de páginas, calidad, formato. Con valores por defecto sensatos.",
  "home.step3Title": "Descarga el resultado",
  "home.step3Desc": "El archivo final se genera en segundos — en tu propio equipo, listo para guardar.",

  "home.privacyEyebrow": "Privacidad",
  "home.privacyTitle": "Tus archivos nunca salen de tu dispositivo.",
  "home.privacyIntro":
    "La mayoría de las herramientas de archivos suben tu documento a un servidor, trabajan allí y dejan una copia. FilesWow hace todo el trabajo dentro de esta pestaña — contratos, pasaportes y deberes se quedan contigo.",
  "home.bulletOffline": "Funciona sin conexión tras la primera visita",
  "home.bulletNothing": "No se guarda nada, no se registra nada",
  "home.bulletNoAccount": "Sin cuenta, nunca",
  "home.otherSites": "Otros sitios de archivos",
  "home.filesWow": "FilesWow",
  "home.yourFile": "Tu archivo",
  "home.theirServer": "Su servidor",
  "home.thisBrowser": "Este navegador",
  "home.result": "Resultado",
  "home.otherCaption":
    "Tu documento sale del dispositivo, se queda en una máquina que no controlas y luego vuelve.",
  "home.ourCaption": "Todo ocurre en la pestaña. El archivo se lee, se procesa y se guarda aquí mismo — ",
  "home.ourCaptionAccent": "nada se sube",

  "home.blogEyebrow": "Del blog",
  "home.blogTitle": "Últimas guías",
  "home.allPosts": "Todos los artículos",
  "home.readGuide": "Leer guía",

  "home.faqTitle": "Preguntas, respondidas con claridad",

  "home.ctaTitle": "Listo cuando tú quieras.",
  "home.ctaSub": "Elige una tarea y termina antes de que hierva la tetera. Sin registros, nunca.",
  "home.ctaExplore": "Explorar herramientas",
  "home.ctaTry": "Probar Combinar PDF",
};

/* ─── Portuguese ──────────────────────────────────────────────── */

const pt: Partial<Record<MessageKey, string>> = {
  "nav.search": "Pesquisar",
  "nav.transfer": "Transferir ficheiros",
  "nav.blogGuides": "Blog e guias",
  "nav.viewAll": "Ver tudo",
  "nav.privacyNote": "Cada ferramenta funciona no seu navegador — os ficheiros nunca são enviados.",
  "nav.lightMode": "Modo claro",
  "nav.darkMode": "Modo escuro",

  "footer.tagline":
    "Os seus ficheiros nunca saem do dispositivo — cada ferramenta funciona no navegador. Sem uploads, sem contas, sem rastreio.",
  "footer.otherTools": "Outras ferramentas",
  "footer.quickLinks": "Ligações rápidas",
  "footer.guides": "Guias",
  "footer.resources": "Recursos",
  "footer.pdfTools": "Ferramentas PDF",
  "footer.wordTools": "Ferramentas Word",
  "footer.imageTools": "Ferramentas de imagem",
  "footer.textTools": "Ferramentas de texto",
  "footer.allTools": "Todas as ferramentas",
  "footer.blog": "Blog",
  "footer.allGuides": "Todos os guias",
  "footer.transfer": "Transferência P2P",
  "footer.about": "Sobre",
  "footer.contact": "Contacto",
  "footer.privacy": "Política de privacidade",
  "footer.terms": "Termos e condições",
  "footer.sitemap": "Mapa do site",
  "footer.selectLanguage": "Selecionar idioma",
  "footer.rights": "Todos os direitos reservados",
  "footer.systems": "Todos os sistemas em funcionamento",

  "home.heroEyebrow": "Grátis · Privado · No navegador",
  "home.heroTitle": "Tarefas de ficheiros, feitas com privacidade no seu navegador.",
  "home.heroSubtitle":
    "Junte, divida, comprima e converta PDFs, documentos Word e imagens — nada é enviado, nada é guardado, sem registo.",
  "home.noUpload": "Sem uploads · Sem registo · Sem marcas de água",
  "home.searchPlaceholder": "Pesquise entre {count} ferramentas — experimente \"juntar pdf\"…",

  "home.categoriesEyebrow": "Categorias",
  "home.categoriesTitle": "Tudo no seu lugar",
  "home.categoriesSub": "{count} ferramentas de PDF, Word, imagem e texto — escolha uma prateleira.",
  "home.browseAll": "Ver todas as ferramentas",

  "home.popularEyebrow": "Popular",
  "home.popularTitle": "O que as pessoas procuram primeiro",
  "home.popularSub": "As tarefas do dia a dia, filtradas por objetivo. {count} ferramentas nesta vista.",
  "home.chipAll": "Tudo",
  "home.chipOrganize": "Organizar",
  "home.chipConvert": "Converter",
  "home.chipEdit": "Editar",
  "home.chipOptimize": "Otimizar",
  "home.chipSecurity": "Segurança",
  "home.chipImage": "Imagem",
  "home.showAll": "Ver as {count} ferramentas",
  "home.showing": "A mostrar {n} de {m}",
  "home.browseAllCount": "Ver as {count} ferramentas",

  "home.howEyebrow": "Como funciona",
  "home.howTitle": "Três passos, sem sala de espera",
  "home.howIntro":
    "Todas as ferramentas funcionam da mesma forma. Não há filas, nem barras de upload, nem contas entre si e o resultado.",
  "home.step1Title": "Adicione o seu ficheiro",
  "home.step1Desc": "Arraste ou escolha no seu dispositivo. O ficheiro abre aqui mesmo no separador.",
  "home.step2Title": "Escolha o que fazer",
  "home.step2Desc": "Escolha uma opção — intervalo de páginas, qualidade, formato. Valores predefinidos sensatos.",
  "home.step3Title": "Descarregue o resultado",
  "home.step3Desc": "O ficheiro final é gerado em segundos — na sua própria máquina, pronto a guardar.",

  "home.privacyEyebrow": "Privacidade",
  "home.privacyTitle": "Os seus ficheiros nunca saem do seu dispositivo.",
  "home.privacyIntro":
    "A maioria das ferramentas de ficheiros envia o documento para um servidor, trabalha lá e deixa uma cópia. O FilesWow faz todo o trabalho dentro deste separador — contratos, passaportes e trabalhos de casa ficam consigo.",
  "home.bulletOffline": "Funciona offline após a primeira visita",
  "home.bulletNothing": "Nada é guardado, nada é registado",
  "home.bulletNoAccount": "Sem conta, nunca",
  "home.otherSites": "Outros sites de ficheiros",
  "home.filesWow": "FilesWow",
  "home.yourFile": "O seu ficheiro",
  "home.theirServer": "O servidor deles",
  "home.thisBrowser": "Este navegador",
  "home.result": "Resultado",
  "home.otherCaption":
    "O seu documento sai do dispositivo, fica numa máquina que não controla e depois regressa.",
  "home.ourCaption": "Tudo acontece no separador. O ficheiro é lido, processado e guardado aqui mesmo — ",
  "home.ourCaptionAccent": "nada é enviado",

  "home.blogEyebrow": "Do blog",
  "home.blogTitle": "Últimos guias",
  "home.allPosts": "Todos os artigos",
  "home.readGuide": "Ler guia",

  "home.faqTitle": "Perguntas, respondidas com clareza",

  "home.ctaTitle": "Pronto quando quiser.",
  "home.ctaSub": "Escolha uma tarefa e fica feita antes de a água ferver. Sem registo, nunca.",
  "home.ctaExplore": "Explorar ferramentas",
  "home.ctaTry": "Experimentar Juntar PDF",
};

const DICTIONARIES: Record<Locale, Partial<Record<MessageKey, string>>> = { en, es, pt };

const STORAGE_KEY = "fw-locale";

/* ─── Context ─────────────────────────────────────────────────── */

interface I18nValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function isLocale(value: string | null): value is Locale {
  return value === "en" || value === "es" || value === "pt";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  // "en" matches the server render; the effect below syncs the saved choice
  // after hydration to avoid a mismatch.
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(saved)) {
      setLocaleState(saved);
      return;
    }
    const nav = navigator.language?.slice(0, 2);
    if (nav === "es" || nav === "pt") setLocaleState(nav);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: MessageKey) => DICTIONARIES[locale][key] ?? en[key],
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
