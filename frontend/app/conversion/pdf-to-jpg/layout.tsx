import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF to JPG Converter – Free Online Image Conversion",
  description: "Convert PDF pages to high-quality JPG images online for free. Rasterize each page as a separate JPG. No account required.",
  alternates: {
    canonical: "https://zip-drop.vercel.app/conversion/pdf-to-jpg",
  },
  openGraph: {
    title: "PDF to JPG Converter – Free Online Image Conversion",
    description: "Convert PDF pages to high-quality JPG images online for free. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF to JPG Converter – Free Online Image Conversion",
    description: "Convert PDF pages to high-quality JPG images online for free. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "PDF to JPG Converter",
  url: "https://zip-drop.vercel.app/conversion/pdf-to-jpg",
  applicationCategory: "FileConverter",
  operatingSystem: "Web",
  description: "Free online PDF to JPG converter. Rasterize PDF pages to high-quality JPG images. No account required.",
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
      { "@type": "ListItem", position: 3, name: "PDF to JPG", item: "https://zip-drop.vercel.app/conversion/pdf-to-jpg" },
    ],
  },
};

export default function PdfToJpgLayout({
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