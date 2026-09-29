// lib/blog.ts — the FilesWow.com blog: long-form, keyword-targeted articles
// that funnel search traffic to the tools. Each post targets one primary
// keyword cluster ("merge pdf files online free", etc.), embeds the tool,
// includes HowTo-style steps, a deep FAQ (FAQPage JSON-LD), and cross-links
// to related tools for internal linking.
//
// `related` slugs are validated against the tool catalog in dev (same pattern
// as guides.ts), so a renamed tool can't leave a dead link behind.

import { ALL_TOOLS } from "./catalog";
import { absoluteUrl } from "./site";

export type BlogSection = {
  h2: string;
  paragraphs: string[];
  /** Optional bulleted list rendered after the paragraphs. */
  bullets?: string[];
  /** Optional numbered step list (rendered as styled steps, mirrors HowTo schema). */
  steps?: string[];
};

export type BlogPost = {
  slug: string;
  title: string;
  /** Short display title for footers, cards, and tight layouts. */
  shortTitle: string;
  /** Short description used in meta description, cards, and JSON-LD. */
  description: string;
  /** Primary keyword this article targets — used for meta keywords emphasis. */
  keyword: string;
  /** Secondary keyword phrases for the keywords meta. */
  keywords: string[];
  category: "pdf" | "word" | "image" | "text";
  /** ISO date of first publication. */
  published: string;
  /** ISO date of last substantive update. */
  updated: string;
  /** Author byline — Organization-level authorship. */
  author: string;
  intro: string[];
  sections: BlogSection[];
  faq: { q: string; a: string }[];
  /** Tool slugs cross-linked at the end of the article (and embedded in steps). */
  related: string[];
};

