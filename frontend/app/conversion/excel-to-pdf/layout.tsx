import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Excel to PDF Converter – Convert XLSX to PDF Free Online",
  description: "Convert Excel spreadsheets (XLSX/XLS) to PDF online for free. Preserve sheet fidelity and formatting. No account required, max 50MB.",
  alternates: {
    canonical: "https://www.getzipdrop.com/conversion/excel-to-pdf",
  },
  openGraph: {
    url: "https://www.getzipdrop.com/conversion/excel-to-pdf",
    title: "Excel to PDF Converter – Convert XLSX to PDF Free Online",
    description: "Convert Excel spreadsheets to PDF online for free. Preserve formatting. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Excel to PDF Converter – Convert XLSX to PDF Free Online",
    description: "Convert Excel spreadsheets to PDF online for free. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Excel to PDF Converter",
  url: "https://www.getzipdrop.com/conversion/excel-to-pdf",
  applicationCategory: "FileConverter",
  operatingSystem: "Web",
  description: "Free online Excel to PDF converter. Convert XLSX/XLS to PDF preserving sheet fidelity. No account required.",
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
      { "@type": "ListItem", position: 3, name: "Excel to PDF", item: "https://www.getzipdrop.com/conversion/excel-to-pdf" },
    ],
  },
};

export default function ExcelToPdfLayout({
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