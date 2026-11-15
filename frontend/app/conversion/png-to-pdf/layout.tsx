import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PNG to PDF Converter – Convert PNG Images to PDF Free Online",
  description: "Convert PNG images to PDF documents online for free. Combine multiple PNGs into a single PDF. No account required, max 50MB.",
  alternates: {
    canonical: "https://zip-drop.vercel.app/conversion/png-to-pdf",
  },
  openGraph: {
    title: "PNG to PDF Converter – Convert PNG Images to PDF Free Online",
    description: "Convert PNG images to PDF online for free. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "PNG to PDF Converter – Convert PNG Images to PDF Free Online",
    description: "Convert PNG images to PDF online for free. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "PNG to PDF Converter",
  url: "https://zip-drop.vercel.app/conversion/png-to-pdf",
  applicationCategory: "FileConverter",
  operatingSystem: "Web",
  description: "Free online PNG to PDF converter. Convert PNG images to PDF documents. No account required.",
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
      { "@type": "ListItem", position: 3, name: "PNG to PDF", item: "https://zip-drop.vercel.app/conversion/png-to-pdf" },
    ],
  },
};

export default function PngToPdfLayout({
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