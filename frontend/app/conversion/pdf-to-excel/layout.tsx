import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF to Excel Converter – Free Online XLSX Conversion",
  description: "Convert PDF tables to Excel (XLSX) spreadsheets online for free. Extract data from PDF to editable Excel format. No account required.",
  alternates: {
    canonical: "https://www.getzipdrop.com/conversion/pdf-to-excel",
  },
  openGraph: {
    url: "https://www.getzipdrop.com/conversion/pdf-to-excel",
    title: "PDF to Excel Converter – Free Online XLSX Conversion",
    description: "Convert PDF tables to Excel (XLSX) spreadsheets online for free. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF to Excel Converter – Free Online XLSX Conversion",
    description: "Convert PDF tables to Excel spreadsheets online for free. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "PDF to Excel Converter",
  url: "https://www.getzipdrop.com/conversion/pdf-to-excel",
  applicationCategory: "FileConverter",
  operatingSystem: "Web",
  description: "Free online PDF to Excel converter. Extract tables from PDF to XLSX spreadsheets. No account required.",
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
      { "@type": "ListItem", position: 3, name: "PDF to Excel", item: "https://www.getzipdrop.com/conversion/pdf-to-excel" },
    ],
  },
};

export default function PdfToExcelLayout({
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