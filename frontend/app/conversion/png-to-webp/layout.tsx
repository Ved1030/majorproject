import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PNG to WEBP Converter – Convert PNG to WEBP Free Online",
  description: "Convert PNG images to WEBP format with transparency support online for free. Smaller file sizes. No account required, max 50MB.",
  alternates: {
    canonical: "https://zip-drop.vercel.app/conversion/png-to-webp",
  },
  openGraph: {
    title: "PNG to WEBP Converter – Convert PNG to WEBP Free Online",
    description: "Convert PNG images to WEBP online for free. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "PNG to WEBP Converter – Convert PNG to WEBP Free Online",
    description: "Convert PNG to WEBP online for free. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "PNG to WEBP Converter",
  url: "https://zip-drop.vercel.app/conversion/png-to-webp",
  applicationCategory: "ImageConverter",
  operatingSystem: "Web",
  description: "Free online PNG to WEBP converter. Convert PNG to WEBP with transparency support. No account required.",
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
      { "@type": "ListItem", position: 3, name: "PNG to WEBP", item: "https://zip-drop.vercel.app/conversion/png-to-webp" },
    ],
  },
};

export default function PngToWebpLayout({
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