import type { Metadata } from "next";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: {
    default: "Free Online File Converter – PDF, Word, Excel & Images",
    template: "%s | ZipDrop",
  },
  description: "Convert files online with ZipDrop. 27 tools for PDF, Word, Excel, PowerPoint, images, and text. No account required and no software to install.",
  keywords: [
    "png to jpg getzipdrop",
    "file conversion getzipdrop",
    "ZipDrop file converter",
  ],
  alternates: {
    canonical: `${SITE_URL}/conversion`,
  },
  openGraph: {
    url: `${SITE_URL}/conversion`,
    title: "Free Online File Converter – PDF, Word, Excel & Images",
    description: "Convert files online with ZipDrop. 27 tools for PDF, Word, Excel, PowerPoint, images, and text. No account required.",
    siteName: SITE_NAME,
    type: "website",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Online File Converter – PDF, Word, Excel & Images",
    description: "Convert files online with ZipDrop. 27 tools for PDF, Word, Excel, images, and text. No account required.",
    images: [OG_IMAGE],
  },
};

const tools = [
  { name: "PDF to Word", slug: "pdf-to-word" },
  { name: "PDF to Excel", slug: "pdf-to-excel" },
  { name: "PDF to PowerPoint", slug: "pdf-to-ppt" },
  { name: "PDF to JPG", slug: "pdf-to-jpg" },
  { name: "PDF to PNG", slug: "pdf-to-png" },
  { name: "PDF to Text", slug: "pdf-to-txt" },
  { name: "PDF to HTML", slug: "pdf-to-html" },
  { name: "PDF to PDF/A", slug: "pdf-to-pdfa" },
  { name: "Word to PDF", slug: "word-to-pdf" },
  { name: "Excel to PDF", slug: "excel-to-pdf" },
  { name: "PowerPoint to PDF", slug: "ppt-to-pdf" },
  { name: "Word to Text", slug: "word-to-txt" },
  { name: "Word to HTML", slug: "word-to-html" },
  { name: "Excel to CSV", slug: "excel-to-csv" },
  { name: "JPG to PNG", slug: "jpg-to-png" },
  { name: "PNG to JPG", slug: "png-to-jpg" },
  { name: "WEBP to JPG", slug: "webp-to-jpg" },
  { name: "JPG to WEBP", slug: "jpg-to-webp" },
  { name: "PNG to WEBP", slug: "png-to-webp" },
  { name: "SVG to PNG", slug: "svg-to-png" },
  { name: "JPG to PDF", slug: "jpg-to-pdf" },
  { name: "PNG to PDF", slug: "png-to-pdf" },
  { name: "Images to PDF", slug: "images-to-pdf" },
  { name: "Text to PDF", slug: "txt-to-pdf" },
  { name: "HTML to PDF", slug: "html-to-pdf" },
  { name: "CSV to Excel", slug: "csv-to-excel" },
  { name: "RTF to Word", slug: "rtf-to-word" },
];

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${SITE_URL}/conversion#webpage`,
  name: "Free Online File Converter – PDF, Word, Excel & Images",
  description: "Convert files online with ZipDrop. 27 tools for PDF, Word, Excel, PowerPoint, images, and text. No account required.",
  url: `${SITE_URL}/conversion`,
  inLanguage: "en",
  isPartOf: { "@id": `${SITE_URL}/#website` },
  publisher: { "@id": `${SITE_URL}/#organization` },
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: tools.length,
    itemListElement: tools.map((tool, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: tool.name,
      url: `${SITE_URL}/conversion/${tool.slug}`,
    })),
  },
};

const breadcrumbData = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Conversion Tools", item: `${SITE_URL}/conversion` },
  ],
};

export default function ConversionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      {children}
    </>
  );
}
