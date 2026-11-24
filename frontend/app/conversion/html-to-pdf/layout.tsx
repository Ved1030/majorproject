import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HTML to PDF Converter – Convert Web Pages to PDF Free Online",
  description: "Convert HTML pages to PDF documents online for free. Preserve layout and styling. No account required, max 50MB.",
  alternates: {
    canonical: "https://www.getzipdrop.com/conversion/html-to-pdf",
  },
  openGraph: {
    url: "https://www.getzipdrop.com/conversion/html-to-pdf",
    title: "HTML to PDF Converter – Convert Web Pages to PDF Free Online",
    description: "Convert HTML pages to PDF online for free. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "HTML to PDF Converter – Convert Web Pages to PDF Free Online",
    description: "Convert HTML pages to PDF online for free. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "HTML to PDF Converter",
  url: "https://www.getzipdrop.com/conversion/html-to-pdf",
  applicationCategory: "FileConverter",
  operatingSystem: "Web",
  description: "Free online HTML to PDF converter. Convert HTML pages to PDF preserving layout. No account required.",
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
      { "@type": "ListItem", position: 3, name: "HTML to PDF", item: "https://www.getzipdrop.com/conversion/html-to-pdf" },
    ],
  },
};

export default function HtmlToPdfLayout({
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