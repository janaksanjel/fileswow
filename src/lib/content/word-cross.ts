// lib/content/word-cross.ts
//
// Editorial content for Word/DOCX tools (33) and cross-format utility tools
// (10). PDF content lives in pdf-a.ts / pdf-b.ts, image content in image.ts.
//
// Every entry is unique, hand-written copy — no templated filler.

import type { ToolGuideMap } from "./types";

const WORD_GUIDES: ToolGuideMap = {
  "merge-word": {
    paragraphs: [
      `Merging Word documents is deceptively hard: two .docx files each carry their own styles, numbering definitions, headers, and section settings, and naive concatenation produces the classic disasters — numbering that restarts, fonts that shift mid-document, headers from file two colonizing file one. This tool merges while keeping each source's sections intact, so chapter numbering and layout survive the journey.`,
      `Order is draggable before you merge; each document becomes its own section in the output, which is exactly what preserves per-file headers, footers, and page numbering schemes. The result is a real Word file — fully editable, tracked-changes-capable — not a flattened PDF stand-in.`,
      `Typical jobs: combining chapter files into a book manuscript, assembling departmental inputs into one report, concatenating legal pleadings. For "combine then freeze," merge here first and convert to PDF second.`,
    ],
    faq: [
      { q: "How do I merge Word documents and keep formatting?", a: "Add the .docx files in reading order and merge — each document keeps its own styles, fonts, headers, and section settings, so the second file doesn't inherit the first file's theme and layout stays intact." },
      { q: "Will merging two documents mess up footnote numbering?", a: "No — footnotes and endnotes travel with their own document's section, so numbering continues correctly instead of colliding or restarting unexpectedly. Cross-references inside each document keep pointing at their own notes." },
      { q: "Will page numbering restart for each document?", a: "Each source keeps its own section settings — numbering schemes are preserved rather than merged into one continuous sequence." },
      { q: "Can I merge .doc files?", a: "Save them as .docx in Word first; the legacy binary format isn't parseable in the browser." },
    ],
  },
  "split-word": {
    paragraphs: [
      `Long Word documents outgrow single files: a 300-page manual is unmaintainable, a combined report can't circulate to its chapter owners, a contract needs to split at signature blocks. This splitter cuts a document into multiple .docx files at the boundaries you choose — by heading (each Heading 1 becomes a file), by page range, or by section break.`,
      `Heading-based splitting is the everyday winner: outline your document properly and the tool finds the seams automatically. Each output file carries the styles it needs, so chapters remain consistently formatted when they leave home.`,
      `The split is structural, not a print-to-file: text stays text, styles stay styles, and each piece reopens in Word as a normal document ready for independent editing.`,
    ],
    faq: [
      { q: "How does splitting by heading work?", a: "The tool maps your document's Heading 1 paragraphs (or a level you choose) and cuts at each — one file per section." },
      { q: "Do shared styles survive?", a: "Yes — each split file embeds the style definitions it uses, so formatting holds outside the original." },
    ],
  },
  "word-to-text": {
    paragraphs: [
      `Under every .docx is plain text trying to get out — for search indexing, for translation pipelines, for pasting into systems that reject formatting, for LLM prompts that don't need XML noise. This extractor pulls the document's text with paragraph structure intact, minus the formatting machinery.`,
      `It uses mammoth.js, which reads the document's semantic content (paragraphs, headings, tables as text runs) rather than scraping visual artifacts. The result is clean: no leftover field codes, no broken style XML, just the words in order.`,
      `Tables flatten with tab separation in this tool; if you need table structure preserved for Excel, Word Tables to Excel keeps the grid. For most prose documents, what you get here is exactly what you want.`,
    ],
    faq: [
      { q: "Are footnotes and endnotes included?", a: "Body text extracts by default; footnote text can be included in output options." },
      { q: "Does the text keep the reading order?", a: "Yes — paragraphs extract in document order, including table content inline where it appears." },
    ],
  },
  "text-to-word": {
    paragraphs: [
      `The Text to Word editor is a small word processor that lives in your browser — the same canvas as Text to PDF. Type directly, or paste from Word, Google Docs, an email, or a web page: the paste pipeline keeps what you copied, including bold, italics, colors, highlights, font families and sizes, alignment, bullet and numbered lists, and links. A one-click toggle strips everything to plain text when you want only the words.`,
      `The export is a real .docx, not a text file with a Word extension: headings map to Word's Heading styles, emphasis becomes true bold/italic runs, lists use Word's native numbering so they renumber when edited, links stay clickable, and images embed into the document. Because DOCX is fully Unicode, emoji and non-Latin scripts convert cleanly — no "?" substitution.`,
      `Common uses: turning notes, drafts, and generated text into documents ready for comments and track changes, rescuing pasted-from-email formatting into a clean file, and producing .docx deliverables without installing Word — all offline, all private.`,
    ],
    faq: [
      { q: "Will long lines wrap or break?", a: "They wrap naturally at the page width; your original line breaks are preserved as paragraph boundaries where they occur." },
      { q: "Can I choose the font?", a: "Yes — style any selection with the editor toolbar (family, size, color, alignment); the Word export carries the styling over as real formatting." },
    ],
  },
  "word-to-html": {
    paragraphs: [
      `A Word document's journey to the web usually passes through "paste into the CMS," which arrives carrying Word's proprietary markup — a mess of spans, styles, and cruft that breaks layouts and bloats pages. This converter produces clean, semantic HTML instead: real heading tags, proper lists, paragraphs.`,
      `mammoth.js maps styles semantically: Heading 1 becomes <h1>, List Paragraph becomes <ul>/<ol>, emphasis becomes <strong>/<em>. The output is ready for a CMS, an email body, or a static site — small, readable, and standards-compliant.`,
      `Images embed as data URIs or extract alongside the HTML depending on your needs; tables convert to proper <table> markup with structure intact.`,
    ],
    faq: [
      { q: "Is the HTML clean or full of Word markup?", a: "Clean — the converter's whole purpose is semantic mapping instead of Word's proprietary XML export." },
      { q: "Do images come through?", a: "Yes — inline images extract and embed; you can choose data-URI embedding or separate files." },
    ],
  },
  "html-to-word": {
    paragraphs: [
      `The reverse trip matters too: an HTML page — a generated report, a web article, documentation — needs to become an editable Word document for review cycles, contracts, and redlining. This converter builds a .docx from your markup with real Word structures: paragraphs, heading styles, lists, tables.`,
      `Paste HTML directly (inline styles are safest) and the tool maps semantic elements to Word styles — <h2> becomes Heading 2, <table> becomes a real Word table you can edit cell by cell. The result isn't a screenshot of a page; it's a document that behaves like one.`,
      `The pairing with Word to HTML makes a full round-trip possible: web to Word for review, Word back to web for publication.`,
    ],
    faq: [
      { q: "Are tables editable in the output?", a: "Yes — they become genuine Word tables, not images." },
      { q: "Which HTML is supported?", a: "Standard semantic markup: headings, paragraphs, lists, tables, links, and inline styles. Scripts don't run — static content only." },
    ],
  },
  "word-to-markdown": {
    paragraphs: [
      `Word documents don't belong in git, wikis, or static sites — Markdown does. This converter translates .docx into clean Markdown: headings to # levels, bold to **, lists to dashes, tables to pipe tables. The output is diff-friendly, versionable, and ready for any documentation system.`,
      `mammoth.js plus turndown handle the semantic mapping, so styled paragraphs become meaningful Markdown instead of gibberish. Code-styled runs convert to backticks where the source used monospace character styles.`,
      `This is the standard first step for migrating docs to a wiki or feeding documents into developer workflows — and because it runs in your browser, internal documents never touch a converter service.`,
    ],
    faq: [
      { q: "How are images handled?", a: "They extract to files or data URIs referenced from the Markdown, depending on your output choice." },
      { q: "Do complex tables convert?", a: "Standard tables become Markdown pipe tables; deeply merged cells simplify to the closest grid." },
    ],
  },
  "markdown-to-word": {
    paragraphs: [
      `Markdown's plainness is its power — until a reviewer demands .docx with tracked changes. This converter promotes your Markdown into a real Word document: # lines become Heading 1 style (not big bold text), lists become native lists, tables become editable Word tables, code blocks become monospace paragraphs.`,
      `The mapping is semantic because it uses markdown-it for parsing and the docx library for building — you get documents that behave correctly in Word's navigation pane, outline view, and table of contents tools.`,
      `Common flow: write in Markdown, convert when the document enters the review/sign-off world, keep the Markdown as the source of truth.`,
    ],
    faq: [
      { q: "Will headings work with Word's TOC generator?", a: "Yes — headings map to real heading styles, so Word's automatic table of contents picks them up." },
      { q: "Are code blocks styled?", a: "They render as monospace paragraphs with preserved line breaks — ready for light styling in Word if needed." },
    ],
  },
  "word-to-epub": {
    paragraphs: [
      `Writers draft in Word and readers read in EPUB — the conversion between them is the whole self-publishing pipeline. This tool rebuilds your manuscript as a reflowable EPUB: heading styles become the chapter navigation, paragraphs flow to any screen size, and the book behaves like a book on Kindle, Kobo, and Apple Books.`,
      `Structure matters going in: use Word's heading styles for chapters (not manually enlarged bold text) and the converter maps them cleanly to the EPUB's table of contents. Front matter, chapters, and images carry across in order.`,
      `Because everything processes in your browser, unpublished manuscripts stay private — a real consideration when the document is your unreleased book.`,
    ],
    faq: [
      { q: "How do chapters map?", a: "Heading 1 paragraphs (or your chosen level) define the chapter boundaries and the EPUB's navigation." },
      { q: "Will it pass bookstore validation?", a: "The output is standards-compliant EPUB; storefront-specific requirements (like Kindle's conversions) are handled by their ingestion tools." },
    ],
  },
  "word-to-odt": {
    paragraphs: [
      `ODT is the OpenDocument format — the native tongue of LibreOffice, OpenOffice, and many government systems that mandate open standards. Converting Word to ODT is the interoperability handshake: your .docx works in environments that deliberately don't speak Microsoft's format.`,
      `The conversion preserves document semantics — paragraphs, headings, lists, tables — into ODF structures. Text-heavy documents convert cleanly; exotic Word features (SmartArt, some theme effects) simplify, since ODF expresses them differently or not at all.`,
      `The round trip (ODT back to Word with the sibling tool) makes mixed Microsoft/LibreOffice workplaces workable without anyone reinstalling anything.`,
    ],
    faq: [
      { q: "Will layout shift after conversion?", a: "Slight differences are normal — ODF and OOXML render some features differently, but content and structure hold." },
      { q: "Is ODT accepted by government portals?", a: "Many mandate or prefer it — that's a core reason the format exists. Check the specific portal's requirements." },
    ],
  },
  "odt-to-word": {
    paragraphs: [
      `The mirror move: an ODT file from a LibreOffice colleague or an open-standards portal needs to enter the Word world for track changes, integration, or a recipient who lives in Microsoft's ecosystem. This converter rebuilds the document as .docx with structure intact.`,
      `Paragraphs, headings, lists, and tables map into OOXML equivalents; styles carry over where the formats correspond. The output opens in Word, of course, but also in Google Docs and everything else that reads .docx — which is the point.`,
      `Like all format translations, exotic source features may simplify. For everyday documents — letters, reports, specifications — the conversion is seamless.`,
    ],
    faq: [
      { q: "Does track changes history survive?", a: "Not across formats — ODF and OOXML store revisions differently. Start fresh tracking in the converted file." },
      { q: "Can I convert back?", a: "Yes — Word to ODT completes the round trip when the document needs to return to open-standards land." },
    ],
  },
  "word-to-images": {
    paragraphs: [
      `Sometimes a document must become a picture: a page preview for an app, a thumbnail for a CMS, an un-editable snapshot for a status update, or slides-ready visuals. This tool renders each page of your Word document as an image — JPG or PNG — at the resolution you pick.`,
      `Rendering goes through a layout-to-canvas pipeline (mammoth + html2canvas): text, tables, and inline images draw faithfully for standard documents. Choose PNG for crisp text, JPG for smaller files when the images feed into larger composites.`,
      `Since the output is pixels, the text is no longer selectable — pair the delivery with the original document or a PDF version whenever recipients might need to copy or search.`,
    ],
    faq: [
      { q: "Which resolution should I choose?", a: "2× scale suits screens and chat previews; 3–4× works for print-quality needs. Higher scales mean larger files." },
      { q: "Why does my complex layout render slightly differently?", a: "Browser-based layout approximates Word's engine; exotic positioning may shift. Simple documents match closely." },
    ],
  },
  "word-to-powerpoint": {
    paragraphs: [
      `Every report ends with "can you present this?" — and the fastest bridge from a written document to a deck is structure-based conversion: your Word headings become slide titles, paragraphs become bullet points, and a 20-page report becomes a navigable presentation in seconds.`,
      `The converter (mammoth + pptxgenjs) reads the document outline and builds slides accordingly — one slide per top-level section, with subsections as bullets. It's a first-draft deck by design: you'll want to trim bullets and add visuals, but starting from structure beats starting from a blank slide.`,
      `Use outline levels deliberately: Heading 1 = slide, Heading 2 = bullet, Heading 3 = sub-bullet. Documents with a clean outline convert almost presentation-ready.`,
    ],
    faq: [
      { q: "How are slides decided?", a: "Each top-level heading starts a new slide; its subheadings and paragraphs become bullets beneath it." },
      { q: "Are images included?", a: "Inline images can carry onto the slides where they appear in the source document." },
    ],
  },
  "remove-watermark-word": {
    paragraphs: [
      `Word watermarks are real objects — WordArt shapes living in the document's header XML — and this tool removes them at that level: it finds the watermark objects and deletes them from the file, leaving every other element untouched. No convert-and-rebuild, no formatting loss.`,
      `Beyond the classic WordArt watermark, the tool optionally strips header/footer images and "behind text" pictures that squatters use as pseudo-watermarks. A checklist shows what was found before anything is removed, so you're never guessing what changed.`,
      `Ownership matters here too: remove watermarks from documents you own or are authorized to modify. The tool's precision editing is exactly what makes that boundary worth respecting — it's a surgical instrument, not a laundering machine.`,
    ],
    faq: [
      { q: "Does it keep my formatting?", a: "Yes — the tool edits only the watermark objects inside the DOCX; all other content and styles remain byte-for-byte intact." },
      { q: "What about old .doc files?", a: "Not supported — save as .docx in Word first, then remove." },
    ],
  },
  "watermark-word": {
    paragraphs: [
      `Word documents get watermarked for the same reasons PDFs do — DRAFT, CONFIDENTIAL, company name — but Word's watermark feature hides three menus deep and behaves inconsistently across versions. This tool adds text or image watermarks directly into the document's structure, visible on every page.`,
      `The watermark inserts as a proper header-anchored object (the mechanism Word itself uses), so it repeats on all pages, prints correctly, and remains editable in Word afterward — you're not baking pixels over the text.`,
      `Text watermarks suit status labels; image watermarks (a logo PNG) brand every page. Either embeds via raw OOXML injection, which is why the result behaves exactly like a Word-native watermark.`,
    ],
    faq: [
      { q: "Can recipients remove it in Word?", a: "Yes — it's a normal Word object, intentionally. For removal-proof marking, watermark the PDF you distribute instead." },
      { q: "Does it appear on all pages?", a: "Yes — the watermark anchors in the header, which repeats document-wide." },
    ],
  },
  "word-page-numbers": {
    paragraphs: [
      `Page numbers in Word are field codes living in footers — and building them programmatically (position, format, restart-at-section) is fiddlier than it should be. This tool writes the field codes for you: bottom-center, top-right, "Page X of Y", starting from any number.`,
      `The numbers are real PAGE fields, so they update if the document reflows after edits — not static text that drifts out of date. Positioning respects existing headers/footers, adding the field rather than clobbering what's there.`,
      `For documents with front matter, run it twice with different ranges and start numbers — lowercase roman for the preface, arabic starting at 1 for chapter one.`,
    ],
    faq: [
      { q: "How do I insert page numbers in Word online?", a: "Upload the .docx, pick the position and format (bottom-center, top-right, \"Page X of Y\"), and download — the tool inserts real Word PAGE fields into the footer or header, so the numbers stay live when the document is edited later." },
      { q: "Will numbers update if I edit the document?", a: "Yes — they're live PAGE fields, recalculated by Word whenever the document reflows." },
      { q: "Can numbering start at a specific page?", a: "Yes — set the range and starting number, useful for skipping covers and front matter." },
    ],
  },
  "word-header-footer": {
    paragraphs: [
      `Headers and footers carry the professional furniture: document title, confidentiality notice, version, date. Editing them one section at a time in Word is slow; this tool sets header and footer text across the document in one pass, with support for the fields that make footers useful (page numbers, dates).`,
      `Existing headers and footers are respected — you're editing, not flattening. Multi-section documents update the sections you target, so a draft's footer can change without disturbing chapter-specific footers elsewhere.`,
      `Because the edits write real footer content into the OOXML, the results are fully editable in Word afterward — no special artifacts, no conversion layer.`,
    ],
    faq: [
      { q: "Can I set different headers for different sections?", a: "Yes — choose the sections to update per run." },
      { q: "Can I include today's date?", a: "Yes — insert it as a live DATE field or as fixed text, your choice." },
    ],
  },
  "word-find-replace": {
    paragraphs: [
      `Find-and-replace across a Word document sounds trivial until the document is 150 pages and the change spans headers, footers, text boxes, and tables — none of which Word's basic dialog reaches uniformly. This tool rewrites text across all of them in one pass, with case options and whole-word matching.`,
      `It operates on the document's XML text nodes directly, which is how it reaches the places the UI forgets. That precision cuts both ways: match carefully (whole-word prevents "cat" hitting "category"), and preview the count before committing.`,
      `Classic uses: renaming a project codename across a document set, updating a date or version, and the boilerplate swap where a client name appears forty times.`,
    ],
    faq: [
      { q: "Does it replace in headers and footers too?", a: "Yes — and in text boxes and tables, the places manual find-replace often misses." },
      { q: "Can I match case exactly?", a: "Yes — case-sensitive and whole-word options are both available." },
    ],
  },
  "word-track-changes": {
    paragraphs: [
      `Track changes is Word's negotiation layer: every edit marked, every reviewer visible. Reviewing it outside Word is painful; accepting everything blindly is dangerous. This viewer lists all tracked changes — insertions, deletions, formatting shifts — with their authors, and lets you accept or reject each one individually.`,
      `The operations write back to the document's revision structure, so what you download is a clean, decided document: no lingering markup, no "final showing marks" confusion. Bulk accept/reject handles the obvious changes; the individual list handles the ones that need thought.`,
      `Before sending a contract externally, a full accept-all pass here (after review) is the modern equivalent of Word's "accept all and stop tracking" — but with the safety of seeing what you accepted.`,
    ],
    faq: [
      { q: "Are reviewer names shown?", a: "Yes — each change lists its author and timestamp where the document records them." },
      { q: "Does accepting remove the revision history?", a: "Accepted and rejected changes are removed from the markup; the document downloads clean." },
    ],
  },
  "word-comments-extractor": {
    paragraphs: [
      `Reviewer comments hold the real work product of a document review — but they're trapped in a format you can't search, sort, or forward usefully. This extractor pulls every comment out with its author, timestamp, and the exact text it anchors to, as a readable, copyable list.`,
      `The anchored context is the killer feature: seeing "this clause is wrong" means nothing without the sentence it attaches to. Here, each comment ships with its surrounding text, so the export is a self-contained review summary.`,
      `Teams use it to consolidate feedback across versions, feed review points into issue trackers, and archive the discussion when the document itself moves on.`,
    ],
    faq: [
      { q: "Are resolved/deleted comments included?", a: "Only comments still present in the file extract; resolved-but-retained comments appear marked as such." },
      { q: "Can I reply or edit comments here?", a: "This tool extracts for review; manage replies in Word itself." },
    ],
  },
  "word-metadata-editor": {
    paragraphs: [
      `A .docx carries a properties card: title, author, company, last-modified-by, revision counts, template references. That card follows the document everywhere — into email attachments, into SharePoint columns, into search results. Editing it deliberately beats letting the software write your autobiography for you.`,
      `The tool edits the core properties (docProps/core.xml) directly: set the title that search and libraries display, fix the author field for formal submissions, and clear the personal trails (last modified by, revision number) before external distribution.`,
      `Pair with a metadata review before publishing: the difference between "Draft3-FINAL-final2-JohnsCopy" and a proper title is the difference between findable and lost.`,
    ],
    faq: [
      { q: "What's the difference between this and file properties in Word?", a: "Same data, edited here in bulk and without opening Word — useful for privacy passes before sending documents out." },
      { q: "Does content change?", a: "No — only the property records; document text and formatting are untouched." },
    ],
  },
  "compare-word": {
    paragraphs: [
      `Two drafts, one truth to find. This comparison extracts the text from both documents and diffs it — additions, deletions, changes — so the negotiation between versions is visible in one view instead of a flip between windows.`,
      `Text-level comparison catches what matters in documents: changed clauses, new obligations, deleted caveats. Formatting-only changes don't register (usually a relief); inserted images register as context shifts rather than pixel diffs.`,
      `For contract review, run it on the redline candidate before the meeting: knowing exactly what moved turns the call from archaeology into decision-making.`,
    ],
    faq: [
      { q: "Does it show formatting changes?", a: "It compares text content; pure formatting changes don't appear. Combine with Word's own compare for layout-level review." },
      { q: "Can I compare .doc with .docx?", a: "Convert legacy .doc to .docx first — the comparison works on parsed text, so same-format inputs are cleanest." },
    ],
  },
  "redact-word": {
    paragraphs: [
      `Redaction in Word means removal, not decoration: highlighting text black leaves it alive under the highlight, one keystroke from exposure. This tool performs true removal — selected text is deleted from the document's XML and replaced, so nothing remains to recover.`,
      `Search-driven redaction suits pattern work (account numbers, names); selection-driven suits bespoke cases. Either way, the operation rewrites the document text, and the download contains only what you chose to keep.`,
      `Best practice mirrors PDF redaction: work on a copy, verify by re-opening and attempting to search the redacted terms, and remember that tracked changes and comments can carry sensitive content — clear those too (Track Changes Viewer handles the former).`,
    ],
    faq: [
      { q: "Is redacted text recoverable?", a: "No — it's deleted from the file, not covered. Keep an unredacted original if you'll need the content." },
      { q: "Does it redact in headers/footers?", a: "Search-based redaction reaches body, tables, headers, and footers — the full text surface." },
    ],
  },
  "protect-word": {
    paragraphs: [
      `Word documents carry two protection layers, and this tool applies both: password-to-open encryption (AES, via the CFB container) for confidentiality, and editing restrictions for documents that should be readable but not modifiable — forms, templates, final drafts.`,
      `Encryption happens in your browser through a WebAssembly implementation of the format; the password never crosses the network. Choose it like it matters: the strength of protection is the entropy of the password, not the algorithm's name.`,
      `The encrypted output opens normally in Word, Pages, and LibreOffice — protection is part of the file, not a plugin requirement on the receiving end.`,
    ],
    faq: [
      { q: "Can I remove protection later?", a: "Yes — Unlock Word with the password you set. Without it, the file stays sealed." },
      { q: "What's the difference from Word's 'restrict editing'?", a: "Same concept — this tool applies it directly to the file without opening Word, useful for batch or quick passes." },
    ],
  },
  "unlock-word": {
    paragraphs: [
      `The legitimate unlock: you hold the password, and the encryption now blocks a workflow — archiving, conversion, merging. This tool decrypts the document with your credential and hands back a clean, unprotected .docx.`,
      `Decryption runs client-side against the file's CFB container; your password and the document stay on your device. That matters more for Word files than PDFs — a decrypted contract is the contract, and it shouldn't transit anyone else's server to get there.`,
      `As with all unlock tools, the design boundary is ethical as much as technical: it requires the password. Locked documents without credentials are out of scope, full stop.`,
    ],
    faq: [
      { q: "Can it crack an unknown password?", a: "No — it requires the legitimate password and doesn't attempt brute force." },
      { q: "Does unlocking modify content?", a: "No — the decrypted document is content-identical to the original; only the protection layer is removed." },
    ],
  },
  "word-template-filler": {
    paragraphs: [
      `Mail merge used to require Word and a spreadsheet ritual. This tool does it in the browser: upload a template with {{placeholder}} tags, fill in the values (one record or many), and download the finished document — contracts from a clause library, offer letters from HR templates, invoices from a master.`,
      `Placeholders map to any content you define: names, dates, amounts, whole paragraphs (boilerplate variants). Repeated tags reuse the same value, so {{client_name}} can appear twelve times and stay consistent everywhere.`,
      `For batch generation (one output per row of a data set), this pairs naturally with the Batch Converter's philosophy — templates in, documents out, all locally.`,
    ],
    faq: [
      { q: "What syntax do placeholders use?", a: "Double curly braces around a name: {{client_name}}, {{date}}, {{amount}} — same tag reused anywhere in the document." },
      { q: "Can I fill multiple records at once?", a: "Yes — provide a set of values per record and generate documents in sequence." },
    ],
  },
  "word-tables-to-excel": {
    paragraphs: [
      `Word tables are where data goes to be read once; Excel is where it goes to be used. This extractor finds the tables in a document and exports them into a real spreadsheet — one table per sheet (or stacked in order), with cells as cells rather than text blobs.`,
      `mammoth.js surfaces the table structures and SheetJS builds the workbook, preserving rows and columns exactly. Merged header cells flatten sensibly so filtering works — the thing you actually came for.`,
      `Typical jobs: financial tables from a report into a model, requirements tables into a tracker, survey result tables into analysis. It's the bridge from narrative documents to working data.`,
    ],
    faq: [
      { q: "How are multiple tables handled?", a: "Each table exports to its own sheet region in document order, so you can trace them back to the source." },
      { q: "Do merged cells survive?", a: "They flatten to their underlying grid — often exactly what you want for sorting and filtering." },
    ],
  },
  "word-style-cleaner": {
    paragraphs: [
      `Documents accumulate style debt: ten shades of "almost the same" heading, direct formatting fighting the style sheet, fonts inherited from three pasted sources. The Style Cleaner normalizes it — strip custom fonts, unify colors, remove direct formatting so the underlying styles speak again.`,
      `The cleanup targets are choosable: fonts only, colors only, spacing only, or everything. A gentle pass fixes the visual chaos while keeping structure; a full pass produces a clean canvas ready for your template's styles to be applied fresh.`,
      `It's the tool for inherited documents — the proposal someone's cousin formatted in 2011 — and for pre-publication passes where consistency isn't negotiable.`,
    ],
    faq: [
      { q: "Will my headings stay headings?", a: "Yes — style structure is preserved; what gets cleaned is direct (manual) formatting that fights it." },
      { q: "Can I clean only fonts?", a: "Yes — each cleanup category is optional so you can strip exactly what's noisy." },
    ],
  },
  "word-toc-generator": {
    paragraphs: [
      `A table of contents built by hand is wrong the day after the next edit. This tool generates one from your document's heading styles — a real Word TOC field that lists every Heading 1/2/3 with page numbers, updating automatically when the document reflows.`,
      `The TOC inserts at your chosen position (usually after the title page) with Word's native TOC field codes, so Ctrl+A → F9 in Word refreshes it, and the navigation pane recognizes it. Depth is configurable: two levels for a report, three for a manual.`,
      `The prerequisite is honest headings: text made big-and-bold manually won't register. If your document suffers from that, run Style Cleaner first, then generate.`,
    ],
    faq: [
      { q: "Does the TOC update page numbers automatically?", a: "Yes — it's a live TOC field; Word recalculates it on update, exactly like one built in Word." },
      { q: "What if my headings aren't styled?", a: "Apply heading styles first (Style Cleaner helps normalize), then generate — the TOC reads styles, not visual size." },
    ],
  },
  "word-font-checker": {
    paragraphs: [
      `Fonts are the silent saboteurs of document portability: your .docx uses three custom fonts, the recipient has none, and the layout quietly reflows into something uglier. This checker lists every font the document uses, where it's used, and which are safely available everywhere.`,
      `The inventory comes from parsing the document's font tables and usage — body, headings, and theme fonts reported separately. The verdict column tells you the real risk: system-safe fonts (Calibri, Arial) are fine; the obscure brand font is what will break on someone else's machine.`,
      `For distribution-critical documents, the fix is embedding fonts (done in Word's save options) or swapping to safe equivalents — and this checker is how you know which you're dealing with.`,
    ],
    faq: [
      { q: "Why does my document look different on other computers?", a: "Almost always font substitution — this list shows which fonts are at risk of not existing on the recipient's machine." },
      { q: "Does it check character coverage for scripts?", a: "It reports fonts used; scripts rendered by each font depend on your system, so the pairing risk is visible by comparing the list against your scripts." },
    ],
  },
  "word-page-setup": {
    paragraphs: [
      `Page setup is the geometry of a document — size, orientation, margins — and changing it across a finished document by hand means touching every section. This tool rewrites the section properties in one pass: Letter to A4 for an international recipient, portrait to landscape for wide tables, margins tightened for a dense report.`,
      `The edits write real sectPr elements, so Word's own layout engine does the reflow afterward — content moves gracefully rather than being scaled or squashed. Multiple sections update together, keeping headers and footers attached as they reposition.`,
      `Change geometry before final styling: pagination, image placement, and tables all respond to page size, so late changes cascade.`,
    ],
    faq: [
      { q: "How do I change page setup in a Word file online?", a: "Upload the .docx, choose the page size, orientation, or margins, and download — the tool rewrites the document's section settings, and Word reflows the content cleanly when you reopen it. No Word installation needed." },
      { q: "Will my images resize?", a: "They keep their sizes; reflow repositions them. Very wide images may need manual adjustment after orientation changes." },
      { q: "Can I set custom margins?", a: "Yes — preset or exact measurements, applied per section or document-wide." },
    ],
  },

  "word-to-pdf-2": {
    paragraphs: [
      `This is the Word-to-PDF converter accessible from the Word tools section — the same engine as the PDF tools' Word to PDF, surfaced here so you don't have to leave the Word workflow to reach it. Upload a .docx, get a PDF; the conversion handles Unicode scripts, tables, and inline images.`,
      `The "Quick" label reflects the entry point, not a capability cut: mammoth.js extracts the document's semantic content and jsPDF renders it to PDF with automatic font loading for non-Latin scripts. Simple documents convert cleanly; complex layouts with precise positioning may shift, as with any client-side approach.`,
      `For the full feature set — script detection options, layout controls — the dedicated Word to PDF tool in the PDF section is the same converter with more surface area exposed.`,
    ],
    faq: [
      { q: "Is this different from the PDF section's Word to PDF?", a: "Same engine, same output quality — this entry point lives in the Word tools section for workflow convenience." },
      { q: "Does it support non-Latin scripts?", a: "Yes — Devanagari, Arabic, CJK, Thai, and 20+ other scripts are detected and rendered with matching Unicode fonts automatically." },
    ],
  },
  "pdf-to-word-2": {
    paragraphs: [
      `This is the PDF-to-Word converter accessible from the Word tools section — the same engine as the PDF tools' PDF to Word, surfaced here so the round-trip stays within the Word workflow. Upload a PDF, get a .docx; text and basic layout extract and rebuild as a real Word document.`,
      `mupdf.js handles the layout extraction and the docx library rebuilds the structure: paragraphs, headings where detectable, and tables where the geometry is clear. The "Quick" label reflects the entry point, not a capability reduction.`,
      `For complex PDFs with intricate multi-column layouts, the dedicated PDF to Word tool in the PDF section exposes the same pipeline with additional layout options.`,
    ],
    faq: [
      { q: "Is this different from the PDF section's PDF to Word?", a: "Same engine and output quality — this entry point lives in the Word tools section for workflow convenience." },
      { q: "How accurate is the conversion?", a: "Best effort — simple text-based PDFs convert well; complex layouts with multi-column text or heavy graphics may shift." },
    ],
  },

  // ── Cross-format & utility tools ───────────────────────────────
  "universal-converter": {
    paragraphs: [
      `The Universal Converter is the front door when you don't care about the machinery: drop any supported file — PDF, DOCX, TXT, HTML, Markdown, the image formats — pick an output (PDF or DOCX), and the tool routes your file through the right pipeline underneath. One interface, every direction.`,
      `It's honest about being an orchestrator: the conversion quality of any pair matches the dedicated tools it dispatches to (Word to PDF's Unicode font handling, PDF to Word's layout heuristics). The value is not thinking about which tool that is.`,
      `For one-off "this thing needs to be that thing" moments it's the whole toolbox; for batch work, the Batch Converter applies the same routing across many files at once.`,
    ],
    faq: [
      { q: "Which output formats are supported?", a: "PDF and DOCX — the two formats most workflows ultimately need. Format-pair-specific tools cover the rest." },
      { q: "How do I know which pipeline my file takes?", a: "You don't need to — the converter detects the input type and routes accordingly, using the same engines as the dedicated tools." },
    ],
  },
  "compress-word": {
    paragraphs: [
      `A .docx is a ZIP of XML and media, and it bloats for boring reasons: embedded images at full resolution, unused media from pasted content, template leftovers. This tool re-packs the container — stripping orphaned media, recompressing where safe — and hands back a smaller document that Word opens without blinking.`,
      `Typical savings land between 20% and 60% for image-heavy documents; text-only files shrink less because text was never the problem. Content is untouched: this is container surgery, not content rewriting.`,
      `Before the compress pass, check where the weight is with File Info Inspector — if one 8 MB screenshot is the culprit, resizing that image at the source beats any generic compression.`,
    ],
    faq: [
      { q: "Does compression lose content?", a: "No — unused/orphaned media and zip overhead are the targets. Visible document content is preserved." },
      { q: "Why is my text-only DOCX barely smaller?", a: "Text compresses efficiently already; the bloat lives in images and media, which text-only documents don't have." },
    ],
  },
  "file-info": {
    paragraphs: [
      `Before converting, archiving, or troubleshooting any file, look inside: type and true format (extensions lie), size, page counts, metadata, embedded fonts, image inventory. This inspector accepts any supported format and reports what a normal "properties" dialog never shows.`,
      `It dispatches to the right parser per format — pdf.js for PDFs, mammoth for DOCX, SheetJS for spreadsheets — and presents a uniform report, so comparing two files' guts doesn't require three tools.`,
      `It's the diagnostic you reach for when something's wrong: "why is this 40 MB?", "why won't it convert?", "what fonts does this use?" — the answers live here, locally, with nothing uploaded.`,
    ],
    faq: [
      { q: "Can it inspect unsupported formats?", a: "It handles the formats the site supports; unknown extensions get a best-effort binary-level report (size, header signatures)." },
      { q: "Does inspecting modify the file?", a: "No — strictly read-only analysis." },
    ],
  },
  "batch-rename-export": {
    paragraphs: [
      `Naming is the quiet infrastructure of any file workflow, and manual renaming of fifty files is where afternoons die. This tool applies pattern-based renames — prefixes, suffixes, sequential numbering, find-and-replace on names — and packages the results as a ZIP in one pass.`,
      `The pattern system covers the real cases: {name}_{date}.pdf for archive drops, INV-{seq:4}.pdf for invoice numbering, prefix additions for project codes. Live preview shows the mapping before anything executes, because a rename mistake at scale is worse than no renaming.`,
      `Since output is a ZIP, this is also the tidy exit from any multi-file tool on the site: convert first, rename-and-package second, download once.`,
    ],
    faq: [
      { q: "Can I renumber starting from a specific number?", a: "Yes — set the sequence start and padding width in the pattern." },
      { q: "Are the original files modified?", a: "No — renames happen in the output package; your source files remain untouched." },
    ],
  },
  "qr-to-pdf": {
    paragraphs: [
      `A QR code's job is to survive: on a printed flyer, on a sticker, on a handout that gets photocopied twice. That's why this tool composes QR codes onto PDF pages rather than exporting fragile images — a PDF prints at exact size, every time, on every printer.`,
      `Enter the URL or text, choose the code size and page layout (full-page for posters, corner-sized for documents), and download. Codes render at high error-correction so scuffed prints and partial occlusion still scan — the difference between a code that works at the venue and one that doesn't.`,
      `For digital-only QR needs (web pages, chat), the Image QR Generator outputs PNG; this tool is the print-and-field pipeline.`,
    ],
    faq: [
      { q: "What error correction should I use?", a: "Level Q or H for printed codes that may get worn or partially covered; M is fine for clean digital use." },
      { q: "Can I put multiple QR codes on one page?", a: "One code per run keeps placement precise; run again to add more to the same document via Insert PDF Pages-style flows." },
    ],
  },
  "side-by-side-diff": {
    paragraphs: [
      `Some differences are textual, some are visual — and the visual ones (a moved signature block, a swapped logo, a shifted layout) don't show up in text diffs. Side-by-Side Diff puts two documents' pages next to each other with synchronized scrolling, so your eyes do the comparison where algorithms fall short.`,
      `It accepts PDFs and Word documents, rendering each page as a clean visual pane. Text highlighting marks detected differences where extraction is possible; beyond that, the aligned layout is the tool — the human eye catches visual deltas with uncanny speed when pages are truly side by side.`,
      `For wording-level scrutiny, Compare PDF or Compare Word gives algorithmic text diffs; use both tools on important documents and let each catch what the other can't.`,
    ],
    faq: [
      { q: "Can it compare a PDF with a DOCX?", a: "Yes — both render to comparable pages; visual comparison works across the formats, text highlighting works where text layers exist." },
      { q: "How are different page counts handled?", a: "Panes scroll independently after the aligned section ends; shorter documents simply run out first." },
    ],
  },
  "bulk-images-to-doc": {
    paragraphs: [
      `Dozens of photos, one document — the recurring job behind photo reports, inspection records, property documentation, and evidence packets. This tool takes a bulk image selection (JPG, PNG, WebP, mixed) and builds a single PDF or Word document, images in order, one per page or fitted to your layout.`,
      `Output choice matters: PDF for fixed, printable, un-editable delivery; DOCX when the recipient will add captions, notes, or reorganize. Either way, ordering is drag-and-drop before the build, because the sequence is the content in these documents.`,
      `For large sets, the flow stays local end-to-end — no upload ceiling, no per-image fees — which is why field teams use it on cellular connections from job sites.`,
    ],
    faq: [
      { q: "PDF or DOCX output?", a: "PDF when the document is final and printable; DOCX when recipients will edit, caption, or extend it." },
      { q: "How many images can I process?", a: "Batches of hundreds work locally — the practical limit is your device's memory, not a service quota." },
    ],
  },
  "signature-manager": {
    paragraphs: [
      `Your signature is used repeatedly — contracts, approvals, forms — but recreating it in every tool wastes time and produces inconsistent results. The Signature Library saves your signatures (drawn, typed, or uploaded) locally in your browser's IndexedDB, then serves them to the Sign PDF and form tools in one click.`,
      `Local storage is the design point: a signature is a biometric artifact, and shipping it to a server "for convenience" is a privacy trade this site declines to make. Signatures sync nowhere; they live in the browser that created them.`,
      `Manage multiple variants — full signature, initials, stamp-style — and pick per document. Clearing the library wipes them everywhere, since there's no cloud copy to clean up.`,
    ],
    faq: [
      { q: "Are my signatures stored on a server?", a: "No — IndexedDB in your browser only. They never leave your device and don't sync." },
      { q: "What happens if I clear my browser data?", a: "Saved signatures are removed — re-create them in a minute. That's the trade-off of local-only storage." },
    ],
  },
  "recent-tools": {
    paragraphs: [
      `This page mirrors your recently used tools — the six or so you actually use, one click away, instead of a search through 200 every time. It's populated by your own browsing (locally, in localStorage) and appears in the site's navigation once you've used anything.`,
      `There's no server, no account, no history worth mentioning: the list is yours, on your device, and clearing browser data clears it. The value is pure ergonomics — recurring workflows (weekly merge, daily compress) stop requiring navigation.`,
      `If your list is empty, use any tool once and come back; the shortcut builds itself.`,
    ],
    faq: [
      { q: "Is my usage history uploaded anywhere?", a: "No — it's localStorage on your device, used only to render your own shortcut list." },
      { q: "Can I clear it?", a: "Yes — the clear button on the home page wipes the local history instantly." },
    ],
  },
  "command-palette": {
    paragraphs: [
      `Two hundred tools are one keystroke away: Ctrl+K (Cmd+K on Mac) opens the command palette, typing filters across every tool by name and description, and Enter opens the selection. It's the keyboard-native way to drive the site — no menus, no scrolling, no mouse required.`,
      `Fuzzy matching forgives typos ("mrg pdf" finds Merge PDF), and recent selections float to the top so your muscle memory compounds. Power users live here; everyone else discovers it the week they get tired of scrolling.`,
      `The palette is also the fastest tool discovery mechanism on the site: typing a verb ("convert", "compress", "sign") surfaces every tool that does it, faster than reading category pages.`,
    ],
    faq: [
      { q: "What's the shortcut?", a: "Ctrl+K on Windows/Linux, Cmd+K on Mac — the same convention as modern editors and terminals." },
      { q: "Does it search tool content too?", a: "It matches tool names and descriptions; for full-text search across guides, use the home page search." },
    ],
  },
};

export default WORD_GUIDES;
