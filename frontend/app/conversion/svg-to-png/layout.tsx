import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SVG to PNG Converter – Rasterize Vector SVG to PNG Free Online",
  description: "Convert SVG vector graphics to PNG raster images online for free. Preserve transparency and quality. No account required, max 50MB.",
  alternates: {
    canonical: "https://www.getzipdrop.com/conversion/svg-to-png",
  },
  openGraph: {
    url: "https://www.getzipdrop.com/conversion/svg-to-png",
    title: "SVG to PNG Converter – Rasterize Vector SVG to PNG Free Online",
    description: "Convert SVG to PNG with transparency support online for free. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "SVG to PNG Converter – Rasterize Vector SVG to PNG Free Online",
    description: "Convert SVG to PNG online for free. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "SVG to PNG Converter",
  url: "https://www.getzipdrop.com/conversion/svg-to-png",
  applicationCategory: "ImageConverter",
  operatingSystem: "Web",
  description: "Free online SVG to PNG converter. Rasterize vector SVG to PNG with transparency. No account required.",
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
      { "@type": "ListItem", position: 3, name: "SVG to PNG", item: "https://www.getzipdrop.com/conversion/svg-to-png" },
    ],
  },
};

export default function SvgToPngLayout({
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