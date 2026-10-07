// lib/content/pdf-a.ts
//
// Editorial content for PDF tools, part A (organize, edit, security, sign,
// form, info). Part B lives in pdf-b.ts (convert, image, batch).
//
// Every entry is unique, hand-written copy — no templated filler.

import type { ToolGuideMap } from "./types";

const PDF_GUIDES_A: ToolGuideMap = {
  // ── Organize ────────────────────────────────────────────────────
  "merge-pdf": {
    paragraphs: [
      `Combining documents sounds trivial until the PDFs fight back. One file is portrait, the next is landscape, a third came out of a scanner upside-down, and the "combined" result is a mess of mismatched page sizes. This merge tool handles those realities: it preserves each source document's page dimensions, so a Letter-sized contract followed by an A4 spreadsheet stays exactly the size it was — no silent rescaling, no cropped margins.`,
      `Everything happens locally in your browser. The files are read with the browser's File API, combined with pdf-lib, and handed back as a download — nothing is transmitted, so there is no upload wait and no server-side size cap. That architecture also makes the tool usable with confidential material: contracts, medical records, financial statements, anything you would not hand to a stranger's web service.`,
      `A practical tip for clean output: merge the cover page and table of contents last. If the TOC was generated from an earlier draft, its page numbers won't match the final pagination — merging it last means regenerating one small file instead of the whole packet.`,
    ],
    faq: [
      { q: "Will bookmarks and links survive the merge?", a: "Internal links and annotations are kept where the underlying PDF structure allows it. Complex documents with cross-document links may lose those specific references, since the target pages move." },
      { q: "Can I merge more than two files?", a: "Yes — add as many files as you like and drag them into the order you want before merging." },
      { q: "Why did my merged file get larger than the sum of the parts?", a: "Each PDF carries its own embedded fonts and resources. When fonts differ across sources, the combined file embeds all of them. Run the result through Compress PDF if size matters." },
    ],
  },
  "split-pdf": {
    paragraphs: [
      `Splitting a PDF is really about deciding where boundaries carry meaning: a chapter break, an invoice per page, a signed section that needs to circulate on its own. This tool gives you both models — extract specific ranges (1–3, 5, 8–10) or explode the document into one file per page — and produces genuine, standalone PDFs rather than a trick that only works in one viewer.`,
      `Because the split runs on pdf-lib in your browser, the source document never leaves your device. That matters for the most common split scenarios: cutting a payroll report into individual employee letters, separating a scanned exam into per-student files, or pulling signed pages out of a 200-page agreement — exactly the documents you should not be uploading anywhere.`,
      `If your goal is size rather than page count — say a 40 MB scan that a portal rejects above 10 MB — you'll get better results from Split PDF by Size, which measures output as it goes and cuts at page boundaries to stay under a byte budget instead of a page count.`,
    ],
    faq: [
      { q: "Do the split files keep the original quality?", a: "Yes. Splitting copies pages between documents without re-rendering, so text stays selectable and images keep their original resolution." },
      { q: "Can I split a password-protected PDF?", a: "Remove the password first (see Unlock PDF) — the splitter can only read documents that open in your browser." },
    ],
  },
  "split-pdf-by-size": {
    paragraphs: [
      `Email providers and government portals enforce file-size ceilings — 10 MB, 25 MB, sometimes less — and a scanned contract blows through all of them. This tool inverts the usual split flow: instead of asking how many pages, you declare a byte budget and it cuts the document into parts that each respect it.`,
      `The split always happens at page boundaries, because a page is the smallest indivisible unit of a PDF. The tool measures the running size as it adds pages and closes the current part before the next page would breach the limit. A 58-page scan might become parts of 15, 15, 15 and 13 pages depending on how heavy each page is — image-heavy pages mean fewer pages per part.`,
      `For predictable results, aim slightly under the limit you're targeting (8.5 MB for a 10 MB portal). Viewer overhead varies, and a small margin prevents the frustrating bounce on the final part.`,
    ],
    faq: [
      { q: "Why is my part still over the limit?", a: "If a single page exceeds the entire budget, no split point can fix it — compress the document first with Compress PDF, then split." },
      { q: "Does order matter?", a: "Parts are produced in page order, so concatenating them later reproduces the original document exactly." },
    ],
  },
  "split-pdf-by-bookmarks": {
    paragraphs: [
      `Well-authored PDFs carry their own structure: a bookmark tree marking chapters, sections, and appendices. This tool reads that outline and turns it into split boundaries, so a 400-page manual becomes one file per chapter in a single pass — no manual page counting.`,
      `It uses pdf.js to parse the outline's destinations and target pages, presents the sections for selection, then extracts the corresponding ranges with pdf-lib. Nested bookmarks can be included with their parent section or pulled out separately.`,
      `This is the fastest route when the author did the labeling work for you: board packets split by agenda item, standards documents split by clause, textbooks split by unit. If the PDF has no bookmarks, add them first with the Bookmarks & TOC Editor and come back.`,
    ],
    faq: [
      { q: "Do bookmarks transfer to the new files?", a: "Each output file is a standalone PDF; the relevant bookmark subtree isn't rebuilt inside it. Page content and quality are unaffected." },
      { q: "Can I pick only some sections?", a: "Yes — the section list is a checklist. Extract everything or just the chapters you need." },
    ],
  },
  "compress-pdf": {
    paragraphs: [
      `PDF size is driven almost entirely by images. Text is a few kilobytes per page; a single full-page scan at 300 DPI can be 2–8 MB. So "compressing a PDF" is really the art of re-encoding images at the lowest quality your use case tolerates — and screen reading tolerates far more than print.`,
      `This tool offers low, medium, and high levels that trade image fidelity for bytes. Medium is the right default for email and web distribution: scans typically shrink 40–70% with no visible change at normal zoom. High compression is for archiving or hitting a hard upload limit, and may soften fine detail.`,
      `Compression runs through WebAssembly builds of Ghostscript/qpdf in your browser. Because nothing uploads, even a 300 MB tender document is practical — the limit is your device's memory, not a server's patience. If the result is still too large, the bigger lever is usually scan resolution: a 200 DPI scan compresses dramatically better than 600 DPI with no readability loss for text.`,
    ],
    faq: [
      { q: "How do I compress a PDF to 1MB?", a: "Run the compression on High first and check the result — image-heavy PDFs usually drop well below 1MB. If it's still over the limit, rescan or re-export the source at a lower DPI; text-only PDFs are already too small for compression to matter." },
      { q: "Why didn't my text-only PDF get smaller?", a: "Text PDFs are already tiny — there are no images to re-encode. Fonts and structure take up nearly all the remaining bytes, and removing those would break the document." },
      { q: "Will compression break my PDF's text layer?", a: "No. Text objects are left intact; only image streams are re-encoded. The document stays searchable and selectable." },
      { q: "Which level should I choose for printing?", a: "Low, or skip compression entirely. Print exposes image softening that screens never show." },
    ],
  },
  "rotate-pdf": {
    paragraphs: [
      `Sideways pages usually come from scanners and phone cameras: a contract fed landscape, a receipt photographed at 90°. Some viewers auto-rotate for display, but printing exposes the problem — and a page rotated only in a viewer is still stored sideways in the file. Fixing it at the file level is the durable fix.`,
      `This tool writes real per-page rotation via pdf-lib, in 90° increments, for selected pages or the whole document. Rotation metadata is non-destructive: the page's text stays upright internally, which is why the result remains searchable and why correcting twice returns you to the original orientation.`,
      `A quick workflow for mixed documents: run the pages through the visual page manager (Organize PDF) to spot the sideways ones, note their numbers, then rotate just those. For systematically mis-rotated scans, rotating all pages at once is one click.`,
    ],
    faq: [
      { q: "Can I rotate by an arbitrary angle like 3°?", a: "This tool rotates in 90° increments, which covers scan and camera errors. For slight skews from a crooked scan, level the photo with Straighten Image before rebuilding the PDF." },
      { q: "Does rotating affect file size?", a: "No — it changes a few bytes of per-page metadata in most cases." },
    ],
  },
  "delete-pdf-pages": {
    paragraphs: [
      `The most common PDF surgery is subtraction: drop the blank cover the scanner added, remove the "do not fill" instruction pages from a form packet, cut pages that were duplicated by accident. Deleting at the file level is cleaner than printing a page range to PDF, which flattens everything and destroys the text layer.`,
      `You pick pages visually and the tool rebuilds the document around them with pdf-lib. Remaining pages keep their content, annotations, and order; the sequence is renumbered automatically since PDF pages are a list, not fixed slots.`,
      `One caution: if you earlier covered sensitive text with a black box, deleting the whole page is the safer distribution move — covered text can still be extracted underneath, which is why true redaction tools exist.`,
    ],
    faq: [
      { q: "Can I delete a range like 10–40?", a: "Yes — enter ranges or click pages in the visual picker; both work." },
      { q: "What happens to page numbers printed on the pages?", a: "Printed numbers are page content and stay as they were. If you need renumbering, use Add Page Numbers after deleting." },
    ],
  },
  "extract-pdf-pages": {
    paragraphs: [
      `Extracting is deletion's mirror image: instead of naming the pages to remove, you name the pages to keep and everything else is discarded. It's the right tool when the pages you want are the minority — pulling three signed pages from a long agreement, extracting a single chart page from a report, saving just the appendix a colleague needs.`,
      `The selected pages are copied into a brand-new PDF, leaving the original untouched. Because the operation is a structural copy — not a re-render — fonts, links, and image quality carry over exactly. Run it on confidential documents without hesitation; the file never leaves the browser.`,
      `For a repeated weekly task (extracting the same report section), organize once with Bookmarks so the boundaries are one click away via Split PDF by Bookmarks.`,
    ],
    faq: [
      { q: "Can I extract to multiple new files at once?", a: "This tool produces one file from the current selection. For multiple independent files, run it per selection or use Split PDF." },
      { q: "Is the original file modified?", a: "No. The extraction writes a new PDF; your source file stays exactly as it was on disk." },
    ],
  },
  "insert-pdf-pages": {
    paragraphs: [
      `Insertion is what makes document packets possible: slip a signature page into a contract at clause 12, add a scanned receipt after its expense claim, drop an updated certificate into a compliance binder. You choose the source pages, the destination document, and the exact position — page 1, after page 5, or at the end.`,
      `The tool merges the two documents with pdf-lib while preserving page sizes, so an A4 insert dropped into a Letter document remains A4 — usually what you want, since the alternative silently rescales one of the two. Inserted pages keep their annotations and image quality because nothing is re-rendered.`,
      `A neat trick: to insert between two chapters you don't need to extract anything — choose "insert at position", give the page number where the new content belongs, and the existing pages shift right. Nothing is overwritten.`,
    ],
    faq: [
      { q: "Can I insert pages from multiple PDFs at once?", a: "One source at a time keeps the flow simple — run it again for each additional source, inserting at the new positions each round." },
      { q: "What if the two documents have different page sizes?", a: "Each page keeps its own size. Mixed-size documents are valid PDFs; viewers show each page at its native dimensions." },
    ],
  },
  "reorder-pdf-pages": {
    paragraphs: [
      `Page order in a PDF is just an array, and this tool gives you a drag-and-drop editor for that array. Scanners that output reversed pages, forms that print sections out of sequence, presentations assembled from multiple decks — all are one visual reordering away from correct.`,
      `You see thumbnails of every page, drag them into place, and the tool writes the new sequence with pdf-lib. Because it's a pure reordering, nothing is re-encoded: quality, text layer, and annotations survive untouched. Multi-select makes moving whole blocks fast.`,
      `A time-saver for scan jobs: if every other page is an extra blank from a duplex misfire, reorder and delete in one session — the editor supports both, and you download the fixed document once.`,
    ],
    faq: [
      { q: "Can I reverse the entire document?", a: "Yes — select all pages and drag, or use the reverse option; reversed order is a single operation." },
      { q: "Does reordering change page numbers printed on pages?", a: "Printed numbers are content and move with their pages. If they no longer make sense, overlay fresh ones with Add Page Numbers." },
    ],
  },
  "organize-pdf": {
    paragraphs: [
      `Real-world PDF cleanup is never one operation: the scanner output needs rotating, two pages are duplicates, the signature page belongs after page 4. The Organize view puts all of that in one screen — a visual page manager where you reorder, rotate, delete, and extract without round-tripping through four tools.`,
      `Each action edits the same in-memory document: drag to reorder, click to rotate, select to delete or extract. When you download, pdf-lib writes the final document in one pass. Working this way is faster and safer than sequential tools because you always see the document's current state, and mistakes are undone before they're saved.`,
      `It's also the best place to sanity-check a merged packet: page thumbnails expose blank pages, wrong orientations, and out-of-place inserts far more reliably than scrolling a reader.`,
    ],
    faq: [
      { q: "Can I undo inside the organizer?", a: "Yes — actions apply to the in-memory copy until you download, so you can rotate, undo, and reorder freely before committing." },
      { q: "What's the difference from Reorder PDF Pages?", a: "Reorder is a focused drag-and-drop tool. Organize adds rotate, delete, and extract in the same view." },
    ],
  },
  "add-blank-page-pdf": {
    paragraphs: [
      `Blank pages are structural, not empty: they force a section to start on a right-hand page for printing, reserve space for a handwritten note, or keep a duplex-printed packet from back-printing a chart onto the back of a signature page. Print shops ask for them constantly.`,
      `The tool inserts true blank pages — matching the target document's page size — at any position via pdf-lib. Because the pages are real, they paginate correctly in every viewer and print job, unlike the "press Enter until a page appears" hack that leaves a stray paragraph mark behind.`,
      `Tip for duplex printing: insert blanks so each section ends on a verso page and the next starts face-up. One pass here saves a reprint.`,
    ],
    faq: [
      { q: "Can I add several blank pages at once?", a: "Yes — set the count and the position; the tool inserts them consecutively." },
      { q: "Will the blank page match my document's size?", a: "It inherits the dimensions of the neighboring page, so the document stays visually consistent." },
    ],
  },
  "crop-pdf": {
    paragraphs: [
      `Cropping a PDF trims what the eye sees: scanner borders, slide decks with fat margins, forms whose edges carry punch-hole shadows. The tool adjusts each page's crop box — the rectangle viewers use for display and printing — so you drag margins visually and every page lands exactly where you drew them.`,
      `Under the hood it's pdf-lib rewriting the MediaBox/CropBox, which is instant and lossless: no re-rendering, no quality loss, and the full original content is still in the file. That also means cropping is reversible — reset the boxes and the hidden content returns. If you need content actually destroyed (for privacy rather than layout), use Redact PDF instead.`,
      `A common use: uniform exam scans with a black scanner edge. Set the crop once, apply to all pages, and the packet reads clean.`,
    ],
    faq: [
      { q: "Does cropping reduce file size?", a: "Barely — the trimmed content still exists in the file. Compress PDF after cropping if size is the goal." },
      { q: "Can I crop different margins per page?", a: "Yes — apply the crop to all pages or just the ones you select." },
    ],
  },
  "resize-pdf-page": {
    paragraphs: [
      `Mixing page sizes is fine inside a PDF but a headache at the printer. Resizing normalizes everything: bring a batch of Letter scans into A4 for a European print shop, enlarge a compact receipt to full page, or fit wide spreadsheets onto standard paper without clipping.`,
      `The tool rescales page content onto the new dimensions with pdf-lib — choose a preset (A4, Letter, Legal, A3) or enter exact millimeters/points. Aspect ratio is preserved; small differences letterbox gracefully rather than distorting.`,
      `For best print results, resize before adding headers or page numbers, so those overlays position against the final geometry rather than the old one.`,
    ],
    faq: [
      { q: "What's the difference between resize and crop?", a: "Crop hides edges of the existing page; resize maps the whole page onto new dimensions. Crop changes what's visible, resize changes the paper." },
      { q: "Will text stay sharp after resizing?", a: "Yes. Content is transformed as vectors, so text and line art remain crisp at any scale." },
    ],
  },
  "pdf-to-grayscale": {
    paragraphs: [
      `Color costs money. Print shops charge per page for color, and many offices simply forbid it — so a PDF with a stray color logo or blue hyperlink text needs converting before it hits the tray. Grayscale conversion maps every page to luminance, producing a true black-and-white document rather than a print-driver approximation.`,
      `The tool renders each page and re-composes it as grayscale, so anything that looked like color — charts, stamps, scanned signatures — becomes a clean tonal equivalent. Choose pure black & white when you want maximum contrast for photocopiers or fax-quality output.`,
      `Check the result on one page before converting a 300-page job: light yellows can turn patchy in grayscale, and you may prefer the B&W option's harder contrast.`,
    ],
    faq: [
      { q: "Does grayscale conversion make the file smaller?", a: "Often yes, since color image data collapses to single-channel — especially after a Compress pass." },
      { q: "Is the text still selectable?", a: "Yes. Text objects are untouched; only color rendering changes." },
    ],
  },
  "edit-pdf": {
    paragraphs: [
      `Most PDF edits are small: correct a date, add a missing clause number, circle an figure, drop a note box on a drawing. A full desktop editor is overkill — and this tool runs the same class of operations in your browser with a canvas editor over the page.`,
      `Add text at any point (with font, size, and color control), draw rectangles, ellipses, and lines, or freehand-annotate. When you save, the annotations are flattened into the PDF with pdf-lib, so they appear identically in every viewer — no fragile annotation layers that some readers hide.`,
      `For form-filling specifically, Fill PDF Form targets AcroForm fields directly; for signatures, Sign PDF gives you a dedicated flow. Edit PDF is the general-purpose middle ground.`,
    ],
    faq: [
      { q: "Can I edit the existing text of a PDF?", a: "No — PDF text isn't stored as an editable paragraph flow. This tool overlays new content; for rewriting sentences, convert to Word first (PDF to Word), edit, then convert back." },
      { q: "Will my edits look the same in Adobe Reader?", a: "Yes. Content is embedded into the page itself rather than stored as optional annotations." },
    ],
  },
  "sign-pdf": {
    paragraphs: [
      `Signing digitally shouldn't mean printing, inking, scanning, and emailing a 6 MB scan of a page that was digital all along. This tool completes the loop: draw your signature with a mouse or finger, type it in a handwriting-style font, or upload a photo of your ink signature — then place it on the page, resize it, and download.`,
      `The signature is embedded as part of the page content with pdf-lib, so it prints and displays identically everywhere, with no dependence on the recipient's software. Nothing about the process touches a server — your signature image never leaves the browser, which matters more than people realize: a signature is a biometric artifact.`,
      `If you sign often, the Signature Library tool stores your signature locally in your browser so you can drop it into any document in one click.`,
    ],
    faq: [
      { q: "Is this a legally binding e-signature?", a: "For most everyday agreements, yes — a visible signature applied with intent is generally valid (ESIGN/UETA in the US, eIDAS 'simple' in the EU). For transactions requiring certified digital signatures, use a dedicated PKI-based service." },
      { q: "Can I add today's date next to my signature?", a: "Yes — use the text tool to stamp the date, or Edit PDF's text box beside the signature." },
    ],
  },
  "watermark-pdf": {
    paragraphs: [
      `A watermark says who owns a document while it travels: DRAFT on a pre-release report, CONFIDENTIAL on a contract draft, a company name on a quotation. This tool stamps text or an image diagonally or horizontally across every page — or just the ones you pick — with control over opacity, size, rotation, and position.`,
      `The watermark is embedded into the page content stream with pdf-lib, so it survives forwarding, printing, and conversion far better than viewer-added overlay layers. Low opacity (10–20%) keeps body text readable underneath; darker stamps suit pages that must be obviously non-final, like rejected proofs.`,
      `To protect images rather than documents, Watermark Image is the sibling tool; to remove an existing watermark you didn't add, Remove Watermark PDF attempts content-aware healing.`,
    ],
    faq: [
      { q: "Can I watermark only the first page?", a: "Yes — choose selected pages and enter the range, or apply to every page." },
      { q: "Will the watermark appear on printouts?", a: "Yes — it's part of the page content, so it prints exactly as displayed." },
    ],
  },
  "remove-watermark-pdf": {
    paragraphs: [
      `Received a PDF stamped with someone else's watermark you're entitled to clean — your own old draft, a template you own, an approved-for-release stamp that no longer applies? This tool erases it visually: brush or rectangle-select the watermark area on any page, and content-aware inpainting rebuilds the covered pixels from the surrounding background.`,
      `The process re-renders the affected pages at high resolution and bakes the healed image back into the PDF. That's why the result is pixel-perfect visually but the page's text becomes non-selectable on treated pages — the extracted text is offered separately so you lose nothing. Use Un-blend mode for semi-transparent stamps: it estimates the watermark's alpha per pixel and mathematically reverses the blend, often recovering the original pixels rather than filling over them.`,
      `Only remove watermarks from documents you own or are licensed to modify — a watermark is often a rights assertion.`,
    ],
    faq: [
      { q: "Will the watermark be completely gone?", a: "Yes on treated areas — pixels are rebuilt from surrounding content. Complex backgrounds (busy patterns) may need a second pass with a tighter selection." },
      { q: "Can I keep selectable text?", a: "Not on the healed pages — they're re-rendered as high-quality images. Copy the text first with PDF to Text if you need it." },
    ],
  },
  "add-page-numbers-pdf": {
    paragraphs: [
      `Page numbers look trivial until a 40-page packet is printed and dropped: without them, reassembling the order is guesswork. This tool stamps numbers on every page — or a range — with your choice of position (all four corners and center-bottom), format (plain, "Page X", "X of Y"), starting number, and font size.`,
      `Numbers are drawn into the page content with pdf-lib, so they print identically everywhere and never depend on the viewer's UI. The tool respects existing rotation, placing the number relative to how the page displays, not how it's stored.`,
      `For documents that already carry printed numbers and just gained pages (an insert here, a deletion there), consider re-stamping uniformly rather than patching — mixed numbering schemes are worse than none.`,
    ],
    faq: [
      { q: "How do I add page numbers to a PDF?", a: "Upload the PDF, pick a position (the four corners or bottom-center), choose a format like \"Page X\" or \"X of Y\", and apply — the numbers are drawn into the pages permanently and print identically in every viewer." },
      { q: "Where should page numbers go on a page?", a: "Bottom-center is the most common convention; bottom-right is standard in reports and legal documents. This tool offers all four corners plus bottom-center so you can match the document's existing style." },
      { q: "Can numbering skip a cover page?", a: "Yes — set the starting page and starting number independently, so the cover stays unnumbered while page 2 begins at 1." },
      { q: "Can I use Roman numerals for front matter?", a: "Choose the Roman numeral format for a range, then run the tool again with Arabic numerals for the body." },
    ],
  },
  "pdf-header-footer": {
    paragraphs: [
      `Headers and footers carry the furniture of a professional document: report title up top, confidentiality notice and date at the bottom, page numbers at the edge. This tool adds them uniformly across a PDF, with support for variables — {date}, {page}, {total}, {filename} — so each page renders its own values.`,
      `Because the text is embedded into each page's content stream via pdf-lib, the results are permanent and identical in every viewer and printer. You control font size, color, margins, and which pages receive the header, the footer, or both.`,
      `A common compliance use: stamping "CONFIDENTIAL — prepared for {filename}'s recipient" across every page of a data-room export, with the date baked in for the record.`,
    ],
    faq: [
      { q: "Can I use different text on odd and even pages?", a: "This tool applies one header/footer definition per run; run it twice with page selections for alternating content." },
      { q: "Will it overwrite an existing footer?", a: "No — new text is added on top. Remove old footers first with Edit PDF's whiteout or by cropping." },
    ],
  },
  "pdf-stamp": {
    paragraphs: [
      `Stamps are the vocabulary of document review: APPROVED in green, RECEIVED with a date, PAID across an invoice. This tool places stamp images or text — yours or from the built-in set — onto PDF pages at any position, size, and rotation, embedding them permanently into the page content.`,
      `Unlike a watermark (usually large, diagonal, translucent), stamps are typically compact and opaque: a corner mark, a seal near a signature line. Upload your organization's stamp as PNG with transparency for the cleanest result.`,
      `For date-stamped workflow marks like RECEIVED 2026-09-28, the sibling Digital Stamp tool composes the text and date for you.`,
    ],
    faq: [
      { q: "Can I use my company seal image?", a: "Yes — upload it as a PNG; transparent backgrounds are preserved so the seal sits cleanly on the page." },
      { q: "Can I stamp multiple pages at different positions?", a: "One position per run; run it again for additional placements." },
    ],
  },
  "protect-pdf": {
    paragraphs: [
      `Password protection has two distinct jobs, and this tool does both: require a password merely to open the document, or leave it openable but block printing, copying, and editing. The first guards confidentiality; the second guards intent — an invoice anyone can read but nobody can silently alter.`,
      `Encryption uses AES-256, the current industry standard, applied through pdf-lib/pdfcpu in your browser. Because the encryption happens locally, the password you type never crosses the network — a meaningful difference from upload-based services, since the password is itself a secret.`,
      `Choose the open-password carefully: there's no recovery. If the document must survive its recipients' memory, a password manager entry beats a clever passphrase.`,
    ],
    faq: [
      { q: "Which password type should I use?", a: "Use an open password for confidential content. Use a permissions password when readability should stay open but editing/printing shouldn't." },
      { q: "Can I remove the password later?", a: "Yes — with Unlock PDF, given you know the password. Without it, AES-256 isn't practically breakable." },
    ],
  },
  "unlock-pdf": {
    paragraphs: [
      `You own the document, you know the password, and yet every workflow trips on the prompt: merging, printing to a new printer, archiving to a system that can't handle encryption. Unlocking removes the protection layer permanently so downstream tools treat the file like any other.`,
      `Decryption runs through pdfcpu in your browser — enter the current password once, get a clean decrypted copy. Nothing uploads, which matters: submitting a protected file plus its password to a random web service would hand a stranger both the lock and the key.`,
      `Note the ethical line this tool sits behind: it requires the password. Protected documents you don't have credentials for are out of scope by design.`,
    ],
    faq: [
      { q: "Can you crack a PDF without the password?", a: "No. AES-256 encrypted PDFs aren't practically breakable, and this tool won't try — it needs the legitimate password." },
      { q: "Does unlocking remove permission restrictions too?", a: "Yes — print/copy restrictions tied to the permissions password are lifted along with encryption." },
    ],
  },
  "redact-pdf": {
    paragraphs: [
      `A black rectangle drawn over text is not redaction — the text still lives under the box, and one copy-paste exposes it. Real redaction removes the content itself. This tool does the real thing: you select words or areas, and the underlying text objects are deleted from the document before a solid bar is drawn in their place.`,
      `It combines pdf.js (to locate the exact text/areas you select) with pdf-lib (to rewrite the page content without the sensitive runs). The result is safe to publish: nothing recoverable remains, verified by the fact that the text simply no longer exists in the file.`,
      `Workflow advice: redact a copy, keep the original. And check adjacent content — page headers, metadata, and bookmarks can carry sensitive context even when the body is clean (Strip Metadata handles the latter).`,
    ],
    faq: [
      { q: "Is redaction reversible?", a: "No — deleted text is gone from the file. That's the point. Keep an unredacted original if you'll need the content." },
      { q: "Can I redact images or parts of images?", a: "Area redaction covers image regions by covering and flattening them; for full-page image removal, delete the page instead." },
    ],
  },
  "repair-pdf": {
    paragraphs: [
      `A PDF that won't open is usually a file with a broken structure: a download cut short, a disk hiccup mid-write, an email gateway that mangled the transfer. The document's content is often intact — it's the cross-reference table and trailer, the PDF's table of contents for itself, that got damaged.`,
      `This tool attempts reconstruction: scanning the raw bytes for page objects and reassembling a valid document around whatever survives. Recovery is genuinely variable — minor structural damage yields a perfect file; severe truncation yields part of the document. The tool tells you which outcome you got.`,
      `Prevention beats repair: if a PDF matters, keep the original download rather than only an email attachment copy, and prefer ZIP wrapping when a file must survive a temperamental transfer path.`,
    ],
    faq: [
      { q: "Will repair recover everything?", a: "It depends on the damage. Structural issues (bad xref, broken trailer) usually recover fully; truncated files recover only the pages whose data survived." },
      { q: "Why does my repaired file look different?", a: "Recovered documents may lose some niceties (bookmarks, some annotations) even when page content is fully intact." },
    ],
  },
  "pdf-to-pdfa": {
    paragraphs: [
      `Ordinary PDFs quietly rot: fonts referenced but not embedded, color profiles implied, JavaScript sprinkled in. Open such a file in twenty years and it may render differently — or not at all. PDF/A is the archival standard that forbids those ambiguities: everything the document needs must be inside the file, self-contained and device-independent.`,
      `This tool converts to PDF/A conformance levels (1b, 2b) by embedding fonts, normalizing color, and stripping anything the standard disallows. Archives, libraries, courts, and increasingly government tenders specify PDF/A precisely because it removes doubt about future rendering.`,
      `Conversion is a fidelity trade: transparency and some multimedia features flatten or drop. Convert a copy for the archive and keep working files as ordinary PDFs.`,
    ],
    faq: [
      { q: "Which conformance level should I choose?", a: "PDF/A-2b is the pragmatic modern default: broad acceptance, good balance of requirements. Use 1b only when a system explicitly demands it." },
      { q: "How do I verify the result?", a: "The PDF/A declaration lives in the document's XMP metadata;veraPDF is the reference validator if your institution requires certification." },
    ],
  },
  "optimize-pdf-web": {
    paragraphs: [
      `A linearized ("fast web view") PDF is organized so the first page can render before the whole file arrives. For documents served over the web — manuals, datasheets, reports — that means time-to-first-content drops from "after the download" to nearly instant, especially on slow links.`,
      `This tool linearizes and optimizes with qpdf in your browser: reorganizing objects for sequential access, deduplicating resources, and pruning unused structures. It's the hosting-side twin of Compress PDF, which shrinks bytes; this one arranges them for streaming.`,
      `After optimizing, serve the file with correct Content-Type and let the browser cache it — linearization only helps when the viewer fetches progressively (most browser PDF viewers do).`,
    ],
    faq: [
      { q: "Does optimization reduce quality?", a: "No — it restructures, it doesn't re-encode. Combine with Compress PDF when you also need fewer bytes." },
      { q: "Do all viewers benefit?", a: "Browsers and Acrobat use linearization for progressive loading; some lightweight viewers download fully and won't show a difference." },
    ],
  },
  "compare-pdf": {
    paragraphs: [
      `Two versions of a contract, a revised proposal, a re-issued policy — the differences are what matter, and eyeballing 60 pages for changed clauses is how mistakes slip through. This tool extracts the text from both PDFs and diffs it, highlighting additions, deletions, and modifications side by side.`,
      `Because the comparison is text-based, it catches wording changes precisely — the things that matter in agreements. Purely visual changes (a moved logo, an image swap) won't register; for page-image comparison, Side-by-Side Diff shows both documents visually.`,
      `Tip: run the comparison on documents from the same source toolchain when possible. Different generators can normalize whitespace differently, producing noise diffs on otherwise identical text.`,
    ],
    faq: [
      { q: "Can it compare scanned PDFs?", a: "Only if they have a text layer. Run OCR PDF first on both files, then compare." },
      { q: "How are moved paragraphs reported?", a: "A moved block appears as a deletion at the old location and an addition at the new one — standard diff behavior." },
    ],
  },
  "ocr-pdf": {
    paragraphs: [
      `A scanned PDF is a photograph of text: searchable to your eyes, invisible to search, copy, and assistive tools. OCR bridges that gap — recognizing characters page by page and attaching an invisible text layer that sits under the image, so the document gains search and copy without changing how it looks.`,
      `Recognition runs on Tesseract.js in your browser across 100+ languages. Pick the document's language before starting; accuracy on a clean 300 DPI scan typically exceeds 95%, and degraded faxes proportionally less. Large documents process page by page, so a 50-page scan takes minutes, not seconds.`,
      `After OCR, use PDF to Text to extract, or search the PDF directly in any reader — the added layer is standard and persists everywhere.`,
    ],
    faq: [
      { q: "How accurate is the OCR?", a: "Clean, straight scans at 300 DPI usually exceed 95% accuracy. Skew, low resolution, and unusual fonts reduce it; re-scanning at higher quality beats post-processing." },
      { q: "Is it slow?", a: "Browser OCR is slower than server farms by design — your files stay private. Expect roughly a second or two per page on a modern laptop." },
    ],
  },
  "scan-to-pdf": {
    paragraphs: [
      `Your phone's camera is a better scanner than most flatbeds were a decade ago — 12 MP of resolution, but only if you capture well. This tool turns the camera (or your photo library) into a document pipeline: shoot the page, crop to its edges, and save a clean PDF, all without any app install.`,
      `Each captured image becomes a PDF page; multiple captures build a multi-page document in order. The page-size step matters for printing: choose "fit to A4/Letter" so a photographed receipt prints at real-world size rather than full-bleed.`,
      `For legibility, shoot in even light and avoid shadows from your own hands — a shadow across text is the number one cause of unreadable scans and poor OCR results later.`,
    ],
    faq: [
      { q: "Do the photos upload anywhere?", a: "No. The camera stream and images are processed in the page and assembled into a PDF on your device." },
      { q: "Can I add pages later to an existing scan?", a: "Yes — start from the saved PDF and use Insert PDF Pages to add new captures." },
    ],
  },
  "fill-pdf-form": {
    paragraphs: [
      `Government forms, tax filings, application packets — most are PDFs with real form fields (AcroForms) that you're meant to fill on screen. This tool opens those fields properly: text boxes accept typing, checkboxes toggle, dropdowns show their options, and signature fields accept a drawn signature.`,
      `Filled values are written into the field dictionary with pdf-lib, so the result is a genuinely filled form — any standard reader shows the values, and the fields can be flattened afterward (Flatten PDF Form) to lock them in before sending.`,
      `If a form opens with no interactive fields at all, it's a flat scan rather than a true form — use Edit PDF to overlay text at the right coordinates instead.`,
    ],
    faq: [
      { q: "Why do some fields look empty in other viewers?", a: "If values were only drawn visually rather than saved into the fields, other readers show blanks. This tool writes real field values; use Flatten afterward to be certain." },
      { q: "Can I save a partially filled form and finish later?", a: "Yes — download the filled PDF and reopen it here; field values persist in the file." },
    ],
  },
  "create-pdf-form": {
    paragraphs: [
      `Building a fillable form from scratch usually requires Acrobat's form editor. This tool provides the essentials in the browser: start from a blank page or an existing PDF, then drag text fields, checkboxes, radio groups, and dropdowns onto the page, sizing each to fit its label.`,
      `The output is a standards-compliant AcroForm built with pdf-lib: recipients can fill it in any reader — Adobe, browser, Preview — and submitted data stays machine-readable because it lives in named fields, not drawn text. That last property matters if you'll extract responses programmatically later.`,
      `Plan field names before you start: each field's name is its key when data is extracted, so consistent names (applicant_name, applicant_dob) make the downstream work trivial.`,
    ],
    faq: [
      { q: "Can I make fields required?", a: "Yes — mark fields required so compliant readers flag empty ones on submission." },
      { q: "Can I add multiple pages?", a: "Yes — add pages and continue placing fields across the whole document." },
    ],
  },
  "flatten-pdf-form": {
    paragraphs: [
      `A filled form is editable by design — which is exactly wrong the moment you send it. Flattening bakes the field values into the page as static content and removes the interactive fields, so what the recipient sees is what everyone sees, forever: no accidental edits, no fields that render blank in odd viewers.`,
      `The operation merges the field appearance streams into page content with pdf-lib and drops the AcroForm dictionary. The PDF that comes out is slightly smaller, universally rendered, and immune to "why can't I see your answers" support emails.`,
      `Flatten as the final step of any form workflow that ends in submission — after verification, because flattening is irreversible.`,
    ],
    faq: [
      { q: "Is flattening reversible?", a: "No — the interactive layer is removed. Keep the unflattened file if you might need to edit values later." },
      { q: "Do signatures survive flattening?", a: "Visible signature images become part of the page; cryptographic signature fields are removed, so flatten before signing if the signature must stay valid." },
    ],
  },
  "edit-pdf-metadata": {
    paragraphs: [
      `Every PDF carries a hidden label: Title, Author, Subject, Keywords, the creating application, sometimes timestamps. It's what search indexers and document systems display first — and what leaks context ("Created by John's-Laptop.local") you may not intend to publish.`,
      `This tool reads the Info dictionary and XMP metadata, lets you set each field explicitly, and writes the result with pdf-lib. Setting a proper Title is the highest-value edit: browsers, search results, and library systems prefer it over the filename.`,
      `For privacy-minded distribution, pair this with Strip Metadata — editing sets what should be there; stripping removes what shouldn't.`,
    ],
    faq: [
      { q: "What's the difference between Title metadata and the first page's heading?", a: "Metadata Title is what the browser tab and search engines show; the heading is visual content. Good documents set both consistently." },
      { q: "Does editing metadata change the document content?", a: "No — pages, text, and images are untouched; only the property records change." },
    ],
  },
  "pdf-bookmarks-editor": {
    paragraphs: [
      `Bookmarks (the outline panel) are the difference between a 300-page document and a navigable one. This editor shows the existing bookmark tree, lets you rename entries, restructure levels, add new destinations pointing at any page, and delete stale ones — all client-side, written back with pdf-lib.`,
      `Well-formed outlines also power other tools on this site: Split PDF by Bookmarks uses the tree as split boundaries, so investing five minutes here pays off every time the document needs sectioning later.`,
      `When adding bookmarks to a scanned document, first run OCR so headings exist as text — the tool can then propose destinations from the detected heading positions instead of you hunting for page numbers.`,
    ],
    faq: [
      { q: "Do bookmarks work in all PDF readers?", a: "Yes — the outline is a core PDF feature that every mainstream reader displays in its sidebar." },
      { q: "Can I import bookmarks from a text file?", a: "This version builds them interactively; for bulk trees, the editor supports nesting quickly via indentation controls." },
    ],
  },
  "pdf-info-viewer": {
    paragraphs: [
      `Before you archive, publish, or troubleshoot a PDF, look inside it: page count and sizes, producer and version, which fonts are embedded, whether it's encrypted, how big the images are. This viewer surfaces all of it in one read-only panel — the equivalent of opening the hood before a road trip.`,
      `The data comes from pdf.js parsing the document structure client-side: nothing uploads, so inspecting a confidential file is safe. Font embedding status is the detail people most often need — a PDF with unembedded fonts will render differently (or break) on machines lacking the font, which explains a whole category of "it looks wrong on her computer" bugs.`,
      `Pair it with Page Analyzer for per-page geometry and reading-time estimates, or Encryption Checker for the security surface.`,
    ],
    faq: [
      { q: "Why does font embedding matter?", a: "Unembedded fonts get substituted on other machines — layout shifts, glyphs vanish. If the viewer lists unembedded fonts, re-export the PDF with fonts embedded before distributing." },
      { q: "Can it show who created a PDF and when?", a: "Yes — producer, creator application, and creation/modification timestamps appear when present in the metadata." },
    ],
  },
  "verify-pdf-signature": {
    paragraphs: [
      `A digitally signed PDF carries a cryptographic assertion: this document, from this signer, unchanged since signing. This tool inspects that assertion — whether a signature exists, which certificate signed it, and whether the signed byte ranges match the document's current bytes.`,
      `Verification happens with pdf.js in your browser: it validates the signature's structural integrity and reports whether the document has been modified after signing. Some chains can't be fully resolved without the signer's certificate authority — those report "unverified" rather than "invalid," which is an honest distinction, not a dodge.`,
      `For contracts where non-repudiation matters, treat this as a first check; full PKI chain validation belongs in Acrobat or a dedicated validator with the CA roots installed.`,
    ],
    faq: [
      { q: "What does \"unverified\" mean?", a: "The signature exists and is structurally intact, but the certificate chain couldn't be resolved in the browser. The signature may be perfectly valid — verify in a full PKI environment for certainty." },
      { q: "Does it detect edits after signing?", a: "Yes — if content was altered outside the permitted ranges, the report flags the document as modified." },
    ],
  },
  "pdf-password-checker": {
    paragraphs: [
      `The weakest part of document security is usually the password: "Company2024!" protects nothing because it's the first thing an attacker tries. This checker scores a proposed password against realistic attack patterns — dictionary words, leetspeak substitutions, date suffixes, keyboard walks — and explains what's weak rather than just showing a red bar.`,
      `It runs entirely client-side as a heuristic analyzer; nothing you type is sent anywhere, so testing your real candidate passwords is safe. Length remains the dominant factor: a four-random-words passphrase outperforms a short string of symbols that's miserable to type.`,
      `Use it before Protect PDF: the encryption is strong, but its strength is capped by the entropy of the key you feed it.`,
    ],
    faq: [
      { q: "Is my password stored or transmitted?", a: "No. The analysis runs in the page and the input never leaves your browser." },
      { q: "What makes a good PDF password?", a: "Long and unpredictable: four or more random words, or a generated password from a manager. Avoid names, dates, and substitutions like @ for a." },
    ],
  },
  "jpg-to-pdf": {
    paragraphs: [
      `Photographs of documents — a signed form, a whiteboard, an ID card — live as JPGs and need to become PDFs to be filed, emailed, or submitted anywhere official. This conversion is deliberately simple: drop the images, choose page size and orientation, and get one PDF with each photo on its own page.`,
      `Quality choices matter more than people expect. "Fit to page" with A4/Letter produces printable, consistent output; "use image size" preserves exact pixels for archival. The tool embeds the JPG data without recompression when possible, so there's no second generation of quality loss.`,
      `For mixed formats (PNG screenshots plus JPG photos), Images to PDF handles both; for bulk folders of one format, this tool with multi-select is the fastest path.`,
    ],
    faq: [
      { q: "How do I convert a JPG to a PDF?", a: "Drag your JPG into the tool (or tap to pick the file), choose a page size — fit-to-page A4 or Letter is the usual choice — and download the PDF. Each image becomes one page, and multiple JPGs combine into a single document in your chosen order." },
      { q: "Can you convert a JPG to a PDF for free?", a: "Yes — this tool is completely free with no signup, watermark, or page limit. Everything runs in your browser, so the image never leaves your device." },
      { q: "How do I change a JPEG to a PDF on my phone?", a: "The same way — open this page in your phone's browser, tap to pick the photo (or snap a new one), and download the PDF. It works in Safari and Chrome without installing an app." },
      { q: "Will converting to PDF reduce image quality?", a: "No — the original image data is embedded. Quality loss only happens if you explicitly enable recompression." },
      { q: "Can I set the order of pages?", a: "Yes — drag the image thumbnails into the desired sequence before converting." },
    ],
  },
  "png-to-pdf": {
    paragraphs: [
      `PNGs are how screenshots, UI captures, and diagrams travel — and they become PDFs when they need to join a document: an appendix of screenshots, a bug report packet, a design handoff. This tool converts PNG images to a single PDF with page-size and orientation control.`,
      `PNG's lossless compression carries over cleanly: text in screenshots stays razor sharp because there's no JPEG-style resampling unless you ask for it. That makes this the right converter for anything containing text-as-image, where JPG artifacts would blur character edges.`,
      `For a mix of PNG and JPG, use Images to PDF; for single-page needs with exact dimension control, this tool's custom size option covers it.`,
    ],
    faq: [
      { q: "Does transparency survive in the PDF?", a: "Transparent areas composite onto the page background (white by default) — PDF pages are opaque. Choose the background color in options where available." },
      { q: "Why is my PNG-based PDF larger than the images?", a: "PDF wraps each image with structure and may not use PNG's exact compression. Compress PDF can shrink the result if needed." },
    ],
  },
  "images-to-pdf": {
    paragraphs: [
      `The general-purpose image bundler: JPG, PNG, WebP, GIF frames, and more, in any mix, ordered by drag-and-drop, assembled into one PDF. It's the tool for the real-world job — a phone album's worth of receipts, a property inspection's photos, a stack of scans in mixed formats — where requiring one format first would be artificial.`,
      `Each image becomes a page with your chosen sizing rule: fit to a standard paper size for printing, or native dimensions for archives. The tool normalizes formats internally where needed, so a WebP from the web and a JPG from your camera coexist in one document without pre-conversion.`,
      `For large batches, sort by filename before adding — the tool preserves selection order, and folder exports usually name files so alphabetical order is the intended reading order.`,
    ],
    faq: [
      { q: "How do I combine multiple photos into one PDF?", a: "Select all the images at once (JPG, PNG, WebP — any mix), drag them into the right order, and convert — every photo becomes a page in one combined PDF at your chosen page size." },
      { q: "Which formats can I combine?", a: "JPG, PNG, WebP, GIF, and BMP in any combination; HEIC and TIFF convert via their dedicated tools first for best fidelity." },
      { q: "Can I add images later to an existing PDF?", a: "Yes — convert the new batch, then use Insert PDF Pages to splice them into the existing document." },
    ],
  },
};

export default PDF_GUIDES_A;
