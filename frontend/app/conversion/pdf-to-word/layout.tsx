import type { Metadata } from "next";
import ToolSeoSection from "@/components/ToolSeoSection";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/conversion/pdf-to-word";
const TITLE = "PDF to Word Converter — Free Online DOCX Conversion";
const DESCRIPTION =
  "Convert PDF to editable Word (DOCX) online for free with ZipDrop at www.getzipdrop.com/conversion/pdf-to-word. Choose Editable or Visual Fidelity mode. Max 50 MB; no account required.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "pdf to word getzipdrop",
    "ZipDrop PDF to Word",
    "convert PDF to Word online",
  ],
  alternates: {
    canonical: `${SITE_URL}${PAGE_PATH}`,
  },
  openGraph: {
    url: `${SITE_URL}${PAGE_PATH}`,
    title: TITLE,
    description: DESCRIPTION,
    siteName: SITE_NAME,
    type: "website",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ZipDrop PDF to Word Converter",
  url: `${SITE_URL}${PAGE_PATH}`,
  applicationCategory: "FileConverter",
  operatingSystem: "Web",
  description: DESCRIPTION,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
  creator: {
    "@type": "Organization",
    name: SITE_NAME,
    url: `${SITE_URL}/`,
  },
  featureList: [
    "Editable Word mode",
    "Visual Fidelity mode",
    "Layout preservation",
    "Table extraction",
    "Image handling",
    "Maximum PDF size: 50 MB",
    "No account required",
  ],
  breadcrumb: {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Conversion Tools", item: `${SITE_URL}/conversion` },
      { "@type": "ListItem", position: 3, name: "PDF to Word", item: `${SITE_URL}${PAGE_PATH}` },
    ],
  },
};

export default function PdfToWordLayout({
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
      {children}
      <ToolSeoSection
        title="PDF to Word conversion with ZipDrop"
        intro="Use the official ZipDrop PDF to Word tool at www.getzipdrop.com/conversion/pdf-to-word to turn PDFs into editable DOCX files. Choose Editable mode to revise text and tables, or Visual Fidelity mode to keep the original layout. Maximum PDF size: 50 MB."
        faqs={[
          {
            question: "Is this the official ZipDrop PDF to Word converter?",
            answer:
              "Yes. The official tool is at https://www.getzipdrop.com/conversion/pdf-to-word on the getzipdrop.com domain.",
          },
          {
            question: "What is the maximum PDF size?",
            answer:
              "The PDF to Word converter accepts PDF files up to 50 MB.",
          },
          {
            question: "Which conversion mode should I choose?",
            answer:
              "Choose Editable mode to revise text and tables, or Visual Fidelity mode to preserve the original page appearance.",
          },
          {
            question: "Do I need an account to convert PDF to Word?",
            answer:
              "No. ZipDrop's PDF to Word converter is free to use without sign-up or login.",
          },
        ]}
        links={[
          { label: "Compress PDF", href: "/compression/pdf" },
          { label: "PDF to Excel", href: "/conversion/pdf-to-excel" },
          { label: "PNG to JPG converter", href: "/conversion/png-to-jpg" },
          { label: "All conversion tools", href: "/conversion" },
        ]}
      />
    </>
  );
}