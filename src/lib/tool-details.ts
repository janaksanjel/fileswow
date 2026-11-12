import type { ToolDef } from "./catalog";

export interface ToolOperationalDetails {
  inputFormats: string[];
  outputFormats: string[];
  useCases: string[];
  limitations: string[];
  privacySummary: string;
}

const SPECIFIC_FORMATS: Record<string, { input: string[]; output: string[] }> = {
  "jpg-to-pdf": { input: ["JPG", "JPEG"], output: ["PDF"] },
  "png-to-pdf": { input: ["PNG"], output: ["PDF"] },
  "images-to-pdf": { input: ["JPG", "JPEG", "PNG", "WebP"], output: ["PDF"] },
  "pdf-to-jpg": { input: ["PDF"], output: ["JPG", "ZIP (multi-page)"] },
  "pdf-to-png": { input: ["PDF"], output: ["PNG", "ZIP (multi-page)"] },
  "pdf-to-tiff": { input: ["PDF"], output: ["TIFF", "ZIP"] },
  "pdf-to-svg": { input: ["PDF"], output: ["SVG", "ZIP"] },
  "pdf-to-word": { input: ["PDF"], output: ["DOCX"] },
  "pdf-to-word-2": { input: ["PDF"], output: ["DOCX"] },
  "pdf-to-excel": { input: ["PDF"], output: ["XLSX"] },
  "pdf-to-powerpoint": { input: ["PDF"], output: ["PPTX"] },
  "pdf-to-text": { input: ["PDF"], output: ["TXT"] },
  "pdf-to-html": { input: ["PDF"], output: ["HTML"] },
  "pdf-to-markdown": { input: ["PDF"], output: ["MD (Markdown)"] },
  "pdf-to-csv": { input: ["PDF"], output: ["CSV"] },
  "pdf-to-json": { input: ["PDF"], output: ["JSON"] },
  "pdf-to-epub": { input: ["PDF"], output: ["EPUB"] },
  "pdf-to-rtf": { input: ["PDF"], output: ["RTF"] },
  "word-to-pdf": { input: ["DOCX", "DOC"], output: ["PDF"] },
  "word-to-pdf-2": { input: ["DOCX", "DOC"], output: ["PDF"] },
  "excel-to-pdf": { input: ["XLSX", "XLS", "CSV"], output: ["PDF"] },
  "powerpoint-to-pdf": { input: ["PPTX", "PPT"], output: ["PDF"] },
  "html-to-pdf": { input: ["HTML", "HTM"], output: ["PDF"] },
  "markdown-to-pdf": { input: ["MD", "TXT"], output: ["PDF"] },
  "text-to-pdf": { input: ["TXT", "Plain Text"], output: ["PDF"] },
  "epub-to-pdf": { input: ["EPUB"], output: ["PDF"] },
  "pdf-create-from-url": { input: ["Public HTTPS URL"], output: ["PDF"] },
  "extract-images-from-pdf": { input: ["PDF"], output: ["PNG", "JPG", "ZIP"] },
  "word-to-text": { input: ["DOCX"], output: ["TXT"] },
  "word-to-html": { input: ["DOCX"], output: ["HTML"] },
  "word-to-markdown": { input: ["DOCX"], output: ["MD"] },
  "word-to-images": { input: ["DOCX"], output: ["PNG", "JPG", "ZIP"] },
  "word-to-epub": { input: ["DOCX"], output: ["EPUB"] },
  "word-to-odt": { input: ["DOCX"], output: ["ODT"] },
  "word-to-powerpoint": { input: ["DOCX"], output: ["PPTX"] },
  "word-tables-to-excel": { input: ["DOCX"], output: ["XLSX"] },
  "text-to-word": { input: ["TXT"], output: ["DOCX"] },
  "p2p-text": { input: ["Plain Text", "Browser Clipboard"], output: ["Direct Peer-to-Peer Text"] },
};

function inferImageFormats(slug: string): { input: string[]; output: string[] } {
  const formats = ["jpg", "png", "webp", "svg", "gif", "bmp", "tiff", "avif", "ico"];
  const toMatch = slug.match(/^([a-z0-9]+)-to-([a-z0-9-]+)$/);
  if (toMatch) {
    const src = toMatch[1].toUpperCase();
    const dst = toMatch[2].toUpperCase();
    if (formats.includes(toMatch[1]) || toMatch[1] === "base64") {
      return {
        input: [src === "BASE64" ? "Base64 String" : src],
        output: [dst === "BASE64" ? "Base64 String" : dst],
      };
    }
  }
  if (slug.includes("background-remove")) {
    return { input: ["JPG", "PNG", "WebP"], output: ["PNG (transparent)"] };
  }
  return {
    input: ["JPG", "PNG", "WebP"],
    output: ["PNG", "JPG", "WebP"],
  };
}