export const BLOG_POSTS: BlogPost[] = [
  // ─── PDF ────────────────────────────────────────────────────────────
  {
    slug: "how-to-merge-pdf-files-online-free",
    title: "How to Merge PDF Files Online Free (Without Uploading Them)",
    shortTitle: "Merge PDF Files",
    description:
      "Learn how to merge PDF files online for free — without uploading your documents to any server. Step-by-step walkthrough, ordering tips, quality checks, and fixes for the most common merge problems.",
    keyword: "merge pdf files online free",
    keywords: [
      "merge pdf files online free",
      "combine pdf files",
      "pdf merger no upload",
      "merge pdf without losing quality",
      "free pdf merger",
    ],
    category: "pdf",
    published: "2026-09-20",
    updated: "2026-09-29",
    author: "FilesWow Team",
    intro: [
      "Combining PDFs should take thirty seconds. Instead, most people hit the same wall: a \"free\" merger that demands an email address, stamps a watermark on page two, uploads a confidential contract to a server who-knows-where, and caps you at two files per day. This guide shows a better path — a browser-based merge that runs entirely on your device — and walks through the details that separate a clean merged document from a broken one: ordering, page sizes, bookmarks, and the sixty-second quality check that catches every defect.",
      "The tool we'll use is the free Merge PDF tool on FilesWow.com. Everything happens in your browser with JavaScript and WebAssembly — your files never leave your device, there's no sign-up, no file limit, and no watermark. If you're merging anything confidential (contracts, payslips, medical records, ID scans), that local-only architecture isn't a nice-to-have; it's the whole point.",
    ],
    sections: [
      {
        h2: "How to merge PDF files online free — step by step",
        paragraphs: [
          "The whole flow takes under a minute for typical documents. There's no account to create and nothing to configure upfront — you only touch settings if you want to.",
        ],
        steps: [
          "Open the free Merge PDF tool in your browser. No sign-up, no email — the tool is ready the moment the page loads.",
          "Drag your PDF files into the drop zone, or click to browse. You can add as many files as you need; the merge happens locally so there's no server-side file limit.",
          "Arrange the files in the order you want them to appear in the final document — drag the cards into sequence. Cover page first, then front matter, then body sections, appendices last.",
          "Click \"Merge PDF\". The tool combines the files in your browser — watch for the progress bar, which usually finishes in seconds for normal documents.",
          "Download the merged PDF. It's written directly to your device; nothing was uploaded at any point.",
        ],
      },
      {
        h2: "Why \"no upload\" matters more than you think",
        paragraphs: [
          "Every conventional online PDF merger works the same way: your file is transmitted to their servers, processed there, and sent back. That means your document — with whatever's inside it — transits and often resides on infrastructure you don't control, under a retention policy you can't see. For a restaurant menu that's irrelevant. For a signed employment contract, a passport scan, or a client's financial statement, it's a genuine risk with no upside.",
          "Browser-based merging flips the architecture: the PDF is read into your browser's memory, the pages are combined with pdf-lib (a JavaScript PDF library), and the result is written back to your disk. The network is never involved in your document's lifecycle. You can literally disconnect from the internet after loading the page and the merge still works.",
        ],
      },
      {
        h2: "Will merging reduce quality? The honest answer",
        paragraphs: [
          "No — and the reason is structural. A proper merge is a copy operation, not a re-render: pages from each source document are moved into a new container byte-for-byte where possible. Text stays selectable, images keep their original resolution, and embedded fonts travel with the document. If you've ever merged PDFs and then couldn't select or search the text, you used a tool that rasterized pages into images — destroying quality for zero benefit.",
          "The one thing a merge cannot fix is the quality of the sources themselves. A 200 DPI phone photo of a document merges exactly as sharply as it was captured. Fix capture quality first (rescan or re-photograph), then merge — assembling clean parts is the whole discipline.",
        ],
      },
      {
        h2: "Ordering strategy that saves rework",
        paragraphs: [
          "The merge order is your document's table of contents, and the cheapest time to get it right is before merging. Drag files into reading order in the queue: cover, summary, body, appendices. If your file list comes from a folder scan, numbered filenames (01-intro.pdf, 02-body.pdf) are the reliable trick — most tools sort them correctly automatically.",
          "Two gotchas bite constantly. First, tables of contents: a TOC generated from an earlier draft describes the old pagination, not the merged one — regenerate it after merging or add page numbers to the combined file instead. Second, scanner output order: tray-fed scanners often output pages bottom-of-stack-first, so a two-sided scan can arrive reversed. Flip the order in the visual organizer rather than re-scanning.",
        ],
      },
      {
        h2: "Quick fixes for the most common merge problems",
        paragraphs: [
          "Merged file is too big: sources duplicate fonts and images — run the result through compression and it usually drops 40–70% with no visible change. Text not selectable: a tool rasterized the pages; re-merge with a structural tool (this one). Bookmarks vanished: outlines sometimes don't carry across — add fresh bookmarks to the merged file if navigation matters. Page sizes are mixed: that's valid PDF behavior; normalize sizes afterward only if the destination is print.",
          "And the checklist worth running every time, in under a minute: select-and-copy a sentence from each source's section (text layer intact?), zoom to 200% on the heaviest photo page (no recompression mush?), click one internal link (references remapped?). Three checks, full confidence.",
        ],
        bullets: [
          "Too big → compress after merging.",
          "Text not selectable → re-merge with a structural tool.",
          "Bookmarks lost → re-add them to the merged file.",
          "Mixed page sizes → fine digitally; resize before print.",
        ],
      },
    ],
    faq: [
      {
        q: "Is this PDF merger really free?",
        a: "Yes — no usage limits, no watermarks, no premium tier. Because processing happens in your browser rather than on paid server infrastructure, the tool costs almost nothing to run, so it stays free.",
      },
      {
        q: "How many PDFs can I merge at once?",
        a: "There's no artificial limit. The practical ceiling is your device's memory: dozens of normal documents are routine; hundreds of image-heavy scans may need batching.",
      },
      {
        q: "Are my files uploaded when I merge?",
        a: "No. The merge runs entirely in your browser. Your files never leave your device — you can verify with your browser's network tab or by disconnecting from the internet after the page loads.",
      },
      {
        q: "Can I merge password-protected PDFs?",
        a: "Remove the password first with the Unlock PDF tool — a merger can only read documents that open without a prompt.",
      },
      {
        q: "Does merging work on iPhone and Android?",
        a: "Yes. The tool runs in any modern mobile browser, and small-to-medium documents merge comfortably on phones. Very large scans are faster on desktop.",
      },
      {
        q: "Will the merged PDF keep my fonts and images?",
        a: "Yes. A structural merge copies page content byte-for-byte, so fonts, images, and vector graphics arrive exactly as they were in the sources.",
      },
    ],
    related: ["merge-pdf", "organize-pdf", "compress-pdf", "split-pdf", "add-page-numbers-pdf"],
  },
  {
    slug: "compress-pdf-to-specific-size",
    title: "How to Compress a PDF to a Specific Size (Under 1MB, 100KB, Any Limit)",
    shortTitle: "Compress to a Size Limit",
    description:
      "Need a PDF under 1MB, 500KB, or 100KB for an upload portal or email? Learn the compress-then-split method that guarantees a size target, which quality settings to pick, and why some PDFs barely shrink.",
    keyword: "compress pdf to specific size",
    keywords: [
      "compress pdf to specific size",
      "compress pdf to 1mb",
      "compress pdf to 100kb",
      "reduce pdf file size",
      "compress pdf online free",
      "make pdf smaller",
    ],
    category: "pdf",
    published: "2026-09-21",
    updated: "2026-09-29",
    author: "FilesWow Team",
    intro: [
      "\"File must not exceed 2 MB.\" Every job portal, grant application, and government form has one, and every one of them rejects the 18 MB scan your scanner politely produced. Generic compression helps, but it's a blunt instrument — you get \"smaller\", not \"under the limit\". This guide shows the two-step method that actually guarantees a size target: compress to get near the ceiling, then split by size so every part is provably under it. Plus the diagnosis step most people skip: finding out what's making your PDF big in the first place, because the right fix depends entirely on the answer.",
      "Both tools run in your browser — Compress PDF and Split PDF by Size — so your documents (often the sensitive kind: applications, tax forms, medical records) never touch a server.",
    ],
    sections: [
      {
        h2: "First, diagnose: why is your PDF big?",
        paragraphs: [
          "Compression fails most often because it's aimed at the wrong target. A PDF's size lives in four places, in rough order of typical impact: embedded images (the usual 80–95% culprit), embedded fonts (a CJK font can add 10+ MB alone), structural overhead from incremental saves (old revisions living inside the file), and duplication (the same logo stored 40 times, once per page). Text is nearly irrelevant — a page of text is a few kilobytes.",
          "The practical diagnosis: open the PDF Info Viewer and check the page count and size per page. One page at 25 MB means one giant image — compression or a rescan at lower DPI is the fix. Three hundred pages at 100 KB each is a different story: global DPI reduction across the document is what moves the needle.",
        ],
        bullets: [
          "One huge page → single giant image; compress or rescan at lower DPI.",
          "Many similar-sized pages → global compression with DPI reduction.",
          "Text-only PDF that won't shrink → nothing to re-encode; fonts/structure dominate.",
          "Old scans → rescan at 300 DPI beats any post-processing.",
        ],
      },
      {
        h2: "Step 1 — Compress with the right quality level",
        paragraphs: [
          "Compression levels map directly to what happens to images. Low re-encodes at high quality and full resolution — visually identical output, modest savings (20–40% on scan-heavy files). Medium targets screen reading: images re-encode around 75–80% quality and downsample to roughly 150 DPI — visually indistinguishable for most content, typically 40–70% smaller. High is for hitting hard limits: 50–60% quality and ~96 DPI; text stays crisp (text isn't an image), but photos soften visibly.",
          "Start with Medium. It's the right default for email and portals in the overwhelming majority of cases. Drop to High only if Medium doesn't reach the target — and remember text is vector content that survives every level, so \"the PDF got blurry\" almost always means images got blurry.",
        ],
        steps: [
          "Open Compress PDF in your browser and upload the file.",
          "Pick Medium first — it's the best balance for screen reading, email, and portals.",
          "Run the compression and compare the output size to your target limit.",
          "If still over, run again at High. If under with room to spare and the images look soft, redo at Low.",
          "Download the compressed copy — keep the original; compression is lossy and irreversible.",
        ],
      },
      {
        h2: "Step 2 — Guarantee the limit with split-by-size",
        paragraphs: [
          "Compression gets you near the target; splitting guarantees it. The Split PDF by Size tool measures the running byte count as pages accumulate and closes each part before the next page would breach your ceiling — so every output file is provably under the limit, not approximately under it.",
          "Aim about 10% under the stated ceiling (9 MB for a 10 MB limit) because email gateways and portals measure with their own overhead, and a part that's exactly at the limit is the part that bounces. If a single page exceeds the entire budget, no split can help — that page is one giant image and needs its own compression pass (or a rescan) first.",
        ],
        steps: [
          "Open Split PDF by Size and upload your compressed PDF.",
          "Enter the target maximum size per part — e.g. 2 MB for a 2 MB portal, slightly under to be safe.",
          "Download the parts. Each is under the ceiling; most portals accept multiple attachments.",
          "If a single part is still over the limit, that page is too heavy: compress it again at a higher level, then re-split.",
        ],
      },
      {
        h2: "What compression can never do",
        paragraphs: [
          "Compression is lossy and irreversible — the re-encoded image data is gone. Three corollaries worth internalizing: always compress a copy and keep the original (next year someone will need it at full resolution for print); text-only PDFs barely shrink because there's nothing to squeeze; and never compress a print master — print exposes every artifact that screens hide, so print-bound documents want Low or nothing.",
          "If your source is a scan, the highest-leverage move isn't compression at all — it's capture. A 600 DPI scan compresses brilliantly and is still too heavy for its purpose; rescanning at 300 DPI produces a better document than any amount of post-processing. Compression is recovery; capture quality is prevention.",
        ],
      },
    ],
    faq: [
      {
        q: "How do I compress a PDF to exactly 1MB?",
        a: "Two steps: compress at Medium (or High if needed) to get close, then use Split PDF by Size with a 1 MB target — it cuts at page boundaries so every part is provably under 1 MB.",
      },
      {
        q: "Why didn't my PDF get smaller after compressing?",
        a: "Text-only PDFs have almost no compressible content — no images to re-encode. Check the file composition: if the size lives in fonts or structure, compression won't help much.",
      },
      {
        q: "Is online PDF compression safe for confidential documents?",
        a: "It is when the tool processes in your browser: files never leave your device. Conventional upload-based compressors transmit your document to their servers — avoid those for sensitive material.",
      },
      {
        q: "What quality should I choose?",
        a: "Medium for almost everything digital — email, portals, screen reading. Low for print or archival masters. High only to hit a hard upload limit when legibility, not beauty, is the bar.",
      },
      {
        q: "Can I compress a scanned PDF?",
        a: "Yes — scans are one image per page, so they compress visibly. Clear scans at Medium typically drop 40–70% with no readable loss.",
      },
    ],
    related: ["compress-pdf", "split-pdf-by-size", "pdf-info-viewer", "optimize-pdf-web", "pdf-to-grayscale"],
  },
  {
    slug: "convert-pdf-to-word-editable",
    title: "How to Convert PDF to Word (Editable DOCX) — and Fix It When Layout Breaks",
    shortTitle: "PDF to Word",
    description:
      "Convert PDF to editable Word documents free: which PDFs convert cleanly, why columns and tables shift, and the five-minute repair playbook that fixes the most common conversion defects.",
    keyword: "convert pdf to word editable",
    keywords: [
      "convert pdf to word editable",
      "pdf to word converter free",
      "pdf to docx",
      "edit pdf in word",
      "pdf to word no upload",
    ],
    category: "pdf",
    published: "2026-09-22",
    updated: "2026-09-29",
    author: "FilesWow Team",
    intro: [
      "PDF to Word is the most requested conversion in the world — and the most misunderstood. People expect a PDF to \"open in Word\" the way a .docx would, then get surprised when columns drift and tables emerge as text soup. The surprise is backwards: PDF stores appearance (\"draw this glyph at x=72, y=640\"), Word stores intent (\"this paragraph is Heading 1\"). Conversion is reconstruction — inferring intent from positions — and its quality depends on how much your document relies on PDF's appearance-only model. This guide covers which documents convert cleanly, which never will, and the repair moves that fix 90% of defects.",
      "The free PDF to Word converter runs entirely in your browser — no upload, which matters when the document is a contract, a resume, or someone's financial records.",
    ],
    sections: [
      {
        h2: "Which PDFs convert cleanly",
        paragraphs: [
          "Single-column documents with standard fonts and clear structure convert best: letters, memos, simple reports, most contracts. Lines of positioned text become paragraphs, larger fonts become headings, embedded images stay in place — these documents often come out nearly identical and fully editable, with working heading styles you can restyle globally.",
          "Digitally-generated PDFs (from Word, Google Docs, LaTeX) convert well because they carry real text layers. Scanned documents are the opposite: a scan has no text until OCR runs. If your PDF opens with selectable text, conversion has material to work with; if not, run OCR first — recognition accuracy then becomes the ceiling for the whole pipeline.",
        ],
      },
      {
        h2: "What struggles, and why",
        paragraphs: [
          "Multi-column layouts are the classic casualty: unless the converter detects column boundaries, a two-column newsletter interleaves line-by-line. Tables are second: a PDF table is just text positioned in a grid — there is no table object — so rows and columns must be inferred from spacing. Simple tables reconstruct well; merged cells don't. Text boxes arrive as floating objects, which reflow differently than inline content. And if the PDF embeds a font Word doesn't have, Word substitutes — changing metrics, line breaks, and pagination in a cascade.",
          "None of this means conversion is bad; it means fidelity scales with how office-like the source is. Complex print design (magazines, brochures) sits at one end — expect hours of cleanup. Office documents sit at the other — expect minutes.",
        ],
      },
      {
        h2: "The five-minute repair playbook",
        paragraphs: [
          "Four moves fix the most common defects. Line-break fragments (paragraphs breaking mid-sentence at odd widths) are hard line breaks baked into the PDF — merge them with Word's Find & Replace targeting paragraph marks. Missing heading styles: apply them manually once, then global restyling and auto-TOC work again. Floating images wrecking layout: switch them to inline (right-click → wrap → inline) and the chaos collapses. Font substitution: identify the original font in the PDF's properties and install it, or select-all into a metrically-similar font you own.",
          "And the meta-repair: sometimes don't convert at all. If the task is \"change the date and add a name\" on a five-page PDF, editing the PDF directly — text overlay, signature placement — beats convert-edit-re-export, because the original stays pristine. Conversion is for substantial editing or reuse, not touch-ups.",
        ],
        bullets: [
          "Broken paragraphs → merge hard line breaks with Find & Replace.",
          "No heading styles → apply once manually, then restyle globally.",
          "Floating images → switch to inline wrapping.",
          "Wrong fonts → install the original or substitute metrically-similar.",
        ],
      },
      {
        h2: "Keep the source of truth in the editable format",
        paragraphs: [
          "The round trip Word → PDF → Word never returns the original exactly, because intent → appearance is mechanical but appearance → intent is inference. If a document will be edited more than once, do the editing in Word (restoring it via conversion once if needed) and export PDFs as snapshots. Chains of PDF-to-Word-to-PDF edits compound conversion damage at every hop.",
          "Practical workflow for a common case: you received a PDF that must be edited and returned. Convert once, make your edits in Word, export to PDF with fonts embedded, and run the result through compression if it's headed to an email — the whole loop is three tools and five minutes, entirely on your device.",
        ],
      },
    ],
    faq: [
      {
        q: "How do I convert a PDF to Word for free without losing formatting?",
        a: "Use a browser-based converter that reconstructs text and layout without uploading. Simple documents convert nearly identically; complex layouts (multi-column, dense tables) need the repair playbook: merge broken line breaks, re-apply heading styles, and switch floating images to inline.",
      },
      {
        q: "Can I convert a scanned PDF to editable Word?",
        a: "Only after OCR creates a text layer — a scan is an image. Run OCR PDF first; recognition accuracy then caps the conversion quality.",
      },
      {
        q: "Why did my fonts change after converting?",
        a: "The PDF embedded a font Word doesn't have, so Word substituted it. Install the original font, or select all text and switch to a similar one you own.",
      },
      {
        q: "Is it safe to convert confidential PDFs online?",
        a: "With a browser-based converter, yes — the document is processed on your device and never uploaded. With conventional upload-based services, your document transits and often resides on their servers.",
      },
      {
        q: "Why are my tables broken after conversion?",
        a: "PDF has no table object — just text positioned in a grid. Simple tables reconstruct well; merged cells and nested layouts don't. Rebuild complex tables manually in Word.",
      },
    ],
    related: ["pdf-to-word", "word-to-pdf", "ocr-pdf", "edit-pdf", "pdf-to-text"],
  },
  {
    slug: "how-to-sign-a-pdf-online",
    title: "How to Sign a PDF Online (Legally, Safely, Without Uploading It)",
    shortTitle: "Sign PDFs Online",
    description:
      "Sign PDF documents online free: create your signature (draw, type, or upload), place it correctly, strengthen its legal weight, and keep confidential documents on your device the whole time.",
    keyword: "how to sign a pdf online",
    keywords: [
      "how to sign a pdf online",
      "sign pdf free",
      "electronic signature pdf",
      "esign pdf",
      "add signature to pdf",
      "sign pdf without uploading",
    ],
    category: "pdf",
    published: "2026-09-23",
    updated: "2026-09-29",
    author: "FilesWow Team",
    intro: [
      "Signing is where documents become commitments — and the online version raises two fair questions: is this signature legally valid, and where does my document go while I sign it? Good news on both: the law accepts visible electronic signatures for the overwhelming majority of everyday agreements, and with a browser-based signing tool your contract never leaves your device. This guide covers the workflow end to end, the legal layer (less intimidating than vendors imply), and the hygiene that makes a simple signature defensible.",
      "The free Sign PDF tool runs entirely in your browser — draw, type, or upload your signature, place it, and download. No account, and your signature (which is biometric data, worth treating that way) is never uploaded to anyone's cloud.",
    ],
    sections: [
      {
        h2: "How to sign a PDF online — step by step",
        paragraphs: [
          "The whole flow takes two minutes for a typical contract. No account, and nothing uploads at any step.",
        ],
        steps: [
          "Open the free Sign PDF tool in your browser and load your document — it's processed locally, never uploaded.",
          "Create your signature: draw it with a mouse or finger, type it in a handwriting style, or photograph your ink signature and place the image.",
          "Position the signature on the signature line — resize and place it precisely where the document expects it.",
          "Add the date beside your signature with a text stamp — evidence of when you signed takes seconds and strengthens the record.",
          "Download the signed PDF. It's written directly to your device.",
        ],
      },
      {
        h2: "Is an online signature legally valid?",
        paragraphs: [
          "In most jurisdictions, validity comes from intent and consent, not from any particular technology. The US ESIGN Act and UETA, the EU's eIDAS \"simple\" level, and the UK's equivalent frameworks all accept a visible signature applied with intent for everyday agreements — contracts, HR forms, NDAs, leases between individuals. What strengthens enforceability is evidence around the signature: who signed, when, and whether the document changed afterward.",
          "The tier above — certificate-based digital signatures (PKI) that cryptographically bind the document bytes to an identity — matters when a counterparty's compliance rules demand it (some government filings, certain EU processes). They'll tell you explicitly when that's required. For everything else, a visible signature with good hygiene is legally sufficient and universally accepted in practice.",
        ],
      },
      {
        h2: "Signature hygiene that makes it defensible",
        paragraphs: [
          "Because validity rides on intent and integrity, a few habits matter. Sign with context: date beside the signature, initials on page corners of multi-page agreements — evidence of review. Keep the evidence chain: save the signed copy and the message thread where the counterparty received it. Verify before countersigning: the Verify PDF Signature tool reports whether a signed document's bytes match what was signed — it catches the \"revised\" contract that differs from what you reviewed, which is precisely the scenario signatures exist to expose.",
          "If you sign often, the Signature Manager stores your signature locally in your browser (IndexedDB — not a server) so placing it into any document is one click. A signature is biometric data; there's no good reason to upload it \"for convenience\" to a service whose retention policy you can't see.",
        ],
      },
      {
        h2: "Why sign without uploading?",
        paragraphs: [
          "Standard e-signature services work by upload: your contract — salaries, client names, deal terms — transits and often resides on their servers. For plenty of documents that's a real cost, not a theoretical one. Local signing makes the confidentiality question disappear: the PDF loads in your browser, the signature is applied, the signed file is written back to your device.",
          "The honest trade-off: local signing gives you tier-one signatures, not certificate-based ones. For the majority of agreements — where the law accepts visible signatures and both parties just need the deal signed — that's the right trade: maximally private, legally sufficient, instantly done. When certified signatures are mandated, that's the heavyweight pipeline regardless of privacy preference.",
        ],
      },
    ],
    faq: [
      {
        q: "Is a drawn or typed electronic signature legally binding?",
        a: "For most everyday agreements, yes — ESIGN/UETA (US) and eIDAS \"simple\" (EU) accept signatures applied with intent, regardless of technology. Regulated workflows may demand certificate-based signatures.",
      },
      {
        q: "Can I sign a PDF without uploading it?",
        a: "Yes — browser-based signing tools process the document entirely on your device. Your contract and your signature never leave your computer or phone.",
      },
      {
        q: "How do I create an electronic signature?",
        a: "Three ways: draw it with a mouse or touchscreen, type your name in a handwriting font, or photograph your ink signature and place the image. All three are equally valid.",
      },
      {
        q: "Does my signature get saved anywhere?",
        a: "With the Signature Manager, it's stored locally in your browser's IndexedDB — never on a server. Clear your browser data and it's gone, which is exactly how it should be.",
      },
      {
        q: "How can I tell if a signed PDF was modified?",
        a: "Run it through signature verification — it reports whether the signed byte ranges match the current document, flagging any post-signing edits.",
      },
      {
        q: "Can I sign on my phone?",
        a: "Yes — drawing with a finger on a touchscreen is actually the most natural signature method. The tool works in any modern mobile browser.",
      },
    ],
    related: ["sign-pdf", "signature-manager", "verify-pdf-signature", "fill-pdf-form", "protect-pdf"],
  },
  {
    slug: "jpg-to-pdf-converter-guide",
    title: "How to Convert JPG to PDF Free (Phone Photos, Scans, Multiple Images)",
    shortTitle: "JPG to PDF",
    description:
      "Turn JPG images into a PDF free — single photos or batches, on phone or desktop. Page size and orientation explained, scan cleanup tips, and how to combine images into one clean document.",
    keyword: "convert jpg to pdf free",
    keywords: [
      "convert jpg to pdf free",
      "jpg to pdf converter",
      "image to pdf",
      "png to pdf",
      "combine images into pdf",
      "photo to pdf converter",
    ],
    category: "pdf",
    published: "2026-09-24",
    updated: "2026-09-29",
    author: "FilesWow Team",
    intro: [
      "Turning images into a PDF is one of those tasks that sounds trivial and then generates a dozen questions: what page size? What about portrait photos on a landscape page? Why is my 3 MB photo suddenly an 8 MB PDF? This guide walks the conversion properly — single image or batch, phone or desktop — with the page-size logic explained and the scan-cleanup moves that turn raw phone photos into a document that looks professional.",
      "The free JPG to PDF tool runs in your browser (Images to PDF handles batches with reordering), so your photos — passport scans, receipts, anything personal — never leave your device.",
    ],
    sections: [
      {
        h2: "How to convert JPG to PDF — step by step",
        paragraphs: [
          "Two minutes, no account, works the same on phone and desktop.",
        ],
        steps: [
          "Open the free JPG to PDF tool in your browser.",
          "Drag in one or more JPG images — or tap to pick from your phone's gallery.",
          "Choose the page size: \"Fit to image\" keeps each page exactly the photo's dimensions (best for viewing); A4 or Letter for printing; A4 portrait is the standard choice for document scans.",
          "Set orientation and margins if needed, and reorder images by dragging — the page order follows the list order.",
          "Download the PDF. It's built entirely on your device.",
        ],
      },
      {
        h2: "Page size choices, demystified",
        paragraphs: [
          "\"Fit to image\" produces pages that match each photo exactly — ideal for on-screen viewing and for anything that will be printed at photo sizes. Fixed sizes (A4, Letter) place the image on standard paper geometry with margins — this is what you want for printable documents: scanned contracts, ID photocopies, assignment submissions. Mixed orientation is fine — PDF supports portrait and landscape pages in one document, and viewers display each natively.",
          "For print destinations, one nuance: a photo placed on A4 at its native resolution prints fine, but a low-resolution photo stretched to fill A4 will look soft. Phone photos (12 MP+) are more than enough for full-page A4; screenshots are usually not.",
        ],
      },
      {
        h2: "Cleaning up phone photos of documents",
        paragraphs: [
          "A raw photo of a document has three problems: perspective skew (shot at an angle), uneven lighting (shadow across half the page), and busy background (the desk, the table). The fixes, in order: crop tightly to the document edges (Crop Image), rotate to square the text lines, and if the shadow is heavy, convert to grayscale or raise contrast — a document scan wants ink-on-paper, not a photograph of paper.",
          "The batch workflow for a multi-page document photographed as ten images: clean each image first (crop/rotate), then convert all at once with the images in order. Doing cleanup after the PDF exists means extracting, fixing, and reassembling — three times the work. Assemble from clean parts.",
        ],
        bullets: [
          "Crop tightly to the document edges before converting.",
          "Square the text lines with rotation.",
          "Grayscale or contrast for heavy shadows.",
          "Clean first, then batch-convert in order.",
        ],
      },
      {
        h2: "Why did my PDF get bigger than the photos?",
        paragraphs: [
          "Most converters re-encode images, and a naive re-encode can inflate a well-compressed JPG. If the output is dramatically larger than the inputs' combined size, run the result through PDF compression — a Medium pass typically brings it back to (or below) the source size with no visible change. And if the PDF's destination is email or a portal with a size limit, compress-first-then-check beats convert-and-hope.",
          "The other direction matters too: screenshots converted at 2× DPI can balloon. The general rule — the PDF's size should land close to the combined size of the images; dramatic divergence in either direction means an unnecessary re-encode happened.",
        ],
      },
    ],
    faq: [
      {
        q: "How do I convert JPG to PDF on my phone for free?",
        a: "Open the JPG to PDF tool in your mobile browser, pick images from your gallery, choose a page size, and download. Nothing uploads — it runs on your phone.",
      },
      {
        q: "Can I combine multiple images into one PDF?",
        a: "Yes — the Images to PDF tool handles batches: drag to reorder, choose page size, and download one combined document.",
      },
      {
        q: "Will converting to PDF reduce image quality?",
        a: "Not with a faithful converter — images are embedded at their original resolution. Quality loss comes from re-encoding or downsizing, which proper tools don't do silently.",
      },
      {
        q: "What page size should I use?",
        a: "\"Fit to image\" for on-screen viewing, A4 or Letter for printing. For document scans, A4 portrait is the standard.",
      },
      {
        q: "Does PNG to PDF work the same way?",
        a: "Yes — the PNG to PDF tool is the same flow for PNG files, and it preserves transparency-capable PNGs as they are.",
      },
    ],
    related: ["jpg-to-pdf", "images-to-pdf", "png-to-pdf", "scan-to-pdf", "compress-pdf"],
  },
  {
    slug: "split-pdf-into-multiple-files",
    title: "How to Split a PDF Into Multiple Files (Pages, Ranges, Size, Bookmarks)",
    shortTitle: "Split PDF Files",
    description:
      "Split PDFs free in your browser: extract single pages, split by ranges, by file size for email limits, or by bookmarks. Which method fits which job, plus the workflow for big scanned documents.",
    keyword: "split pdf into multiple files",
    keywords: [
      "split pdf into multiple files",
      "split pdf online free",
      "extract pages from pdf",
      "separate pdf pages",
      "split pdf by size",
      "pdf splitter",
    ],
    category: "pdf",
    published: "2026-09-25",
    updated: "2026-09-29",
    author: "FilesWow Team",
    intro: [
      "Splitting is merging's mirror — and just as frequently done badly. The typical pain: a 90-page scan that must go to four different people, each needing \"their\" pages, or a 25 MB report that must be sliced under a 10 MB email limit. \"Split PDF\" covers four genuinely different operations, and picking the right one is the difference between thirty seconds and an hour. This guide maps each method to the job it's built for and walks the workflows people actually do.",
      "All of the splitters run in your browser — Split PDF, Split by Size, Split by Page Count, Split by Bookmarks — with nothing uploaded.",
    ],
    sections: [
      {
        h2: "The four ways to split a PDF (and when to use each)",
        paragraphs: [
          "Same verb, four different jobs. Choosing by the job is the whole skill.",
        ],
        bullets: [
          "Split by page ranges — you know exactly which pages go where (\"1-5 to Alice, 6-12 to Bob\"). The general-purpose splitter.",
          "Extract pages — you want a few pages out, keeping the original untouched. The surgical option.",
          "Split by size — a hard file-size limit (email, portal). Cuts at page boundaries so every part is under the ceiling.",
          "Split by bookmarks — the PDF has a TOC; each section becomes its own file. Perfect for books and manuals with real structure.",
          "Split by page count — equal chunks (every 10 pages). Chapter-a-day reading, print batching.",
        ],
      },
      {
        h2: "How to split by page ranges — step by step",
        paragraphs: [
          "The everyday case: specific pages to specific people.",
        ],
        steps: [
          "Open the free Split PDF tool and upload your document.",
          "Choose \"custom ranges\" and enter them — \"1-3, 7, 12-15\" creates a file with pages 1, 2, 3, 7, 12, 13, 14, 15 in that order.",
          "Add multiple ranges if you want several output files in one pass.",
          "Download each part — built locally, nothing uploaded.",
        ],
      },
      {
        h2: "Splitting under a size limit (the email case)",
        paragraphs: [
          "When the constraint is bytes, not pages, split by size: the tool measures the running byte count as pages accumulate and closes each part before the next page would breach the limit. Set the target slightly under the stated ceiling — 9 MB for a 10 MB limit — because mail gateways measure with their own overhead.",
          "Compress first, split second. Compression shrinks the total; splitting distributes it. Doing it in that order means fewer parts and smaller total transfer. And if a single page exceeds the whole budget, that page is one giant image — it needs its own compression pass before any splitting works.",
        ],
      },
      {
        h2: "Splitting scanned documents and books",
        paragraphs: [
          "Long scans and downloaded books usually have one asset people overlook: bookmarks. If the PDF has a TOC, Split by Bookmarks turns each section into its own file in one click — chapters for a book, sections for a manual, exhibits for a legal bundle. No bookmark structure? The Bookmarks & TOC Editor can add one, or page-count splitting approximates it.",
          "For two-sided scans that came out reversed (tray-fed scanners output bottom-of-stack-first), the visual page organizer lets you flip the order before or after splitting — faster than re-scanning and re-assembling.",
        ],
      },
    ],
    faq: [
      {
        q: "How do I split a PDF into separate files for free?",
        a: "Use a browser-based splitter: upload, choose ranges (or size/bookmark mode), download the parts. Free, no sign-up, and the file never leaves your device.",
      },
      {
        q: "How do I split a PDF under 10MB?",
        a: "Compress first, then Split PDF by Size with a ~9 MB target. It cuts at page boundaries so every part is provably under the limit.",
      },
      {
        q: "Can I extract just a few pages?",
        a: "Yes — Extract PDF Pages pulls selected pages into a new file and leaves the original untouched.",
      },
      {
        q: "Will splitting reduce quality?",
        a: "No — splitting is a structural copy, exactly like merging. Text, images, and fonts arrive in each part exactly as they were.",
      },
      {
        q: "How do I split a PDF by chapter?",
        a: "If the PDF has bookmarks, Split by Bookmarks turns each top-level section into its own file automatically.",
      },
    ],
    related: ["split-pdf", "split-pdf-by-size", "extract-pdf-pages", "split-pdf-by-bookmarks", "compress-pdf"],
  },
  {
    slug: "remove-background-from-image-free",
    title: "How to Remove a Background From an Image Free (No Upload, HD Result)",
    shortTitle: "Remove Backgrounds",
    description:
      "Remove image backgrounds free in your browser: how AI background removal works, when to use manual erasing instead, PNG transparency tips, and how to get a clean result on hair, edges, and logos.",
    keyword: "remove background from image free",
    keywords: [
      "remove background from image free",
      "background remover",
      "make background transparent",
      "png transparent background",
      "delete background photo",
      "background eraser online",
    ],
    category: "image",
    published: "2026-09-25",
    updated: "2026-09-29",
    author: "FilesWow Team",
    intro: [
      "Background removal used to be a Photoshop skill. Now an AI model does the first pass in seconds — but anyone who has processed a photo of a person with frizzy hair knows the difference between a passable result and a clean one. This guide covers how AI background removal actually works, when it shines and when manual tools beat it, how to keep transparency intact (the PNG rules), and the source-photo habits that make every result better.",
      "The free Remove Background tool runs the AI model entirely in your browser — your photos never upload, which matters for ID photos, product images you haven't launched, and personal pictures.",
    ],
    sections: [
      {
        h2: "How to remove a background — step by step",
        paragraphs: [
          "One step if the AI nails it; two if it needs help.",
        ],
        steps: [
          "Open the free Remove Background tool in your browser and drop in your image — it processes locally, nothing uploads.",
          "Wait a few seconds while the AI model segments the subject. The result appears as a preview with transparency.",
          "Inspect the edges (hair, fur, glass, fine details) at 100% zoom. If they're clean, download the PNG — done.",
          "If edges need work, use manual erase/restore brushes to fix the specific areas, then download.",
        ],
      },
      {
        h2: "Where AI shines — and where it fails",
        paragraphs: [
          "AI segmentation is excellent on high-contrast subjects: a person against a wall, a product on a table, a logo on a flat background. It handles people especially well because the models are trained heavily on human subjects — faces, torsos, and hairlines get dedicated attention.",
          "It struggles predictably on low contrast (white shirt on white wall), fine translucent detail (hair wisps, glass, steam), and ambiguous boundaries (shadows that might be part of the subject). For those, the manual brushes are the answer — AI does 95%, you do the last 5%, and the result reads as professional.",
        ],
        bullets: [
          "Great: people, products, logos on plain backgrounds.",
          "Struggles: low contrast, hair wisps, glass, motion blur.",
          "Fix: AI first, manual brush cleanup on problem edges.",
        ],
      },
      {
        h2: "Keeping transparency: the PNG rules",
        paragraphs: [
          "Transparency lives only in formats that support an alpha channel: PNG and WebP. JPG does not — saving a cutout as JPG flattens the transparency to a solid background (usually white), undoing the whole job. Download PNG for graphics and design work; use JPG only when you're placing the result on a known solid background.",
          "For e-commerce: Amazon and most marketplaces require pure white backgrounds rather than transparency — so there, remove the background and re-composite onto white at export time. For design work (logos, stickers, profile cutouts), keep the PNG with alpha.",
        ],
      },
      {
        h2: "Source photos that produce clean results",
        paragraphs: [
          "The model can't invent edges that aren't visible. Even lighting (no harsh shadows across the subject), sharp focus on the subject's edges, and maximum subject-background contrast produce dramatically better cutouts than artistic moody lighting. If you control the shot: plain background, subject well-separated, light from the front.",
          "Resolution matters too: a 400 px source photo gives the model little to work with at the hairline; a 2000 px photo gives it every strand. If the source is small, upscale-quality expectations, not the image — and for product photos, shoot once properly rather than fixing ten images.",
        ],
      },
    ],
    faq: [
      {
        q: "How do I remove a background for free without watermark?",
        a: "Use a browser-based background remover that processes locally: no watermark, no sign-up, no upload. The AI model runs on your device.",
      },
      {
        q: "Are my photos uploaded to a server?",
        a: "No — the AI model runs entirely in your browser. Your images never leave your device, which makes it safe for personal and unreleased photos.",
      },
      {
        q: "What format keeps the transparent background?",
        a: "PNG (or WebP). JPG has no transparency channel and will flatten your cutout onto a solid background.",
      },
      {
        q: "Why does hair look cut off?",
        a: "Fine hair wisps are the hardest segmentation case. Use the restore brush at reduced hardness to paint the wisps back in — the AI gets you 95% there.",
      },
      {
        q: "Can I remove backgrounds in bulk?",
        a: "Yes — process images one after another in the tool; each runs locally. For very large batches, expect it to take as long as your device needs — there's no server queue.",
      },
    ],
    related: ["background-remove-image", "crop-image", "compress-image", "resize-image", "jpg-to-png"],
  },
  {
    slug: "word-to-pdf-conversion-guide",
    title: "How to Convert Word to PDF Free (Fonts Embedded, Layout Intact)",
    shortTitle: "Word to PDF",
    description:
      "Convert Word to PDF free without uploading: why PDFs render identically everywhere, how to keep fonts and layout intact, and the finishing touches (metadata, page numbers, protection) that make output look professional.",
    keyword: "convert word to pdf free",
    keywords: [
      "convert word to pdf free",
      "word to pdf converter online",
      "docx to pdf",
      "save word as pdf",
      "word to pdf no upload",
    ],
    category: "word",
    published: "2026-09-26",
    updated: "2026-09-29",
    author: "FilesWow Team",
    intro: [
      "Word to PDF is the last step of most document workflows — the resume gets submitted as PDF, the contract executed as PDF, the report distributed as PDF. Which makes it strange how often the step is done badly: fonts substituted, images mushed, pagination shifted. This guide covers why PDF is the right distribution format, how to convert without the common defects, and the small finishing touches that separate a converted document from a professional one.",
      "The free Word to PDF tool runs in your browser — your draft contract or resume never touches a server, and conversion works even with non-Latin scripts (Nepali, Hindi, Arabic, Thai, Chinese) because matching Unicode fonts load automatically.",
    ],
    sections: [
      {
        h2: "How to convert Word to PDF — step by step",
        paragraphs: [
          "Under a minute for a typical document.",
        ],
        steps: [
          "Open the free Word to PDF tool in your browser.",
          "Upload your .docx file — it's processed locally, never uploaded.",
          "The tool renders the document with matching fonts (including automatic Unicode font loading for non-Latin scripts) and builds the PDF.",
          "Download the PDF — fonts embedded, layout frozen exactly as rendered.",
        ],
      },
      {
        h2: "Why PDF freezes what Word leaves fluid",
        paragraphs: [
          "A .docx is a living document: its appearance depends on installed fonts, Word version, and printer driver. Send it to ten people and you get ten slightly different renderings — pagination drifts, and a signature line on page 3 for you lands on page 4 for someone else. PDF freezes appearance: one file, one rendering, everywhere, forever. That's why \"please send as PDF\" is the universal closing line of document workflows.",
          "The mechanism that makes it work is font embedding: the PDF carries the glyph programs inside itself, so machines without the font render identically. Non-embedded fonts are the number-one cause of \"it looks different on her computer\" — a faithful converter embeds automatically.",
        ],
      },
      {
        h2: "Fonts and non-English documents",
        paragraphs: [
          "Non-Latin scripts are where naive converters fall apart — Devanagari, Arabic, Thai, and CJK glyphs require font programs most converters don't carry. The browser-based approach here detects the writing scripts in your document and loads matching open-source Unicode fonts on the fly, so a Nepali or Hindi document renders every character correctly — with the fonts fetched to your browser, not your document uploaded anywhere.",
          "For documents that travel, the pragmatic font policy: system-safe fonts (Calibri, Arial, Georgia, Times New Roman) for anything collaborative; distinctive fonts only when you control the export and can verify embedding. And if your brand font refuses to embed, that's usually a desktop-only license — the fix is a webfont-licensed version or a visually similar fallback.",
        ],
      },
      {
        h2: "Finishing touches that look deliberate",
        paragraphs: [
          "Metadata: the PDF inherits your document's properties — set the Title properly before converting (\"Document1\" as a title reads exactly as seriously as it sounds). Page numbers and headers: apply in Word before export, or stamp onto the PDF afterward — the PDF stage guarantees consistency regardless of how the document reflows on other machines. Bookmarks: if the document uses real heading styles, add PDF bookmarks for navigation — the difference between a 40-page document and a usable one.",
          "Protection: for documents going to counterparties, a permissions password blocks editing, and full encryption suits confidential material. And for template-based documents (offer letters, contracts with placeholders), fill the template before converting — the PDF snapshot should capture a finished document, not {{placeholders}} still showing.",
        ],
      },
    ],
    faq: [
      {
        q: "How do I convert Word to PDF for free online?",
        a: "Use a browser-based converter: upload the .docx, and download the PDF. Free, no sign-up, and the document is processed on your device rather than uploaded.",
      },
      {
        q: "Why does my converted PDF look different from Word?",
        a: "Almost always fonts: if the converter doesn't embed the fonts, viewers substitute. A faithful converter embeds automatically — verify with a PDF info check on the output.",
      },
      {
        q: "Does it support Nepali, Hindi, Arabic, or Chinese documents?",
        a: "Yes — the converter detects the writing scripts in your document and loads matching Unicode fonts automatically, so non-Latin text renders correctly.",
      },
      {
        q: "Are my documents uploaded during conversion?",
        a: "No — conversion runs in your browser. Draft contracts and resumes never touch a server.",
      },
      {
        q: "Can I make the PDF smaller after converting?",
        a: "Yes — run it through compression. Word exports often carry full-resolution photos; a Medium pass typically halves the size with no visible change.",
      },
    ],
    related: ["word-to-pdf", "pdf-to-word", "compress-pdf", "protect-pdf", "add-page-numbers-pdf"],
  },
  {
    slug: "pdf-to-jpg-export-images",
    title: "How to Convert PDF to JPG Free (Every Page, High Resolution, or ZIP)",
    shortTitle: "PDF to JPG",
    description:
      "Turn PDF pages into JPG images free: DPI and quality explained, when to pick JPG vs PNG, batch ZIP export, and how to keep text sharp when a page becomes a picture.",
    keyword: "convert pdf to jpg",
    keywords: [
      "convert pdf to jpg",
      "pdf to image converter",
      "pdf to jpg free",
      "pdf to png",
      "export pdf pages as images",
    ],
    category: "pdf",
    published: "2026-09-27",
    updated: "2026-09-29",
    author: "FilesWow Team",
    intro: [
      "Sometimes a page needs to be a picture: a slide for a deck, a preview thumbnail, an image for a chat message, a page that must never be edited. Converting PDF pages to images is the bridge — and doing it well is one decision (DPI) plus one format choice (JPG vs PNG). This guide covers both, the batch workflow for multi-page documents, and the honesty about what's lost when a page becomes a picture.",
      "The free PDF to JPG tool runs in your browser — the PDF is rendered locally and the images are written to your device, nothing uploaded.",
    ],
    sections: [
      {
        h2: "How to convert PDF to JPG — step by step",
        paragraphs: [
          "Thirty seconds for a typical document.",
        ],
        steps: [
          "Open the free PDF to JPG tool in your browser and upload the PDF — rendered locally, never uploaded.",
          "Choose the output quality (DPI): 96–150 DPI for screen use, 300 DPI for print-quality output.",
          "Pick per-page JPGs or a ZIP of all pages for multi-page documents.",
          "Download — each page arrives as an image, written to your device.",
        ],
      },
      {
        h2: "DPI: the one setting that matters",
        paragraphs: [
          "DPI (dots per inch) is the resolution of the rendered image. At 96–150 DPI, a page becomes a screen-friendly image — perfect for slides, chat previews, and web use, and small in bytes. At 300 DPI, the page renders at print quality — four times the pixels of 150, correspondingly larger files. Rendering above 300 DPI is rarely useful: print shops ask for 300, screens can't show more.",
          "The practical rule: match the destination. Screens → 150 DPI. Print → 300 DPI. Zoomable inspection (plans, maps) → 300 DPI regardless, because the point is pixel-level detail.",
        ],
        bullets: [
          "96–150 DPI: slides, chat, web, email previews.",
          "300 DPI: printing, archival, zoom inspection.",
          "Above 300: wasted bytes unless a printer explicitly asks.",
        ],
      },
      {
        h2: "JPG or PNG?",
        paragraphs: [
          "JPG for photographs and scans — its lossy compression is tuned for continuous tones and produces far smaller files. PNG for pages that are mostly text, line art, or screenshots — its lossless compression keeps sharp edges perfectly crisp, where JPG introduces ringing artifacts along text edges.",
          "The catch with either: a page that becomes an image loses its text layer — no selecting, searching, or copying. If the text matters, extract it separately with PDF to Text first, keep both, and use the images for visual contexts only.",
        ],
      },
      {
        h2: "Batch export: the multi-page workflow",
        paragraphs: [
          "For a 40-page document, the ZIP export is the only sane path: one download, every page as an image, files named by page number. If you only need a few pages, extract them first (Extract PDF Pages) and convert the smaller file — faster and less to sort through.",
          "If the goal is actually \"pages as images inside a new PDF\" (flattening for anti-editing), the flow is convert-to-images then rebuild — but the simpler path is flattening the PDF directly, which merges layers into the page content in one step.",
        ],
      },
    ],
    faq: [
      {
        q: "How do I convert PDF to JPG for free?",
        a: "Use a browser-based converter: upload the PDF, choose DPI, download the images or a ZIP. Free, no sign-up, nothing uploaded to a server.",
      },
      {
        q: "What DPI should I choose?",
        a: "150 DPI for screen use (slides, chat, web), 300 DPI for printing or zoom inspection. Above 300 is rarely useful.",
      },
      {
        q: "Why is my exported image blurry?",
        a: "The DPI was too low for the destination, or the source page itself was a low-resolution scan — rendering can't add detail that isn't in the PDF.",
      },
      {
        q: "JPG or PNG for text pages?",
        a: "PNG — its lossless compression keeps text edges crisp. JPG is for photos and scans, where its compression excels.",
      },
      {
        q: "Can I convert every page at once?",
        a: "Yes — choose the ZIP export and all pages arrive as numbered images in one download.",
      },
    ],
    related: ["pdf-to-jpg", "pdf-to-png", "extract-images-from-pdf", "pdf-to-text", "flatten-pdf-form"],
  },
  {
    slug: "resize-image-without-losing-quality",
    title: "How to Resize an Image Without Losing Quality (Free, In Your Browser)",
    shortTitle: "Resize Images",
    description:
      "Resize images free without getting blur: downscale vs upscale physics, the interpolation settings that matter, standard dimension presets for web and social, and batch workflow for whole folders.",
    keyword: "resize image without losing quality",
    keywords: [
      "resize image without losing quality",
      "resize image online free",
      "change image size",
      "scale image",
      "image resizer",
      "reduce image dimensions",
    ],
    category: "image",
    published: "2026-09-28",
    updated: "2026-09-29",
    author: "FilesWow Team",
    intro: [
      "Resizing is the most common image operation on earth — and \"why does my resized photo look blurry?\" is the most common complaint about it. The answer is physics, not bad tools: downscaling throws pixels away (done right, it looks sharp), upscaling invents pixels (never truly lossless). This guide covers what actually happens when dimensions change, the settings that keep downscale results crisp, the standard sizes worth memorizing, and the batch workflow for whole folders.",
      "The free Resize Image tool runs in your browser — photos stay on your device even while being processed in bulk.",
    ],
    sections: [
      {
        h2: "How to resize an image — step by step",
        paragraphs: [
          "The core flow, with the one setting most people miss.",
        ],
        steps: [
          "Open the free Resize Image tool in your browser and drop in your image — processed locally.",
          "Enter new dimensions, or pick a preset (web, social, print sizes). Lock the aspect ratio unless you deliberately want distortion.",
          "Choose how to fit: stretch (distorts), fit-within (adds no bars, may leave smaller result), or crop-to-fill (fills exactly, trims edges).",
          "Download — the resized image is written to your device.",
        ],
      },
      {
        h2: "Downscale vs upscale: the honest physics",
        paragraphs: [
          "Downscaling (fewer pixels) discards information, and done with proper interpolation the result looks sharp — the algorithm averages neighboring pixels rather than just dropping them. Shrinking to 50% or 25% is mathematically clean; odd ratios like 73% can introduce faint aliasing on fine patterns, which a well-implemented resampler handles.",
          "Upscaling (more pixels) invents information — the algorithm interpolates between existing pixels, and the result is inevitably softer than a native image of that size. Modern browsers use smooth interpolation that's fine for a 2× bump, but there is no free lunch: a 400 px thumbnail cannot become a sharp 2000 px hero image. If an image must be bigger, re-shoot or re-export from the source at higher resolution — that's the only true fix.",
        ],
      },
      {
        h2: "Dimensions worth memorizing",
        paragraphs: [
          "The web runs on a handful of standard sizes. Blog content width: 1200–1600 px. Full-width hero images: 1920 px. Social: Instagram post 1080×1080 (or 1080×1350 portrait), stories/reels 1080×1920, Twitter/X 1600×900, LinkedIn 1200×627. Thumbnails: 400–800 px. Email: 600–800 px wide.",
          "For web performance the dimension matters less than the match: an image displayed at 800 px should be an 800 px file, not a 4000 px original leaving the browser to scale — that's wasted bytes and slower loads. Resize to display size first, then compress; the order saves twice.",
        ],
        bullets: [
          "Blog/body images: 1200–1600 px wide.",
          "Hero/full-width: 1920 px.",
          "Instagram post: 1080×1080 · Story/Reel: 1080×1920.",
          "Resize to display size, then compress.",
        ],
      },
      {
        h2: "Batch resizing a whole folder",
        paragraphs: [
          "For a folder of photos going to a website: resize all to the target width first, then batch-convert to WebP at 80–85% quality, and download as a ZIP. The folder typically drops 80–90% in total size with no visible difference — the single highest-leverage optimization for web images.",
          "Keep the originals. Resizing is cheap to redo; a downscaled original is gone forever. The pattern is the same as compression: process a copy, archive the source.",
        ],
      },
    ],
    faq: [
      {
        q: "How do I resize an image without losing quality?",
        a: "Downscale with proper interpolation — the result stays sharp. Avoid upscaling beyond ~2×, which invents pixels and softens the image. Resize to the exact display size for the crispest result.",
      },
      {
        q: "Why does my resized image look blurry?",
        a: "Either it was upscaled (invented pixels are always softer) or it was compressed aggressively after resizing. Resize to display size, then compress at 80–85% quality.",
      },
      {
        q: "How do I resize multiple images at once?",
        a: "Batch tools process a folder in one pass — set the target width once, download all results as a ZIP.",
      },
      {
        q: "What size should images be for my website?",
        a: "Match the display size: 1200–1600 px for content columns, 1920 px for full-width heroes. An image displayed at 800 px should be an 800 px file.",
      },
      {
        q: "Does resizing change the file format?",
        a: "No — resizing changes dimensions; format is a separate choice. Convert to WebP after resizing for the biggest web savings.",
      },
    ],
    related: ["resize-image", "compress-image", "crop-image", "batch-converter", "bulk-images-to-doc"],
  },
  {
    slug: "protect-pdf-with-password",
    title: "How to Password-Protect a PDF (Encrypt Free, In Your Browser)",
    shortTitle: "Password-Protect PDF",
    description:
      "Add a password to a PDF free: AES-256 encryption explained, open password vs permissions password, how strong your password should be, and the mistakes that make PDF protection useless.",
    keyword: "password protect pdf",
    keywords: [
      "password protect pdf",
      "encrypt pdf free",
      "add password to pdf",
      "lock pdf file",
      "secure pdf online",
      "pdf encryption",
    ],
    category: "pdf",
    published: "2026-09-29",
    updated: "2026-09-29",
    author: "FilesWow Team",
    intro: [
      "A PDF with a password is one of the few file protections normal people interact with weekly — payslips, contracts, scanned IDs. But \"password protect\" actually means two different things (opening vs permissions), and doing it wrong produces a false sense of security. This guide covers both password types, what AES-256 encryption actually protects against, the password strength that matters, and the mistakes that quietly undo the protection.",
      "The free Protect PDF tool runs in your browser — the document is encrypted locally with AES-256 and never uploaded, so even the protection step keeps your file private.",
    ],
    sections: [
      {
        h2: "How to password-protect a PDF — step by step",
        paragraphs: [
          "One minute, entirely on your device.",
        ],
        steps: [
          "Open the free Protect PDF tool in your browser and load your document — processed locally, never uploaded.",
          "Enter your password. Use a long passphrase (see below) — this is the actual security, not the encryption.",
          "Choose the protection type: open password (required to open the file), permissions password (controls printing/copying/editing), or both.",
          "Download the encrypted PDF. It's AES-256 encrypted on your device.",
        ],
      },
      {
        h2: "Open password vs permissions password",
        paragraphs: [
          "An open password (user password) is what most people mean: the file cannot be opened without it. This is the right choice for sending payslips, ID scans, or contracts over email — the email account can be compromised; the attachment stays encrypted.",
          "A permissions password (owner password) is different: the file opens freely, but printing, copying text, or editing are restricted. Important honesty: permissions are enforced by the PDF reader's good behavior, not by cryptography — a determined user with tools can strip them. Use permissions for politeness (discouraging edits), never for secrecy. For actual confidentiality, the open password is the real lock.",
        ],
        bullets: [
          "Open password = real encryption; file unreadable without it.",
          "Permissions = reader-enforced etiquette, not security.",
          "Both can be combined; the open password is what protects content.",
        ],
      },
      {
        h2: "What AES-256 actually protects against",
        paragraphs: [
          "AES-256 is the same standard used for state secrets — the mathematics is not the weak point. The password is. Encryption strength is capped by password strength: \"Fluffy2024!\" falls to a dictionary attack in minutes regardless of the cipher. The fix is length: a four-word passphrase (\"harbor-canyon-velvet-train\") is exponentially harder to brute-force than a short complex one and easier to type correctly on the first try.",
          "Share the password through a different channel than the file: document by email, password by phone or text. Same-channel delivery (both in one email) means whoever intercepts one gets both — the protection evaporates.",
        ],
      },
      {
        h2: "The mistakes that undo the protection",
        paragraphs: [
          "Three common ones. Sending file and password together — split the channels. Passwords in the filename (\"contract-Password123.pdf\") — the filename travels with the file everywhere. And assuming protection survives extraction: if the recipient can open the file, they can print, re-scan, or screenshot the content — encryption protects the file in transit and at rest, not the content once it's opened by an authorized person. For content that must not circulate, watermarks and redaction do work encryption can't.",
          "Related: metadata survives encryption (it's encrypted too, but remember it's in there), while comments and form data may or may not be included depending on how the document was prepared — run the metadata stripper before encrypting if the properties contain anything sensitive.",
        ],
      },
    ],
    faq: [
      {
        q: "How do I password-protect a PDF for free?",
        a: "Use a browser-based protection tool: load the PDF, set the password, download the encrypted file. AES-256 encryption happens on your device — nothing uploads.",
      },
      {
        q: "What encryption is used?",
        a: "AES-256 — the industry standard, the same cipher approved for top-secret government data. The password you choose is the real variable in the security.",
      },
      {
        q: "Can a protected PDF be unlocked without the password?",
        a: "Not meaningfully with AES-256. Tools that \"remove PDF passwords\" require you to know the password — they remove protection after authenticating, not break it.",
      },
      {
        q: "Should I use the same password for every PDF?",
        a: "No — reuse means one leak unlocks everything. A passphrase pattern unique per document (or a password manager) keeps it manageable.",
      },
      {
        q: "How do I remove a password from a PDF later?",
        a: "Open the file with its password in the Unlock PDF tool — it removes protection after verifying you have it, giving you a clean copy.",
      },
    ],
    related: ["protect-pdf", "unlock-pdf", "pdf-metadata-stripper", "redact-pdf", "sign-pdf"],
  },
  {
    slug: "edit-pdf-online-free",
    title: "How to Edit a PDF Online Free (Add Text, Images, Shapes, Signatures)",
    shortTitle: "Edit PDFs",
    description:
      "Edit PDF documents free in your browser: add text and images to any page, draw shapes and highlights, white-out mistakes, and when direct editing beats converting to Word first.",
    keyword: "edit pdf online free",
    keywords: [
      "edit pdf online free",
      "pdf editor",
      "add text to pdf",
      "change pdf document",
      "white out pdf",
      "modify pdf free",
    ],
    category: "pdf",
    published: "2026-09-29",
    updated: "2026-09-29",
    author: "FilesWow Team",
    intro: [
      "\"Edit PDF\" covers a range of jobs — from fixing a date on a contract to adding images and annotations to a draft — and the right approach depends on which job you have. The surprise for most people: PDFs are not editable documents by nature; they're a fixed rendering format. Editing means adding new content on top (or covering what's there), and modern browser tools make that fast and free. This guide covers what's possible, the step-by-step, and the judgment call between editing directly and converting to Word first.",
      "The free Edit PDF tool runs entirely in your browser — the document never uploads, which is why it's the right choice for contracts and confidential files.",
    ],
    sections: [
      {
        h2: "How to edit a PDF online — step by step",
        paragraphs: [
          "Adding text, images, and shapes takes seconds per change.",
        ],
        steps: [
          "Open the free Edit PDF tool in your browser and load your document — processed locally.",
          "Add text: click anywhere on the page, type, and adjust font size and color. The text is placed as an overlay at that position.",
          "Add images (logos, stamps, photos): place and scale them anywhere on the page.",
          "Draw shapes, lines, and freehand highlights to emphasize or annotate.",
          "Download the edited PDF — new content is merged into the document on your device.",
        ],
      },
      {
        h2: "What PDF editing can and can't do",
        paragraphs: [
          "Honest scope: browser PDF editing adds and covers; it doesn't reflow. You can place new text at any position (the fix for a wrong date, a missing name, a corrected figure), place images, draw, highlight, and white-out areas that need to disappear. What it can't do is re-type a paragraph and have the following text re-flow around it — PDF has no flowing text; everything is positioned.",
          "That's why the right first question is: is this a touch-up or a rewrite? Touch-up (dates, names, small corrections, signatures, stamps) — edit the PDF directly; the original formatting stays pristine. Rewrite (changing several paragraphs, restructuring) — convert to Word, edit there where text flows, and export back to PDF. Choosing wrong is what makes people hate PDF editing.",
        ],
      },
      {
        h2: "White-out: covering content the right way",
        paragraphs: [
          "Covering a mistake is placing a filled rectangle over it — but color-match matters: sample the page background color so the patch is invisible. On white pages that's trivial; on textured or colored backgrounds, pick the color from the page itself with a color picker.",
          "One warning with real consequences: covering content visually is not redaction. The underlying text still exists in the file — anyone with a text-selection tool can read what's under the white box. If content must truly be removed (SSNs, account numbers, names in a shared document), use the Redact PDF tool, which deletes the underlying content, not just its appearance.",
        ],
      },
      {
        h2: "The touch-up vs rewrite decision",
        paragraphs: [
          "A rule of thumb that saves hours: fewer than three changes and no paragraph rewrites — edit the PDF directly. More than three changes, or any paragraph-level rewriting — convert to Word, edit, convert back. The crossover exists because direct editing is positional (fast for surgical changes, tedious for flowing text), while Word editing is textual (fast for rewrites, but conversion adds round-trip risk).",
          "Either way, finish with the same checks: metadata (set the Title before sending), page numbers if pages were added, and a final read on a different device if the document matters.",
        ],
      },
    ],
    faq: [
      {
        q: "How do I edit a PDF for free without Adobe?",
        a: "Use a browser-based PDF editor: add text, images, shapes, and highlights directly on the page, then download. Free, no account, and the file is processed on your device.",
      },
      {
        q: "Can I edit the existing text in a PDF?",
        a: "You can cover it and replace it visually (white-out + new text), but PDF text isn't reflowable. For paragraph-level changes, convert to Word first.",
      },
      {
        q: "Is white-out the same as redaction?",
        a: "No — white-out covers the appearance; the text remains in the file and can be selected. Redaction removes the underlying content permanently. Use redaction for anything sensitive.",
      },
      {
        q: "Is it safe to edit confidential PDFs online?",
        a: "With a browser-based editor, yes — the document never leaves your device. Upload-based editors transmit your file to their servers.",
      },
      {
        q: "When should I convert to Word instead?",
        a: "When you're rewriting paragraphs or restructuring content — text flows in Word. For dates, names, signatures, and small fixes, edit the PDF directly.",
      },
    ],
    related: ["edit-pdf", "sign-pdf", "redact-pdf", "pdf-to-word", "flatten-pdf-form"],
  },
  {
    slug: "crop-image-online-guide",
    title: "How to Crop an Image Online Free (Perfect Ratios, No Quality Loss)",
    shortTitle: "Crop Images",
    description:
      "Crop images free in your browser: aspect ratios explained (1:1, 4:5, 16:9), crop-to-fill vs fit, passport-size and platform presets, and why cropping never reduces sharpness.",
    keyword: "crop image online free",
    keywords: [
      "crop image online free",
      "image cropper",
      "crop photo",
      "aspect ratio crop",
      "crop to 1:1",
      "passport photo crop",
    ],
    category: "image",
    published: "2026-09-28",
    updated: "2026-09-29",
    author: "FilesWow Team",
    intro: [
      "Cropping is composition — the cheapest way to turn a snapshot into a deliberate image. But between platform aspect ratios, print sizes, and the fear of \"losing quality\", most people crop by trial and error. This guide covers the ratios that actually matter, the crop-to-fill vs fit decision, quality physics (cropping never reduces sharpness — done right, it improves perceived sharpness), and the specific workflows: profile photos, e-commerce, passport sizes.",
      "The free Crop Image tool runs in your browser — your photos stay on your device.",
    ],
    sections: [
      {
        h2: "How to crop an image — step by step",
        paragraphs: [
          "The flow, plus the ratio lock that makes results predictable.",
        ],
        steps: [
          "Open the free Crop Image tool in your browser and load the image — processed locally.",
          "Choose a ratio: freehand, or lock to 1:1, 4:5, 16:9, or a custom value. The ratio lock keeps every crop consistent.",
          "Drag the crop box to frame the subject — for portraits, eyes at the upper third line reads best.",
          "Apply and download. Cropping re-encodes at the original resolution — no sharpness is lost.",
        ],
      },
      {
        h2: "Aspect ratios that actually matter",
        paragraphs: [
          "1:1 square — profile photos, Instagram grid, e-commerce thumbnails. 4:5 portrait — Instagram feed posts (more screen space than square). 16:9 — YouTube thumbnails, web heroes, presentation slides. 3:2 and 4:3 — classic photo prints and photo frames. 2:3 — 4×6 prints (the standard print size).",
          "The rule behind the numbers: match the ratio to the destination, crop once. Cropping to 1:1 for a profile photo that displays at 400 px means you should keep the crop's longest side ≥ 400 px — crop wide, display small, and the image stays sharp everywhere it's used.",
        ],
        bullets: [
          "1:1 — profiles, product thumbnails.",
          "4:5 — Instagram feed.",
          "16:9 — YouTube, heroes, slides.",
          "2:3 — 4×6 prints.",
        ],
      },
      {
        h2: "Does cropping reduce quality?",
        paragraphs: [
          "No — and understanding why removes the fear. Cropping selects a region of existing pixels; it doesn't touch them. The cropped image contains a subset of the original pixels at their original sharpness. What people perceive as \"quality loss\" is usually one of two things: cropping so aggressively that the remaining region is too small for its destination (a 200 px crop displayed at 800 px looks soft because it's being upscaled — the fix is a less aggressive crop or a higher-resolution source), or over-compressing after the crop.",
          "The practical guidance: keep the cropped result's dimensions at or above the display size, and compress after cropping only as needed. Done in that order, a crop is resolution-neutral.",
        ],
      },
      {
        h2: "Specific workflows: profiles, products, documents",
        paragraphs: [
          "Profile photos: square 1:1, subject centered with small margin, eyes on the upper-third line. Products for marketplaces: 1:1 with the product filling 85% of the frame on white — most marketplaces reject busy backgrounds, so remove the background first, then crop to square. Passport/ID photos: the crop ratio is regulated (35×45 mm for most countries) — crop to the ratio, keep head height within the specified band, and use a plain background.",
          "For documents photographed at an angle, cropping is half the fix: crop tightly to the document, then square the text lines with rotation — the combination turns a casual photo into a readable scan.",
        ],
      },
    ],
    faq: [
      {
        q: "How do I crop an image for free online?",
        a: "Use a browser-based cropper: load the image, drag the crop box (lock a ratio if you need consistency), apply, download. Free, no upload, no watermark.",
      },
      {
        q: "What aspect ratio should I use for Instagram?",
        a: "4:5 for feed posts (maximum screen space), 1:1 for profile photos, 9:16 for stories and reels.",
      },
      {
        q: "Does cropping reduce image quality?",
        a: "No — cropping selects pixels, it doesn't change them. Apparent quality loss comes from over-cropping (too few pixels left for the display size) or re-compression.",
      },
      {
        q: "How do I crop a passport photo?",
        a: "Crop to 35×45 mm equivalent ratio with head height in the required band. A plain background and even lighting matter as much as the crop.",
      },
      {
        q: "Can I crop and resize in one step?",
        a: "Yes — crop first for composition, then resize to the exact display dimension. The order keeps the most pixels.",
      },
    ],
    related: ["crop-image", "resize-image", "compress-image", "background-remove-image", "rotate-image"],
  },
  {
    slug: "convert-word-to-pdf-vs-export",
    title: "Word to PDF: Export Directly or Convert Online? (And When Each Wins)",
    shortTitle: "Export vs Convert",
    description:
      "You can export PDF from Word itself or convert the .docx online — which is better? Font embedding, fidelity, privacy, and speed compared honestly, plus the workflow for non-English documents.",
    keyword: "word to pdf converter",
    keywords: [
      "word to pdf converter",
      "export word to pdf",
      "docx to pdf online",
      "best word to pdf converter",
      "word to pdf without word",
    ],
    category: "word",
    published: "2026-09-29",
    updated: "2026-09-29",
    author: "FilesWow Team",
    intro: [
      "There are two roads from Word to PDF, and people argue about them like sports teams. The honest answer: both are correct for different situations. Exporting from Word itself gives the highest fidelity when you have Word and the document's fonts. Converting online wins when you don't have Word (phone, Chromebook, borrowed laptop), when the document uses scripts your Word install can't render properly, or when privacy rules out uploading — because a browser-based converter processes the file on your device. This guide compares them honestly across fidelity, fonts, privacy, and speed.",
      "The free Word to PDF converter used here runs in the browser with automatic Unicode font loading for non-Latin scripts — the case where it beats desktop export outright.",
    ],
    sections: [
      {
        h2: "The two paths, honestly compared",
        paragraphs: [
          "Desktop export (Word's own \"Save as PDF\"): highest fidelity when you have Word and the document's fonts installed — Word's layout engine renders its own document perfectly, and font embedding is checkbox-simple. Weaknesses: requires Word (paid), requires the fonts, and the output inherits whatever fonts/settings the machine has.",
          "Browser-based conversion: no Word needed, works on any device, processes locally so nothing uploads, and handles non-Latin scripts by fetching open-source Unicode fonts automatically (the document itself stays on your device — only font files download). Weakness: complex desktop layouts (precise text boxes, exotic fonts) may shift slightly, because the converter reconstructs the document rather than rendering it with Word's engine.",
        ],
        bullets: [
          "Have Word + fonts → export directly, full fidelity.",
          "No Word / on a phone → browser converter.",
          "Nepali/Hindi/Arabic/Thai/Chinese documents → browser converter with Unicode font loading.",
          "Confidential documents you won't upload → browser converter (local processing).",
        ],
      },
      {
        h2: "Fonts decide quality more than the converter does",
        paragraphs: [
          "Either path fails identically when fonts are missing: characters substitute, metrics shift, line breaks cascade, pagination drifts. The font checker tells you which fonts a document actually uses before you convert anything — and the PDF-info pass on the output confirms they embedded.",
          "The pragmatic policy: system-safe fonts (Calibri, Arial, Georgia, Times New Roman) for anything that travels; distinctive fonts only when you control the export and can verify embedding. And license-restricted \"desktop-only\" fonts may refuse to embed in any tool — that's a licensing wall, not a converter bug.",
        ],
      },
      {
        h2: "Privacy: the dimension nobody prices",
        paragraphs: [
          "Desktop export keeps the document local by definition. Online conversion splits into two architectures: upload-based services transmit your document to their servers (fine for a menu, not for a contract with salaries), and browser-based converters process the file on your device — the network only fetches the tool's code and, when needed, open-source font files.",
          "For resumes, contracts, medical and legal documents, the local-processing option is strictly better: same result, zero transit. And it runs on machines without Word, which is how most \"I need this as a PDF right now\" situations actually happen.",
        ],
      },
      {
        h2: "The finishing pass (either path)",
        paragraphs: [
          "Whatever produced the PDF, the finishing moves are the same: set the document Title in the PDF metadata (\"Document1\" reads exactly as seriously as it sounds), add page numbers if pages were added or reordered, add bookmarks if the document is long, and protect with a permissions password if the recipient shouldn't edit it.",
          "And the pre-flight for print destinations: check the fonts embedded, zoom to 200% on representative pages, verify page count and margins — two minutes that beat a reprint every time.",
        ],
      },
    ],
    faq: [
      {
        q: "Is it better to export PDF from Word or convert online?",
        a: "Export from Word when you have Word and the fonts — highest fidelity. Convert online when you don't have Word, on phones or Chromebooks, for non-Latin scripts, or when you can't upload the document (browser tools process locally).",
      },
      {
        q: "How do I convert Word to PDF without Microsoft Word?",
        a: "Use a browser-based converter — it renders the .docx and writes the PDF on your device. Works on any computer, phone, or Chromebook.",
      },
      {
        q: "Why do my fonts look wrong in the converted PDF?",
        a: "The document used fonts that weren't available or didn't embed. Check which fonts the document uses first, and prefer system-safe fonts for documents that travel.",
      },
      {
        q: "Are online Word-to-PDF converters safe?",
        a: "Browser-based ones are — the document is processed on your device and never uploaded. Upload-based services transmit your file to their servers; avoid those for confidential material.",
      },
      {
        q: "Can I convert Word to PDF on my phone?",
        a: "Yes — a browser-based converter works in any mobile browser, with the same font handling as desktop.",
      },
    ],
    related: ["word-to-pdf", "word-font-checker", "pdf-info-viewer", "protect-pdf", "add-page-numbers-pdf"],
  },
  {
    slug: "add-page-numbers-to-pdf",
    title: "How to Add Page Numbers to a PDF (Free, Any Format, Any Position)",
    shortTitle: "Add Page Numbers",
    description:
      "Add page numbers to a PDF free in your browser: position and format options (Page X of Y, starting numbers, skip the cover), Bates numbering for legal work, and headers/footers with dates.",
    keyword: "add page numbers to pdf",
    keywords: [
      "add page numbers to pdf",
      "pdf page numbers",
      "insert page numbers pdf",
      "page x of y pdf",
      "bates numbering",
      "pdf footer page number",
    ],
    category: "pdf",
    published: "2026-09-29",
    updated: "2026-09-29",
    author: "FilesWow Team",
    intro: [
      "Page numbers look trivial and then generate surprisingly specific requirements: \"start numbering from page 2\", \"format: Page 3 of 17\", \"bottom-center, but skip the cover\", \"Bates numbers for the court filing\". All of it is doable in a browser for free — this guide covers the standard numbering workflow, the format and position choices that matter, and the legal-document variant (Bates numbering) that has its own rules.",
      "The free Add Page Numbers tool runs entirely in your browser — the document never uploads.",
    ],
    sections: [
      {
        h2: "How to add page numbers — step by step",
        paragraphs: [
          "The standard flow, with the skip-the-cover trick.",
        ],
        steps: [
          "Open the free Add Page Numbers tool in your browser and load the PDF — processed locally.",
          "Choose position: bottom-center is the default convention; bottom-right reads naturally in reports; top-right suits handouts.",
          "Choose the format: plain numbers, \"Page X\", or \"Page X of Y\" — the last is best for contracts (missing pages become obvious).",
          "Set the starting number — use 0 on a cover page so numbering lands \"1\" on the first content page, or start at 2 on page 2 to skip the cover visually.",
          "Download the numbered PDF, written to your device.",
        ],
      },
      {
        h2: "Position and format conventions",
        paragraphs: [
          "Bottom-center is the safe default — it's where readers look and it never collides with content margins. Bottom-right suits documents that will be hole-punched (the left margin is punched away; the right survives). Top-right works for handouts and decks printed one-sided. Margin placement matters: numbers inside the printer's non-printable zone (~5 mm) get clipped — keep them at least 10 mm from the paper edge.",
          "Format conventions worth following: contracts and legal documents want \"Page X of Y\" (completeness is verifiable), reports want plain numbers with a section prefix if the document is assembled from parts, and any document that will be printed double-sided wants mirrored positions (outside edges) — which is why print shops ask for the \"mirror margins\" setting.",
        ],
      },
      {
        h2: "Bates numbering for legal documents",
        paragraphs: [
          "Bates numbering is the legal-industry standard: every page gets a unique sequential identifier, typically a prefix plus zero-padded number (\"ABC-000123\"). The point is unambiguous reference — \"see ABC-000417\" identifies exactly one page across an entire production of thousands. Courts and opposing counsel expect it; ad-hoc numbering creates disputes about which page is which.",
          "The Bates tool handles the mechanics: prefix, start number, and zero-padding are configurable, and the numbers are stamped permanently into the page content. Set the padding to match your document count (4 digits for anything under 10,000 pages) so every number sorts identically in references and databases.",
        ],
      },
      {
        h2: "Headers, footers, and dates",
        paragraphs: [
          "Page numbers are one resident of the footer; the Add Header & Footer tool handles the full set: document titles, confidentiality notices (\"CONFIDENTIAL — internal use only\"), version identifiers, and dates. The classic combination for business documents: title left, date center, page number right — all in one pass.",
          "One workflow note: number pages after assembling, not before. If a document is merged from parts, each part's internal numbering is wrong for the whole — stamp numbers on the merged result and the sequence is correct by construction. The same logic applies to table-of-contents pages: generate them after final pagination, or they'll describe a document that no longer exists.",
        ],
      },
    ],
    faq: [
      {
        q: "How do I add page numbers to a PDF for free?",
        a: "Use a browser-based numbering tool: choose position and format, set the starting number, download. Free, no sign-up, nothing uploaded.",
      },
      {
        q: "How do I skip the cover page when numbering?",
        a: "Set the starting number so the cover is unnumbered: either start at 2 on the second page, or give the cover 0 so the first content page reads 1.",
      },
      {
        q: "What does \"Page X of Y\" do?",
        a: "It stamps the total page count into every footer (\"Page 3 of 17\") so completeness is verifiable — the standard for contracts and legal documents.",
      },
      {
        q: "What is Bates numbering?",
        a: "The legal standard: every page gets a unique prefix + sequential number (\"ABC-000123\") so any page can be referenced unambiguously across thousands of pages.",
      },
      {
        q: "Will page numbers overlap my content?",
        a: "Numbers are placed in the page margin — choose a position and offset that avoids content. Bottom-center with a 10 mm+ offset is safe for nearly every document.",
      },
    ],
    related: ["add-page-numbers-pdf", "pdf-header-footer", "pdf-bates-numbering", "merge-pdf", "pdf-page-labels"],
  },
];

