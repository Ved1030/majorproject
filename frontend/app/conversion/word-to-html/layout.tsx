import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Word to HTML Converter – Convert DOCX to HTML Free Online",
  description: "Convert Word documents (DOCX/DOC) to clean HTML online for free. Preserve formatting and structure. No account required, max 50MB.",
  alternates: {
    canonical: "https://www.getzipdrop.com/conversion/word-to-html",
  },
  openGraph: {
    url: "https://www.getzipdrop.com/conversion/word-to-html",
    title: "Word to HTML Converter – Convert DOCX to HTML Free Online",
    description: "Convert Word documents to clean HTML online for free. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Word to HTML Converter – Convert DOCX to HTML Free Online",
    description: "Convert Word documents to HTML online for free. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Word to HTML Converter",
  url: "https://www.getzipdrop.com/conversion/word-to-html",
  applicationCategory: "FileConverter",
  operatingSystem: "Web",
  description: "Free online Word to HTML converter. Convert DOCX/DOC to clean HTML. No account required.",
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
  breadcrumb: {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.getzipdrop.com" },
      { "@type": "ListItem", position: 2, name: "Conversion Tools", item: "https://www.getzipdrop.com/conversion" },
      { "@type": "ListItem", position: 3, name: "Word to HTML", item: "https://www.getzipdrop.com/conversion/word-to-html" },
    ],
  },
};

export default function WordToHtmlLayout({
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