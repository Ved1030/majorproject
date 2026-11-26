import type { Metadata } from "next";
import ToolSeoSection from "@/components/ToolSeoSection";
import { OG_IMAGE, SITE_NAME } from "@/lib/site";

const TITLE = "Compress PDF — Free Online PDF Compression";
const DESCRIPTION =
  "Compress PDF files online for free at getzipdrop.com with ZipDrop. Choose Low, Recommended or High compression to reduce file size while preserving text, images and layout. No account required, max 100MB.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "compress pdf getzipdrop",
    "file compression getzipdrop",
    "ZipDrop PDF compressor",
  ],
  alternates: {
    canonical: "https://www.getzipdrop.com/compression/pdf",
  },
  openGraph: {
    url: "https://www.getzipdrop.com/compression/pdf",
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
  name: "Compress PDF",
  url: "https://www.getzipdrop.com/compression/pdf",
  applicationCategory: "FileCompression",
  operatingSystem: "Web",
  description: "Free online PDF compression tool with 3 levels: Low, Recommended, High. Reduce PDF file size while preserving text, images, and layout. Max 100MB, no account required.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
  creator: {
    "@type": "Organization",
    name: "ZipDrop",
    url: "https://www.getzipdrop.com",
  },
  featureList: [
    "3 compression levels",
    "Preserves text and vectors",
    "Optimizes embedded images",
    "Max 100MB file size",
    "No account required",
    "Real compression stats",
  ],
  breadcrumb: {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.getzipdrop.com" },
      { "@type": "ListItem", position: 2, name: "Compression Tools", item: "https://www.getzipdrop.com/compression" },
      { "@type": "ListItem", position: 3, name: "Compress PDF", item: "https://www.getzipdrop.com/compression/pdf" },
    ],
  },
};

export default function CompressPdfLayout({
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
        title="Why use ZipDrop to compress PDF files?"
        intro="ZipDrop's Compress PDF tool reduces PDF file size in your browser. Upload a PDF, choose Low, Recommended or High compression, and download the result without creating an account."
        faqs={[
          {
            question: "Is the ZipDrop PDF compressor free?",
            answer:
              "Yes. You can compress PDF files at https://www.getzipdrop.com/compression/pdf without payment or an account.",
          },
          {
            question: "Which PDF compression levels are available?",
            answer:
              "ZipDrop offers Low, Recommended and High compression levels so you can balance file size against output quality.",
          },
          {
            question: "What is the maximum PDF size?",
            answer:
              "The Compress PDF tool accepts PDF files up to 100 MB.",
          },
        ]}
        links={[
          { label: "Compress JPG", href: "/compression/jpg" },
          { label: "Compress PNG", href: "/compression/png" },
          { label: "PNG to JPG converter", href: "/conversion/png-to-jpg" },
          { label: "All compression tools", href: "/compression" },
        ]}
      />
    </>
  );
}