import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Images to PDF Converter – Combine Images to PDF Free Online",
  description: "Combine multiple images (JPG, PNG, WEBP) into a single PDF online for free. Reorder, rotate, and adjust pages. No account required.",
  alternates: {
    canonical: "https://www.getzipdrop.com/conversion/images-to-pdf",
  },
  openGraph: {
    url: "https://www.getzipdrop.com/conversion/images-to-pdf",
    title: "Images to PDF Converter – Combine Images to PDF Free Online",
    description: "Combine multiple images into a single PDF online for free. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Images to PDF Converter – Combine Images to PDF Free Online",
    description: "Combine images to PDF online for free. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Images to PDF Converter",
  url: "https://www.getzipdrop.com/conversion/images-to-pdf",
  applicationCategory: "FileConverter",
  operatingSystem: "Web",
  description: "Free online Images to PDF converter. Combine multiple JPG, PNG, WEBP images into a single PDF. Reorder and rotate pages. No account required.",
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
      { "@type": "ListItem", position: 3, name: "Images to PDF", item: "https://www.getzipdrop.com/conversion/images-to-pdf" },
    ],
  },
};

export default function ImagesToPdfLayout({
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