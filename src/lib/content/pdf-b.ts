// lib/content/pdf-b.ts
//
// Editorial content for PDF tools, part B (convert, image, batch, utility).
// Part A (organize/edit/security/sign/form/info) lives in pdf-a.ts.
//
// Every entry is unique, hand-written copy — no templated filler.

import type { ToolGuideMap } from "./types";

const PDF_GUIDES_B: ToolGuideMap = {
  "pdf-to-jpg": {
    paragraphs: [
      `Extracting a PDF page as an image solves a surprising range of problems: a chart page that must go into a slide deck, a scanned signature page needed as a picture, proof pages for a print quote. Converting to JPG rasterizes each page at the DPI you choose and hands you the images directly or bundled as a ZIP.`,
      `DPI is the quality dial. 72–96 DPI is fine for on-screen thumbnails; 150 DPI works for documents; 300 DPI matches print quality and multiplies file size accordingly. Since rendering uses pdf.js in your browser, a 200-page export happens on your device at your disk's speed — no queue, no watermark, no per-page limits.`,
      `For text-heavy pages where you want the words back rather than their picture, PDF to Text or PDF to Word will serve you better; JPG output is for when pixels are the point.`,
    ],
    faq: [
      { q: "Which quality should I pick?", a: "150 DPI is a good default for screen and email; use 300 DPI for print. Higher DPI means proportionally larger files." },
      { q: "Can I export only some pages?", a: "Yes — select the pages you need before exporting, or export everything and grab the JPGs from the ZIP." },
    ],
  },
  "pdf-to-png": {
    paragraphs: [
      `PNG is the raster format for crisp graphics: screenshots, logos, diagrams, anything with sharp edges and flat color. When a PDF page contains exactly that — a vector diagram, a typeset certificate, a UI mockup — PNG output keeps edges razor sharp where JPG would smear them.`,
      `The conversion renders each page with pdf.js at your chosen resolution and encodes lossless PNGs. For documents destined for the web, that means transparent-capable, artifact-free images; for archival snippets, it means an exact pixel record of the page.`,
      `Rule of thumb: JPG for photographs and scans, PNG for text-as-image, diagrams, and screenshots. If your PDF is a scanned document, prefer PDF to JPG for far smaller files at equal visual quality.`,
    ],
    faq: [
      { q: "Why are PNG files larger than JPG?", a: "PNG stores every pixel losslessly — great for sharp graphics, heavy for photographs. Choose JPG when the page is photo-like." },
      { q: "Can I get a transparent background?", a: "PDF pages are opaque, so output has a solid background. For transparency you'd need the original source graphics." },
    ],
  },
  "pdf-to-tiff": {
    paragraphs: [
      `TIFF survives where modern formats don't: archive systems, medical and legal records management, fax servers, and print workflows that predate the web. When a submission system asks for TIFF specifically, this conversion renders each PDF page into a multi-page or per-page TIFF without installing anything.`,
      `You control compression (LZW for lossless, or CCITT G4 for pure black-and-white text scans, which is dramatically smaller) and resolution. Legal e-filing systems commonly want 300 DPI G4 TIFF — a checkbox here rather than a desktop-software ordeal.`,
      `Because rendering happens locally with mupdf.wasm, confidential filings never touch a server — a requirement, not a nicety, in many of the industries that still standardize on TIFF.`,
    ],
    faq: [
      { q: "Which TIFF compression should I choose?", a: "LZW keeps grayscale fidelity for general documents; CCITT G4 is ideal for black-and-white text scans and much smaller. Match whatever the receiving system specifies." },
      { q: "Do I get one multi-page TIFF or many files?", a: "Your choice — multi-page TIFF for archive systems that support it, or one file per page for systems that don't." },
    ],
  },
  "extract-images-from-pdf": {
    paragraphs: [
      `A PDF often contains images you need back at their original quality: the product photos embedded in a catalog, the charts inside a report, the logo a designer only delivered inside a PDF. Rather than screenshotting at screen resolution, this tool pulls the actual embedded image objects — full native resolution, untouched.`,
      `It walks the page resources with pdf.js, decodes each image XObject (handling DCTDecode/JPG and FlateDecode/PNG cases), and offers individual downloads or a ZIP. Duplicates shared across pages are deduplicated, so a logo used on every page yields one file, not thirty.`,
      `Note the boundary of this approach: images that were split into tiles or heavily transformed may extract as fragments. For photographic fidelity, extraction beats re-rendering every time — you get the original bytes, not a screenshot of them.`,
    ],
    faq: [
      { q: "Why do some images extract in pieces?", a: "PDFs may store a large image as multiple tiles or strips. The tool reassembles common cases; unusual tiling may produce fragments you can stitch elsewhere." },
      { q: "Do extracted images keep original quality?", a: "Yes — you get the embedded image data itself, not a re-rendered screenshot. Quality is exactly what was embedded." },
    ],
  },
  "html-to-pdf": {
    paragraphs: [
      `Turning HTML into a PDF makes web content portable and signable: a receipt page for expenses, a booking confirmation for records, an invoice template for print. This tool renders your HTML — pasted directly, styled inline — onto a PDF page using jsPDF with html2canvas.`,
      `It's a client-side pipeline by design: your markup, including anything with personal data, is rendered in your own browser. For pixel-accurate complex layouts, inline your CSS and use fixed dimensions; the renderer honors standard styling, so simple invoices, letters, and tables come out clean.`,
      `For saving an entire live webpage by URL, Create from URL fetches and captures it; this tool is the hands-on version where you control the markup.`,
    ],
    faq: [
      { q: "Do external stylesheets and images load?", a: "Inline styles and same-page images are safest. Cross-origin assets may be blocked by canvas security rules — inline critical CSS for reliable output." },
      { q: "Can I control page size and margins?", a: "Yes — pick A4 or Letter, orientation, and margins before rendering." },
    ],
  },
  "pdf-to-html": {
    paragraphs: [
      `Sometimes a PDF needs to become a web page again: republishing a brochure's content, feeding a document into a CMS, or making a report selectable and searchable on the web. This conversion extracts text and basic structure — headings, paragraphs, lists — into clean HTML.`,
      `The extraction heuristics read font sizes and positions to infer structure: large bold lines become headings, indented blocks become lists. Complex multi-column layouts are the known weak spot — columns may interleave — so review the output for anything beyond simple documents.`,
      `The result is an HTML file you can open directly or paste into an editor. For pure plain text (no markup), PDF to Text is the simpler sink; for Markdown specifically, PDF to Markdown.`,
    ],
    faq: [
      { q: "Does the HTML look exactly like the PDF?", a: "No — this is a content-focused conversion, not a pixel clone. Structure and text carry over; visual styling is approximated." },
      { q: "Are images included?", a: "Embedded images can be extracted alongside the HTML where the PDF structure allows clean extraction." },
    ],
  },
  "text-to-pdf": {
    paragraphs: [
      `The Text to PDF editor is a small word processor that lives in your browser. Type directly, or paste from Word, Google Docs, an email, or a web page — the paste pipeline keeps what you copied: bold, italics, colors, highlights, font families and sizes, alignment, bullet and numbered lists, and links. A one-click toggle strips everything to plain text when you want only the words.`,
      `Export is where the quality lives: instead of screenshotting the editor, the tool re-typesets your document with real vector text — selectable, searchable, and sharp at any zoom. Fonts map to the closest standard PDF face, sizes and colors carry over at print resolution, and wrapping, justification, lists, and images are laid out per page using your chosen page size, margins, and line spacing. Page numbers stamp as "Page X of Y" in the position you pick.`,
      `Common uses: turning notes, resumes, and cover letters into submittable PDFs, formatting code listings in monospace, and producing clean hard copies for signatures — all offline, all private, nothing uploaded.`,
    ],
    faq: [
      { q: "Are special characters supported?", a: "The standard PDF fonts cover Latin scripts (including smart quotes and dashes). Emoji and non-Latin scripts are replaced with \"?\" and counted in a warning — for full Unicode output, use Word to PDF." },
      { q: "Can I control page breaks?", a: "The editor paginates automatically at your chosen page size — blank lines, headings, and spacing flow naturally. Page numbers come from the Page setup panel." },
    ],
  },
  "pdf-to-text": {
    paragraphs: [
      `Under every digital PDF lies its text layer — and extracting it is the doorway to everything else: search indexing, quotation, translation pipelines, LLM grounding, data mining. This tool walks each page's content stream with pdf.js and reconstructs the text in reading order.`,
      `Reading-order reconstruction is the craft here: columns, tables, and headers can confuse naive extraction. Simple documents extract flawlessly; complex layouts may need light cleanup. Scanned PDFs without a text layer return nothing — run OCR PDF first to create one.`,
      `The output is a .txt file preserving paragraph breaks. For markup (headings, bold), step up to PDF to Markdown; for spreadsheets from tabular data, PDF to CSV.`,
    ],
    faq: [
      { q: "Why does my scanned PDF extract nothing?", a: "Scans are images without a text layer. Run OCR PDF to add one, then extract." },
      { q: "Does extraction keep the reading order?", a: "Yes, heuristically — the tool orders text by position. Multi-column documents occasionally interleave; spot-check before bulk use." },
    ],
  },
  "markdown-to-pdf": {
    paragraphs: [
      `Markdown is how technical people write; PDF is how the world reads. This converter closes the gap with a proper render pipeline: markdown-it parses headings, lists, tables, code blocks, and emphasis, and the result typesets onto PDF pages with sensible typography.`,
      `Code blocks get monospace boxes that wrap long lines instead of clipping; tables render with borders and fit page width; headings scale hierarchically. It's the fastest route from a README, spec, or meeting-notes file to something you can attach to an email with dignity.`,
      `For syntax-highlighted code or custom themes, tweak the source before converting — the pipeline intentionally stays simple and predictable.`,
    ],
    faq: [
      { q: "Are tables and code blocks supported?", a: "Yes — GFM-style tables and fenced code blocks both render, with wrapping and borders handled automatically." },
      { q: "Can I use images in my Markdown?", a: "Referenced images embed when provided as data URIs or accessible inline sources; remote-hosted images may be blocked by the browser's canvas rules." },
    ],
  },
  "pdf-to-markdown": {
    paragraphs: [
      `Getting a PDF into Markdown means getting it into your wiki, your docs site, your notes app, or your LLM's context window. This converter detects structure — headings by font size, lists by indentation and bullets, emphasis by font weight — and emits Markdown that preserves the document's shape, not just its characters.`,
      `Detection is heuristic and honest about it: clean reports and manuals convert impressively; multi-column papers and heavy tables may need touch-ups. Even then, the output is a strong first draft measured in seconds instead of an hour of manual transcription.`,
      `The result feeds directly into documentation systems and AI tools, which is increasingly the whole point: PDF is for humans with printers; Markdown is for systems that read.`,
    ],
    faq: [
      { q: "How accurate is the conversion?", a: "Best-effort by design. Simple documents convert well; complex layouts (multi-column, nested tables) may shift and need review." },
      { q: "Are tables converted to Markdown tables?", a: "Detected tables convert where the PDF's ruling lines or spacing are clear; ambiguous layouts fall back to plain text rows." },
    ],
  },
  "pdf-to-csv": {
    paragraphs: [
      `The data you need is trapped in a PDF table — a bank statement, a price list, a lab report — and retyping it is both tedious and error-prone. This converter detects table-like regions, parses rows and columns, and exports them as CSV that Excel, Sheets, or any database will accept.`,
      `Detection reads ruling lines and column alignment to segment cells; the result is presented for review before download, because honest tools admit that heuristics deserve a glance. Multi-page tables concatenate in order, with a source-page marker available to trace rows back.`,
      `For heavy numerical work, PDF to Excel preserves more structure (types, multiple sheets); CSV is the universal lingua franca when you just need the values.`,
    ],
    faq: [
      { q: "What if my tables aren't detected?", a: "Layout-heavy or borderless tables can defeat detection. Try a cleaner source PDF, or use PDF to Excel which attempts smarter cell reconstruction." },
      { q: "Are numbers and dates kept as-is?", a: "Yes — cell text is exported verbatim. Excel may reformat on import depending on your locale settings." },
    ],
  },
  "pdf-to-epub": {
    paragraphs: [
      `Reading a long PDF on an e-reader is an exercise in zoom-and-pan: fixed pages fight small screens. EPUB reflows text to fit any device, and this converter rebuilds your PDF as an EPUB ebook — paragraphs flow, font size adapts, margins vanish.`,
      `The pipeline extracts text (pdf.js), infers chapter boundaries from headings or page groups, packages sections with jszip into EPUB structure, and embeds cover/page images where meaningful. Novels, reports, and text-heavy documents convert beautifully; magazine layouts and dense tables less so.`,
      `Load the EPUB onto any reader — Kindle (via conversion), Kobo, Apple Books — and the document finally behaves like a book instead of a photocopied handout.`,
    ],
    faq: [
      { q: "Is the conversion perfect?", a: "Best effort: text-driven documents convert well; complex layouts may shift. That's inherent to reflowing fixed pages, not a bug in this tool." },
      { q: "Are images included?", a: "Page images can be embedded per section; text-first mode keeps the EPUB light and reflowable." },
    ],
  },
  "epub-to-pdf": {
    paragraphs: [
      `The reverse commute: an EPUB ebook that must become a PDF — for printing a chapter, submitting a manuscript excerpt, or annotating in a PDF-first workflow. This tool parses the EPUB (a zip of XHTML chapters), renders the content, and paginates it onto PDF pages.`,
      `Because EPUB is reflowable and PDF is fixed, the tool must choose pagination — it uses a readable default (A4/Letter, standard margins, embedded fonts) rather than pretending to match your e-reader's exact layout. Chapters become page groups in order.`,
      `Text-based EPUBs convert cleanly; DRM-protected store purchases are unreadable by design and won't open here — use DRM-free files you own.`,
    ],
    faq: [
      { q: "Will the PDF look like it did in my e-reader?", a: "Not exactly — EPUB adapts to each screen. This tool picks one consistent typesetting for print-like output." },
      { q: "DRM-protected books?", a: "No. Files with DRM can't be parsed; this tool works with DRM-free EPUBs." },
    ],
  },
  "pdf-to-word": {
    paragraphs: [
      `The moment someone says "just edit the PDF," the answer is PDF to Word. Converting gives you a .docx where text is actually editable — track changes, restyle, rewrite — instead of drawing boxes over a fixed page. It's the most requested conversion in document work for good reason.`,
      `The pipeline extracts text and layout signals (pdf.js/mupdf) and rebuilds a Word document: paragraphs stay paragraphs, headings map to heading styles, lists become lists. Simple business documents convert with high fidelity; magazine-grade layouts, nested tables, and multi-column spreads are the honest weak spots of any client-side approach — complex documents may need layout touch-ups.`,
      `All processing runs in your browser, which is why this tool suits the documents you most want to convert and least want to upload: contracts, HR paperwork, board minutes.`,
    ],
    faq: [
      { q: "Why does my PDF layout shift when converting to Word?", a: "PDF stores fixed positions on a page; Word stores reflowable content. The converter rebuilds paragraphs, headings, and tables rather than pinning every character, so precisely-positioned text may reflow — the trade that keeps the document fully editable instead of a picture of text." },
      { q: "How accurate is the conversion?", a: "Best effort — simple documents convert well; complex layouts, tables, and multi-column designs may shift. Client-side conversion trades pixel-perfection for privacy." },
      { q: "Are scanned PDFs supported?", a: "Only after OCR — run OCR PDF first so a text layer exists to convert." },
      { q: "Do fonts carry over?", a: "Common fonts map to close equivalents; the document remains fully editable either way." },
    ],
  },
  "pdf-to-powerpoint": {
    paragraphs: [
      `Turning a PDF into a PowerPoint deck is usually about reuse: the deck itself was lost, the PDF is the master from a designer, or the content needs to live in a slide system now. This converter places each PDF page as a full-bleed image on its own slide — pixel-faithful and instant.`,
      `Rendering runs via pdf.js at your chosen DPI, and slides assemble with pptxgenjs: 16:9 or 4:3, page order preserved. The result opens in PowerPoint, Keynote, and Google Slides with zero font issues — because there are no live fonts, just clean images.`,
      `The trade is editability: pages become pictures, so text on slides isn't editable. That's the right trade when fidelity matters most; for extracting outline text into editable slides, convert to Word first and restructure there.`,
    ],
    faq: [
      { q: "Can I edit the text on the slides?", a: "No — pages are embedded as images for visual fidelity. Convert to Word if you need editable text, then rebuild slides." },
      { q: "Which slide size should I pick?", a: "16:9 matches modern displays; 4:3 for legacy projectors. Page aspect is preserved inside either frame." },
    ],
  },
  "pdf-to-excel": {
    paragraphs: [
      `Financial reports, inventories, and statements arrive as PDFs but get worked on in spreadsheets. This converter extracts tables into a real .xlsx workbook: detected tables become sheets (or regions on a sheet), with columns split and numeric cells typed where the heuristics are confident.`,
      `It's the structured sibling of PDF to CSV — same table detection, but the Excel output preserves multiple tables as separate areas and keeps column boundaries that CSV flattening can blur. Review the preview before downloading; ambiguous merged cells are exactly where a human eye beats an algorithm.`,
      `For documents that are pure tables (statements, price lists) the conversion is often near-perfect; for decorated financial reports, expect to delete a few header/footer rows that rode along.`,
    ],
    faq: [
      { q: "How are multiple tables handled?", a: "Each detected table exports to its own sheet region in order, so you can trace the source by sequence." },
      { q: "Are formulas reconstructed?", a: "No — values are extracted, not the computation history. The numbers arrive; the logic stays in the PDF." },
    ],
  },
  "word-to-pdf": {
    paragraphs: [
      `Sending a .docx is sending a moving target: fonts substituted, layout reflowed, page breaks shifted on every machine that opens it. Converting to PDF freezes the document — same pagination, same fonts, same look everywhere — which is why "send as PDF" is the closing line of every serious exchange.`,
      `This converter renders your Word document (via mammoth.js to structured content, then to PDF) with Unicode-aware font loading: Devanagari, Arabic, Bengali, Thai, Chinese, Japanese, Korean, and 20+ scripts render correctly because matching fonts load automatically when those scripts are detected — a chronic failure point of naive converters.`,
      `Everything runs in your browser; the document never uploads. Simple documents convert with high fidelity; exotic custom layouts are best-effort, the honest limit of all client-side conversion.`,
    ],
    faq: [
      { q: "Will fonts and layout be preserved exactly?", a: "Best effort — simple documents convert well. Complex layouts with custom fonts and precise positioning may shift; that's a limit of all client-side approaches." },
      { q: "Does it support Nepali, Hindi, Arabic and other non-English scripts?", a: "Yes — the tool detects writing scripts in your document and loads matching Unicode fonts automatically so every character renders correctly." },
      { q: "Does my document get uploaded?", a: "No. Processing is entirely in your browser; only open-source font files are fetched when a non-Latin script is detected." },
    ],
  },
  "powerpoint-to-pdf": {
    paragraphs: [
      `Distributing a .pptx hands recipients an editable copy and prays their fonts match yours. A PDF deck does neither: slides render identically everywhere, nothing reflows, and speaker notes stay private unless you include them. It's the standard way to share decks for review and archival.`,
      `The converter parses the PPTX (a zip of slide XML) with jszip, renders each slide's content — text boxes, images, shapes — onto PDF pages at your chosen size. Static fidelity is the goal: the deck as it looks, not the animations it plays.`,
      `Choose "with notes" for handouts that pair each slide with its talking points, or slides-only for the audience version — one tool, both deliverables.`,
    ],
    faq: [
      { q: "Do animations and transitions carry over?", a: "No — PDF is static. Each slide exports as its final visual state." },
      { q: "Are speaker notes included?", a: "Optionally — choose notes-per-slide mode if you want a handout with the talking points." },
    ],
  },
  "excel-to-pdf": {
    paragraphs: [
      `A spreadsheet is a terrible attachment and a great printout: formulas break on other machines, column widths explode on phones, and nobody trusts "values only" copies. Excel to PDF produces the fixed, signable, emailable rendition — the format finance teams actually circulate.`,
      `The pipeline reads your workbook with SheetJS, renders each sheet as a formatted table, and paginates to PDF with repeated headers and sensible column fitting. Choose per-sheet or whole-workbook output, portrait or landscape (landscape earns its keep for wide tables).`,
      `Before converting, set print areas in Excel if you have them — honored where present — or just select the sheet range here. Either way, the output prints exactly like the preview.`,
    ],
    faq: [
      { q: "Are all sheets included?", a: "By default yes, one after another; you can restrict output to selected sheets." },
      { q: "How are very wide sheets handled?", a: "Landscape orientation plus column scaling fits most tables; extremely wide ones split across pages with the header row repeated." },
    ],
  },
  "batch-converter": {
    paragraphs: [
      `One file is a task; fifty files are a workflow. The Batch Converter takes a ZIP (or a multi-file selection), applies one conversion to everything — Word to PDF, images to PDF, any direction the individual tools support — and returns a ZIP of results, filename-for-filename.`,
      `This is where client-side processing shines at scale: files process sequentially in your browser, so there's no upload queue, no per-file fee, no "you've used your free conversions" wall. A folder of fifty invoices converts in one sitting, privately.`,
      `Practical tips: keep input filenames clean (they carry over); use Rename & Batch Export afterward if the outputs need a naming convention; and for mixed input types in one archive, process per type for predictable results.`,
    ],
    faq: [
      { q: "Which conversions can run in batch?", a: "Any single-format direction the site supports — pick the target format and drop matching files." },
      { q: "What about failed files?", a: "Failures are reported per file without blocking the batch; the ZIP contains everything that succeeded." },
    ],
  },
  "split-pdf-by-page-count": {
    paragraphs: [
      `Some workflows think in fixed blocks, not content: ship 25 pages per envelope, archive 50 pages per file, hand each reviewer 10 pages. This splitter cuts a PDF into equal parts by page count — set the chunk size and download the stack.`,
      `The last part is intentionally shorter when the total isn't evenly divisible; boundaries always fall between pages, so no content is cut mid-flow. Parts are named in order (part-1, part-2, …) so downstream systems can reassemble confidently.`,
      `When the limit is bytes rather than pages — email caps, portal limits — Split PDF by Size measures and cuts on actual file size instead; when the boundaries are semantic (chapters), bookmarks are the smarter dividing line.`,
    ],
    faq: [
      { q: "How does it decide where to split?", a: "At page boundaries, into equal chunks of your chosen size — the final part may be smaller if the page count isn't evenly divisible." },
      { q: "Can I reassemble the original later?", a: "Yes — merging the parts in order reproduces the source document exactly." },
    ],
  },
  "pdf-duplicate-pages": {
    paragraphs: [
      `Duplication sounds redundant until you need it: print shops want a page repeated N-up for cut sheets, forms packets need a blank copy of the same page after each filled one, and design proofs repeat a page across paper stocks. This tool copies selected pages in place, as many times as you specify.`,
      `Copies are true structural duplicates — same content, annotations, and size — inserted consecutively where you choose. Since pdf-lib copies page objects without re-rendering, quality is bit-identical to the source page.`,
      `A classic use: a two-page form where the second page is the carbon copy — duplicate page 1 twice to build a three-up print sheet without leaving the PDF world.`,
    ],
    faq: [
      { q: "Where do the copies go?", a: "Immediately after the original by default, or at a position you specify." },
      { q: "Do duplicated pages increase file size much?", a: "PDF reuses the page's resources, so copies cost far less than full-size duplicates in most documents." },
    ],
  },
  "pdf-interleave": {
    paragraphs: [
      `Scanning double-sided documents on a single-sided feeder produces two files: all the fronts, then all the backs. Interleaving is the fix — this tool zips two PDFs together page by page (A1, B1, A2, B2, …) so fronts and backs reunite in correct order.`,
      `The opposite operation, de-interleaving, is equally supported: split a stack that alternates two document types into separate files. Either direction, the merge is structural — pages are resequenced, not re-rendered, so quality and text layers are untouched.`,
      `When the two scans have unequal page counts (a blank back, a dropped sheet), the tool appends the remainder after the interleave and flags it — no silent page loss.`,
    ],
    faq: [
      { q: "What if the PDFs have different page counts?", a: "The longer document's remaining pages continue after the interleave ends — nothing is discarded, and the report tells you the final structure." },
      { q: "Can I interleave more than two files?", a: "Two at a time keeps the operation predictable; chain runs for more complex shuffles." },
    ],
  },
  "pdf-scale-pages": {
    paragraphs: [
      `Scaling pages is the print-shop verb: a 25% reduction turns an oversized drawing into a standard sheet, a 141% enlargement (A4→A3) makes a form readable at a counter, and uniform scaling fixes pages that arrived with the wrong paper size. This tool rescales page content by percentage, per page or across the document.`,
      `The transform maps content vectors — text and line art stay sharp at any factor, unlike bitmap zooming. Aspect ratio is preserved; the page box grows or shrinks to match, so printed output matches your expectation on the first try.`,
      `For mixed-size documents destined for one paper stock, scale everything to a common factor (or use Resize PDF Page for absolute target sizes) before printing to avoid paper-swapping mid-job.`,
    ],
    faq: [
      { q: "Will scaled text stay sharp?", a: "Yes — content is transformed as vectors, so it re-renders crisply at any percentage." },
      { q: "What's the useful range?", a: "25%–200% covers reduction to A3 enlargement; beyond that, re-export from the source at the target size." },
    ],
  },
  "pdf-invert-colors": {
    paragraphs: [
      `Inverting a PDF is accessibility and comfort: dark mode for reading at night, white-text-on-black for light-sensitive readers, and a quick way to make a glaring whitepaper readable on an OLED screen. The tool inverts each page's colors — white becomes black, text becomes light — while preserving layout exactly.`,
      `Inversion happens at the pixel level per page, so the result is view-anywhere: no reader needs a special mode, and printouts come out as the inverted hard copy, which is occasionally exactly the ask (dark-theme proofs, chalkboard-style handouts).`,
      `For images-only inversion or selective treatment, the image tools invert single graphics; here the whole document flips in one pass.`,
    ],
    faq: [
      { q: "Is the text still selectable after inverting?", a: "On pages re-rendered during inversion, text becomes image-based; copy the text first with PDF to Text if you need it." },
      { q: "Does inversion affect file size?", a: "Re-rendered pages compress similarly to scans — size stays in the same ballpark as the original." },
    ],
  },
  "pdf-metadata-stripper": {
    paragraphs: [
      `Metadata is the story a document tells about itself without being asked: author names, machine hostnames, editing software, revision timestamps, sometimes comment history. Strip it before publication and the document tells only its content — nothing about who touched it or on what computer.`,
      `The tool clears the Info dictionary fields (title stays if you choose) and removes XMP packet data that carries richer trails: creator tool versions, edit history, thumbnails. Page content is untouched — this is a privacy operation, not a content one.`,
      `Sequence matters in real workflows: strip metadata as the final step after all editing, since every save can reintroduce it. Pair with EXIF stripping on images for a fully clean publication package.`,
    ],
    faq: [
      { q: "Which fields are removed?", a: "Author, producer, creator application, keywords, subject, and timestamps — plus XMP metadata blocks. Page content is unaffected." },
      { q: "Will stripping change how my document displays?", a: "No — viewers only use metadata for the window title and file properties; pages render identically." },
    ],
  },
  "pdf-page-labels": {
    paragraphs: [
      `PDF page labels are the unsung navigation feature: the reader's page field showing "A-3" or "iv" instead of "17." Legal depositions (A-1 exhibits), books (roman-numeral front matter), and standards documents (section-prefixed pages) all rely on labels to keep printed page numbers and PDF navigation in sync.`,
      `This tool assigns label ranges with styles — decimal, lowercase/uppercase Roman, letters — and optional prefixes, mapping them onto page ranges. Readers that honor labels (Acrobat, Firefox, Preview) display them; the pages themselves aren't altered.`,
      `Labels complement rather than replace stamped numbers: labels live in navigation, stamps live in content. Formal documents usually want both, aligned.`,
    ],
    faq: [
      { q: "Do labels change the printed page numbers?", a: "No — labels affect the viewer's navigation display. Add visible numbers with Add Page Numbers if the print needs them." },
      { q: "Can I mix styles like iv, then 1, then A-1?", a: "Yes — define consecutive ranges, each with its own style and prefix." },
    ],
  },
  "pdf-transparent-bg": {
    paragraphs: [
      `A white page background is a choice, not a law — and sometimes the wrong one: branded stationery with a tinted ground, overlay documents meant to stack on templates, or pages destined for dark-background compositing. This tool converts page backgrounds to true transparency where the PDF format allows it.`,
      `Transparency in PDF is a compositing feature: viewers that support it (all modern ones) show whatever is behind the page — useful for overlay workflows like stamping a signature layer onto another document, or producing print-ready art where the stock color should show through.`,
      `Note the honest limit: many consumer tools flatten transparency to white on export or print. Treat transparent PDFs as intermediate art assets rather than final documents unless your pipeline supports alpha.`,
    ],
    faq: [
      { q: "Will transparency survive printing?", a: "Only in pipelines that honor PDF transparency; many flatten to white. Test-print one page before committing a run." },
      { q: "Which viewers show it correctly?", a: "Modern browsers and Acrobat render PDF transparency; very old or minimal viewers may show white." },
    ],
  },
  "pdf-page-crop-marks": {
    paragraphs: [
      `Crop marks are the printer's contract with the paper: short lines at each corner showing exactly where to trim. If your PDF will be cut — business cards, flyers, book blocks — adding marks and a bleed removes guesswork from the guillotine and keeps the finished size honest.`,
      `The tool draws standard offset marks outside the trim area, with configurable mark length, offset, and line weight, via pdf-lib. Content is untouched; marks are additive annotations on the page periphery, so the document stays fully intact underneath.`,
      `Workflow note: marks describe the trim; bleed (content extending past it) must exist in the artwork. If your design runs edge-to-edge, make sure it extends past the trim line before adding marks.`,
    ],
    faq: [
      { q: "What's the difference between crop marks and a crop box?", a: "Crop marks are printed trim guides on the sheet; the crop box hides page area in viewers. Print production wants marks; display tweaks want the crop box." },
      { q: "Do I need bleed for marks to work?", a: "Marks guide the cut; bleed prevents white slivers when the cut drifts. Include both for edge-to-edge designs." },
    ],
  },
  "pdf-bates-numbering": {
    paragraphs: [
      `Bates numbering is how legal and regulatory worlds keep thousands of pages unambiguous: every page carries a unique, sequential identifier (ABCD-000001) that survives copying, scanning, and citation in court. If a production set ever lands on your desk, the Bates number is its primary key.`,
      `This tool applies Bates stamps across a document or a merged production: configure the prefix, starting number, digit padding, position, and font, then stamp in one pass. Numbers render into page content, so they photocopy and re-scan like any printed text — the property that made Bates stamping the standard for a century.`,
      `For evidence integrity, stamp a copy and keep the pristine original; the numbered set is your working production, the original is your proof of unaltered source.`,
    ],
    faq: [
      { q: "What is Bates numbering used for?", a: "Unique page identification in legal productions, regulatory filings, and large document sets — each page gets a traceable sequential ID." },
      { q: "Can numbering continue across multiple documents?", a: "Yes — merge the set first, or start each run at the next number manually to continue a series across files." },
    ],
  },
  "pdf-to-svg": {
    paragraphs: [
      `SVG turns a PDF page into web-native graphics: embeddable in HTML, styleable with CSS, zoomable without blur. For diagrams, charts, and drawings inside a PDF, an SVG export keeps line work crisp at any size — ideal for documentation sites and responsive pages.`,
      `This converter extracts page structure and vector content into SVG per page, with output selectable individually or as a ZIP. Because PDF and SVG share a vector heritage, geometry carries over; effects that exist only in PDF rendering (some shading patterns, blend modes) approximate rather than replicate.`,
      `For photographs and scans, SVG buys nothing — raster formats are honest about pixels. Reserve this tool for line art and vector-heavy pages.`,
    ],
    faq: [
      { q: "Is the SVG pixel-perfect?", a: "Structure and geometry preserve well; exotic PDF paint features may approximate. Vector diagrams convert best." },
      { q: "Can I edit the SVG afterward?", a: "Yes — any vector editor opens it, which is often the point of the conversion." },
    ],
  },
  "pdf-create-from-url": {
    paragraphs: [
      `"Save this page as a PDF" is a request that comes up constantly — receipts, confirmations, articles, documentation. This tool fetches a URL, renders the page content, and produces a PDF you can file, sign, or attach, without browser print-dialog gymnastics.`,
      `It captures what the page renders: visible content including images that load. Client-rendered apps (content built by JavaScript after load) and sites that block embedded capture are the known limits — the FAQ in every honest tool says so, and this one is no exception.`,
      `Respect the target site's terms: capture pages for your own records and compliance, not for republication. For pages you control (invoices you generate), HTML to PDF gives you full layout control instead.`,
    ],
    faq: [
      { q: "Will it capture all content?", a: "It captures the page's visible rendered content. Dynamic content loaded via JavaScript may be incomplete, and some sites block external capture." },
      { q: "Can I capture a page that requires login?", a: "No — the tool fetches as an anonymous visitor. For authenticated pages, save the page from your browser instead." },
    ],
  },
  "pdf-to-rtf": {
    paragraphs: [
      `RTF is the formats' diplomat: understood by WordPad, Word, Pages, LibreOffice, and a thousand legacy systems that never learned DOCX. When a PDF's text must land in an unknown-word-processor environment — legacy case management, old records systems — RTF is the safe common denominator.`,
      `The converter extracts text with paragraph structure and basic character styling (bold/italic where detectable) and builds a valid RTF document. It's a text-focused bridge, not a layout clone: pagination, columns, and images don't survive the trip, and pretending otherwise would produce garbage in the target system anyway.`,
      `For modern targets, PDF to Word (DOCX) is richer; RTF earns its place when "DOCX support" can't be assumed.`,
    ],
    faq: [
      { q: "Why RTF instead of DOCX?", a: "Legacy compatibility — RTF opens in virtually every word processor ever shipped, including systems that predate DOCX." },
      { q: "Are images included?", a: "No — this is a text-and-structure conversion. Extract images separately if needed." },
    ],
  },
  "pdf-encrypt-check": {
    paragraphs: [
      `Before you archive, merge, or submit a PDF, know its security posture: is it encrypted at all, which protections apply (open password vs. permissions), which encryption revision, and what the permission flags actually allow. This checker reads the document's security dictionary and reports plainly.`,
      `The distinction that matters operationally: an open-password document can't be read without the credential, while a permissions-only document is readable but restricted — and many tools (including some on this site) can reprocess permissions-restricted files but must refuse open-password ones. Checking first saves a failed workflow later.`,
      `Pair with PDF Info Viewer for the full structural picture, or Protect PDF to apply the encryption this tool reports on.`,
    ],
    faq: [
      { q: "Does this reveal the password?", a: "No — it reads the encryption metadata (algorithm, permissions), which is not secret. Passwords are never recoverable from a PDF." },
      { q: "Why does my 'protected' PDF open without a password?", a: "Permissions-only protection restricts actions (printing, copying) but not reading — a common and often misunderstood configuration." },
    ],
  },
  "pdf-page-counter": {
    paragraphs: [
      `"How many pages?" sounds like a trivial question until it gates a process: per-page pricing, submission limits, print quotes, reading-time estimates. This analyzer opens the document and reports the count — plus the geometry that page counts hide: per-page dimensions, orientation distribution, and estimated reading time.`,
      `Mixed-orientation documents are the surprise here: packets that mix portrait and landscape pages confuse printers and staplers, and this is the tool that reveals the mix before the print shop calls. Page-size distribution matters for the same reason.`,
      `It's a read-only diagnostic — pair it with Resize PDF Page to normalize a mixed-size document once you know what you're dealing with.`,
    ],
    faq: [
      { q: "Does it count hidden or very large pages?", a: "Yes — every page object counts, including oversized plotter pages that most viewers silently scale down." },
      { q: "How is reading time estimated?", a: "From extracted word count at a typical reading pace — a rough guide for packets destined for human review, not a precision metric." },
    ],
  },
  "pdf-to-json": {
    paragraphs: [
      `Structured data about a document — page inventory, text content, metadata, fonts — is the raw material for automation: indexing pipelines, QA scripts, AI retrieval systems. This converter exports the PDF's content as JSON with a predictable schema, ready for code to consume.`,
      `The payload includes document metadata, per-page geometry, and extracted text with page attribution. That last field — knowing which page each text block came from — is what makes citations and highlighting possible downstream, and it's the reason to use this over generic text extraction when building tools.`,
      `The JSON is intentionally self-describing: field names are stable, and the structure mirrors the PDF object model loosely enough to stay robust across producers.`,
    ],
    faq: [
      { q: "What's in the JSON?", a: "Metadata, page list with dimensions, and text blocks with page positions — enough to rebuild reading order or map highlights." },
      { q: "Can I feed this to an LLM?", a: "Yes — that's a common use: page-attributed text is ideal for grounded retrieval where answers must cite pages." },
    ],
  },
  "pdf-image-watermark": {
    paragraphs: [
      `A logo watermark does what text can't: brand every page visually, unmissable and unmistakable. Upload a PNG (transparency preserved), choose scale, opacity, and position — corner badge, centered ghost, diagonal banner — and apply to every page or a range.`,
      `The watermark embeds into page content with pdf-lib, surviving forwarding and printing identically everywhere. Opacity in the 10–25% range keeps body text legible; a corner badge at full opacity marks ownership without obscuring anything.`,
      `For text watermarks (DRAFT, CONFIDENTIAL) use Watermark PDF; this tool is for image marks — logos, seals, signature stamps at document scale.`,
    ],
    faq: [
      { q: "What image format works best?", a: "PNG with a transparent background — the transparency carries into the PDF, so the mark composites cleanly over content." },
      { q: "Can I combine a logo and a DRAFT text stamp?", a: "Yes — run each watermark tool once; both embed permanently into the page content." },
    ],
  },
  "pdf-merge-single-page": {
    paragraphs: [
      `N-up layout is the print-shop trick hiding in plain sight: multiple PDF pages composed onto one sheet — 2-up for conference handouts, 4-up for slide printouts, 6-up for proof grids. This tool builds the composite: choose a grid (2×1, 2×2, 3×2, 3×3), drop in the source (one PDF's pages or several files), and get a sheet-optimized document.`,
      `Pages place in reading order across the grid, scaled to fit cells with margins you control. The math is real savings: 4-up prints use a quarter of the paper, and slide decks become readable handouts instead of one-slide-per-page forests.`,
      `For reverse use — splitting a composed sheet back apart — Crop PDF on the grid boundaries does the surgical work.`,
    ],
    faq: [
      { q: "How many pages per sheet are supported?", a: "Grids from 2×1 up to 3×3 (nine-up), with margin and spacing controls." },
      { q: "Is quality reduced when pages shrink?", a: "Content scales as vectors, so text stays sharp; scanned pages scale like photos — fine at 2-up, denser at 9-up." },
    ],
  },
  "pdf-digital-stamp": {
    paragraphs: [
      `Workflow stamps carry state: RECEIVED on the day the document arrived, APPROVED with the approver's date, REVIEWED, PAID, VOID. This tool composes those stamps — built-in styles or custom text, optional automatic date — and places them precisely where your process expects them.`,
      `Unlike a generic watermark, a stamp is compact, opaque, and positioned like a rubber stamp: top-right corner, next to a signature block, across a totals row. Rotation, color, and border styles match the office-stamp look; the date pulls from your device or a fixed value you set.`,
      `For legal productions, Bates Numbering handles sequential IDs; this tool handles status marks — the two coexist on the same pages without conflict.`,
    ],
    faq: [
      { q: "Can the stamp include today's date automatically?", a: "Yes — enable the date and it composes into the stamp text at render time." },
      { q: "Can I create custom stamp text?", a: "Yes — enter any text, choose style, color, and position; the tool renders it as a permanent page mark." },
    ],
  },
  "pdf-page-transition": {
    paragraphs: [
      `PDF supports presentation transitions — the page-change effects (fade, slide, dissolve) that Acrobat's full-screen mode plays between pages. This tool adds them to an existing PDF, turning a plain document into a self-presenting deck that needs no PowerPoint: open in full-screen mode and the transitions play.`,
      `Set a default effect and duration for the whole document, or override per page for emphasis moments — a dissolve into a title page, quick slides through body content. Transitions are stored as page metadata, so the document stays a normal PDF everywhere else.`,
      `The honest caveat: transitions are a presentation-mode feature honored by Acrobat and some viewers; basic readers and browsers ignore them gracefully — the document simply shows without effects.`,
    ],
    faq: [
      { q: "Do transitions work in all PDF viewers?", a: "No — viewers that implement PDF presentation mode (like Acrobat) play them; browsers and minimal readers show pages without effects." },
      { q: "Can I mix different transitions?", a: "Yes — apply a default and override specific pages for emphasis." },
    ],
  },
};

export default PDF_GUIDES_B;
