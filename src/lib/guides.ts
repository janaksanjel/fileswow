// lib/guides.ts — editorial guides: in-depth articles per category.
//
// Each guide is a standalone article (1,500+ words) that answers real questions
// searchers have about the category. `related` slugs are validated against the
// tool catalog in dev (see dev checks at the bottom), so a renamed tool can't
// leave a dead link behind.

import { ALL_TOOLS } from "./catalog";
import { absoluteUrl } from "./site";

export type GuideSection = {
  h2: string;
  paragraphs: string[];
  /** Optional bulleted list rendered after the paragraphs. */
  bullets?: string[];
};

export type Guide = {
  slug: string;
  title: string;
  /** Short description used in meta description, cards, and JSON-LD. */
  description: string;
  category: "pdf" | "word" | "image" | "text";
  /** ISO date of last substantive update. */
  updated: string;
  /** Reading time is computed from content at build time — not stored. */
  intro: string[];
  sections: GuideSection[];
  faq: { q: string; a: string }[];
  /** Tool slugs cross-linked at the end of the article. */
  related: string[];
};

export const GUIDES: Guide[] = [
  {
    slug: "how-to-merge-pdf-files",
    title: "How to Merge PDF Files Without Losing Quality",
    description:
      "A complete walkthrough of combining PDFs: why page sizes collide, how to keep quality intact, ordering strategies for reports and scans, and the mistakes that ruin merged documents.",
    category: "pdf",
    updated: "2026-09-28",
    intro: [
      "Merging PDFs is the most common document operation after printing, and the one with the most ways to go subtly wrong. The obvious version — drop files into a tool, click combine — works until it doesn't: page sizes fight each other, bookmarks point nowhere, a 30 MB photo scan bloats a 2 MB report. This guide covers what actually happens when PDFs are combined, how to prepare files so the result behaves, and the workflows (reports, scan packets, contract assemblies) where a little ordering discipline saves hours.",
      "One ground rule first: a proper merge is a structural operation, not a re-render. The pages of each source document are copied into a new container, byte-for-byte where possible. That's why a good merge leaves text selectable, images at original resolution, and fonts embedded exactly as they were. Tools that 'flatten' pages into images during a merge are destroying quality for no reason — and if you've ever merged and then couldn't select text, that's what happened.",
    ],
    sections: [
      {
        h2: "What actually happens when you merge PDFs",
        paragraphs: [
          "A PDF is not a scroll of pages; it's a graph of objects — page objects, font programs, image streams, annotation lists — tied together by a cross-reference table. Merging means building a new graph and pulling each source's page objects into it, remapping every internal reference so page 3's links still point to page 3's resources. When the tool does this correctly, the output is indistinguishable from a document authored as one file: same text layer, same image data, same vector crispness.",
          "The two classic failure modes come from tools that skip this care. The first is rasterization — rendering each page to a picture and wrapping the pictures in a new PDF. File size explodes, text stops being selectable, and print quality drops to the render DPI. The second is resource collision: two source documents both reference 'Font-Arial' but embed different versions, and a careless merge keeps one and breaks the other, producing the infamous wrong-glyphs page. Client-side merges with pdf-lib handle the remapping correctly precisely because nothing is re-rendered and resources are namespaced per source.",
        ],
      },
      {
        h2: "Page sizes: the mismatch nobody plans for",
        paragraphs: [
          "Merge a Letter-sized contract with an A4 spreadsheet and the combined file contains both sizes. That's not a bug — PDF explicitly supports mixed page geometry, and professional print shops handle it routinely. The real question is what you want the output to be. For digital distribution, mixed sizes are fine: viewers display each page natively. For printing, mixed sizes cause scaling surprises: the print driver fits each page to the paper, so an A4 page printed on Letter shrinks slightly and shifts margins.",
          "If the destination is print, normalize first. Two paths: resize the odd pages to match the majority before merging (Resize PDF Page maps content onto new dimensions with vector scaling, so text stays sharp), or merge first and resize the whole document after — cleaner when most pages already match. What you should not do is crop pages to force a match: cropping hides content rather than rescaling it, and trimmed margins become permanent losses in the printed result.",
        ],
      },
      {
        h2: "Ordering strategy: assemble like you'd present",
        paragraphs: [
          "The merge order is the table of contents of your packet, and the cheapest time to get it right is before merging. A workable discipline: cover first, then front matter (TOC, summary), then body sections in the order a reader meets them, appendices last. Drag-and-drop reordering in the merge queue beats renaming files with number prefixes — though numbered filenames (01-intro, 02-body) remain the reliable trick when the file list comes from a folder scan.",
          "Two ordering details bite people constantly. First, the table of contents problem: if your TOC page was generated from an earlier draft, its page numbers describe the old file, not the merged one. Merge the TOC last, regenerate it, and re-merge — or add a TOC to the finished packet with page-number stamps. Second, scan order: scanners that feed from a tray often output pages bottom-of-stack-first, so a two-sided scan can arrive reversed. Flip the order of those pages before or after merging (drag in the visual organizer) rather than re-scanning.",
        ],
        bullets: [
          "Cover and title pages go first — they set the document's identity.",
          "Front matter (TOC, executive summary) follows, generated last in practice.",
          "Body sections in reading order; appendices and forms at the end.",
          "Mixed orientations are fine; mixed sizes are fine digitally, risky in print.",
        ],
      },
      {
        h2: "Keeping quality: what to check after any merge",
        paragraphs: [
          "Three spot-checks catch nearly every merge defect in under a minute. Text: open the result, select a sentence from each source document's section, and copy it — if the selection highlights and the clipboard holds real words, the text layer survived. Images: zoom to 200% on a page from the heaviest photo source; visible recompression softness means the tool re-encoded when it shouldn't have. Navigation: click a bookmark or internal link from the first document; broken targets mean references weren't remapped.",
          "Size is the other tell. If the merged file is dramatically larger than the sum of its sources, fonts and images are being duplicated instead of shared — or the tool rasterized. If it's dramatically smaller, content may have been dropped. A healthy merge lands close to the combined size of the inputs, with run-through-compression available when the target is email limits.",
        ],
      },
      {
        h2: "Workflows: three merges people actually do",
        paragraphs: [
          "The report packet: chapter files from multiple authors, plus a cover and summary. Merge in reading order, then run the TOC/page-number pass on the combined file — numbering pages after assembly avoids the renumber-every-chapter treadmill. The scan cleanup: photos or scans of a signed contract, one page per shot. Straighten and crop each image first, convert to PDF, then merge; the merged result is where a uniform page size pays off in printing. The signature loop: a contract that needs one inserted signature page. Extract nothing — insert the signed page at the right position and re-download; inserting at a position is safer than re-merging everything because the surrounding pages are untouched.",
          "Each of these is doable with any competent merge tool, but they share a principle worth naming: assemble from clean parts. Fix rotation, size, and quality at the page level first, then combine. Cleaning up after a merge means redoing the merge; cleaning up before it means one pass.",
        ],
      },
    ],
    faq: [
      {
        q: "Will merging PDFs reduce quality?",
        a: "No — a structural merge copies page content without re-rendering, so text, images, and fonts arrive exactly as they were. Quality drops only with tools that rasterize pages into images during the merge.",
      },
      {
        q: "Can I merge a PDF with a password-protected PDF?",
        a: "Remove the password from the protected file first. The merger can only read documents that open without a prompt.",
      },
      {
        q: "How many files can I merge at once?",
        a: "There's no server, so the practical limit is your device's memory. Dozens of normal documents are routine; hundreds of image-heavy scans may need batching.",
      },
      {
        q: "Why is my merged PDF bigger than the originals combined?",
        a: "Each source embeds its own fonts and resources, and duplicates add up. Running the result through compression usually recovers most of it when size matters.",
      },
      {
        q: "Do bookmarks and links survive a merge?",
        a: "Internal links generally do; cross-document links break because their targets move. Bookmark outlines may not carry over — add fresh bookmarks to the merged file if navigation matters.",
      },
    ],
    related: ["merge-pdf", "organize-pdf", "resize-pdf-page", "compress-pdf", "add-page-numbers-pdf"],
  },
  {
    slug: "compress-pdf-guide",
    title: "How to Compress a PDF (Without Destroying It)",
    description:
      "Why PDFs get huge, which compression levers actually work, quality settings that survive email and print, and how to hit upload limits without gutting the document.",
    category: "pdf",
    updated: "2026-09-28",
    intro: [
      "Every large PDF tells the same story: a scanner ran at 600 DPI, a phone camera exported full-resolution photos into a report, or PowerPoint exported slides as lossless PNGs. The text was never the problem — a page of text is a few kilobytes. Compression is the art of finding the megabytes hiding in images and removing redundancy without breaking what readers need. Done well, a 40 MB scan becomes a 6 MB file that looks identical on screen. Done badly, it becomes a blurry mess nobody can read. This guide walks the actual mechanics and the decision tree.",
      "The first rule of compression: know what's making the file big before choosing a setting. The file inspector shows exactly that — page count, image inventory, and per-object weight. A 30 MB PDF that's mostly one embedded 25 MB photo needs a different fix than a 30 MB PDF that's 300 pages of medium scans. The first wants an image re-encode; the second wants global DPI reduction.",
    ],
    sections: [
      {
        h2: "Where the megabytes actually live",
        paragraphs: [
          "A PDF's size is dominated by four things, in rough order of typical impact: embedded images (the usual 80–95% culprit), embedded fonts (a CJK font can add 10+ MB by itself), structural overhead from incremental saves (every 'save' in some editors appends rather than rewrites, so old revisions live inside the file), and duplication (the same logo image stored 40 times, once per page). Text content is nearly irrelevant — which is why 'compressing' a text-only PDF accomplishes nothing: there's nothing to squeeze.",
          "This is also why the file inspector is worth a minute before any compression pass: identify the dominant weight, and you know which lever to pull. Image-heavy: re-encode images at lower quality/DPI. Font-heavy: subset fonts (usually automatic in proper tools) or accept the size. Overhead-heavy: a clean re-save through a normalizer strips stale revisions. Duplication-heavy: optimization that deduplicates resources collapses the repeats to one copy.",
        ],
      },
      {
        h2: "The quality trade-off, quantified",
        paragraphs: [
          "Compression levels map to what happens to images. Low compression re-encodes images at high quality (think 85–90% JPEG-equivalent) and full resolution: output looks identical in every context, savings are modest — often 20–40% on scan-heavy files. Medium compression targets screen reading: images re-encode around 75–80% quality and downsample to roughly 150 DPI. At normal zoom and on print, most scans are visually indistinguishable; this is the right default for email and web distribution, and it typically cuts 40–70%. High compression is for hitting a hard limit: 50–60% quality and ~96 DPI. Text stays crisp (text isn't an image), but photographs soften visibly, fine print in embedded screenshots gets fuzzy, and anything destined for print should skip this level.",
          "The nuance worth internalizing: text is vector content and survives every compression level — 'the PDF got blurry' almost always means images got blurry. So a scanned document (which is one image per page) compresses visibly, while a digitally-authored report with a couple of small photos compresses invisibly. Matching level to content is the whole skill.",
        ],
        bullets: [
          "Low: archival, print masters, when a client will re-compress anyway.",
          "Medium: email, web distribution, screen reading — the everyday default.",
          "High: hard upload limits, mass archiving where legibility-not-beauty is the bar.",
          "Text-heavy digital PDFs: skip compression; there's nothing meaningful to save.",
        ],
      },
      {
        h2: "Hitting an exact size limit (10 MB portals and friends)",
        paragraphs: [
          "When a portal rejects anything above a threshold, compression alone is a blunt instrument — you iterate settings until the file fits, which is tedious. The precise approach is a two-step: compress to get near the target, then split by size to guarantee every part is under the ceiling. Splitting works at page boundaries: the tool measures the running byte count as pages accumulate and closes each part before the next page would breach the limit.",
          "Aim slightly under the limit — 9 MB for a 10 MB ceiling — because viewers and email gateways measure with their own overhead. And if a single page exceeds the entire budget, no split can help: that page is one giant image, and it needs compression (or rescanning at lower DPI) before any packaging strategy works.",
        ],
      },
      {
        h2: "Compression that damages: what to watch for",
        paragraphs: [
          "Three failure patterns separate careful compression from sloppy. Text layer loss: tools that rasterize pages to compress them destroy selectability and searchability — a compressed PDF that can't be searched is a damaged PDF; verify text survives with a quick select-and-copy after compressing. Font stripping: aggressive optimizers sometimes drop embedded font subsets they deem unused, and the document renders wrong on machines without the font — if the PDF matters, verify it opens identically on a second device. Color shifts: recompression can alter color profiles on brand-critical documents; a side-by-side visual check of one representative page catches it.",
          "One more, subtle but real: compression is lossy and irreversible. Compress a copy, not your original. The 40 MB scan you flattened to 6 MB can't be un-flattened — and next year someone will need the original at full resolution for print.",
        ],
      },
      {
        h2: "The compression decision tree",
        paragraphs: [
          "Start with the destination. Email attachment: medium compression, then split-by-size if still over. Web distribution: medium, and consider linearization (fast web view) so pages render before the download completes. Archival: low compression only — and if the archive demands PDF/A, convert after compressing, because PDF/A conversion normalizes structure and you don't want to repeat the pass. Print: no compression, or low at most; print exposes every artifact screens hide. Upload portal with a hard limit: medium-to-high, then split-by-size for the guarantee.",
          "And the lever people forget: the source. A 600 DPI scan compresses brilliantly and is still too heavy for its purpose — rescanning at 300 DPI (or re-photographing with even light) produces a better document than any amount of post-processing. Compression is recovery; capture quality is prevention.",
        ],
      },
    ],
    faq: [
      {
        q: "Why didn't my PDF get smaller?",
        a: "Text-only PDFs have almost no compressible content — no images to re-encode. Check the file inspector: if size lives in fonts or structure, compression won't help much.",
      },
      {
        q: "Does compression remove the text layer?",
        a: "Not with proper tools. Text objects are preserved; only images are re-encoded. If a tool rasterizes pages to compress them, it has destroyed searchability — verify with a select-and-copy test.",
      },
      {
        q: "Which compression level for printing?",
        a: "Low, or none. Print exposes image softening that screens never show. For digital-only distribution, medium is the safe default.",
      },
      {
        q: "How do I guarantee a file is under 10 MB?",
        a: "Compress first, then split by size — the splitter measures bytes as it goes and cuts at page boundaries so every part is under the ceiling you set.",
      },
      {
        q: "Is compression reversible?",
        a: "No — re-encoded image data is gone. Always compress a copy and keep the original for future high-quality needs.",
      },
    ],
    related: ["compress-pdf", "split-pdf-by-size", "optimize-pdf-web", "pdf-info-viewer", "file-info"],
  },
  {
    slug: "pdf-to-word-conversion",
    title: "PDF to Word: What Converts Well, What Doesn't, and How to Fix It",
    description:
      "The honest mechanics of PDF-to-DOCX conversion: why layout shifts, which documents come out clean, how to repair the common defects, and when editing the PDF directly is the better move.",
    category: "pdf",
    updated: "2026-09-28",
    intro: [
      "PDF to Word is the most requested conversion in the world — and the most misunderstood. People expect a PDF to 'open in Word' the way a .docx would, and are then surprised that columns drift, fonts swap, and tables emerge as text soup. The surprise is understandable but backwards: PDF and DOCX are fundamentally different machines, and conversion is translation between them. This guide explains what each format actually stores, which documents translate cleanly, which never will, and the repair moves that fix 90% of conversion defects.",
      "The core difference: Word documents store intent — 'this paragraph is Heading 1, in Calibri, flowing after the previous paragraph' — while PDFs store appearance — 'draw this glyph at coordinates x=72, y=640.' A PDF has no paragraphs, no styles, no sections; it has positioned drawing commands. Conversion is therefore reconstruction: reading positions and inferring the intent that would produce them. Inference is where quality is won or lost.",
    ],
    sections: [
      {
        h2: "What converts cleanly",
        paragraphs: [
          "Single-column documents with standard fonts and clear structure convert best: letters, memos, simple reports, most contracts. The reconstruction has an easy job — lines of positioned text become paragraphs, larger fonts become headings, embedded images stay in place. These documents often come out of conversion looking nearly identical to the original, fully editable, with working heading styles you can restyle globally.",
          "Documents with real text layers also convert cleanly — digitally-generated PDFs from Word, Google Docs, LaTeX. Scanned documents are the opposite case: a scan has no text at all until OCR runs. If your PDF opens with selectable text, conversion has material to work with; if not, OCR first (which adds a recognition layer) and then convert — with the caveat that OCR accuracy becomes the ceiling for the whole pipeline.",
        ],
      },
      {
        h2: "What struggles, and why",
        paragraphs: [
          "Multi-column layouts are the classic casualty: a two-column newsletter's left and right columns interleave line-by-line unless the converter detects the column boundaries, and detection heuristics fail on complex designs. Tables are the second: a PDF table is just text positioned in a grid pattern — there is no table object — so the converter must infer rows and columns from spacing. Simple tables reconstruct well; merged cells and nested layouts don't. Text boxes and floating shapes position absolutely in the PDF and arrive in Word as floating objects, which reflow differently than inline content.",
          "Fonts are the quiet issue: if the PDF embeds a font Word doesn't have, the converted document substitutes — and substitution changes metrics, which changes line breaks, which cascades through the layout. None of this means conversion is bad; it means conversion is a best-effort translation whose fidelity depends on how much the source relies on PDF's appearance-only model. Complex print-designed documents (magazines, brochures) sit at one end — expect hours of cleanup; office documents sit at the other — expect minutes.",
        ],
      },
      {
        h2: "The repair playbook",
        paragraphs: [
          "Five minutes of targeted repair fixes the most common defects. Line-break fragments: paragraphs that break mid-sentence at odd widths are hard line breaks baked into the PDF — Word's Find & Replace with ^p (paragraph mark) or a targeted find-replace tool merges them back. Restyle from headings: if heading styles didn't carry over, apply them manually once — global restyling then works, and a table of contents becomes generatable. Floating images: switch wrapped images to inline (right-click → wrap → inline) and layout chaos collapses. Font substitution: identify the original font in the PDF's properties and install it, or select-all and switch to a metrically-similar font you own.",
          "And the meta-repair: sometimes the right move is not converting at all. If the task is 'change the date and add a name' on a five-page PDF, editing the PDF directly — text overlay for the date, a signature placement — beats converting, editing, and re-exporting, because the original stays pristine. Conversion is for when substantial editing or reuse is the goal, not for touch-ups.",
        ],
      },
      {
        h2: "The reverse trip: Word to PDF",
        paragraphs: [
          "Word to PDF is the friendlier direction — a document of intent becomes a set of appearance commands, which is a lossy-in-reverse but deterministic process. The main decisions: embed fonts (so the PDF renders identically everywhere), and choose the export flavor — print-oriented PDFs keep full image resolution, while web-oriented exports downsample. The reverse conversion also explains conversion asymmetry: intent→appearance is mechanical, appearance→intent is inference, which is why the round trip Word→PDF→Word never returns the original document exactly.",
          "Practical rule: keep the source of truth in the editable format. If a document will be edited more than once, do the editing in Word (or restore it there via conversion once), and export PDFs as snapshots. Chains of PDF-to-Word-to-PDF-to-Word edits compound conversion damage every hop.",
        ],
      },
    ],
    faq: [
      {
        q: "Why does my converted document look different?",
        a: "PDF stores positions, Word stores intent — conversion reconstructs intent from positions, and complex layouts (columns, tables, text boxes) are where inference is imperfect. Simple documents convert nearly perfectly.",
      },
      {
        q: "Can I convert a scanned PDF to Word?",
        a: "Only after OCR creates a text layer — a scan is an image. Run OCR first; recognition accuracy then caps the conversion quality.",
      },
      {
        q: "How do I fix paragraphs that break mid-sentence?",
        a: "The PDF baked hard line breaks into the text. Merge them with Word's Find & Replace or a find-replace tool targeting the paragraph marks at line ends.",
      },
      {
        q: "Is it better to edit the PDF directly instead?",
        a: "For small touch-ups — a date, a name, a signature — yes: overlay the change on the PDF and skip conversion entirely. Convert when substantial editing or content reuse is the real goal.",
      },
      {
        q: "Why did my fonts change after conversion?",
        a: "The PDF embedded a font Word doesn't have, so Word substituted. Install the original font, or select all text and switch to a similar one you own.",
      },
    ],
    related: ["pdf-to-word", "word-to-pdf", "ocr-pdf", "edit-pdf", "word-style-cleaner"],
  },
  {
    slug: "e-sign-documents-guide",
    title: "How to Sign Documents Online (Legally and Safely)",
    description:
      "From drawing a signature to cryptographic certificates: what makes an electronic signature valid, when you need more than a drawn one, and how to sign without uploading your documents to anyone.",
    category: "pdf",
    updated: "2026-09-28",
    intro: [
      "Signing is where documents become commitments — and the online version raises two questions people rightly worry about: is this signature legally valid, and where does my document go while I sign it? This guide answers both properly: what the law actually says about electronic signatures (less intimidating than vendors imply), the difference between a visible signature and a cryptographic one, and a fully local signing workflow where the document never leaves your device — which matters more than most people realize once you remember a signature is a biometric artifact.",
      "First, the legal layer, because the anxiety is misplaced: in most jurisdictions, the validity of an electronic signature comes from intent and consent, not from any particular technology. The US ESIGN Act and UETA, the EU's eIDAS 'simple' level, and the UK's equivalent frameworks all accept a visible signature applied with intent for the overwhelming majority of everyday agreements — contracts, HR forms, NDAs, leases between individuals. What strengthens enforceability is evidence around the signature: who signed, when, and whether the document changed afterward.",
    ],
    sections: [
      {
        h2: "Three tiers of electronic signature",
        paragraphs: [
          "Tier one: the visible signature — drawn, typed in a handwriting font, or an image of your ink signature placed on the page. Legally sufficient for most everyday agreements, zero setup, and the recipient sees a normal signed document. What it doesn't provide: cryptographic proof the document is unchanged, or strong identity verification. Tier two: the digital certificate signature (PKI-based) — a cryptographic object embedded in the PDF that binds the document bytes to a certificate, detecting any later modification and, with a certificate from a trusted authority, asserting identity. Required in specific regulated workflows (some government filings, certain EU processes) and overkill for a gym contract. Tier three: qualified electronic signatures (eIDAS 'qualified') — certificate-based signatures with accredited certification, legally equivalent to handwritten in the EU. Niche, identity-verified, and unavailable without a certificate authority.",
          "The matching insight: most people searching 'how to sign a PDF online' need tier one with good hygiene — a visible signature, a date stamp, and the ability to verify the document afterward. Tier two matters when a counterparty's compliance rules demand it, which they'll tell you explicitly.",
        ],
        bullets: [
          "Visible signature: everyday contracts, HR forms, NDAs — valid nearly everywhere.",
          "Certificate (PKI) signature: regulated filings, proof of integrity, non-repudiation.",
          "Qualified (eIDAS) signature: EU legal equivalence — requires an accredited certificate.",
        ],
      },
      {
        h2: "Strengthening a simple signature: the hygiene that matters",
        paragraphs: [
          "Because validity rides on intent and integrity, a few habits make a visible signature defensible. Sign with context: place the date beside the signature (a text stamp takes seconds), and initial page corners on multi-page agreements — evidence of review. Keep the evidence chain: save the signed copy and, ideally, the message thread where the counterparty received it. Verify integrity before relying on a document: the signature verification tool reports whether a signed PDF's bytes match what was signed — even for certificate signatures it reports tampering, which is the question that actually matters in disputes.",
          "For organizations signing frequently, a signature library turns the ritual into one click: store your signature locally (drawn, typed, or uploaded), then place it into any document — with the crucial privacy property that the signature lives in your browser's IndexedDB, not in someone's cloud. A signature is biometric data; there's no good reason to upload it 'for convenience' to a service whose retention policy you can't see.",
        ],
      },
      {
        h2: "Signing confidential documents without uploading them",
        paragraphs: [
          "The standard e-signature services work by uploading: your contract — salaries, client names, deal terms — transits and often resides on their servers. For plenty of documents that's a real cost, not a theoretical one. The alternative architecture is local signing: the PDF loads in your browser, you draw or place the signature, and the signed file is written back on your device. Nothing uploads, so the confidentiality question disappears — the same principle as every tool on this site.",
          "The trade-off to understand honestly: local signing gives you tier-one signatures, not certificate-based ones (certificate infrastructure requires authorities and key ceremonies that don't fit a browser-only model). For the majority of agreements — where the law accepts visible signatures and the parties just need the deal signed — local is the right trade: maximally private, legally sufficient, instantly done. When a counterparty mandates certified signatures, that's tier two, and it needs the heavyweight pipeline regardless of privacy preference.",
        ],
      },
      {
        h2: "The signing workflow, end to end",
        paragraphs: [
          "A repeatable flow: open the document in the signing tool; place your signature from the library (or create one — draw with a mouse/finger, type in a handwriting style, or photograph your ink signature and clean it up); add the date next to it with the text tool; initial other pages if the agreement warrants it; download the signed copy. Two finishing touches worth adopting: flatten the result if it's a filled form (so field values can't be edited), and protect the signed PDF with a permissions password if you want to discourage silent modification downstream — encryption is belt-and-suspenders on top of the signature itself.",
          "For the receiving side: before countersigning anything sent to you, run signature verification — it reports whether the document was modified after signing. It takes seconds and catches the 'revised' contract that differs from what you reviewed, which is precisely the scenario signatures exist to expose.",
        ],
      },
    ],
    faq: [
      {
        q: "Is a drawn or typed online signature legally binding?",
        a: "For most everyday agreements, yes — ESIGN/UETA (US) and eIDAS 'simple' (EU) accept signatures applied with intent, regardless of technology. Regulated workflows may demand certificate-based signatures.",
      },
      {
        q: "What's the difference between electronic and digital signatures?",
        a: "Electronic is the umbrella term (including visible signatures); 'digital signature' usually means the cryptographic, certificate-based kind that proves document integrity and signer identity.",
      },
      {
        q: "Does my signature or document get uploaded when I sign here?",
        a: "No — signing runs entirely in your browser. The document and your signature never leave your device, which is exactly what confidential agreements deserve.",
      },
      {
        q: "How do I check if a signed PDF was modified?",
        a: "Run it through signature verification — it reports whether the signed byte ranges match the current document, flagging any post-signing edits.",
      },
      {
        q: "Can I save my signature for reuse?",
        a: "Yes — the signature library stores drawn/typed/uploaded signatures locally in your browser (IndexedDB) so signing takes one click, with no server copy.",
      },
    ],
    related: ["sign-pdf", "signature-manager", "verify-pdf-signature", "fill-pdf-form", "protect-pdf"],
  },
  {
    slug: "word-to-pdf-guide",
    title: "Word to PDF: Getting Professional, Consistent Output",
    description:
      "Why Word documents render differently everywhere and PDFs don't, how to export without breaking fonts or layout, and the finishing touches that make converted documents look deliberate.",
    category: "word",
    updated: "2026-09-28",
    intro: [
      "Word to PDF is the last step of most document workflows — the resume gets submitted as PDF, the contract gets executed as PDF, the report gets distributed as PDF. Which makes it strange that the step is so often done badly: fonts substituted, images recompressed to mush, clickable TOCs flattened into dead text. This guide covers why PDF is the right distribution format, how to convert without the common defects, and the small finishing touches (metadata, bookmarks, protection) that separate a converted document from a professional one.",
      "The reason PDF exists at all: Word documents are living things — their appearance depends on the fonts installed, the Word version, the printer driver, the zoom. Send a .docx to ten people and you get ten slightly different renderings; pagination drifts, and a signature line that was on page 3 for you is on page 4 for someone else. PDF freezes the appearance: one file, one rendering, everywhere, forever. That's why 'please send as PDF' is the universal closing line of document workflows.",
    ],
    sections: [
      {
        h2: "The conversion that just works",
        paragraphs: [
          "A faithful Word-to-PDF conversion preserves the three things readers notice: fonts, layout, and images. Fonts must embed — the PDF carries the glyphs inside itself so machines without the font render identically; non-embedded fonts are the number-one cause of 'it looks different on her computer.' Layout must map page geometry exactly — margins, headers, footers, and section breaks become fixed page furniture. Images should transfer at full resolution unless you deliberately choose downsampling for size.",
          "Client-side conversion does this by rendering the document through a real layout engine and writing the result to PDF — no upload, no conversion queue, and your draft never sits on someone's server while it converts. For resumes, contracts, and anything confidential, that's not a nicety; it's the point.",
        ],
      },
      {
        h2: "Fonts: the defect that ruins everything",
        paragraphs: [
          "Font problems dominate conversion complaints, and they're all one root cause: a font that exists on the authoring machine but not on recipients' machines. In Word, the recipient's system substitutes silently — and substitution changes character widths, which changes line breaks, which changes pagination. In PDF, the fix is embedding: the font program is copied into the file. Verify with the font checker before converting anything important — it lists which fonts your document uses and flags the risky ones, and a PDF-info pass on the output confirms the fonts actually embedded.",
          "The pragmatic font policy for documents that travel: stick to system-safe fonts (Calibri, Arial, Georgia, Times New Roman) for anything collaborative; use distinctive fonts only when you control the PDF export and can verify embedding. And note what embedding doesn't cover: license-restricted 'desktop-only' fonts may block embedding in some tools — if your brand font refuses to embed, that's why, and the answer is a webfont-licensed version or a visual-safe fallback.",
        ],
      },
      {
        h2: "Finishing touches that make output look deliberate",
        paragraphs: [
          "Metadata: the PDF inherits your document's properties — set the Title properly before converting, because browsers, search systems, and document management tools display it, and 'Document1' as a title reads exactly as seriously as it sounds. Bookmarks: if your document uses real heading styles, generate a table of contents field before conversion, or add PDF bookmarks to the result — navigation is the difference between a 40-page document and a usable one. Page numbers and headers: apply them in Word before export, or stamp them onto the PDF afterward; doing it at the PDF stage guarantees consistency regardless of how the document reflows on other machines.",
          "Protection: for documents going to counterparties, the export step is where light protection belongs — a permissions password that blocks editing, or full encryption for confidential material. And for documents that started life as templates (offer letters, contracts with placeholders), fill the template before converting: the PDF snapshot should capture a finished document, not a form with {{placeholders}} still showing.",
        ],
      },
      {
        h2: "When the destination is print",
        paragraphs: [
          "Print exposes everything screens forgive, so print-bound conversions deserve extra checks. Image resolution: photos embedded at web resolution (72–96 DPI effective) look fine on screen and raggy in print — anything print-critical wants 300 DPI source images. Color: RGB documents convert to PDF in RGB, and print shops either handle the conversion or ask for it; when in doubt, ask your printer whether they want RGB or CMYK — naive conversion is a common source of shifted brand colors. Bleed: documents designed edge-to-edge need bleed area that Word doesn't model — for full-bleed print work, design in a tool that understands bleed and export from there, using Word for content documents.",
          "The pre-flight ritual for important print jobs: convert, open the PDF, check the fonts embedded, zoom to 200% on representative pages, verify page count and margins survive, then send. Two minutes of checking beats a reprint every time.",
        ],
      },
    ],
    faq: [
      {
        q: "Why convert Word to PDF at all?",
        a: "PDF freezes the document's appearance — same fonts, same pagination, same layout on every machine — while .docx renders differently depending on the recipient's software and fonts.",
      },
      {
        q: "Why does my converted PDF look different from Word?",
        a: "Almost always fonts: if the PDF doesn't embed the fonts Word used, viewers substitute. Verify embedding, or stick to system-safe fonts for documents that travel.",
      },
      {
        q: "Are my document contents uploaded during conversion?",
        a: "No — conversion runs in your browser. Draft contracts and resumes never touch a server.",
      },
      {
        q: "Can I make the PDF smaller after converting?",
        a: "Yes — compression targets the images, not text. Word exports often carry full-resolution photos; a medium compression pass typically cuts half the size with no visible change.",
      },
      {
        q: "How do I add page numbers after converting?",
        a: "Stamp them onto the PDF directly — position, format ('Page X of Y'), and starting number are all controllable, and it's more consistent than Word's field-based footers across mixed machines.",
      },
    ],
    related: ["word-to-pdf", "pdf-info-viewer", "word-font-checker", "add-page-numbers-pdf", "protect-pdf"],
  },
  {
    slug: "merge-word-documents-guide",
    title: "How to Merge Word Documents Without Breaking Formatting",
    description:
      "Why naive DOCX concatenation wrecks numbering, styles, and headers — and the section-aware merge approach that keeps every document's formatting intact.",
    category: "word",
    updated: "2026-09-28",
    intro: [
      "Merging Word documents is deceptively hard, and anyone who has pasted five chapter files together has met the evidence: numbering that restarts at 1 in every chapter, fonts that change mid-page, a header from chapter two colonizing the whole book, styles fighting over which 'Normal' wins. The failures aren't random — they're what happens when a merge ignores document sections. This guide explains what .docx files actually carry, why copy-paste merges fail the way they do, and how a section-aware merge keeps every source's formatting exactly as authored.",
      "The mental model that fixes everything: a .docx is not text with formatting — it's a package of styles, numbering definitions, headers/footers, and section settings, with text that references them. Two documents each have their own 'List Number' definition; two documents have different page setups. The merge question is always: whose definitions govern the combined file? Get that wrong (as naive concatenation does) and the symptoms follow.",
    ],
    sections: [
      {
        h2: "Why copy-paste merging fails",
        paragraphs: [
          "Pasting content from document B into document A doesn't merge documents — it imports B's text into A's system. Every reference in B's text now resolves against A's style definitions: B's 'Heading 2' might be 14pt blue; A's 'Heading 2' is 12pt black, so B's headings silently reformat. Numbering is worse: lists reference numbering definitions, and if the definitions collide or renumber, chapter 2's list either restarts at 1 or continues from chapter 1's last number — the classic thesis-formatting disaster. Headers and footers don't import at all, because they belong to sections, not paragraphs.",
          "The failures compound in exactly the scenarios merging is for — long multi-author documents with real structure. For two plain documents with no lists, headers, or custom styles, copy-paste works fine; the disasters start when documents carry the machinery that makes them worth merging.",
        ],
      },
      {
        h2: "Section-aware merging: the mechanism that works",
        paragraphs: [
          "The correct merge treats each source document as an intact unit: each becomes its own section in the output, with its style definitions, numbering definitions, and headers/footers carried along — namespaced so they can't collide. Word's own 'Insert File' and master-document features gesture at this; a proper merge tool implements it fully. The result: chapter numbering continues or restarts exactly as each source intended, fonts stay as authored because each section references its own definitions, and per-chapter headers survive because sections carry them.",
          "Ordering is part of the mechanism — drag sources into sequence before merging, since the output order is fixed at merge time. And the output is a real .docx: fully editable, tracked-changes-capable, ready for reviewers. That last property matters — merging to PDF freezes the document; merging to Word keeps the collaboration alive, which is usually the point of a combined draft.",
        ],
      },
      {
        h2: "Preparing documents for a clean merge",
        paragraphs: [
          "Ten minutes of preparation prevents most merge pain. Normalize styles at the source: if chapter files use different heading conventions (one author used manual big-bold text instead of Heading 1), fix that first — a style cleaner pass converts direct formatting into real styles, and merges preserve structure only when structure exists. Decide numbering policy: if each chapter restarts its lists at 1 and that's intended, fine; if the combined document should number continuously, that's a post-merge pass, not a merge setting. Kill the surprises: run the metadata editor to fix author/title on each source, because the merged document inherits the first source's identity.",
          "The last preparation step is the outline check: open each file and confirm the navigation pane shows the structure you expect. Section-aware merging preserves what's there — including the mistakes. Clean structure going in is the only reliable way to get clean structure coming out.",
        ],
      },
      {
        h2: "Splitting, the mirror operation",
        paragraphs: [
          "Merging's twin is splitting — a 300-page manual into per-chapter files, a combined report back to its section owners. The same section-awareness applies in reverse: split at heading boundaries (each Heading 1 starts a new file), by page ranges, or at section breaks, with each output carrying the styles it needs so chapters remain formatted when they leave home. Heading-based splitting is the everyday winner: outline the document properly and the seams find themselves.",
          "Merge and split together form the document-lifecycle loop that real organizations live in: authors submit chapters, you merge for review, split for redlining, merge again for release. Choosing tools that respect sections at both ends is what keeps the loop from degrading the document every cycle.",
        ],
      },
    ],
    faq: [
      {
        q: "Why does my numbering restart or continue wrongly after merging?",
        a: "Lists reference numbering definitions, and naive merges resolve them against the wrong source. Section-aware merging namespaces each document's definitions so numbering behaves as each source intended.",
      },
      {
        q: "Can I merge .doc files?",
        a: "Save them as .docx first — the legacy binary format can't be parsed in the browser.",
      },
      {
        q: "Will track changes survive the merge?",
        a: "Review markup is part of the document content and carries over with its section. For a clean combined draft, accept/reject changes in each source before merging.",
      },
      {
        q: "How do I keep each chapter's headers?",
        a: "Headers belong to sections — a section-aware merge preserves each source's headers within its section, rather than flattening everything to the first document's header.",
      },
      {
        q: "Should I merge to Word or to PDF?",
        a: "Word when the combined draft will be edited or reviewed further; PDF when it's final. Merging to Word keeps the workflow alive — export a PDF snapshot at the end.",
      },
    ],
    related: ["merge-word", "split-word", "word-style-cleaner", "word-toc-generator", "word-metadata-editor"],
  },
  {
    slug: "image-format-guide",
    title: "JPG, PNG, WebP, AVIF: Which Image Format to Use When",
    description:
      "The practical guide to image formats: why each exists, what it's actually good at, and a decision table for photos, screenshots, logos, and web performance.",
    category: "image",
    updated: "2026-09-28",
    intro: [
      "Image formats are tribal knowledge: people reach for JPG 'because photos', PNG 'because quality', and shrug at WebP and AVIF as browser trivia. But each format embodies a specific engineering trade-off — and choosing deliberately gets you smaller files, sharper edges, and fewer compatibility surprises. This guide explains what each format actually does, the honest physics of converting between them (including what's recoverable and what never is), and a decision table you can apply to any image task in seconds.",
      "One framework organizes everything: lossy vs. lossless, and pixels vs. vectors. Lossy formats (JPG, WebP-lossy, AVIF) throw information away to hit smaller sizes — permanently. Lossless formats (PNG, WebP-lossless) keep every pixel exact. Raster formats (all of the above) store pixels; SVG stores drawing instructions that scale infinitely. Most 'which format' questions are really questions about where on those axes your image belongs.",
    ],
    sections: [
      {
        h2: "JPG: the photo workhorse",
        paragraphs: [
          "JPG is 30 years old and still the right answer for photographs heading to email, chat, or any compatibility-uncertain destination. Its lossy compression is tuned for how cameras see: gradual tonal transitions compress well; sharp edges and text do not — that's where JPG's characteristic 'mosquito noise' and ringing appear. Quality is a dial: 85–90% is visually transparent for most content; below 75%, blocking artifacts creep into text edges and flat-color areas.",
          "Two JPG properties shape everything around it. No alpha channel: transparency flattens to a background color at conversion time — choose it deliberately. Generation loss: every save re-compresses, degrading slightly; edit JPGs in copies, keep the original, and convert to lossless before repeated edits. Neither flaw matters for its core job — delivering photographs at small sizes with universal compatibility — which is why JPG refuses to die.",
        ],
      },
      {
        h2: "PNG: lossless pixels and transparency",
        paragraphs: [
          "PNG stores every pixel exactly — the lossless format of the raster world, and the only mainstream one with a full alpha channel. That makes it the format for screenshots, logos, UI elements, diagrams, and anything with sharp edges or flat color where JPG's artifacts would be visible. It's also the editing master: convert a JPG to PNG and the artifacts are baked (they don't heal), but further edits stop degrading — one generation of loss, then stability.",
          "The cost is size: photographic content in PNG weighs multiples of the same image as JPG — often 5–10×. The discipline is direction: photos going out → JPG; graphics and screenshots → PNG; photo being edited repeatedly → PNG master until final export to JPG. And one correction to a persistent myth: PNG doesn't 'improve' an image, it just refuses to make it worse. Converting a mushy JPG to PNG produces a large, mushy PNG.",
        ],
      },
      {
        h2: "WebP and AVIF: the modern formats",
        paragraphs: [
          "WebP does everything JPG and PNG do, smaller: lossy mode typically saves 25–34% over JPG at equivalent quality; lossless mode beats PNG by ~26%. It has alpha in both modes, and browser support is effectively universal now. For website assets, converting an image library to WebP is one of the highest-leverage performance wins available — same visual result, materially faster pages. The remaining friction is tooling outside browsers: some desktop apps, printers, and CMS pipelines still want JPG/PNG, which is what the conversion tools are for.",
          "AVIF pushes further — better compression than WebP, HDR support, and growing adoption — at the cost of encode time and a longer compatibility tail. The pragmatic web strategy today: WebP as the default delivery format, AVIF where the toolchain supports it, JPG/PNG as the universal fallback for anything that leaves the browser. All three conversions run locally here — decode and re-encode in one pass, with quality control and batch handling.",
        ],
      },
      {
        h2: "SVG: the vector exception",
        paragraphs: [
          "SVG isn't pixels — it's instructions (circles, paths, text) that render at any size without quality loss. For logos and icons, it's the correct master format: one file serves favicon and billboard. The catch is sourcing: SVG comes from vector editors or tracing, not from photographs. Tracing a PNG into SVG (potrace-style) works brilliantly on flat-color logos and line art, and honestly poorly on photos — the result is either mush or a ten-thousand-path monster. Know the direction: rasterize SVG to PNG/JPG at a target size (easy, lossless in the vector sense), or vectorize raster to SVG (narrow, artifact-sensitive).",
          "The full-circle rule: keep the vector master, export raster derivatives on demand. Logos stored as PNG forever get re-made at every new size; logos stored as SVG generate any size in seconds.",
        ],
      },
      {
        h2: "The decision table",
        paragraphs: [
          "Photo for email/chat/print → JPG at 85–90%. Screenshot or UI capture → PNG (crisp text, small for flat content). Logo or icon with transparency → PNG for delivery; SVG as the master if you have it. Web page images → WebP (lossy for photos, lossless for graphics), with JPG/PNG fallback. Editing master → PNG or lossless WebP; never re-save JPGs repeatedly. Animation → GIF survives for memes; WebP/APNG for quality; video formats for anything longer. Scan or document capture → JPG for size, PNG for OCR-crisp text. And when converting between formats: know what you're gaining (compatibility, size, alpha) and what you're losing (lossy steps are forever, alpha flattens, palette limits persist).",
        ],
      },
    ],
    faq: [
      {
        q: "Why is my PNG so much bigger than the JPG?",
        a: "PNG stores every pixel losslessly — photographs (millions of gradual transitions) are its worst case. PNG is for graphics, screenshots, and transparency; photos belong in JPG or WebP.",
      },
      {
        q: "Does converting JPG to PNG improve quality?",
        a: "No — existing compression artifacts are baked in. PNG stops further degradation on re-saves and adds transparency support, but it doesn't heal anything.",
      },
      {
        q: "Is WebP safe to use everywhere in 2026?",
        a: "Every current browser renders it. Some desktop apps, printers, and older CMS pipelines still want JPG/PNG — keep the conversion tools handy for those boundaries.",
      },
      {
        q: "What quality setting for JPG/WebP?",
        a: "85–90% is visually transparent for most content; below 75% artifacts appear around text and flat colors. Screenshots with small text are the most fragile case.",
      },
      {
        q: "Which format for a logo?",
        a: "SVG if you have or can trace it (flat-color logos trace well) — one master, every size. PNG with transparency for raster delivery. Never JPG: edges ring and there's no alpha.",
      },
    ],
    related: ["jpg-to-png", "png-to-jpg", "jpg-to-webp", "png-to-webp", "svg-to-png", "png-to-svg"],
  },
  {
    slug: "remove-image-background-guide",
    title: "How to Remove Image Backgrounds (and When to Rebuild Them Instead)",
    description:
      "How AI background removal works, what makes cutouts clean vs ragged, the privacy trade of upload-based tools, and the workflows beyond simple removal — shadows, transparency, composites.",
    category: "image",
    updated: "2026-09-28",
    intro: [
      "Background removal used to be an afternoon with the pen tool; now a model does it in seconds. But 'the model does it' hides the questions that decide whether your result is usable: what the model actually understands about your image, why edges come out ragged on some subjects, and — the part almost nobody considers — where your photo goes in upload-based tools. This guide covers the mechanics, the quality factors, and the workflows that start where simple removal ends: transparency, soft shadows, and composites.",
      "The mechanics, briefly: modern background removal uses a segmentation model — a neural network trained on millions of labeled images that predicts, per pixel, whether it belongs to the subject or the background. The output is a mask that becomes the alpha channel. The model runs in your browser here (WebAssembly), which means the photo never uploads — relevant for product photos, ID-style images, and any picture of people, which is exactly the content you should think twice about sending to a stranger's API.",
    ],
    sections: [
      {
        h2: "What makes cutouts clean or ragged",
        paragraphs: [
          "Subject-background contrast is the dominant factor: a dark jacket on a dark background forces the model to guess along fuzzy boundaries, and the guesses show as halo fringes. Sharp-edged subjects (products, furniture, people against plain walls) segment almost perfectly; furry, translucent, or motion-blurred edges are where masks soften. Resolution helps up to a point — enough pixels for the model to resolve edge detail — but a 4000px blurry phone shot still segments worse than a sharp 800px photo.",
          "Post-processing fixes the common defects: erase or restore edges with a brush when the mask missed; a slight inward edge shift removes halo fringing on hair and fur; and compositing onto a new background works best when you add a matching soft shadow under the subject — the missing contact shadow is the number-one tell of a cutout. For product photography on white, don't remove the background at all: shoot or fake a clean white background in the capture; removal is for when the subject must travel to a new context.",
        ],
      },
      {
        h2: "The privacy dimension",
        paragraphs: [
          "The dominant background-removal websites are upload-based: your image — often of people, homes, or documents — transits to their servers, gets processed, and lives by their retention policy. For marketing stock that's fine; for a photo containing your home's interior, a child's face, or an ID card, it's a decision most people would make differently if they remembered they were making it. Local processing (in-browser models) removes the transmission entirely: the image loads into the page, the model runs on your CPU/GPU, the result saves to disk. Same output class, zero upload.",
          "The trade is speed and file size: in-browser models are smaller than datacenter ones, so the hardest images (complex hair, low contrast) may segment less perfectly than the best cloud models. For the overwhelming majority of images — products, people on plain backgrounds, objects — local quality is indistinguishable, and the privacy win is categorical.",
        ],
      },
      {
        h2: "Beyond removal: transparency and composites",
        paragraphs: [
          "Removal is step one of the transparency workflow. The cutout is a PNG with alpha — which then composites onto any background: a brand color, a gradient, another photo. Compositing quality lives in the details: match lighting direction between subject and new background (a subject lit from the left on a background lit from the right reads wrong instantly), scale relative to the scene's perspective, and add the contact shadow mentioned above. A five-second mask plus ten seconds of composite attention produces results that pass for professional work in most contexts.",
          "For e-commerce specifically: marketplaces mandate white backgrounds but styles vary — keep the raw cutout as your master, then batch-generate the platform-specific versions (pure white for Amazon, lifestyle contexts for social) from the same transparent master. One removal, many destinations.",
        ],
      },
      {
        h2: "Alternatives that beat removal",
        paragraphs: [
          "Sometimes the right edit isn't removing the background but replacing it in-place: blur the background (keeps context, kills distraction — and works when segmentation struggles with hair), or darken/desaturate it for text-overlay legibility. And the deepest alternative is capture: photographing the subject against a plain contrasting background at the start makes every downstream step trivial. Segmentation is genuinely excellent now — but a good capture still beats a great correction.",
        ],
      },
    ],
    faq: [
      {
        q: "Is my photo uploaded when I remove the background here?",
        a: "No — the segmentation model runs in your browser via WebAssembly. The image is processed on your device and never leaves it.",
      },
      {
        q: "Why are the edges ragged on my subject?",
        a: "Low contrast between subject and background forces the model to guess along boundaries. Higher-contrast capture, or manual edge cleanup with the brush, fixes the fringing.",
      },
      {
        q: "What format keeps the transparency?",
        a: "PNG (or WebP) — both carry alpha channels. JPG flattens transparency to a background color at export.",
      },
      {
        q: "Can I add a new background after removal?",
        a: "Yes — the cutout composites onto any image or color. Match lighting direction and add a soft contact shadow to avoid the 'sticker' look.",
      },
      {
        q: "Why does my photo of a person come out with fuzzy hair?",
        a: "Hair is the hardest segmentation case — fine, translucent strands. Slight inward edge correction, or a background blur instead of full removal, handles it better.",
      },
    ],
    related: ["background-remove-image", "blur-image", "resize-image", "png-to-jpg", "jpg-to-png"],
  },
  {
    slug: "compress-images-web-guide",
    title: "Image Compression for the Web: Core Web Vitals Without the Pain",
    description:
      "How to make images dramatically smaller with no visible quality loss: format choice, resize discipline, quality settings, and the lazy-loading habits that make pages fast.",
    category: "image",
    updated: "2026-09-28",
    intro: [
      "Images are most of the web's weight — typically 60–70% of a page's bytes — which makes image optimization the highest-leverage performance work available, and the least technical. No framework changes, no build tooling: pick the right format, ship the right dimensions, choose a sane quality level, and lazy-load what's below the fold. This guide is that checklist with the reasoning attached, sized so a page that took 8 seconds loads in 2.",
      "The physics that makes this work: image size is driven by pixel count and encoding efficiency, and both are usually wrong by large factors. A 4000×3000 camera photo displayed in a 800px content column carries 16× more pixels than needed. The same photo as WebP instead of JPG weighs 25–34% less at identical quality. Multiply those two corrections and a 4 MB hero image becomes 200 KB — visually identical. No other optimization on the stack delivers 20×.",
    ],
    sections: [
      {
        h2: "Resize first: the 16× nobody ships",
        paragraphs: [
          "Shipping full-resolution photos into fixed-size slots is the web's most common image sin. The rule: the image file should match its largest rendered size (times device pixel ratio — 2× for retina). A hero displayed full-width at 1600px on a retina screen wants a 3200px file; a product thumbnail in a 300px slot wants 600px. Everything else is wasted bytes — and the browser downscales the excess anyway, so the visitor pays for pixels that never appear.",
          "Resize discipline also compounds with format choice: resize to target first, then encode — encoding at full size and letting CSS shrink the display wastes the pixels twice. For responsive layouts, one file per breakpoint (a 480px, a 960px, a 1600px variant) with srcset is the full pattern; a single sensibly-sized file covers most sites' real needs.",
        ],
      },
      {
        h2: "Format and quality: the two dials",
        paragraphs: [
          "Format: WebP for everything web-delivered (lossy for photos, lossless for screenshots/graphics), JPG/PNG as universal fallbacks, AVIF where the toolchain supports it. Quality: the counterintuitive finding is that quality settings are mostly forgiving — 80% WebP is visually transparent for photographs and dramatically smaller than 100%. Beyond ~85% you're buying invisible improvements with real bytes; below ~70% artifacts appear around text edges and flat-color boundaries. Screenshots with small text are the fragile case — PNG or lossless WebP for those, since lossy artifacts on text are exactly what eyes catch.",
          "The workflow that makes this mechanical: batch convert a site's image library to WebP at 80–85%, resize per the render-size rule, and compare a before/after of the heaviest pages. The typical outcome on image-heavy sites: 60–80% total image-weight reduction with no visible change — which is why this guide is the shortest path to a faster site.",
        ],
        bullets: [
          "Photos → WebP at 80–85% quality, resized to render dimensions × 2.",
          "Screenshots/diagrams → PNG or lossless WebP; lossy artifacts on text are visible.",
          "Icons/logos → SVG where possible; PNG at exact sizes otherwise.",
          "Thumbnails → generate at slot size, don't reuse hero files downscaled by CSS.",
        ],
      },
      {
        h2: "Lazy loading and the habits that finish the job",
        paragraphs: [
          "Encoding handles the bytes; loading behavior handles the experience. Lazy-load everything below the fold (loading=\"lazy\" on the img), and never lazy-load the hero — the LCP (Largest Contentful Paint) element should load eagerly, ideally preloaded. Width and height attributes on images prevent layout shift (CLS), the metric that makes pages feel janky regardless of speed. These are HTML one-liners, but they're the difference between 'images are small' and 'the page feels instant'.",
          "The measurement loop closes it: run the page through any Core Web Vitals checker before and after. LCP typically improves by the exact megabytes the images lost; CLS fixes come from the width/height habit. And the maintenance habit: new images get the same treatment at upload time — a site's image debt only grows when optimization is a one-off project instead of a habit.",
        ],
      },
    ],
    faq: [
      {
        q: "What quality setting should I use for web images?",
        a: "80–85% WebP for photos is visually transparent and dramatically smaller than 100%. Below 70%, artifacts appear around text and flat edges.",
      },
      {
        q: "Why are my images slow despite compression?",
        a: "Usually dimensions: a 4000px photo in an 800px slot ships 16× the needed pixels. Resize to render size (×2 for retina) before encoding.",
      },
      {
        q: "PNG or JPG for screenshots?",
        a: "PNG (or lossless WebP) — screenshots are flat-color, sharp-edged content where lossy artifacts on small text are clearly visible.",
      },
      {
        q: "Does image optimization really affect SEO?",
        a: "Yes — Core Web Vitals (LCP, CLS) are ranking signals, and images dominate both. Faster image delivery measurably moves them.",
      },
      {
        q: "How do I convert a whole folder of images?",
        a: "Batch conversion handles it: drop the folder, choose format and quality, download the ZIP. All local — no upload ceiling.",
      },
    ],
    related: ["compress-image", "resize-image", "jpg-to-webp", "png-to-webp", "scale-image"],
  },
  {
    slug: "ocr-scanned-documents-guide",
    title: "How to OCR Scanned Documents (and Get Searchable PDFs That Stay Sharp)",
    description:
      "Turning scans into searchable, selectable documents: how OCR accuracy actually works, the capture settings that determine everything, language selection, and post-OCR cleanup.",
    category: "image",
    updated: "2026-09-28",
    intro: [
      "A scanned document is a photograph pretending to be text: visible to eyes, invisible to search, copy, and every tool that works on words. OCR — optical character recognition — bridges that gap by recognizing characters and attaching an invisible text layer beneath the image, so the document gains searchability without changing how it looks. This guide covers how recognition accuracy actually works (it's mostly decided before OCR ever runs), the capture and preprocessing settings that matter, and the cleanup that turns a 90%-accurate result into a usable document.",
      "The framing that saves the most pain: OCR accuracy is a pipeline property, not an engine property. The same engine yields 98% on a clean 300 DPI scan and 70% on a crooked phone photo of a fax. The engine matters — modern Tesseract-based recognition is excellent — but capture quality, language selection, and preprocessing decide the ceiling before recognition begins.",
    ],
    sections: [
      {
        h2: "Capture quality: where accuracy is won",
        paragraphs: [
          "Resolution: 300 DPI is the standard for a reason — glyph strokes resolve cleanly at that density; 200 DPI starts dropping thin strokes (i, l, t become ambiguous); 150 DPI is where accuracy collapses. For phone captures, that translates to filling the frame with the page, holding steady, and shooting in even light. Skew: recognition assumes roughly horizontal text lines; a 2–3° tilt is tolerable, 5°+ measurably degrades. Straighten before OCR — the straighten tool's tenth-of-a-degree grid exists precisely for this.",
          "Lighting and contrast: shadows across text are the top scanner-killer — a shadow edge reads as a character boundary. Even, diffuse light (near a window, or two light sources) beats any single harsh source. And thresholding: for uneven scans, converting to pure black-and-white with a tuned threshold (drag the slider, watch the preview) often lifts accuracy more than any engine setting, because the recognizer stops guessing about anti-aliased gray edges.",
        ],
      },
      {
        h2: "Language and document structure",
        paragraphs: [
          "OCR is language-aware: recognition models know which characters and letter sequences occur in which scripts. Running English-language recognition on a French document yields 'langue' becoming 'langue' or worse — accented characters are where wrong-language models fall apart. Pick the document's actual language (the tool supports 100+), and for mixed-language documents pick the dominant one; modern engines handle common loanwords fine.",
          "Structure matters too: forms with ruled lines, tables, and multi-column layouts challenge recognition order — the text layer may interleave columns. For forms, OCR the whole page and expect to clean up field order; for tables, OCR is the input to reconstruction (Word tables to Excel-style extraction), not the end product. The sweet spot for OCR is continuous prose: reports, books, letters, invoices — documents that are lines of text with no complex geometry.",
        ],
      },
      {
        h2: "The OCR workflow, end to end",
        paragraphs: [
          "Scan or capture well (300 DPI, even light, straight). Preprocess if needed: straighten, threshold, or bump contrast — each is a tool here. Run OCR with the correct language, page by page for long documents. Verify by searching: pick three words from different pages, search for them in the result, and confirm they hit — the fastest accuracy check there is. Then extract or convert: searchable PDF for archiving, plain text for reuse, Word for editing — each is a downstream tool away.",
          "Expectation-setting on speed: browser OCR processes roughly a page per second or two on modern hardware — a 50-page scan takes minutes, not the seconds a server farm spends. That's the price of the document never uploading, and for confidential material (financial records, medical documents, contracts) it's a price worth paying.",
        ],
      },
      {
        h2: "Post-OCR cleanup that's worth the time",
        paragraphs: [
          "No OCR is perfect, and knowing where errors concentrate makes cleanup efficient. Numbers and proper nouns are the highest-stakes errors — amounts, dates, names — and they're exactly what a spot-check should target. Repeated characters and ligatures (ff, fi) are classic recognition traps. And structure artifacts: page headers/footers repeating into the text, hyphenation at line breaks — a find-replace pass handles both mechanically. For documents that matter, one careful read-through of the extracted text (not the scan) catches the rest; reading text is five times faster than proofreading a scan.",
        ],
      },
    ],
    faq: [
      {
        q: "What DPI should I scan at for OCR?",
        a: "300 DPI. Below 200, thin strokes drop out and accuracy falls; above 400, file size grows without accuracy gains.",
      },
      {
        q: "How accurate is browser OCR?",
        a: "Clean 300 DPI scans typically exceed 95% with the correct language selected. Skew, shadows, and low resolution are what degrade it — capture quality dominates.",
      },
      {
        q: "Does my document upload for OCR?",
        a: "No — recognition runs in your browser (Tesseract via WebAssembly). Confidential documents stay on your device.",
      },
      {
        q: "Can OCR handle handwriting?",
        a: "Neat printing, sometimes; cursive handwriting, no — the engine is tuned for typeset text. Handwritten documents need specialized transcription services.",
      },
      {
        q: "How do I check the OCR result quickly?",
        a: "Search the output for three words from different pages — hits confirm the text layer works. For high-stakes documents, spot-check numbers and names specifically.",
      },
    ],
    related: ["ocr-pdf", "scan-to-pdf", "straighten-image", "threshold-image", "pdf-to-text"],
  },
  {
    slug: "convert-word-excel-guide",
    title: "Word to Excel and Back: Getting Table Data Out of Documents",
    description:
      "Why document tables are hard to extract, how Word-to-Excel conversion actually works, what survives and what needs cleanup, and the formats that keep data machine-readable.",
    category: "text",
    updated: "2026-09-28",
    intro: [
      "Word tables are where data goes to be read once. A requirements matrix, a financial summary, a survey breakdown — written into a document, formatted for humans, and then needed as data the moment someone wants to sort, filter, or chart it. Getting tables out of documents into spreadsheets is the bridge from narrative to analysis, and doing it well requires understanding what a Word table actually is and what survives the crossing. This guide covers the mechanics, the cleanup patterns, and the format decisions that keep data usable.",
      "The structural fact: in a .docx, a table is a real table object — rows, columns, cells — not positioned text. That's good news: extraction can read the actual grid rather than inferring it from spacing (which is what PDF table extraction has to do, and why PDF tables convert so much worse). The catch is content: cells contain formatted text runs, merged cells break the grid, and nested tables nest. Extraction quality depends on how much of that machinery the source table uses.",
    ],
    sections: [
      {
        h2: "How extraction works and what it preserves",
        paragraphs: [
          "Extraction walks the document's table structures in order and writes each into a spreadsheet — rows map to rows, columns to columns, cells to cells. Multiple tables land on separate sheets or stacked regions in document order, so traceability back to the source survives. Merged cells flatten to their underlying grid (the header row that spanned three columns becomes three cells, two of them empty or repeated) — which is usually exactly what sorting and filtering want, since merged cells break both.",
          "What carries over: text content, basic cell order, the grid geometry. What doesn't: cell formatting (colors, fonts, borders — spreadsheets get their own), embedded images inside cells (rare, and usually better re-added manually), and any table-calculation the document faked with text. The output is a real .xlsx: filters, formulas, and charting all work from there.",
        ],
      },
      {
      h2: "The cleanup patterns that matter",
      paragraphs: [
        "Three patterns cover most post-extraction cleanup. Header rows: the spreadsheet's first row should be field names — if the source table used a merged banner row, delete it and promote the real header row to row 1 (filters read from there). Numbers-as-text: values that arrived formatted ('$1,200.50', '15%') are text to the spreadsheet; a find-replace pass stripping currency symbols and thousands separators, then reformatting as numbers, restores sortability. Multi-line cells: cells with embedded line breaks (address blocks, descriptions) sort by their first line — fine for display, annoying for filtering; split them into columns with the spreadsheet's text-to-columns when needed.",
        "One more, worth naming: empty cells vs. missing values. Extraction preserves the grid exactly — including cells that were empty for layout reasons (spanned rows, blank separators). Decide what 'empty' means in your data (zero? unknown? not-applicable?) and normalize; downstream formulas treat all three identically unless you say otherwise.",
      ],
      },
      {
        h2: "The wider format question",
        paragraphs: [
          "Tables aren't the only data in documents — and sometimes the right extraction is simpler. Word to text gives you the whole document's prose for search indexing, translation pipelines, or LLM prompts (tables flatten with tab separation). Word to HTML carries tables as real <table> markup for the web. And the reverse direction — building documents from spreadsheet data — is template filling: placeholders in a Word template map to values from your dataset, one output per record, which is how offer letters, invoices, and certificates scale past about a dozen documents.",
          "The unifying principle: keep data in a data format (spreadsheet, CSV, JSON) and documents in a document format, and convert at the boundaries deliberately. The pain this guide addresses is what happens when data lives inside documents for months and then has to come home.",
        ],
      },
    ],
    faq: [
      {
        q: "Do multiple tables go to separate sheets?",
        a: "Yes — each table exports in document order, either to its own sheet region or stacked, so you can trace extracted data back to its source table.",
      },
      {
        q: "What happens to merged cells?",
        a: "They flatten to the underlying grid — the spanned columns become individual cells. That's usually what you want for sorting and filtering.",
      },
      {
        q: "Why are my numbers text after extraction?",
        a: "Formatted values ('$1,200.50') extract as text. Strip the formatting with find-replace, then apply a number format to restore sortability.",
      },
      {
        q: "Can I extract tables from a PDF instead?",
        a: "PDFs have no table object — tables are positioned text, and extraction must infer the grid. Word/DOCX extraction is far more reliable; for PDFs, convert to Word first, then extract.",
      },
      {
        q: "Does cell formatting (colors, borders) carry over?",
        a: "No — the extraction targets data and grid structure. Apply spreadsheet-native formatting after import.",
      },
    ],
    related: ["word-tables-to-excel", "word-to-text", "word-template-filler", "word-to-html", "pdf-to-word"],
  },
  {
    slug: "pdf-password-protection-guide",
    title: "PDF Passwords and Permissions: What They Actually Protect",
    description:
      "The honest guide to PDF security: what a password stops and what it doesn't, user vs. owner passwords, why metadata leaks, and a protection checklist for confidential documents.",
    category: "pdf",
    updated: "2026-09-29",
    intro: [
      "Clicking 'encrypt with a password' feels like putting a document in a safe. The reality is more nuanced: PDF encryption is strong mathematics wrapped around a weak link — the choices you make about which password, which restrictions, and what metadata travels alongside the encrypted pages. This guide explains the two-password model, what each protection layer actually prevents, where real-world leaks happen (almost never through the cipher), and a practical checklist for documents whose confidentiality matters.",
      "The headline worth internalizing first: AES-256, the strongest encryption PDFs support, has never been practically broken. When a 'protected' document leaks, the cause is almost always one of the human layers — the password was shared in the same email as the file, the metadata still named the wrong recipient, the permissions password was never set, or the recipient simply forwarded the unlocked copy you sent them. Document security is a chain, and the cipher is rarely the weak link.",
    ],
    sections: [
      {
        h2: "Two passwords, two very different jobs",
        paragraphs: [
          "The user password (open password) locks the document itself: without it, the file is unreadable cipher. This is the layer that protects confidentiality, and it's the one that matters when a file travels to someone who shouldn't open it — an email misfire, a shared folder with the wrong permissions. The owner password (permissions password) is different and routinely misunderstood: a file with only an owner password opens freely for anyone — they can read everything — but viewing applications honor restrictions on printing, copying, and editing. It is an instruction to well-behaved software, not a lock.",
          "The consequence: if your threat model is 'I don't want this read by the wrong person,' an owner password alone provides zero confidentiality. If your threat model is 'I want to discourage casual copying,' an owner password does that — while accepting that any of a dozen free tools (including the one on this site, which requires the legitimate password precisely for this reason) removes it for anyone with the user password, or with no password at all. Set the user password for secrets; set the owner password for etiquette.",
        ],
        bullets: [
          "User (open) password: actual confidentiality — required for confidential content.",
          "Owner (permissions) password: discourages printing/copying/editing; not secrecy.",
          "AES-256: choose it over legacy 40/128-bit RC4 whenever the tool offers the option.",
          "Neither password protects against a recipient who voluntarily forwards the file.",
        ],
      },
      {
        h2: "Where protected documents actually leak",
        paragraphs: [
          "The password travels with the file: the single most common failure. 'Here's the contract — password is Spring2026!' in the same email as the attachment means the protection exists in name only; anyone intercepting either message has both halves. Send the password out-of-band: a phone call, a different messaging app, or split across two channels. It feels paranoid for about the one week it takes to become a habit.",
          "Metadata tells the story you didn't: the document properties — author name, title, the software and machine that produced it, revision history — ride along unless explicitly stripped. A redacted-looking PDF that still carries a title like 'Layoffs_2026_draft_v3' or an author field naming a person who was never meant to be visible has leaked context before a single page is read. The metadata editor shows what's there; the stripper removes it. Check this on anything leaving your organization.",
        ],
      },
      {
        h2: "Redaction versus hiding",
        paragraphs: [
          "Covering a word with a black rectangle changes its color, not its existence — the text lives on under the box, one copy-paste from exposure. Genuine redaction deletes the content: the text object is removed from the file before the bar is drawn. The distinction has produced some of the most embarrassing document leaks on record, precisely because a redacted-by-drawing file looks perfectly protected in every viewer.",
          "The same logic applies to buried remnants: deleted pages that linger in a file's structure on some incremental saves, embedded attachments nobody remembers adding, comments and annotation threads from review rounds. A protection pass on an important document should include: redact properly, strip metadata, and flatten forms so field values can't be edited back out of their boxes.",
        ],
      },
      {
        h2: "A protection checklist for confidential documents",
        paragraphs: [
          "Before anything sensitive leaves your device, in order: fix the metadata first (title, author — set what should be seen, strip what shouldn't); redact genuinely if any content must not reach the recipient; set the user password with AES-256 if the content is confidential, and send that password out-of-band; add an owner password to discourage casual printing or copying when the recipient is trusted to read but you'd rather they not redistribute; verify the result on a machine that doesn't have the password cached — the encryption checker reports what protection the file actually carries, which occasionally differs from what you believed you applied.",
          "And the layer above all tools: the recipient. Protection authenticates and encrypts; it does not create trust. For documents whose control truly matters — contracts in negotiation, board materials, personal records — the strongest technical measure is minimizing distribution: fewer copies, named recipients, and a shared understanding that the document is confidential. Every protection in this guide is defeated by an authorized recipient who chooses to forward the file. Technology narrows the attack surface; it cannot replace judgment about who receives the document in the first place.",
        ],
      },
    ],
    faq: [
      {
        q: "Is a permissions password real security?",
        a: "No — it restricts printing, copying, and editing only in applications that honor it. Anyone can read the document. Confidential content needs a user (open) password.",
      },
      {
        q: "How strong is PDF encryption?",
        a: "AES-256 PDF encryption has never been practically broken. Real-world leaks come from shared passwords, leftover metadata, or recipients forwarding files — not the cipher.",
      },
      {
        q: "How should I share the password itself?",
        a: "Out-of-band: a phone call or a different app than the one carrying the file. Password-in-the-same-email equals no protection.",
      },
      {
        q: "Does encryption hide the document's metadata?",
        a: "Some viewers gate it behind the password, but you should not rely on it: strip sensitive metadata before encrypting, so the context never ships at all.",
      },
      {
        q: "Can I check what protection a PDF actually has?",
        a: "Yes — the encryption checker reports the cipher strength and which restrictions are set, which is worth doing on any document you're about to trust.",
      },
    ],
    related: ["protect-pdf", "unlock-pdf", "pdf-encrypt-check", "redact-pdf", "pdf-metadata-stripper"],
  },
  {
    slug: "document-scanning-guide",
    title: "Phone Scanning Done Right: From Bad Photo to Clean Document",
    description:
      "Why scanner-app output looks professional and camera photos don't: capture technique, the correction pipeline (crop, straighten, threshold), and turning images into searchable PDFs.",
    category: "image",
    updated: "2026-09-29",
    intro: [
      "A photo of a document is not a scan — or at least, it isn't yet. The camera version has keystone distortion from shooting at an angle, uneven lighting with a shadow across half the page, a gray instead of white background, and text too soft for OCR. Scanner apps fix this with a pipeline of corrections, and every one of those corrections is available here as a standalone tool. This guide walks the pipeline in order: capture, crop, straighten, clean, and convert — with the settings that separate a document that looks photographed from one that looks scanned.",
      "The order matters more than the individual steps. Straighten before cropping (the crop frame rotates with the correction); clean and threshold before converting to PDF (the conversion bakes whatever state the image is in); OCR last (recognition quality is capped by everything that came before). People who get poor results usually aren't missing a tool — they're running the same pipeline in an order that undoes earlier corrections.",
    ],
    sections: [
      {
        h2: "Capture: the five seconds that decide everything",
        paragraphs: [
          "Light: even, diffuse light is the single biggest quality factor. A window on an overcast day is ideal; two lamps at opposite corners beat one overhead source. Avoid direct overhead light, which bounces off glossy paper into hotspots, and avoid any angle where your own shadow crosses the page. If the light can't be fixed, the threshold step can compensate — partially — by forcing white backgrounds at the cost of some faint content.",
          "Geometry: shoot straight down, filling the frame. Every degree off-perpendicular adds keystone distortion — the page becomes a trapezoid with text narrower at the far edge — which no amount of later correction fully repairs. Hold steady and tap to focus on the text itself, not the page center: focus error is the difference between OCR-ready text and a soft blur that recognition reads at 70%. And capture at full resolution; storage is cheap, and resolution lost at capture cannot be recreated.",
        ],
      },
      {
        h2: "The correction pipeline, in order",
        paragraphs: [
          "Straighten first: level the horizon to a tenth of a degree — recognition assumes horizontal text lines, and even a 3° tilt measurably degrades OCR. Crop second, as tightly as the content allows: margins become gray padding in the PDF, and tight crops make thumbnails, prints, and screen reads all better. Perspective correction (for the trapezoid shots that couldn't be avoided) belongs in this stage too — un-skew the page before anything else touches it.",
          "Then the cleaning pass, where photos become documents. Threshold (black-and-white conversion with a live-adjustable cutoff) turns the gray camera background into paper-white and pushes text to true black — this is the step that makes a phone photo look scanned, and on anything destined for OCR it's usually worth the loss of grayscale detail. Contrast and sharpening handle the in-between cases: mild low-contrast scans that aren't bad enough to warrant full thresholding. One pass, in this order, and the image is ready for assembly.",
        ],
        bullets: [
          "Straighten (and un-skew) → crop tight → threshold or contrast → convert → OCR.",
          "Threshold for OCR and print; contrast-only when faint stamps or photos matter.",
          "300 DPI effective resolution at final size is the target — resize down, never up.",
        ],
      },
      {
        h2: "From images to a real document",
        paragraphs: [
          "Assembly is the easy part once the images are clean: JPG to PDF (one image per page) or Images to PDF (many at once, with reordering) wraps them into a single document at a consistent page size — usually A4 or Letter so prints behave. Orientation should already be correct from the straighten step; if a page slips through sideways, real per-page rotation fixes it at the PDF level non-destructively.",
          "The last step is the one that changes what the document can do: OCR. Recognition attaches an invisible text layer under the image, making the PDF searchable and its text selectable — the difference between a document you can only look at and one you can work with. Capture quality, thresholding, and straightening all pay off here: a clean pipeline routinely exceeds 95% recognition accuracy, while a rushed photo of a crumpled receipt can fall below 80%. Run OCR page by page for long documents, then verify by searching for three words from different pages.",
        ],
      },
      {
        h2: "When to rescan instead of repair",
        paragraphs: [
          "Some photos are past saving: focus miss on the text, a shadow that sits exactly on a line of numbers, a page folded through the signature. The correction pipeline can spend your time and still deliver a worse document than a twenty-second reshoot would. The honest test: if the text itself is hard for you to read on the photo, it will be impossible for OCR — recapture rather than repair.",
          "For recurring scanning — expenses, intake forms, mail — build the habit instead of the rescue: same surface, same light, fill the frame, shoot, and run the batch through the pipeline weekly. Ten consistent captures beat fifty rescues, and the batch converter turns the routine into a single drop-and-download step.",
        ],
      },
    ],
    faq: [
      {
        q: "Why does my document photo look gray instead of white?",
        a: "Cameras expose for the whole scene, and paper is never lit evenly. Threshold conversion forces the background to pure white and text to black — the step that makes photos look scanned.",
      },
      {
        q: "What resolution should document photos be?",
        a: "Aim for 300 DPI at final page size — roughly 2,500×3,300 pixels for an A4 page. Higher helps nothing after that; lower starts dropping thin character strokes.",
      },
      {
        q: "Why is OCR accuracy poor on my photo?",
        a: "Usually capture: skew, shadows, focus, or gray-on-gray contrast. Straighten, threshold, and reshoot if the text is blurry — recognition can't exceed what the image actually shows.",
      },
      {
        q: "Should I scan in color or black-and-white?",
        a: "Black-and-white (thresholded) for text documents — smaller, sharper, better for OCR. Grayscale or color when stamps, photos, or signatures carry information that contrast loss would erase.",
      },
      {
        q: "Can I combine photos taken on different days into one PDF?",
        a: "Yes — process each through the pipeline, then merge or assemble with Images to PDF. Consistent correction matters more than consistent capture timing.",
      },
    ],
    related: ["scan-to-pdf", "jpg-to-pdf", "images-to-pdf", "straighten-image", "threshold-image"],
  },
  {
    slug: "file-size-reduction-guide",
    title: "Every Way to Shrink a File (and When Each One Applies)",
    description:
      "PDFs, images, Word documents, and folders of them: why files are big, the reduction tool for each case, and the order of operations that hits a size limit with minimum quality loss.",
    category: "text",
    updated: "2026-09-29",
    intro: [
      "'The file is too big' arrives in many forms: the 25 MB portal that rejects a 30 MB PDF, the email attachment ceiling, the folder of scans that needs to travel as one archive. The solutions are just as varied — and applying the wrong one wastes time or quality. This guide maps file weight to its actual causes and the reduction strategy for each: compression for image-heavy PDFs, resizing for photos, subsetting and cleanup for Word documents, and splitting when no amount of shrinking will fit the budget.",
      "The unifying principle: size has causes, and each cause has its own fix. A PDF that's huge because of one embedded photo will not benefit from re-saving; a Word document bloated by tracked changes and embedded fonts ignores image logic entirely. Diagnose first — the file inspector tells you where the bytes live — then apply the tool that addresses that cause. Everything below runs locally in your browser, so even multi-hundred-megabyte files are practical.",
    ],
    sections: [
      {
        h2: "PDFs: find the weight before you compress",
        paragraphs: [
          "Open the inspector first. If images dominate (the usual case — scans, photo-embedded reports), compression is the answer, and the level choice follows the destination: medium for email and web (typically 40–70% off scans, visually transparent), high only for hard limits, low or none for print. If fonts dominate (CJK documents can carry 10+ MB of glyphs), compression won't touch it — accept the size or re-author with system fonts. If structure dominates (incremental saves stacking revisions), a clean re-save through a normalizer strips the dead weight.",
          "Then the levers people miss. Optimize for web (linearization) doesn't shrink much but transforms perceived speed — pages render before the download finishes. Splitting by size doesn't shrink at all but guarantees compliance when a portal enforces a ceiling: compress to get near the target, split to guarantee it. And the scanner's lever: a 600 DPI source compresses well but is still heavier than a 300 DPI rescan — capture resolution is the upstream fix no post-processing quite matches.",
        ],
      },
      {
        h2: "Images: resize, then encode",
        paragraphs: [
          "Two numbers decide image weight: pixel count and encoding efficiency — and pixel count is usually the bigger sin. A 4000×3000 camera photo displayed in an 800px article column carries 16× the needed pixels; no quality setting fixes that. Resize to the largest rendered size first (×2 for retina), then choose the format: WebP for web delivery (25–34% under JPG at equal quality), JPG at 85–90% for universal compatibility, PNG only for sharp-edged graphics, screenshots, and anything needing transparency.",
          "Quality settings are more forgiving than people expect: 80–85% is visually transparent for photographic content, and the cliff is below 70% where artifacts appear around text and flat edges. The compounding effect is where the wins live — resize to half the linear dimensions plus WebP instead of JPG typically lands a 4 MB camera photo near 200 KB with no visible difference. For folders of images, batch conversion applies the identical recipe to all of them in one pass.",
        ],
        bullets: [
          "Resize to render size × 2 (retina) before any format conversion.",
          "WebP 80–85% for photos on the web; JPG 85–90% for email-bound compatibility.",
          "PNG for screenshots and logos — and never re-save a JPG repeatedly.",
        ],
      },
      {
        h2: "Word documents: the invisible bloat",
        paragraphs: [
          "DOCX files are ZIP archives, and their size hides in odd corners: embedded fonts (each can weigh megabytes), full-resolution images pasted from phones (unresized, unconverted), tracked changes and comments accumulating through review rounds, unused style definitions from template ancestors, and embedded objects — a linked spreadsheet that arrived as a full embedded copy. Compression for Word targets the safe parts: re-encoding images inside the package at web-appropriate quality, which typically halves a document whose bloat is photographic.",
          "The rest is hygiene: accept or reject tracked changes before distribution (smaller, and it removes history you may not intend to share); run a style cleaner to strip orphaned formatting definitions; check the metadata editor for embedded thumbnails. And when the document must not change — a signed agreement, a filed form — convert to PDF first, then compress the PDF: the PDF's compression tools are more precise about what they sacrifice, and the snapshot semantic fits 'this is final.'",
        ],
      },
      {
        h2: "When shrinking isn't enough: split deliberately",
        paragraphs: [
          "Some files cannot reach their target: a 200-page scan at acceptable quality may never fit a 10 MB portal. That's the moment to stop compressing and start splitting — split by size cuts at page boundaries against a byte budget (aim 10% under the stated limit for gateway overhead), producing parts that concatenate back to the original. Label the parts ('Part 1 of 3') in the email; recipients reassemble by downloading all before opening.",
          "The decision rule, compressed: one file under one limit → compress; a folder under one limit → batch-convert, then ZIP (archives re-compress what's left); a document that refuses both → split by size; a document that must remain single and whole → renegotiate the limit or the medium, because the last 10% of compression costs the most quality. Knowing which situation you're in is most of the solution.",
        ],
      },
    ],
    faq: [
      {
        q: "Why won't my text-only PDF compress?",
        a: "There's nothing to re-encode — its bytes are fonts and structure. Check the inspector; if fonts dominate, only re-authoring with lighter fonts helps.",
      },
      {
        q: "Compress before or after splitting?",
        a: "Compress first, then split by size. Splitting doesn't shrink anything — it guarantees the ceiling once compression has done what it can.",
      },
      {
        q: "What's the fastest way to shrink a folder of photos?",
        a: "Batch resize to render dimensions, batch-convert to WebP at 80–85%, download as ZIP. The whole folder typically drops 80–90%.",
      },
      {
        q: "Why is my Word file so big with almost no images?",
        a: "Usually embedded fonts, accumulated tracked changes, or an embedded object like a pasted spreadsheet. Accept changes, run a style cleaner, and check the metadata.",
      },
      {
        q: "How far under a size limit should I aim?",
        a: "About 10% — gateways and mail servers measure with their own overhead, and a part that's exactly at the limit is the part that bounces.",
      },
    ],
    related: ["compress-pdf", "split-pdf-by-size", "optimize-pdf-web", "compress-word", "compress-image"],
  },
];

// ── Dev-time validation: related slugs must exist in the tool catalog ──
if (process.env.NODE_ENV !== "production") {
  const known = new Set(ALL_TOOLS.map((t) => t.slug));
  const broken: string[] = [];
  for (const guide of GUIDES) {
    for (const slug of guide.related) {
      if (!known.has(slug)) broken.push(`${guide.slug} → ${slug}`);
    }
  }
  if (broken.length > 0) {
    throw new Error(`[guides] Related tool slugs not in catalog: ${broken.join(", ")}`);
  }
}

/** Look up a guide by slug. */
export function getGuideBySlug(slug: string): Guide | null {
  return GUIDES.find((g) => g.slug === slug) ?? null;
}

/** Canonical URL for a guide page. */
export function guideUrl(slug: string): string {
  return absoluteUrl(`/guides/${slug}`);
}

/** Reading time in minutes, computed from the guide's own content. */
export function readingMinutes(guide: Guide): number {
  const words = [
    ...guide.intro,
    ...guide.sections.flatMap((s) => [...s.paragraphs, ...(s.bullets ?? [])]),
    ...guide.faq.map((f) => `${f.q} ${f.a}`),
  ].join(" ").split(/\s+/).length;
  return Math.max(3, Math.round(words / 220));
}
