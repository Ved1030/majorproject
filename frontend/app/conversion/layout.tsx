import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Online File Converter – PDF, Word, Excel, Images & More",
  description: "Convert files online for free with ZipDrop. 30+ conversion tools for PDF, Word, Excel, PowerPoint, images, and more. No account required, no software to install.",
  alternates: {
    canonical: "https://www.getzipdrop.com/conversion",
  },
  openGraph: {
    url: "https://www.getzipdrop.com/conversion",
    title: "Free Online File Converter – PDF, Word, Excel, Images & More",
    description: "Convert files online for free with ZipDrop. 30+ conversion tools for PDF, Word, Excel, PowerPoint, images, and more. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Online File Converter – PDF, Word, Excel, Images & More",
    description: "Convert files online for free with ZipDrop. 30+ conversion tools. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Free Online File Converter",
  description: "Convert files online for free with ZipDrop. 30+ conversion tools for PDF, Word, Excel, PowerPoint, images, and more. No account required.",
  url: "https://www.getzipdrop.com/conversion",
  publisher: {
    "@type": "Organization",
    name: "ZipDrop",
    url: "https://www.getzipdrop.com",
  },
  mainEntity: {
    "@type": "ItemList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "PDF to Word", url: "https://www.getzipdrop.com/conversion/pdf-to-word" },
      { "@type": "ListItem", position: 2, name: "PDF to Excel", url: "https://www.getzipdrop.com/conversion/pdf-to-excel" },
      { "@type": "ListItem", position: 3, name: "PDF to PowerPoint", url: "https://www.getzipdrop.com/conversion/pdf-to-ppt" },
      { "@type": "ListItem", position: 4, name: "Word to PDF", url: "https://www.getzipdrop.com/conversion/word-to-pdf" },
      { "@type": "ListItem", position: 5, name: "Excel to PDF", url: "https://www.getzipdrop.com/conversion/excel-to-pdf" },
      { "@type": "ListItem", position: 6, name: "JPG to PNG", url: "https://www.getzipdrop.com/conversion/jpg-to-png" },
      { "@type": "ListItem", position: 7, name: "PNG to JPG", url: "https://www.getzipdrop.com/conversion/png-to-jpg" },
      { "@type": "ListItem", position: 8, name: "Images to PDF", url: "https://www.getzipdrop.com/conversion/images-to-pdf" },
    ],
  },
  breadcrumb: {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.getzipdrop.com" },
      { "@type": "ListItem", position: 2, name: "Conversion Tools", item: "https://www.getzipdrop.com/conversion" },
    ],
  },
};

export default function ConversionLayout({
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