// ── Dev-time validation: related slugs must exist in the tool catalog ──
if (process.env.NODE_ENV !== "production") {
  const known = new Set(ALL_TOOLS.map((t) => t.slug));
  const broken: string[] = [];
  for (const post of BLOG_POSTS) {
    for (const slug of post.related) {
      if (!known.has(slug)) broken.push(`${post.slug} → ${slug}`);
    }
  }
  if (broken.length > 0) {
    throw new Error(`[blog] Related tool slugs not in catalog: ${broken.join(", ")}`);
  }
}

/** Look up a blog post by slug. */
export function getBlogPostBySlug(slug: string): BlogPost | null {
  return BLOG_POSTS.find((p) => p.slug === slug) ?? null;
}

/** Canonical URL for a blog post page. */
export function blogUrl(slug: string): string {
  return absoluteUrl(`/blog/${slug}`);
}

/** Canonical URL for the blog index. */
export function blogIndexUrl(): string {
  return absoluteUrl("/blog");
}

/** Reading time in minutes, computed from the post's own content. */
export function blogReadingMinutes(post: BlogPost): number {
  const words = [
    ...post.intro,
    ...post.sections.flatMap((s) => [
      ...s.paragraphs,
      ...(s.bullets ?? []),
      ...(s.steps ?? []),
    ]),
    ...post.faq.map((f) => `${f.q} ${f.a}`),
  ].join(" ").split(/\s+/).length;
  return Math.max(3, Math.round(words / 220));
}
