import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CSV to Excel Converter – Convert CSV to XLSX Free Online",
  description: "Convert CSV data to Excel spreadsheets (XLSX) online for free. Preserve data structure. No account required, max 50MB.",
  alternates: {
    canonical: "https://zip-drop.vercel.app/conversion/csv-to-excel",
  },
  openGraph: {
    title: "CSV to Excel Converter – Convert CSV to XLSX Free Online",
    description: "Convert CSV data to Excel spreadsheets online for free. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "CSV to Excel Converter – Convert CSV to XLSX Free Online",
    description: "Convert CSV data to Excel spreadsheets online for free. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "CSV to Excel Converter",
  url: "https://zip-drop.vercel.app/conversion/csv-to-excel",
  applicationCategory: "FileConverter",
  operatingSystem: "Web",
  description: "Free online CSV to Excel converter. Convert CSV data to XLSX spreadsheets. No account required.",
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
      { "@type": "ListItem", position: 3, name: "CSV to Excel", item: "https://zip-drop.vercel.app/conversion/csv-to-excel" },
    ],
  },
};

export default function CsvToExcelLayout({
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