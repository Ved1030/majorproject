import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Word to PDF Converter – Free Online DOCX to PDF",
  description: "Convert Word documents (DOCX/DOC) to PDF online for free. Preserve formatting, fonts, and layout. No account required.",
  alternates: {
    canonical: "https://zip-drop.vercel.app/conversion/word-to-pdf",
  },
  openGraph: {
    title: "Word to PDF Converter – Free Online DOCX to PDF",
    description: "Convert Word documents to PDF online for free. Preserve formatting. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Word to PDF Converter – Free Online DOCX to PDF",
    description: "Convert Word documents to PDF online for free. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Word to PDF Converter",
  url: "https://zip-drop.vercel.app/conversion/word-to-pdf",
  applicationCategory: "FileConverter",
  operatingSystem: "Web",
  description: "Free online Word to PDF converter. Convert DOCX/DOC to PDF preserving formatting. No account required.",
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
  breadcrumb: {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://zip-drop.vercel.app" },
      { "@type": "ListItem", position: 2, name: "Conversion Tools", item: "https://zip-drop.vercel.app/conversion" },
      { "@type": "ListItem", position: 3, name: "Word to PDF", item: "https://zip-drop.vercel.app/conversion/word-to-pdf" },
    ],
  },
};

export default function WordToPdfLayout({
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