function getFormats(tool: ToolDef): { input: string[]; output: string[] } {
  if (SPECIFIC_FORMATS[tool.slug]) {
    return SPECIFIC_FORMATS[tool.slug];
  }
  if (tool.category === "pdf") {
    return { input: ["PDF"], output: ["PDF"] };
  }
  if (tool.category === "word") {
    return { input: ["DOCX"], output: ["DOCX"] };
  }
  if (tool.category === "image") {
    return inferImageFormats(tool.slug);
  }
  if (tool.category === "text") {
    return { input: ["Plain Text", "UTF-8"], output: ["Plain Text"] };
  }
  return { input: ["PDF", "DOCX", "Images"], output: ["PDF", "DOCX", "Images"] };
}

function getUseCases(tool: ToolDef): string[] {
  const cases: string[] = [];
  if (tool.category === "pdf") {
    if (tool.subCategory === "organize") {
      cases.push(
        "Preparing multi-part reports, invoices, or application packets for email or portal submission.",
        "Removing cover sheets, blank pages, or outdated sections before sharing a document."
      );
    } else if (tool.subCategory === "convert") {
      cases.push(
        "Turning documents into a format suitable for editing, archiving, or web publishing.",
        "Sharing files with recipients who need a specific format without installing desktop software."
      );
    } else if (tool.subCategory === "security" || tool.subCategory === "sign") {
      cases.push(
        "Adding signatures, watermarks, or access controls to contracts and internal drafts.",
        "Reviewing or cleaning document metadata before sending files outside your organization."
      );
    } else {
      cases.push(
        "Quickly adjusting PDF pages, layout, or file size directly in the browser.",
        "Handling everyday document tasks on devices where desktop PDF editors are not installed."
      );
    }
  } else if (tool.category === "word") {
    cases.push(
      "Preparing DOCX reports, letters, and templates for distribution or archival.",
      "Cleaning up formatting, inspecting document properties, or converting Word files in the browser."
    );
  } else if (tool.category === "image") {
    cases.push(
      "Optimizing photos and graphics for websites, emails, social posts, and document uploads.",
      "Adjusting dimensions, aspect ratios, colors, or file formats without opening a desktop editor."
    );
  } else {
    cases.push(
      "Sharing short text snippets or links quickly between two devices on any network.",
      "Transferring notes without signing into cloud messaging apps."
    );
  }
  return cases;
}

function getLimitations(tool: ToolDef): string[] {
  const limits: string[] = [
    "Processing runs in your browser, so speed and maximum file size depend on your device's available RAM and CPU.",
  ];

  if (tool.category === "pdf") {
    limits.push(
      "Password-protected or encrypted PDFs must be unlocked before they can be modified (except in Unlock PDF)."
    );
    if (tool.slug === "ocr-pdf") {
      limits.push(
        "This browser tool creates a basic searchable PDF wrapper rather than running full multi-language optical character recognition on complex scans."
      );
    }
    if (tool.slug === "pdf-create-from-url") {
      limits.push(
        "Many websites block cross-origin browser requests (CORS), which can prevent external pages from loading in this client-side tool."
      );
    }
  }

  if (tool.tier === 3 || tool.category === "word") {
    limits.push(
      "Client-side format conversion is best-effort: complex tables, custom fonts, floating text boxes, or tracked changes may shift compared to desktop office suites."
    );
  }

  if (tool.category === "image") {
    limits.push(
      "Very high-resolution images (such as large RAW exports or 50+ megapixel photos) may take longer or hit browser canvas dimension limits."
    );
  }

  if (tool.slug === "p2p-text") {
    limits.push(
      "Both sender and receiver tabs must remain open during pairing and transfer; closing the page ends the session."
    );
  }

  return limits;
}

function getPrivacySummary(tool: ToolDef): string {
  if (tool.slug === "p2p-text") {
    return "Uses the public PeerJS signaling broker (0.peerjs.com) solely to exchange the initial WebRTC connection handshake. Once paired, messages travel directly between your browsers over an encrypted WebRTC DataChannel and are not stored on FilesWow servers.";
  }
  if (tool.slug === "background-remove-image") {
    return "Your image is processed locally in your browser. On first use, the tool downloads its client-side machine-learning model assets into your browser cache; your photo itself is not uploaded to a FilesWow storage server.";
  }
  if (tool.slug === "pdf-create-from-url") {
    return "Your browser directly requests the public URL you provide and renders the PDF locally. No files are stored on FilesWow servers, though the target website will receive your browser's request.";
  }
  return "Your files are read and processed locally in your web browser using JavaScript and WebAssembly. FilesWow does not upload, store, or retain copies of your documents on a server.";
}

export function getToolOperationalDetails(tool: ToolDef): ToolOperationalDetails {
  const { input, output } = getFormats(tool);
  return {
    inputFormats: input,
    outputFormats: output,
    useCases: getUseCases(tool),
    limitations: getLimitations(tool),
    privacySummary: getPrivacySummary(tool),
  };
}
