import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF to PDF/A Converter – Convert to Archival PDF/A Free Online",
  description: "Convert PDF to archival PDF/A standard online for free. Ensure long-term document preservation. No account required, max 50MB.",
  alternates: {
    canonical: "https://www.getzipdrop.com/conversion/pdf-to-pdfa",
  },
  openGraph: {
    url: "https://www.getzipdrop.com/conversion/pdf-to-pdfa",
    title: "PDF to PDF/A Converter – Convert to Archival PDF/A Free Online",
    description: "Convert PDF to archival PDF/A standard online for free. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF to PDF/A Converter – Convert to Archival PDF/A Free Online",
    description: "Convert PDF to archival PDF/A standard online for free. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "PDF to PDF/A Converter",
  url: "https://www.getzipdrop.com/conversion/pdf-to-pdfa",
  applicationCategory: "FileConverter",
  operatingSystem: "Web",
  description: "Free online PDF to PDF/A converter. Convert to archival PDF/A standard for long-term preservation. No account required.",
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
      { "@type": "ListItem", position: 3, name: "PDF to PDF/A", item: "https://www.getzipdrop.com/conversion/pdf-to-pdfa" },
    ],
  },
};

export default function PdfToPdfaLayout({
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