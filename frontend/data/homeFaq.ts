export type FaqSegment =
  | { type: "text"; text: string }
  | { type: "link"; text: string; href: string };

export interface HomeFaqItem {
  id: string;
  question: string;
  answer: FaqSegment[];
}

export const HOME_FAQS: HomeFaqItem[] = [
  {
    id: "what-is-zipdrop",
    question: "What is ZipDrop, and what can I do with it?",
    answer: [
      { type: "text", text: "ZipDrop is a free browser-based " },
      { type: "link", text: "online file converter", href: "/conversion" },
      {
        type: "text",
        text: " and file-sharing tool at www.getzipdrop.com. Use it to transfer files from phone to laptop with a 4-digit code, convert PDFs and office documents, compress files, remove image backgrounds and edit documents — without an app or sign-up.",
      },
    ],
  },
  {
    id: "account-or-app",
    question: "Do I need an account or app to use these free online file tools?",
    answer: [
      {
        type: "text",
        text: "No. ZipDrop requires no account, login or app installation. Open the site in a modern browser on a supported phone, tablet or computer, and the available ",
      },
      { type: "link", text: "free online file tools", href: "/#share-receive" },
      { type: "text", text: " work directly from the page." },
    ],
  },
  {
    id: "transfer-phone-to-laptop",
    question: "How do I transfer files from phone to laptop without login?",
    answer: [
      {
        type: "text",
        text: "Open ZipDrop on the sending device, add up to 10 files or text, and share the 4-digit code. On the receiving device, open ZipDrop and enter that code to download. The devices do not need to be on the same Wi-Fi network, and ZipDrop handles the transfer through its servers rather than directly between devices.",
      },
    ],
  },
  {
    id: "files-per-transfer",
    question: "How many files can I share in one ZipDrop transfer?",
    answer: [
      {
        type: "text",
        text: "Each ZipDrop transfer accepts up to 10 files in a single upload. If you need to send several large documents, use ",
      },
      { type: "link", text: "online file compression", href: "/compression" },
      { type: "text", text: " first to reduce their size." },
    ],
  },
  {
    id: "is-zipdrop-free",
    question: "Is ZipDrop really free?",
    answer: [
      {
        type: "text",
        text: "Yes. The available tools are free to use and do not require payment or an account. You can convert, compress, merge, split and share files without signing up.",
      },
    ],
  },
  {
    id: "available-tools",
    question: "What free online file tools does ZipDrop include?",
    answer: [
      {
        type: "text",
        text: "ZipDrop includes online file conversion, PDF merge, split and organize tools, PDF and image compression, background removal and a document editor. Start with ",
      },
      { type: "link", text: "file sharing", href: "/#share-receive" },
      { type: "text", text: ", browse " },
      { type: "link", text: "all conversion tools", href: "/conversion" },
      { type: "text", text: " or open the " },
      { type: "link", text: "document editor", href: "/editor" },
      { type: "text", text: "." },
    ],
  },
  {
    id: "pdf-to-word",
    question: "How do I convert PDF to Word online?",
    answer: [
      { type: "text", text: "Open the " },
      { type: "link", text: "PDF to Word converter", href: "/conversion/pdf-to-word" },
      {
        type: "text",
        text: ", upload a PDF, choose Editable or Visual Fidelity mode, then download the DOCX. Editable mode reconstructs text and tables for editing; Visual Fidelity mode keeps the page appearance closer to the original.",
      },
    ],
  },
  {
    id: "word-to-pdf",
    question: "How do I convert Word to PDF?",
    answer: [
      { type: "text", text: "Open the " },
      { type: "link", text: "Word to PDF converter", href: "/conversion/word-to-pdf" },
      {
        type: "text",
        text: ", upload a DOC or DOCX file, convert it, and download the PDF. It is a simple way to prepare a Word document for sharing and viewing in a browser.",
      },
    ],
  },
  {
    id: "pdf-to-images",
    question: "Can I convert PDF pages to JPG or PNG images?",
    answer: [
      { type: "text", text: "Yes. Use " },
      { type: "link", text: "PDF to JPG", href: "/conversion/pdf-to-jpg" },
      { type: "text", text: " or " },
      { type: "link", text: "PDF to PNG", href: "/conversion/pdf-to-png" },
      {
        type: "text",
        text: " to turn PDF pages into images. The PDF to JPG tool includes page, DPI, quality and grayscale options, so you can balance image quality and file size before downloading.",
      },
    ],
  },
  {
    id: "online-pdf-tools",
    question: "Which online PDF tools does ZipDrop offer?",
    answer: [
      {
        type: "text",
        text: "ZipDrop's online PDF tools include ",
      },
      { type: "link", text: "merge PDFs", href: "/pdf/merge" },
      { type: "text", text: ", " },
      { type: "link", text: "split PDFs", href: "/pdf/split" },
      { type: "text", text: ", " },
      { type: "link", text: "organize PDF pages", href: "/pdf/organize" },
      { type: "text", text: ", " },
      { type: "link", text: "compress PDF files", href: "/compression/pdf" },
      { type: "text", text: ", convert PDF to Word and convert PDF pages to images." },
    ],
  },
  {
    id: "compress-pdf-target-size",
    question: "How can I compress a PDF to 100 KB or another target size?",
    answer: [
      { type: "text", text: "Use the " },
      { type: "link", text: "Compress PDF tool", href: "/compression/pdf" },
      { type: "text", text: " or the " },
      { type: "link", text: "Compress PDF Under 100KB page", href: "/compress-pdf-under-100kb" },
      {
        type: "text",
        text: ". Choose a 100 KB, 200 KB or 500 KB preset, upload your PDF, and ZipDrop will aim for a size at or near the target. The final size depends on the document, so a preset is not a guarantee for every file.",
      },
    ],
  },
  {
    id: "image-compression",
    question: "Which image compression tools are available?",
    answer: [
      { type: "text", text: "Use ZipDrop's online file compression for JPG, PNG and WEBP images. Open the " },
      { type: "link", text: "JPG compressor", href: "/compression/jpg" },
      { type: "text", text: ", " },
      { type: "link", text: "PNG compressor", href: "/compression/png" },
      { type: "text", text: " or " },
      { type: "link", text: "WEBP compressor", href: "/compression/webp" },
      { type: "text", text: ", adjust the quality setting, and download the smaller image." },
    ],
  },
  {
    id: "background-remover",
    question: "Can I remove an image background and download a transparent PNG?",
    answer: [
      { type: "text", text: "Yes. Upload a JPG, PNG or WEBP image to the " },
      { type: "link", text: "background remover", href: "/image-tools/background-remover" },
      {
        type: "text",
        text: " and download the result as a transparent PNG. It is useful for product photos, profile pictures and design work.",
      },
    ],
  },
  {
    id: "file-handling-and-retention",
    question: "How does ZipDrop handle uploaded files, and how long are they kept?",
    answer: [
      {
        type: "text",
        text: "Files uploaded for conversion or compression are processed on ZipDrop's servers and temporary working files are cleaned up after processing. Files shared with a code are stored so the recipient can download them. A 48-hour expiry timestamp is recorded, but automatic deletion is not currently enforced; files may remain until manually removed. ZipDrop is not end-to-end encrypted, so avoid sensitive documents, and ",
      },
      { type: "link", text: "contact us", href: "/contact" },
      { type: "text", text: " if you need a removal request." },
    ],
  },
  {
    id: "code-privacy",
    question: "Is a 4-digit code enough to keep my shared files private?",
    answer: [
      {
        type: "text",
        text: "No. Treat the 4-digit code as a convenient way to receive files, not as a privacy guarantee. There are only 10,000 possible codes, shared files are stored in a public storage bucket, and a direct URL can be accessed without the code. Do not use ZipDrop as a private vault for sensitive documents.",
      },
    ],
  },
  {
    id: "supported-formats",
    question: "Which file formats does ZipDrop support?",
    answer: [
      {
        type: "text",
        text: "ZipDrop supports PDF; Word DOC and DOCX; Excel XLS, XLSX and CSV; PowerPoint PPT and PPTX; RTF, TXT and HTML; and JPG/JPEG, PNG, WEBP and SVG images. Support varies by tool, so check the upload area on each converter or compressor for its exact accepted file types.",
      },
    ],
  },
];

export function faqAnswerText(segments: FaqSegment[]): string {
  return segments.map((segment) => segment.text).join("").trim();
}
