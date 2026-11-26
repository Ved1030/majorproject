export interface ToolFaq {
  question: string;
  answer: string;
}

export interface ToolLink {
  label: string;
  href: string;
}

export interface ToolSeoContent {
  name: string;
  path: string;
  category: string;
  applicationCategory: string;
  intro: string;
  howTo: string[];
  features: string[];
  privacy: string;
  faqs: ToolFaq[];
  links: ToolLink[];
}

const SHARED_FAQS: ToolFaq[] = [
  {
    question: "Do I need to sign up or log in to use ZipDrop tools?",
    answer:
      "No. Every ZipDrop utility works in the browser without an account, so you can open the tool, process a file and download the result directly.",
  },
  {
    question: "How long are my files kept on ZipDrop?",
    answer:
      "Conversion and compression jobs are processed and returned to your browser without permanent storage. Files you explicitly share with a 4-digit code are stored so the recipient can download them, and a 48-hour expiry is recorded for those shares.",
  },
  {
    question: "Can I use ZipDrop on a phone and send the result to my laptop?",
    answer:
      "Yes. Open the tool in your phone's browser, download or process the file, then use the 4-digit code sharing flow to send the finished file to your laptop. The two devices do not need to be on the same Wi-Fi network.",
  },
  {
    question: "Will my file work with SSC, UPSC or college upload limits?",
    answer:
      "ZipDrop lets you reduce a file before uploading it to an exam portal or college site. Check the exact size and format limit on the portal first, then use the matching ZipDrop tool and confirm the final file size shown on the result screen before uploading.",
  },
  {
    question: "Which file formats does ZipDrop support?",
    answer:
      "ZipDrop supports PDF, Word (DOCX), Excel, PowerPoint, JPG, PNG, WEBP and SVG for most conversion and compression tools. Each tool page lists the exact formats it accepts.",
  },
  {
    question: "Is ZipDrop free and safe to use?",
    answer:
      "Yes. The tools are free to use without payment. Files are not end-to-end encrypted, so avoid uploading sensitive documents, and remove local copies when you no longer need them.",
  },
];

const RELATED_TOOLS: ToolLink[] = [
  { label: "Compress PDF under 100KB", href: "/compress-pdf-under-100kb" },
  { label: "Transfer files from phone to laptop", href: "/blog/how-to-transfer-files-phone-to-laptop" },
  { label: "Convert PDF to Word (DOCX)", href: "/conversion/pdf-to-word" },
  { label: "Remove image background to transparent PNG", href: "/image-tools/background-remover" },
  { label: "Compress JPG, PNG and WEBP images", href: "/compression/compress-image" },
  { label: "Share files with a 4-digit code", href: "/#share-receive" },
];

