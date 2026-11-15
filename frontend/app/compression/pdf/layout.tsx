import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compress PDF Online – Reduce PDF File Size Free",
  description: "Compress PDF files online for free with ZipDrop. Choose from 3 compression levels (Low, Recommended, High). Reduce file size while preserving text, images, and layout. No account required, max 100MB.",
  alternates: {
    canonical: "https://zip-drop.vercel.app/compression/pdf",
  },
  openGraph: {
    title: "Compress PDF Online – Reduce PDF File Size Free",
    description: "Compress PDF files online for free with ZipDrop. 3 compression levels. No account required, max 100MB.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Compress PDF Online – Reduce PDF File Size Free",
    description: "Compress PDF files online for free. 3 compression levels. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Compress PDF",
  url: "https://zip-drop.vercel.app/compression/pdf",
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
    url: "https://zip-drop.vercel.app",
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
      { "@type": "ListItem", position: 1, name: "Home", item: "https://zip-drop.vercel.app" },
      { "@type": "ListItem", position: 2, name: "Compression Tools", item: "https://zip-drop.vercel.app/compression" },
      { "@type": "ListItem", position: 3, name: "Compress PDF", item: "https://zip-drop.vercel.app/compression/pdf" },
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
    </>
  );
}