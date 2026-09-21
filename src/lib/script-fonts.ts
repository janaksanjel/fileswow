/**
 * Script-aware font support for canvas/HTML rendering pipelines
 * (e.g. Word → PDF via html2canvas).
 *
 * Problem this solves: html2canvas rasterizes text with the exact
 * font-family resolved from CSS. When a document contains scripts like
 * Devanagari (Nepali/Hindi/Marathi), Arabic (Urdu/Persian), Bengali,
 * Tamil, Thai, etc. and the CSS only specifies "Arial", the browser's
 * implicit font fallback is unreliable inside html2canvas's cloned
 * iframe — glyphs render as boxes (□) or conjuncts/matras break.
 *
 * Fix: scan the actual text, determine which Unicode scripts it uses,
 * explicitly load a proper Unicode webfont for each (FontFace API, from
 * the Fontsource CDN — a font *download*, not a file upload; the
 * document itself never leaves the device), and prepend those families
 * to the font stack before rasterizing.
 */

interface ScriptFontDef {
  /** CSS family name the FontFace is registered under */
  cssName: string;
  /** Fontsource package id on the jsDelivr CDN */
  fontId?: string;
  /** Fontsource subset name (file prefix) */
  subset?: string;
  /** System-installed families worth adding to the stack (no download) */
  system?: string[];
  /** Unicode code-point ranges that trigger this font */
  ranges: Array<[number, number]>;
}

const SCRIPT_FONTS: ScriptFontDef[] = [
  {
    cssName: "Noto Sans Devanagari",
    fontId: "noto-sans-devanagari",
    subset: "devanagari",
    system: ["Nirmala UI", "Kohinoor Devanagari", "Devanagari MT"],
    ranges: [[0x0900, 0x097f]],
  },
  {
    cssName: "Noto Sans Bengali",
    fontId: "noto-sans-bengali",
    subset: "bengali",
    system: ["Nirmala UI", "Bangla MN"],
    ranges: [[0x0980, 0x09ff]],
  },
  {
    cssName: "Noto Sans Gurmukhi",
    fontId: "noto-sans-gurmukhi",
    subset: "gurmukhi",
    system: ["Nirmala UI"],
    ranges: [[0x0a00, 0x0a7f]],
  },
  {
    cssName: "Noto Sans Gujarati",
    fontId: "noto-sans-gujarati",
    subset: "gujarati",
    system: ["Nirmala UI", "Gujarati Sangam MN"],
    ranges: [[0x0a80, 0x0aff]],
  },
  {
    cssName: "Noto Sans Oriya",
    fontId: "noto-sans-oriya",
    subset: "oriya",
    system: ["Nirmala UI", "Oriya Sangam MN"],
    ranges: [[0x0b00, 0x0b7f]],
  },
  {
    cssName: "Noto Sans Tamil",
    fontId: "noto-sans-tamil",
    subset: "tamil",
    system: ["Nirmala UI", "InaiMathi", "Tamil Sangam MN"],
    ranges: [[0x0b80, 0x0bff]],
  },
  {
    cssName: "Noto Sans Telugu",
    fontId: "noto-sans-telugu",
    subset: "telugu",
    system: ["Nirmala UI", "Kohinoor Telugu", "Telugu Sangam MN"],
    ranges: [[0x0c00, 0x0c7f]],
  },
  {
    cssName: "Noto Sans Kannada",
    fontId: "noto-sans-kannada",
    subset: "kannada",
    system: ["Nirmala UI", "Kannada Sangam MN"],
    ranges: [[0x0c80, 0x0cff]],
  },
  {
    cssName: "Noto Sans Malayalam",
    fontId: "noto-sans-malayalam",
    subset: "malayalam",
    system: ["Nirmala UI", "Malayalam Sangam MN"],
    ranges: [[0x0d00, 0x0d7f]],
  },
  {
    cssName: "Noto Sans Sinhala",
    fontId: "noto-sans-sinhala",
    subset: "sinhala",
    system: ["Sinhala Sangam MN"],
    ranges: [[0x0d80, 0x0dff]],
  },
  {
    cssName: "Noto Naskh Arabic",
    fontId: "noto-naskh-arabic",
    subset: "arabic",
    system: ["Segoe UI", "Geeza Pro", "Nadeem"],
    ranges: [
      [0x0600, 0x06ff],
      [0x0750, 0x077f],
      [0xfb50, 0xfdff],
      [0xfe70, 0xfeff],
    ],
  },
  {
    cssName: "Noto Sans Hebrew",
    fontId: "noto-sans-hebrew",
    subset: "hebrew",
    system: ["Segoe UI", "Arial Hebrew"],
    ranges: [[0x0590, 0x05ff]],
  },
  {
    cssName: "Noto Sans Armenian",
    fontId: "noto-sans-armenian",
    subset: "armenian",
    ranges: [[0x0530, 0x058f]],
  },
  {
    cssName: "Noto Sans Thai",
    fontId: "noto-sans-thai",
    subset: "thai",
    system: ["Leelawadee UI", "Thonburi"],
    ranges: [[0x0e00, 0x0e7f]],
  },
  {
    cssName: "Noto Sans Lao",
    fontId: "noto-sans-lao",
    subset: "lao",
    system: ["Leelawadee UI"],
    ranges: [[0x0e80, 0x0eff]],
  },
  {
    cssName: "Noto Sans Tibetan",
    fontId: "noto-sans-tibetan",
    subset: "tibetan",
    system: ["Kailasa"],
    ranges: [[0x0f00, 0x0fff]],
  },
  {
    cssName: "Noto Sans Myanmar",
    fontId: "noto-sans-myanmar",
    subset: "myanmar",
    system: ["Myanmar Text", "Myanmar Sangam MN"],
    ranges: [[0x1000, 0x109f]],
  },
  {
    cssName: "Noto Sans Georgian",
    fontId: "noto-sans-georgian",
    subset: "georgian",
    system: ["Sylfaen"],
    ranges: [[0x10a0, 0x10ff]],
  },
  {
    cssName: "Noto Sans Khmer",
    fontId: "noto-sans-khmer",
    subset: "khmer",
    system: ["Leelawadee UI", "Khmer Sangam MN"],
    ranges: [[0x1780, 0x17ff]],
  },
  {
    cssName: "Noto Sans Ethiopic",
    fontId: "noto-sans-ethiopic",
    subset: "ethiopic",
    system: ["Nyala"],
    ranges: [[0x1200, 0x137f]],
  },
];

