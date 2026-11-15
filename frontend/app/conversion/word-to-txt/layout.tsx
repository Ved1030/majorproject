import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Word to Text Converter – Extract Text from DOCX Free Online",
  description: "Extract plain text from Word documents (DOCX/DOC) online for free. Preserve text content. No account required, max 50MB.",
  alternates: {
    canonical: "https://zip-drop.vercel.app/conversion/word-to-txt",
  },
  openGraph: {
    title: "Word to Text Converter – Extract Text from DOCX Free Online",
    description: "Extract plain text from Word documents online for free. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Word to Text Converter – Extract Text from DOCX Free Online",
    description: "Extract plain text from Word documents online for free. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Word to Text Converter",
  url: "https://zip-drop.vercel.app/conversion/word-to-txt",
  applicationCategory: "FileConverter",
  operatingSystem: "Web",
  description: "Free online Word to Text converter. Extract plain text from DOCX/DOC documents. No account required.",
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
      { "@type": "ListItem", position: 3, name: "Word to Text", item: "https://zip-drop.vercel.app/conversion/word-to-txt" },
    ],
  },
};

export default function WordToTxtLayout({
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