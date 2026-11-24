import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF to PNG Converter – Free Online Image Conversion",
  description: "Convert PDF pages to PNG images with transparency support online for free. High-quality rasterization. No account required.",
  alternates: {
    canonical: "https://www.getzipdrop.com/conversion/pdf-to-png",
  },
  openGraph: {
    url: "https://www.getzipdrop.com/conversion/pdf-to-png",
    title: "PDF to PNG Converter – Free Online Image Conversion",
    description: "Convert PDF pages to PNG images with transparency online for free. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF to PNG Converter – Free Online Image Conversion",
    description: "Convert PDF pages to PNG images with transparency online for free. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "PDF to PNG Converter",
  url: "https://www.getzipdrop.com/conversion/pdf-to-png",
  applicationCategory: "FileConverter",
  operatingSystem: "Web",
  description: "Free online PDF to PNG converter. Convert PDF pages to PNG with transparency support. No account required.",
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
      { "@type": "ListItem", position: 3, name: "PDF to PNG", item: "https://www.getzipdrop.com/conversion/pdf-to-png" },
    ],
  },
};

export default function PdfToPngLayout({
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