/** CJK handled via system fonts only — Noto CJK downloads are 4-8 MB. */
const CJK_RANGES: Array<[number, number]> = [
  [0x2e80, 0x9fff], // CJK radicals, kana, ideographs, compatibility
  [0xf900, 0xfaff], // CJK compatibility ideographs
  [0xff00, 0xffef], // halfwidth/fullwidth forms
  [0x3000, 0x303f], // CJK symbols and punctuation
  [0xac00, 0xd7af], // Hangul syllables
  [0x1100, 0x11ff], // Hangul jamo
];

const CJK_SYSTEM_STACK = [
  "PingFang SC",
  "Hiragino Sans GB",
  "Microsoft YaHei",
  "Noto Sans CJK SC",
  "Yu Gothic",
  "Hiragino Kaku Gothic ProN",
  "Meiryo",
  "Malgun Gothic",
  "Apple SD Gothic Neo",
];

const FONT_CDNS = [
  (id: string, subset: string) =>
    `https://cdn.jsdelivr.net/fontsource/fonts/${id}@latest/${subset}-400-normal.woff2`,
  (id: string, subset: string) =>
    `https://cdn.jsdelivr.net/fontsource/fonts/${id}@latest/${subset}-400-normal.woff`,
];

/** Families already loaded this session — avoid repeat network work. */
const loadedFamilies = new Set<string>();

function matchesAnyRange(cp: number, ranges: Array<[number, number]>): boolean {
  for (const [lo, hi] of ranges) {
    if (cp >= lo && cp <= hi) return true;
  }
  return false;
}

export interface ScriptFontSupport {
  /** font-family value to use, ordered so loaded fonts win */
  fontFamily: string;
  /** true when the text contains RTL scripts (Arabic/Hebrew) */
  hasRtl: boolean;
  /** families that were successfully registered */
  loaded: string[];
}

/**
 * Scan `text` for non-Latin scripts, load matching webfonts, and return
 * a font-family stack that puts them first. Never throws: on network
 * failure it degrades to system font stacks.
 */
export async function prepareScriptFonts(text: string): Promise<ScriptFontSupport> {
  const needed: ScriptFontDef[] = [];
  let hasRtl = false;
  let hasCjk = false;

  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    for (const def of SCRIPT_FONTS) {
      if (!needed.includes(def) && matchesAnyRange(cp, def.ranges)) {
        needed.push(def);
        if (def.fontId === "noto-naskh-arabic" || def.fontId === "noto-sans-hebrew") {
          hasRtl = true;
        }
      }
    }
    if (!hasCjk && matchesAnyRange(cp, CJK_RANGES)) hasCjk = true;
  }

  const loaded: string[] = [];

  await Promise.all(
    needed.map(async (def) => {
      const family = def.cssName;
      try {
        if (!loadedFamilies.has(family) && def.fontId && def.subset) {
          let registered = false;
          for (const buildUrl of FONT_CDNS) {
            try {
              const face = new FontFace(family, `url(${buildUrl(def.fontId, def.subset)})`, {
                weight: "400",
                style: "normal",
                display: "swap",
              });
              await face.load();
              document.fonts.add(face);
              registered = true;
              break;
            } catch {
              // try next CDN format (woff2 → woff)
            }
          }
          if (!registered) return; // skip this font, stack still has system fallbacks
        }
        loadedFamilies.add(family);
        loaded.push(family);
      } catch {
        // non-fatal — fall back to system fonts for this script
      }
    })
  );

  const stack: string[] = [];
  for (const def of needed) {
    if (loaded.includes(def.cssName)) stack.push(`"${def.cssName}"`);
    if (def.system) stack.push(...def.system);
  }
  if (hasCjk) stack.push(...CJK_SYSTEM_STACK);
  // Latin/base coverage always last
  stack.push("Segoe UI", "Arial", "Helvetica", "sans-serif");

  // De-duplicate while preserving order
  const seen = new Set<string>();
  const fontFamily = stack.filter((f) => (seen.has(f) ? false : (seen.add(f), true))).join(", ");

  return { fontFamily, hasRtl, loaded };
}

/**
 * Wait for all currently-loading webfonts (with a hard timeout so a slow
 * network can't hang the conversion forever).
 */
export async function waitForFonts(timeoutMs = 4000): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  await Promise.race([
    document.fonts.ready,
    new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

/**
 * Wait for every <img> inside `root` to finish loading (mammoth emits
 * data-URI images; html2canvas needs them complete before capture).
 */
export function waitForImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  return Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) return resolve();
          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
          // hard cap per image
          setTimeout(done, 5000);
        })
    )
  ).then(() => undefined);
}
