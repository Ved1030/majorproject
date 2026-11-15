import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PowerPoint to PDF Converter – Convert PPTX to PDF Free Online",
  description: "Convert PowerPoint presentations (PPTX/PPT) to PDF online for free. Preserve slides and formatting. No account required, max 50MB.",
  alternates: {
    canonical: "https://zip-drop.vercel.app/conversion/ppt-to-pdf",
  },
  openGraph: {
    title: "PowerPoint to PDF Converter – Convert PPTX to PDF Free Online",
    description: "Convert PowerPoint presentations to PDF online for free. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "PowerPoint to PDF Converter – Convert PPTX to PDF Free Online",
    description: "Convert PowerPoint presentations to PDF online for free. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "PowerPoint to PDF Converter",
  url: "https://zip-drop.vercel.app/conversion/ppt-to-pdf",
  applicationCategory: "FileConverter",
  operatingSystem: "Web",
  description: "Free online PowerPoint to PDF converter. Convert PPTX/PPT to PDF preserving slides. No account required.",
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
      { "@type": "ListItem", position: 3, name: "PowerPoint to PDF", item: "https://zip-drop.vercel.app/conversion/ppt-to-pdf" },
    ],
  },
};

export default function PptToPdfLayout({
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