export const CORE_TOOL_SEO: Record<string, ToolSeoContent> = {
  "/": {
    name: "ZipDrop file sharing",
    path: "/",
    category: "File sharing",
    applicationCategory: "UtilitiesApplication",
    intro:
      "ZipDrop is a free browser-based way to share files and text between a phone, tablet and PC using a 4-digit code. No login, no app install and no same-Wi-Fi requirement.",
    howTo: [
      "Upload files — Open ZipDrop on the sending device and add up to 10 files or paste text.",
      "Get a 4-digit code — ZipDrop generates a code you can read out or type on the other device.",
      "Receive anywhere — Enter the code on the second device to download the files instantly.",
    ],
    features: [
      "Share up to 10 files in one transfer",
      "Works across different networks, not just the same Wi-Fi",
      "No sign-up, no app install and no browser extension",
      "Built-in PDF, image and document utilities",
    ],
    privacy:
      "Shared files are stored so the recipient can download them with the code; a 48-hour expiry is recorded for each share. Files are not end-to-end encrypted.",
    faqs: [
      {
        question: "How do I share files between phone and PC with a 4-digit code?",
        answer:
          "Open ZipDrop on your phone, upload the files and note the 4-digit code. On your PC, open the same site, choose Receive, enter the code and download the files.",
      },
      {
        question: "Do the devices need to be on the same Wi-Fi network?",
        answer:
          "No. ZipDrop transfers files over the internet, so your phone can use mobile data while your laptop uses a different network.",
      },
      {
        question: "How many files can I send at once?",
        answer: "You can add up to 10 files in a single ZipDrop transfer.",
      },
      {
        question: "Is ZipDrop really free and does it need an account?",
        answer:
          "Yes. The sharing flow and all available tools work without payment, sign-up or login.",
      },
      {
        question: "Are my shared files deleted automatically?",
        answer:
          "ZipDrop records a 48-hour expiry for shared transfers. Check the privacy policy for the current enforcement details before sharing sensitive files.",
      },
      {
        question: "Can I send an exam form or college assignment this way?",
        answer:
          "Yes. You can share a PDF or image with another device, or first compress it with ZipDrop's PDF and image tools to meet an SSC, UPSC or college upload limit.",
      },
    ],
    links: RELATED_TOOLS,
  },
  "/compression/pdf": {
    name: "Compress PDF",
    path: "/compression/pdf",
    category: "Compression Tools",
    applicationCategory: "FileCompression",
    intro:
      "Compress a PDF online for free. Choose a target size preset such as 100 KB, 200 KB or 500 KB, or pick Low, Recommended/Medium and High compression. Download the result without an account.",
    howTo: [
      "Choose a target — Pick 100 KB, 200 KB or 500 KB, or select Low, Recommended or High compression.",
      "Add your PDF — Drag and drop a PDF up to 100 MB or browse for one on your device.",
      "Download the result — Review the size reduction and download the compressed PDF.",
    ],
    features: [
      "One-click 100 KB, 200 KB and 500 KB target presets",
      "Low, Recommended and High compression levels",
      "Preserves text, vectors, links and readable image quality",
      "Works for SSC, UPSC and college portal upload limits",
      "Maximum input size 100 MB, no account required",
    ],
    privacy:
      "PDFs are processed and returned to your browser without permanent storage. Use the 4-digit code flow only when you intentionally want to send the finished file to another device.",
    faqs: [
      {
        question: "How do I compress a PDF to under 100 KB?",
        answer:
          "Open the ZipDrop PDF compressor, choose the 100 KB preset, upload your PDF and start. ZipDrop tries progressively smaller settings and downloads the smallest result it can produce; the result screen shows the exact final size.",
      },
      {
        question: "Can I compress a PDF to 200 KB or 500 KB?",
        answer:
          "Yes. Select the 200 KB or 500 KB preset before uploading. If the file cannot reach that target without destroying readability, ZipDrop returns the smallest usable version and tells you the final size.",
      },
      {
        question: "What is the difference between Low, Recommended and High compression?",
        answer:
          "Low makes conservative changes that preserve quality, Recommended balances size and readability, and High uses aggressive downsampling for the smallest file.",
      },
      {
        question: "Will the compressed PDF work on SSC, UPSC or college portals?",
        answer:
          "ZipDrop produces a standard PDF that portals accept. Check your portal's exact KB limit, then confirm the size shown on the result screen before uploading.",
      },
      {
        question: "Can I compress a PDF on my phone and send it to my laptop?",
        answer:
          "Yes. Compress the PDF in your phone's browser, then use the 4-digit code button on the result screen to send the processed file to your laptop.",
      },
      {
        question: "Does PDF compression remove a password or watermark?",
        answer:
          "No. Password-protected PDFs cannot be compressed and ZipDrop does not add a watermark to processed files.",
      },
    ],
    links: [
      { label: "Compress PDF under 100KB", href: "/compress-pdf-under-100kb" },
      { label: "Convert PDF to Word (DOCX)", href: "/conversion/pdf-to-word" },
      { label: "Compress JPG, PNG and WEBP images", href: "/compression/compress-image" },
      { label: "Transfer files from phone to laptop", href: "/blog/how-to-transfer-files-phone-to-laptop" },
      { label: "Share files with a 4-digit code", href: "/#share-receive" },
    ],
  },
  "/compress-pdf-under-100kb": {
    name: "Compress PDF under 100KB",
    path: "/compress-pdf-under-100kb",
    category: "Compression Tools",
    applicationCategory: "FileCompression",
    intro:
      "Reduce a PDF to under 100 KB for exam portals, college uploads and form submissions. Pick the 100 KB preset, upload your PDF and download the smallest usable result free.",
    howTo: [
      "Open the 100 KB tool — The 100 KB target preset is selected for you.",
      "Upload your PDF — Choose a PDF up to 100 MB from your phone or computer.",
      "Check and download — Confirm the final KB size on the result screen and download it.",
    ],
    features: [
      "100 KB target preset pre-selected",
      "200 KB and 500 KB presets available for softer limits",
      "No watermark and no account",
      "Standard PDF output accepted by upload portals",
    ],
    privacy:
      "PDFs are processed and returned without permanent storage; nothing is shared with another device unless you choose the 4-digit code option.",
    faqs: [
      {
        question: "Can every PDF be compressed to under 100 KB?",
        answer:
          "Not always. Very long or image-heavy PDFs may not fit under 100 KB without making text unreadable. ZipDrop returns the smallest usable result and shows the exact size.",
      },
      {
        question: "Why do exam portals need a 100 KB PDF?",
        answer:
          "Many SSC, UPSC and university application portals cap file size to keep uploads fast. Compress first, then check the size shown on the result screen against the portal requirement.",
      },
      {
        question: "Can I try 200 KB instead of 100 KB?",
        answer:
          "Yes. Switch to the 200 KB preset inside the tool for a higher-quality result that still fits many form limits.",
      },
      {
        question: "Does the compressor add a watermark?",
        answer: "No. ZipDrop does not add watermarks to compressed PDFs.",
      },
      {
        question: "Can I compress on mobile and send the PDF to a laptop?",
        answer:
          "Yes. After compression, use the 4-digit code button to send the finished PDF to another device.",
      },
      {
        question: "What PDF formats are supported?",
        answer: "Standard unencrypted PDF files up to 100 MB are supported.",
      },
    ],
    links: [
      { label: "Compress PDF with custom levels", href: "/compression/pdf" },
      { label: "Convert PDF to Word (DOCX)", href: "/conversion/pdf-to-word" },
      { label: "Compress JPG, PNG and WEBP images", href: "/compression/compress-image" },
      { label: "Transfer files from phone to laptop", href: "/blog/how-to-transfer-files-phone-to-laptop" },
    ],
  },
  "/conversion/pdf-to-word": {
    name: "PDF to Word",
    path: "/conversion/pdf-to-word",
    category: "Conversion Tools",
    applicationCategory: "FileConverter",
    intro:
      "Convert PDF to Word (DOCX) online free. Choose Editable mode to revise text and tables or Visual Fidelity mode to preserve the original layout. No login, maximum PDF size 50 MB.",
    howTo: [
      "Pick a mode — Choose Editable for text you want to change, or Visual Fidelity for layout accuracy.",
      "Upload a PDF — Drag and drop a PDF up to 50 MB or browse from your device.",
      "Download the DOCX — Open the result in Word, Google Docs or any DOCX editor.",
    ],
    features: [
      "Editable DOCX output with text and tables",
      "Visual Fidelity mode for complex layouts",
      "Image handling and basic heading detection",
      "No watermark and no sign-up",
      "Maximum input size 50 MB",
    ],
    privacy:
      "PDFs are processed and returned to your browser without permanent storage. Converted files are only sent to another device if you explicitly use the 4-digit sharing flow.",
    faqs: [
      {
        question: "Is the converted Word file really editable?",
        answer:
          "Editable mode reconstructs text, tables and images as editable Word elements. Scanned PDFs need OCR elsewhere first; Visual Fidelity mode keeps the page appearance instead.",
      },
      {
        question: "Does ZipDrop preserve the original layout?",
        answer:
          "Visual Fidelity mode preserves page appearance using positioned elements, which is best for multi-column documents and forms.",
      },
      {
        question: "What is the maximum PDF size?",
        answer: "The PDF to Word converter accepts PDFs up to 50 MB.",
      },
      {
        question: "Can I convert a PDF on my phone and send the DOCX to my laptop?",
        answer:
          "Yes. Convert on your phone and use the 4-digit code button on the result screen to send the DOCX to your laptop.",
      },
      {
        question: "Does it add a watermark or require payment?",
        answer: "No. The converter is free and does not add a watermark.",
      },
      {
        question: "Are password-protected PDFs supported?",
        answer:
          "No. Remove the password before uploading, then convert the unlocked PDF.",
      },
    ],
    links: [
      { label: "Compress PDF under 100KB", href: "/compress-pdf-under-100kb" },
      { label: "Merge PDF files online", href: "/pdf/merge" },
      { label: "Split PDF by page range", href: "/pdf/split" },
      { label: "Transfer files from phone to laptop", href: "/blog/how-to-transfer-files-phone-to-laptop" },
    ],
  },
  "/image-tools/background-remover": {
    name: "AI Background Remover",
    path: "/image-tools/background-remover",
    category: "Image Tools",
    applicationCategory: "ImageEditor",
    intro:
      "Remove image backgrounds online free with AI and download a transparent PNG. Supports JPG, PNG and WEBP up to 20 MB, with original dimensions preserved and no account required.",
    howTo: [
      "Upload an image — Add a JPG, PNG or WEBP file up to 20 MB.",
      "AI removes the background — Photos and graphics are detected automatically and processed with the best method.",
      "Download a transparent PNG — Preview on different backgrounds and save the PNG with its alpha channel.",
    ],
    features: [
      "AI detection for photos, products, logos and graphics",
      "Transparent PNG output with alpha channel",
      "Original pixel dimensions preserved",
      "Before/after comparison and background previews",
      "Maximum input size 20 MB, no login required",
    ],
    privacy:
      "Images are processed in memory and temporary files are deleted after processing. ZipDrop does not permanently store images you only use in the background remover.",
    faqs: [
      {
        question: "Which image formats are supported?",
        answer: "JPG, PNG and WEBP files up to 20 MB are accepted; output is always a transparent PNG.",
      },
      {
        question: "Can I remove a background for an exam photo or college ID?",
        answer:
          "Yes. Upload a clear photo, download the transparent PNG and place it on the required background colour. Check the portal's exact size and format rules before uploading.",
      },
      {
        question: "Will the image quality and dimensions change?",
        answer: "No. The output keeps the same pixel dimensions as the source image.",
      },
      {
        question: "Can I send the transparent PNG to another device?",
        answer:
          "Yes. Use the 4-digit code button on the result screen to send the processed PNG to your phone or laptop.",
      },
      {
        question: "Does it work on logos and graphics?",
        answer:
          "Yes. The tool detects graphics and logos and uses edge-based colour removal to keep details such as holes inside letters.",
      },
      {
        question: "Is the background remover free?",
        answer: "Yes. It is free to use without registration or payment.",
      },
    ],
    links: [
      { label: "Compress JPG, PNG and WEBP images", href: "/compression/compress-image" },
      { label: "Convert PNG to JPG", href: "/conversion/png-to-jpg" },
      { label: "Convert JPG to PNG", href: "/conversion/jpg-to-png" },
      { label: "Transfer files from phone to laptop", href: "/blog/how-to-transfer-files-phone-to-laptop" },
    ],
  },
  "/compression/compress-image": {
    name: "Compress Image",
    path: "/compression/compress-image",
    category: "Compression Tools",
    applicationCategory: "FileCompression",
    intro:
      "Compress JPG, PNG and WEBP images to a target KB size online free. Choose quality presets or a target size, review the result and download without an account.",
    howTo: [
      "Set a target — Choose a preset such as 100 KB, 200 KB or 500 KB, or pick a quality level.",
      "Add an image — Upload a JPG, PNG or WEBP file from your phone or computer.",
      "Download the result — Confirm the final KB size and save the compressed image.",
    ],
    features: [
      "JPG, PNG and WEBP input",
      "Target KB presets for portal and form uploads",
      "Quality presets and progressive JPG option",
      "Lossless PNG optimisation",
      "No watermark, no sign-up",
    ],
    privacy:
      "Images are processed and returned to your browser without permanent storage. Nothing is sent to another device unless you use the 4-digit code sharing flow.",
    faqs: [
      {
        question: "How do I compress an image to an exact KB size?",
        answer:
          "Choose a target preset, upload the image and start. ZipDrop tries a range of quality settings and returns the smallest usable image near your target, showing the final KB size on the result screen.",
      },
      {
        question: "Which image formats can I compress?",
        answer: "JPG, PNG and WEBP images are supported.",
      },
      {
        question: "Will the compressed image lose quality?",
        answer:
          "Some quality loss is normal at smaller sizes. ZipDrop selects the best result it can produce at or near your target.",
      },
      {
        question: "Can I compress a photo for SSC, UPSC or college uploads?",
        answer:
          "Yes. Check the portal's KB limit, use the closest target preset and verify the exact output size before uploading.",
      },
      {
        question: "Can I compress on mobile and send the image to my laptop?",
        answer:
          "Yes. After compression, use the 4-digit code button on the result screen to send the image to another device.",
      },
      {
        question: "Does compression add a watermark?",
        answer: "No. ZipDrop never adds watermarks to compressed images.",
      },
    ],
    links: [
      { label: "Compress PDF under 100KB", href: "/compress-pdf-under-100kb" },
      { label: "Remove image background to transparent PNG", href: "/image-tools/background-remover" },
      { label: "Convert JPG to WEBP", href: "/conversion/jpg-to-webp" },
      { label: "Share files with a 4-digit code", href: "/#share-receive" },
    ],
  },
};

