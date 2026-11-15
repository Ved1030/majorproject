import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Excel to CSV Converter – Convert XLSX to CSV Free Online",
  description: "Convert Excel spreadsheets (XLSX/XLS) to CSV format online for free. Preserve data integrity. No account required, max 50MB.",
  alternates: {
    canonical: "https://zip-drop.vercel.app/conversion/excel-to-csv",
  },
  openGraph: {
    title: "Excel to CSV Converter – Convert XLSX to CSV Free Online",
    description: "Convert Excel spreadsheets to CSV online for free. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Excel to CSV Converter – Convert XLSX to CSV Free Online",
    description: "Convert Excel spreadsheets to CSV online for free. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Excel to CSV Converter",
  url: "https://zip-drop.vercel.app/conversion/excel-to-csv",
  applicationCategory: "FileConverter",
  operatingSystem: "Web",
  description: "Free online Excel to CSV converter. Convert XLSX/XLS to CSV format. No account required.",
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
      { "@type": "ListItem", position: 3, name: "Excel to CSV", item: "https://zip-drop.vercel.app/conversion/excel-to-csv" },
    ],
  },
};

export default function ExcelToCsvLayout({
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