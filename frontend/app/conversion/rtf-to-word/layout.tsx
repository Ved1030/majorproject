import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RTF to Word Converter – Convert RTF to DOCX Free Online",
  description: "Convert Rich Text Format (RTF) to Word documents (DOCX) online for free. Preserve formatting. No account required, max 50MB.",
  alternates: {
    canonical: "https://zip-drop.vercel.app/conversion/rtf-to-word",
  },
  openGraph: {
    title: "RTF to Word Converter – Convert RTF to DOCX Free Online",
    description: "Convert RTF to Word documents online for free. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "RTF to Word Converter – Convert RTF to DOCX Free Online",
    description: "Convert RTF to DOCX online for free. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "RTF to Word Converter",
  url: "https://zip-drop.vercel.app/conversion/rtf-to-word",
  applicationCategory: "FileConverter",
  operatingSystem: "Web",
  description: "Free online RTF to Word converter. Convert RTF to DOCX preserving formatting. No account required.",
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
      { "@type": "ListItem", position: 3, name: "RTF to Word", item: "https://zip-drop.vercel.app/conversion/rtf-to-word" },
    ],
  },
};

export default function RtfToWordLayout({
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