const CATEGORY_BY_PREFIX: Array<{ prefix: string; category: string; applicationCategory: string }> = [
  { prefix: "/compression/", category: "Compression Tools", applicationCategory: "FileCompression" },
  { prefix: "/conversion/", category: "Conversion Tools", applicationCategory: "FileConverter" },
  { prefix: "/pdf/", category: "PDF Tools", applicationCategory: "UtilitiesApplication" },
  { prefix: "/image-tools/", category: "Image Tools", applicationCategory: "ImageEditor" },
];

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function isToolPath(pathname: string): boolean {
  const clean = pathname.replace(/\/$/, "") || "/";
  return clean === "/" || CATEGORY_BY_PREFIX.some(({ prefix }) => clean.startsWith(prefix));
}

export function getToolSeoContent(pathname: string): ToolSeoContent | null {
  const clean = pathname.replace(/\/$/, "") || "/";
  const core = CORE_TOOL_SEO[clean];
  if (core) return core;
  if (!isToolPath(clean)) return null;

  const slug = clean.split("/").pop() || "tool";
  const name = titleFromSlug(slug);
  const meta = CATEGORY_BY_PREFIX.find(({ prefix }) => clean.startsWith(prefix));

  return {
    name,
    path: clean,
    category: meta?.category ?? "File Tools",
    applicationCategory: meta?.applicationCategory ?? "UtilitiesApplication",
    intro: `Use ZipDrop's free ${name.toLowerCase()} tool in your browser. No sign-up, no software install, and no watermark. Process your file and download the result directly.`,
    howTo: [
      `Choose your file — Open the ${name.toLowerCase()} tool and add a supported file from your device.`,
      "Start processing — ZipDrop handles the work in the browser with server-side helpers where needed.",
      "Download or share — Save the finished file, or send it to another device with a 4-digit code.",
    ],
    features: [
      "Free to use with no account",
      "Works in any modern browser on phone or desktop",
      "No watermark on processed files",
      "Optional 4-digit code sharing for another device",
    ],
    privacy:
      "Files are processed and returned without permanent storage. Shared files are stored only when you explicitly create a 4-digit code transfer, with a 48-hour expiry recorded.",
    faqs: SHARED_FAQS,
    links: RELATED_TOOLS,
  };
}

export function getCoreToolSeoContent(pathname: string): ToolSeoContent | null {
  const clean = pathname.replace(/\/$/, "") || "/";
  return CORE_TOOL_SEO[clean] ?? null;
}

export const ALL_RELATED_TOOLS = RELATED_TOOLS;
