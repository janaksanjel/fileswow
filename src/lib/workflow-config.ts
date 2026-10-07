// lib/workflow-config.ts
// Configuration-driven operations, descriptions, and metadata for the 3-step workflow across
// PDF, Word, Image, and Text tool categories.

export type WorkflowCategory = "pdf" | "word" | "image" | "text";

export interface WorkflowOperation {
  id: string;
  name: string;
  shortDesc: string;
  description: string;
  icon: string;
  badge?: string;
  slug: string;
  outputExt: string;
  supportsMultipleFiles?: boolean;
}

export interface WorkflowCategoryConfig {
  category: WorkflowCategory;
  title: string;
  badge: string;
  seoTitle: string;
  seoDescription: string;
  subtitle: string;
  acceptedExtensions: string[];
  acceptedMimeTypes: string[];
  maxFileSizeMB: number;
  allowTextInput?: boolean;
  operations: WorkflowOperation[];
  howItWorks: {
    step: string;
    title: string;
    description: string;
    icon: string;
  }[];
  faqs: {
    q: string;
    a: string;
  }[];
}

export const WORKFLOW_CONFIGS: Record<WorkflowCategory, WorkflowCategoryConfig> = {
  pdf: {
    category: "pdf",
    title: "PDF Tools",
    badge: "PDF Suite",
    seoTitle: "Free PDF Tools Online – Merge, Split, Compress & Convert PDFs",
    seoDescription:
      "Merge, split, compress, convert, rotate, and organize PDF documents directly in your browser. 100% private, free, and processed locally.",
    subtitle:
      "All-in-one browser PDF studio. Merge, split, compress, and convert documents locally with zero file size traps.",
    acceptedExtensions: [".pdf"],
    acceptedMimeTypes: ["application/pdf"],
    maxFileSizeMB: 100,
    operations: [
      {
        id: "merge-pdf",
        name: "Merge PDF",
        shortDesc: "Combine multiple PDF files into one.",
        description: "Join two or more PDF files into a single organized document in your chosen order.",
        icon: "merge-pdf",
        badge: "Popular",
        slug: "merge-pdf",
        outputExt: ".pdf",
        supportsMultipleFiles: true,
      },
      {
        id: "split-pdf",
        name: "Split PDF",
        shortDesc: "Separate pages into individual files.",
        description: "Extract specific pages or break a PDF into independent documents.",
        icon: "split-pdf",
        badge: "Fast",
        slug: "split-pdf",
        outputExt: ".pdf",
      },
      {
        id: "compress-pdf",
        name: "Compress PDF",
        shortDesc: "Reduce PDF file size.",
        description: "Shrink document size for easy emailing and web sharing while keeping text sharp.",
        icon: "compress-pdf",
        badge: "High Ratio",
        slug: "compress-pdf",
        outputExt: ".pdf",
      },
      {
        id: "pdf-to-word",
        name: "PDF to Word",
        shortDesc: "Convert PDF into editable Word files.",
        description: "Extract formatted content and convert PDF documents into editable .docx files.",
        icon: "pdf-to-word",
        badge: "Editable",
        slug: "pdf-to-word",
        outputExt: ".docx",
      },
      {
        id: "pdf-to-jpg",
        name: "PDF to JPG",
        shortDesc: "Convert PDF pages into images.",
        description: "Turn every page of your PDF into high-resolution JPG images.",
        icon: "pdf-to-jpg",
        slug: "pdf-to-jpg",
        outputExt: ".jpg",
      },
      {
        id: "jpg-to-pdf",
        name: "JPG to PDF",
        shortDesc: "Create a PDF from images.",
        description: "Transform JPG, PNG, and WebP images into a clean, paginated PDF document.",
        icon: "jpg-to-pdf",
        slug: "jpg-to-pdf",
        outputExt: ".pdf",
        supportsMultipleFiles: true,
      },
      {
        id: "rotate-pdf",
        name: "Rotate PDF",
        shortDesc: "Rotate pages 90°, 180°, or 270°.",
        description: "Fix orientation of individual pages or the entire PDF document permanently.",
        icon: "rotate-pdf",
        slug: "rotate-pdf",
        outputExt: ".pdf",
      },
      {
        id: "organize-pdf",
        name: "Organize PDF",
        shortDesc: "Reorder, duplicate, or delete pages.",
        description: "Arrange pages visually, delete unwanted sheets, and assemble the perfect PDF.",
        icon: "organize-pdf",
        slug: "organize-pdf",
        outputExt: ".pdf",
      },
      {
        id: "protect-pdf",
        name: "Protect PDF",
        shortDesc: "Encrypt PDF with a password.",
        description: "Add standard password encryption to prevent unauthorized reading and printing.",
        icon: "protect-pdf",
        badge: "Security",
        slug: "protect-pdf",
        outputExt: ".pdf",
      },
      {
        id: "unlock-pdf",
        name: "Unlock PDF",
        shortDesc: "Remove PDF security passwords.",
        description: "Remove passwords from unlocked PDFs for frictionless viewing and printing.",
        icon: "unlock-pdf",
        slug: "unlock-pdf",
        outputExt: ".pdf",
      },
      {
        id: "watermark-pdf",
        name: "Watermark PDF",
        shortDesc: "Stamp text or logo watermarks.",
        description: "Apply custom confidential or copyright watermarks across all pages.",
        icon: "watermark-pdf",
        slug: "watermark-pdf",
        outputExt: ".pdf",
      },
      {
        id: "extract-pdf-pages",
        name: "Extract Pages",
        shortDesc: "Save selected pages as a new PDF.",
        description: "Select individual pages or ranges and export them into a separate document.",
        icon: "extract-pdf-pages",
        slug: "extract-pdf-pages",
        outputExt: ".pdf",
      },
    ],
    howItWorks: [
      {
        step: "01",
        title: "Add your PDF file",
        description: "Drag & drop your document into the secure upload area or browse from your device.",
        icon: "upload",
      },
      {
        step: "02",
        title: "Choose your operation",
        description: "Select what you need: merge, split, compress, convert, rotate, or protect.",
        icon: "sliders",
      },
      {
        step: "03",
        title: "Process & download",
        description: "Your document is transformed locally in your browser. Download the finished file instantly.",
        icon: "download",
      },
    ],
    faqs: [
      {
        q: "Are my PDF files uploaded to an external server?",
        a: "No. All PDF processing happens locally in your web browser using client-side JavaScript and WebAssembly. Your files stay on your device.",
      },
      {
        q: "Is there a limit on how many PDF files I can merge?",
        a: "You can merge dozens of files at once. Because processing runs in memory on your computer or phone, we recommend files under 100MB each for optimal speed.",
      },
      {
        q: "Will compression reduce the visual quality of my PDF?",
        a: "Our smart compression optimizes duplicate streams, redundant font subsets, and high-res image assets to achieve the best ratio without making text blurry.",
      },
      {
        q: "Do I need to install Adobe Acrobat or create an account?",
        a: "No account, no sign-up, and no software installation required. Everything works directly in Chrome, Safari, Edge, or Firefox.",
      },
      {
        q: "Can I convert scanned PDFs to Word or images?",
        a: "Yes. You can convert PDF pages directly into high-res JPG images or editable DOCX formats.",
      },
    ],
  },

  word: {
    category: "word",
    title: "Word Tools",
    badge: "Word & DOCX Suite",
    seoTitle: "Free Word Tools Online – Convert, Compress & Edit Documents",
    seoDescription:
      "Convert Word DOCX to PDF, compress documents, extract text, merge files, and inspect formatting directly in your browser. 100% private.",
    subtitle:
      "Streamlined Word document utilities. Convert, extract, and manipulate DOCX files without needing Microsoft Office.",
    acceptedExtensions: [".docx", ".doc"],
    acceptedMimeTypes: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ],
    maxFileSizeMB: 80,
    operations: [
      {
        id: "word-to-pdf",
        name: "Word to PDF",
        shortDesc: "Convert Word documents into clean PDFs.",
        description: "Convert .docx files into standard, universally shareable PDF documents.",
        icon: "word-to-pdf",
        badge: "Popular",
        slug: "word-to-pdf",
        outputExt: ".pdf",
      },
      {
        id: "compress-word",
        name: "Compress Word",
        shortDesc: "Reduce DOCX document file size.",
        description: "Optimize embedded images and cleanup XML bloat to make documents email-friendly.",
        icon: "compress-docx",
        badge: "Compact",
        slug: "compress-docx",
        outputExt: ".docx",
      },
      {
        id: "merge-word",
        name: "Merge Documents",
        shortDesc: "Combine multiple Word documents.",
        description: "Merge multiple .docx documents into one continuous file while preserving styles.",
        icon: "merge-docx",
        slug: "merge-docx",
        outputExt: ".docx",
        supportsMultipleFiles: true,
      },
      {
        id: "split-word",
        name: "Split Document",
        shortDesc: "Divide DOCX into sections.",
        description: "Break long Word documents by page breaks or section headings.",
        icon: "split-docx",
        slug: "split-docx",
        outputExt: ".docx",
      },
      {
        id: "extract-text-word",
        name: "Extract Text",
        shortDesc: "Pull out all raw text & headings.",
        description: "Extract text from Word files cleanly without formatting clutter.",
        icon: "docx-to-text",
        slug: "docx-to-text",
        outputExt: ".txt",
      },
      {
        id: "word-to-html",
        name: "Convert to HTML",
        shortDesc: "Turn Word documents into web HTML.",
        description: "Generate clean, modern semantic HTML from your Word document.",
        icon: "docx-to-html",
        slug: "docx-to-html",
        outputExt: ".html",
      },
      {
        id: "word-to-markdown",
        name: "Convert to Markdown",
        shortDesc: "Export clean Markdown (.md).",
        description: "Convert Word paragraphs, lists, and tables into GitHub-flavored markdown.",
        icon: "docx-to-markdown",
        slug: "docx-to-markdown",
        outputExt: ".md",
      },
      {
        id: "word-preview",
        name: "Document Preview",
        shortDesc: "Inspect word count, text, & metadata.",
        description: "Analyze word count, paragraph structure, and metadata instantly in your browser.",
        icon: "docx-info-viewer",
        slug: "docx-info-viewer",
        outputExt: ".txt",
      },
    ],
    howItWorks: [
      {
        step: "01",
        title: "Select your Word document",
        description: "Drop your .docx or .doc file into the upload dropzone.",
        icon: "upload",
      },
      {
        step: "02",
        title: "Pick your Word operation",
        description: "Choose Word to PDF, text extraction, HTML conversion, or compression.",
        icon: "sliders",
      },
      {
        step: "03",
        title: "Download your result",
        description: "Your document is processed locally using browser-based parsers. Download with 1 click.",
        icon: "download",
      },
    ],
    faqs: [
      {
        q: "Do I need Microsoft Word installed on my computer?",
        a: "No. FilesWow processes Word documents using open standards and WebAssembly parsers. You don't need Microsoft 365, Word, or LibreOffice.",
      },
      {
        q: "Can I convert Word files back into PDFs?",
        a: "Yes. The Word to PDF tool compiles your text, tables, and images into a crisp, printable PDF document.",
      },
      {
        q: "Are my confidential Word reports safe?",
        a: "Yes. All conversions happen entirely on your own device. Nothing is uploaded to remote servers or cloud databases.",
      },
      {
        q: "Does it support older .doc formats?",
        a: "Yes, both modern .docx (XML-based) and legacy .doc binary formats are supported.",
      },
    ],
  },

  image: {
    category: "image",
    title: "Image Tools",
    badge: "Image Studio",
    seoTitle: "Free Image Tools Online – Compress, Resize & Convert Images",
    seoDescription:
      "Compress, resize, convert, crop, and edit images directly in your browser. Supports JPG, PNG, WebP, SVG, and GIF. 100% private.",
    subtitle:
      "Fast, private image editing suite. Compress, convert, crop, and polish photos without uploading to external servers.",
    acceptedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif"],
    acceptedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/svg+xml",
      "image/gif",
    ],
    maxFileSizeMB: 60,
    operations: [
      {
        id: "compress-image",
        name: "Compress Image",
        shortDesc: "Shrink image file size.",
        description: "Reduce file weight by up to 80% while preserving crisp pixel fidelity.",
        icon: "compress-image",
        badge: "Top Pick",
        slug: "compress-image",
        outputExt: ".webp",
      },
      {
        id: "resize-image",
        name: "Resize Image",
        shortDesc: "Scale dimensions by px or %.",
        description: "Adjust pixel dimensions with bilinear smoothing for web or print.",
        icon: "resize-image",
        slug: "resize-image",
        outputExt: ".jpg",
      },
      {
        id: "jpg-to-png",
        name: "JPG to PNG",
        shortDesc: "Convert JPG to lossless PNG.",
        description: "Transform lossy JPEG photos into high-quality PNG with transparent alpha support.",
        icon: "jpg-to-png",
        slug: "jpg-to-png",
        outputExt: ".png",
      },
      {
        id: "png-to-jpg",
        name: "PNG to JPG",
        shortDesc: "Convert PNG to lightweight JPG.",
        description: "Convert transparent or heavy PNG graphics into compact, shareable JPG files.",
        icon: "png-to-jpg",
        slug: "png-to-jpg",
        outputExt: ".jpg",
      },
      {
        id: "webp-converter",
        name: "WebP Converter",
        shortDesc: "Modernize to next-gen WebP.",
        description: "Convert JPG and PNG images into modern WebP for 30% faster web page loading.",
        icon: "convert-image",
        badge: "Next-Gen",
        slug: "convert-image",
        outputExt: ".webp",
      },
      {
        id: "crop-image",
        name: "Crop Image",
        shortDesc: "Trim edges to custom ratios.",
        description: "Crop photos for square avatars, 16:9 banners, or custom dimensions.",
        icon: "crop-image",
        slug: "crop-image",
        outputExt: ".jpg",
      },
      {
        id: "rotate-image",
        name: "Rotate & Flip",
        shortDesc: "Rotate 90°/180° or mirror.",
        description: "Quickly rotate photos clockwise/counterclockwise or flip horizontally.",
        icon: "rotate-image",
        slug: "rotate-image",
        outputExt: ".jpg",
      },
      {
        id: "image-grayscale",
        name: "Grayscale & B/W",
        shortDesc: "Convert to black and white.",
        description: "Transform vibrant colors into balanced monochrome tones instantly.",
        icon: "image-filter-grayscale",
        slug: "image-filter-grayscale",
        outputExt: ".jpg",
      },
      {
        id: "remove-background",
        name: "Remove Background",
        shortDesc: "AI background eraser.",
        description: "Isolate subjects and export transparent PNGs right on your device.",
        icon: "remove-background",
        badge: "AI Powered",
        slug: "remove-background",
        outputExt: ".png",
      },
      {
        id: "images-to-pdf",
        name: "Images to PDF",
        shortDesc: "Combine photos into a PDF.",
        description: "Turn photo albums, receipts, or scans into a clean multipage PDF.",
        icon: "images-to-pdf",
        slug: "images-to-pdf",
        outputExt: ".pdf",
        supportsMultipleFiles: true,
      },
    ],
    howItWorks: [
      {
        step: "01",
        title: "Upload your photo or graphic",
        description: "Select any JPG, PNG, WebP, GIF, or SVG image from your computer or phone.",
        icon: "upload",
      },
      {
        step: "02",
        title: "Choose your image tool",
        description: "Select compression, resizing, format conversion, cropping, or monochrome filter.",
        icon: "sliders",
      },
      {
        step: "03",
        title: "Instant browser export",
        description: "Rendered directly on your GPU/Canvas. Download your optimized image immediately.",
        icon: "download",
      },
    ],
    faqs: [
      {
        q: "What image formats are supported?",
        a: "FilesWow supports JPG, JPEG, PNG, WebP, SVG, and GIF formats. You can convert between all of them seamlessly.",
      },
      {
        q: "How does browser-based image compression work?",
        a: "We use the browser's native HTML5 Canvas and WebGL APIs to resample and re-encode image pixels with optimal quantization matrices, without server lag.",
      },
      {
        q: "Are my private personal photos uploaded anywhere?",
        a: "Never. Your photos never leave your browser tab. All processing is 100% client-side, making it ideal for private photos, IDs, and sensitive receipts.",
      },
      {
        q: "Can I resize images for Instagram or LinkedIn?",
        a: "Yes. You can crop and scale images to exact dimensions like 1080x1080 (square), 1200x630 (social card), or custom pixel bounds.",
      },
    ],
  },

  text: {
    category: "text",
    title: "Text Tools",
    badge: "Text & Data Suite",
    seoTitle: "Free Text Tools Online – Format, Clean & Transform Text",
    seoDescription:
      "Format, clean, count, encode, and transform text online. Word counter, case converter, duplicate remover, JSON formatter, and Base64 encoder.",
    subtitle:
      "Lightweight, real-time text and data utilities. Format, deduplicate, encode, and count text instantly with zero lag.",
    acceptedExtensions: [".txt", ".json", ".csv", ".md", ".log"],
    acceptedMimeTypes: ["text/plain", "application/json", "text/csv", "text/markdown"],
    maxFileSizeMB: 25,
    allowTextInput: true,
    operations: [
      {
        id: "word-counter",
        name: "Word & Character Counter",
        shortDesc: "Count words, characters, & read time.",
        description: "Analyze word count, character count (with/without spaces), reading time, and speaking time.",
        icon: "word-counter",
        badge: "Essential",
        slug: "word-counter",
        outputExt: ".txt",
      },
      {
        id: "case-converter",
        name: "Case Converter",
        shortDesc: "UPPER, lower, Title, camelCase.",
        description: "Transform text casing instantly across Uppercase, Lowercase, Title Case, Sentence case, and slug format.",
        icon: "case-converter",
        badge: "Popular",
        slug: "case-converter",
        outputExt: ".txt",
      },
      {
        id: "remove-duplicate-lines",
        name: "Remove Duplicate Lines",
        shortDesc: "Deduplicate lists & data.",
        description: "Strip out repeated lines from lists, log files, or CSV exports while keeping unique entries.",
        icon: "remove-duplicate-lines",
        slug: "remove-duplicate-lines",
        outputExt: ".txt",
      },
      {
        id: "text-cleaner",
        name: "Text Cleaner",
        shortDesc: "Strip extra spaces & breaks.",
        description: "Clean up messy copied text: remove extra blank lines, trailing tabs, and normalize spaces.",
        icon: "text-cleaner",
        slug: "text-cleaner",
        outputExt: ".txt",
      },
      {
        id: "json-formatter",
        name: "JSON Formatter & Validator",
        shortDesc: "Prettify or minify raw JSON.",
        description: "Indent messy JSON payloads with 2-space formatting, validate syntax, or minify to 1 line.",
        icon: "json-formatter",
        badge: "Dev Tool",
        slug: "json-formatter",
        outputExt: ".json",
      },
      {
        id: "base64-encode",
        name: "Base64 Encoder",
        shortDesc: "Encode text to Base64 format.",
        description: "Convert UTF-8 text strings into safe Base64 encoded format for web and API usage.",
        icon: "base64-encode",
        slug: "base64-encode",
        outputExt: ".txt",
      },
      {
        id: "base64-decode",
        name: "Base64 Decoder",
        shortDesc: "Decode Base64 back to text.",
        description: "Translate Base64 strings back into readable plain text with automatic error checking.",
        icon: "base64-decode",
        slug: "base64-decode",
        outputExt: ".txt",
      },
      {
        id: "text-sorter",
        name: "Text Sorter",
        shortDesc: "Sort lines A-Z, Z-A, or by length.",
        description: "Sort lines alphabetically, in reverse, numerically, or ordered by string length.",
        icon: "text-sorter",
        slug: "text-sorter",
        outputExt: ".txt",
      },
      {
        id: "p2p-transfer",
        name: "P2P Text Transfer",
        shortDesc: "Direct device-to-device text send.",
        description: "Send text, links, or code snippets directly between phone and PC via encrypted WebRTC.",
        icon: "p2p-text-transfer",
        badge: "Private P2P",
        slug: "p2p-text-transfer",
        outputExt: ".txt",
      },
    ],
    howItWorks: [
      {
        step: "01",
        title: "Type, paste, or upload text",
        description: "Enter your text directly in the box or drop a .txt, .json, or .csv document.",
        icon: "upload",
      },
      {
        step: "02",
        title: "Select your transformation",
        description: "Choose Word Counter, Case Converter, JSON Formatter, Line Sorter, or Base64.",
        icon: "sliders",
      },
      {
        step: "03",
        title: "Copy or download result",
        description: "Get immediate results. Copy to clipboard with 1 click or download as a text file.",
        icon: "download",
      },
    ],
    faqs: [
      {
        q: "Can I paste text directly instead of uploading a file?",
        a: "Yes! Text tools support both direct typing/pasting into the live textarea and uploading text files (.txt, .json, .csv, .md).",
      },
      {
        q: "Is there a character limit on the text tools?",
        a: "Because all algorithms execute locally in your browser memory, you can easily process hundreds of thousands of words without lag or paywalls.",
      },
      {
        q: "Does the JSON Formatter validate syntax errors?",
        a: "Yes. It will highlight invalid syntax, unclosed brackets, and missing quotes with clear human-readable error messages.",
      },
      {
        q: "How does P2P Text Transfer work?",
        a: "It establishes a direct WebRTC peer-to-peer data channel between your two devices. The text never touches a web server or database.",
      },
    ],
  },
};

