import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Text to PDF Converter – Convert TXT to PDF Free Online",
  description: "Convert plain text files to PDF documents online for free. Preserve formatting and structure. No account required, max 50MB.",
  alternates: {
    canonical: "https://zip-drop.vercel.app/conversion/txt-to-pdf",
  },
  openGraph: {
    title: "Text to PDF Converter – Convert TXT to PDF Free Online",
    description: "Convert plain text files to PDF online for free. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Text to PDF Converter – Convert TXT to PDF Free Online",
    description: "Convert plain text files to PDF online for free. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Text to PDF Converter",
  url: "https://zip-drop.vercel.app/conversion/txt-to-pdf",
  applicationCategory: "FileConverter",
  operatingSystem: "Web",
  description: "Free online Text to PDF converter. Convert TXT to PDF documents. No account required.",
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
      { "@type": "ListItem", position: 3, name: "Text to PDF", item: "https://zip-drop.vercel.app/conversion/txt-to-pdf" },
    ],
  },
};

export default function TxtToPdfLayout({
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